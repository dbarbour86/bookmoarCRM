import { db, PlatformEventData, WorkflowExecutionData } from '../db';
import { executeWorkflowInstance } from '../workflow/engine';

export interface PublishEventInput {
  tenantId: string;
  eventType: string;
  source: string;
  payload: Record<string, any>;
}

export interface EventGuardResult {
  allowed: boolean;
  reason?: string;
  failedFlag?: string;
}

export function evaluateEventGuard(tenantId: string, eventType: string): EventGuardResult {
  const tenant = db.tenants.get(tenantId) || {
    id: tenantId,
    name: "Tyree's Auto Detailing",
    serviceStatus: 'ACTIVE',
    masterAutomationEnabled: true,
    smsEnabled: true,
    emailEnabled: true,
    crmWriteEnabled: true,
    missedCallEnabled: true,
    reviewsEnabled: true,
  };

  if (tenant.serviceStatus === 'SUSPENDED') {
    return { allowed: false, reason: 'Tenant managed services are SUSPENDED.', failedFlag: 'serviceStatus:SUSPENDED' };
  }
  if (tenant.serviceStatus === 'TERMINATED') {
    return { allowed: false, reason: 'Tenant managed services are TERMINATED.', failedFlag: 'serviceStatus:TERMINATED' };
  }
  if (!tenant.masterAutomationEnabled) {
    return { allowed: false, reason: 'Master Automation Kill Switch is OFF for this tenant.', failedFlag: 'masterAutomationEnabled' };
  }
  if (eventType.includes('SMS') && !tenant.smsEnabled) {
    return { allowed: false, reason: 'SMS Automation capability is DISABLED for this tenant.', failedFlag: 'smsEnabled' };
  }

  return { allowed: true };
}

export class EventBus {
  public static async publish(input: PublishEventInput): Promise<{ event: PlatformEventData; executions: WorkflowExecutionData[] }> {
    // 1. Create and Persist PlatformEvent in Database
    const event = await db.createPlatformEvent({
      tenantId: input.tenantId,
      eventType: input.eventType,
      source: input.source,
      payload: input.payload,
    });

    console.log('[EVENT_BUS_PUBLISHED]', {
      timestamp: new Date().toISOString(),
      eventId: event.id,
      tenantId: input.tenantId,
      eventType: input.eventType,
    });

    // 2. Evaluate Guard
    const guard = evaluateEventGuard(input.tenantId, input.eventType);
    const executions: WorkflowExecutionData[] = [];

    // 3. Find matching active workflows for this tenant (Auto-seeds Speed-to-Lead if missing)
    const tenantWorkflows = await db.getTenantWorkflows(input.tenantId);
    const activeWorkflows = tenantWorkflows.filter((w) => w.status === 'ACTIVE');

    for (const workflow of activeWorkflows) {
      const activeVersion = workflow.versions.find((v) => v.id === workflow.activeVersionId) || workflow.versions[0];
      if (!activeVersion) continue;

      if (activeVersion.triggerConfig.eventType === input.eventType) {
        if (!guard.allowed) {
          const blockedExec: WorkflowExecutionData = {
            id: `exec_blocked_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            tenantId: input.tenantId,
            workflowId: workflow.id,
            workflowVersionId: activeVersion.id,
            eventId: event.id,
            contactId: input.payload.contactId,
            status: 'BLOCKED',
            skippedReason: guard.reason,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            steps: [],
          };
          await db.saveWorkflowExecution(blockedExec);
          executions.push(blockedExec);

          console.log('[EVENT_BUS_WORKFLOW_BLOCKED]', {
            eventId: event.id,
            workflowId: workflow.id,
            reason: guard.reason,
          });
        } else {
          // Execute Workflow
          const exec = await executeWorkflowInstance({
            tenantId: input.tenantId,
            workflow,
            version: activeVersion,
            event,
          });
          executions.push(exec);

          console.log('[EVENT_BUS_WORKFLOW_COMPLETED]', {
            eventId: event.id,
            workflowId: workflow.id,
            executionId: exec.id,
            stepsCount: exec.steps.length,
          });
        }
      }
    }

    return { event, executions };
  }
}
