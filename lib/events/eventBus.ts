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

/**
 * Central Guard evaluating Tenant Service Status, Master Automation Kill Switch,
 * and Granular Capability Flags.
 */
export function evaluateEventGuard(tenantId: string, eventType: string): EventGuardResult {
  const tenant = db.tenants.get(tenantId);
  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found' };
  }

  // 1. Master Service Status Check
  if (tenant.serviceStatus === 'SUSPENDED') {
    return { allowed: false, reason: 'Tenant managed services are SUSPENDED.', failedFlag: 'serviceStatus:SUSPENDED' };
  }
  if (tenant.serviceStatus === 'TERMINATED') {
    return { allowed: false, reason: 'Tenant managed services are TERMINATED.', failedFlag: 'serviceStatus:TERMINATED' };
  }

  // 2. Master Automation Kill Switch
  if (!tenant.masterAutomationEnabled) {
    return { allowed: false, reason: 'Master Automation Kill Switch is OFF for this tenant.', failedFlag: 'masterAutomationEnabled' };
  }

  // 3. Granular Capability Flags Check
  if (eventType.includes('SMS') && !tenant.smsEnabled) {
    return { allowed: false, reason: 'SMS Automation capability is DISABLED for this tenant.', failedFlag: 'smsEnabled' };
  }
  if (eventType.includes('EMAIL') && !tenant.emailEnabled) {
    return { allowed: false, reason: 'Email Automation capability is DISABLED for this tenant.', failedFlag: 'emailEnabled' };
  }
  if (eventType.includes('MISSED_CALL') && !tenant.missedCallEnabled) {
    return { allowed: false, reason: 'Missed-Call Text Back capability is DISABLED for this tenant.', failedFlag: 'missedCallEnabled' };
  }
  if (eventType.includes('RATING') || eventType.includes('REVIEW') && !tenant.reviewsEnabled) {
    return { allowed: false, reason: 'Review Automation capability is DISABLED for this tenant.', failedFlag: 'reviewsEnabled' };
  }

  return { allowed: true };
}

/**
 * Standardized Tenant-Scoped Event Registry & Dispatcher
 */
export class EventBus {
  public static publish(input: PublishEventInput): { event: PlatformEventData; executions: WorkflowExecutionData[] } {
    const event: PlatformEventData = {
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId: input.tenantId,
      eventType: input.eventType,
      source: input.source,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };

    db.platformEvents.unshift(event);

    // Process event-driven Wait State Cancellations
    EventBus.checkWaitStateCancellations(input.tenantId, input.eventType, input.payload);

    // Evaluate Guard
    const guard = evaluateEventGuard(input.tenantId, input.eventType);
    const executions: WorkflowExecutionData[] = [];

    // Find matching active workflows for this tenant
    const tenantWorkflows = Array.from(db.workflows.values()).filter(
      (w) => w.tenantId === input.tenantId && w.active
    );

    for (const workflow of tenantWorkflows) {
      const activeVersion = workflow.versions.find((v) => v.id === workflow.activeVersionId) || workflow.versions[0];
      if (!activeVersion) continue;

      // Check if workflow trigger matches this event
      if (activeVersion.triggerConfig.eventType === input.eventType) {
        if (!guard.allowed) {
          // Record BLOCKED execution with clear skipped reason
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
          db.executions.unshift(blockedExec);
          executions.push(blockedExec);
        } else {
          // Execute Workflow
          const exec = executeWorkflowInstance({
            tenantId: input.tenantId,
            workflow,
            version: activeVersion,
            event,
          });
          executions.push(exec);
        }
      }
    }

    return { event, executions };
  }

  private static checkWaitStateCancellations(tenantId: string, eventType: string, payload: Record<string, any>) {
    const contactId = payload.contactId;
    if (!contactId) return;

    for (const wait of db.waitStates) {
      if (
        wait.tenantId === tenantId &&
        wait.contactId === contactId &&
        wait.status === 'PENDING' &&
        wait.cancellationConditions.includes(eventType)
      ) {
        wait.status = 'CANCELLED';
        // Find execution and update status
        const exec = db.executions.find((e) => e.id === wait.executionId);
        if (exec) {
          exec.status = 'CANCELLED';
          exec.steps.push({
            id: `step_cancel_${Date.now()}`,
            nodeId: wait.nodeId,
            nodeType: 'wait',
            nodeName: 'Wait Node',
            status: 'SKIPPED',
            outputData: { reason: `Wait state cancelled by event ${eventType}` },
            executedAt: new Date().toISOString(),
          });
        }
      }
    }
  }
}
