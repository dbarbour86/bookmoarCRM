import {
  db,
  PlatformEventData,
  WorkflowData,
  WorkflowVersionData,
  WorkflowExecutionData,
  WorkflowExecutionStepData,
  WorkflowWaitStateData,
  TenantData,
  WorkflowNodeData,
} from '../db';

export interface ExecuteWorkflowInput {
  tenantId: string;
  workflow: WorkflowData;
  version: WorkflowVersionData;
  event: PlatformEventData;
  isTestMode?: boolean;
}

export function interpolateVariables(templateStr: string, payload: Record<string, any>, tenant: TenantData): string {
  if (!templateStr) return '';
  const contactName = payload.name || payload.contactName || (payload.contact && payload.contact.name) || 'Customer';
  const firstName = payload.contact?.firstName || contactName.split(' ')[0] || 'Customer';
  const lastName = payload.contact?.lastName || contactName.split(' ').slice(1).join(' ') || '';

  return templateStr
    .replace(/\{\{\s*contact\.firstName\s*\}\}/g, firstName)
    .replace(/\{\{\s*contact\.lastName\s*\}\}/g, lastName)
    .replace(/\{\{\s*contact\.name\s*\}\}/g, contactName)
    .replace(/\{\{\s*contact\.phone\s*\}\}/g, payload.phone || payload.contact?.phone || '(919) 555-0144')
    .replace(/\{\{\s*business\.name\s*\}\}/g, tenant.name || 'Our Business')
    .replace(/\{\{\s*appointment\.date\s*\}\}/g, payload.appointmentDate || 'Friday, Aug 28')
    .replace(/\{\{\s*appointment\.time\s*\}\}/g, payload.appointmentTime || '2:00 PM')
    .replace(/\{\{\s*estimate\.amount\s*\}\}/g, payload.estimateValue ? `$${payload.estimateValue}` : '$350')
    .replace(/\{\{\s*link\s*\}\}/g, payload.link || 'https://g.page/r/tyrees-auto/review');
}

export function evaluateFilterCondition(
  fieldValue: any,
  operator: string,
  targetValue: any
): boolean {
  switch (operator) {
    case 'equals':
      return String(fieldValue) === String(targetValue);
    case 'does_not_equal':
      return String(fieldValue) !== String(targetValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
    case 'does_not_contain':
      return !String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(targetValue);
    case 'less_than':
      return Number(fieldValue) < Number(targetValue);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'does_not_exist':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    default:
      return true;
  }
}

export function evaluateTriggerFilters(
  payload: Record<string, any>,
  filters?: Array<{ field: string; operator: string; value: any }>
): boolean {
  if (!filters || filters.length === 0) return true;
  for (const filter of filters) {
    const val = payload[filter.field];
    if (!evaluateFilterCondition(val, filter.operator, filter.value)) {
      return false;
    }
  }
  return true;
}

export async function executeWorkflowInstance(input: ExecuteWorkflowInput): Promise<WorkflowExecutionData> {
  const { tenantId, workflow, version, event, isTestMode } = input;
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

  const executionId = `exec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const execution: WorkflowExecutionData = {
    id: executionId,
    tenantId,
    workflowId: workflow.id,
    workflowVersionId: version.id,
    eventId: event.id,
    contactId: event.payload.contactId,
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
    steps: [],
  };

  // 1. Evaluate Trigger Filters
  const filtersPassed = evaluateTriggerFilters(event.payload, version.triggerConfig.filters);
  if (!filtersPassed) {
    execution.status = 'COMPLETED';
    execution.skippedReason = 'Trigger filters did not match event payload.';
    execution.completedAt = new Date().toISOString();
    await db.saveWorkflowExecution(execution);
    return execution;
  }

  // Find Trigger Node
  const triggerNode = version.nodesConfig.find((n) => n.type === 'trigger');
  if (!triggerNode) {
    execution.status = 'FAILED';
    execution.skippedReason = 'Malformed workflow: No trigger node found.';
    execution.completedAt = new Date().toISOString();
    await db.saveWorkflowExecution(execution);
    return execution;
  }

  execution.steps.push({
    id: `step_${Date.now()}_1`,
    nodeId: triggerNode.id,
    nodeType: 'trigger',
    nodeName: triggerNode.name,
    status: 'EXECUTED',
    outputData: { payload: event.payload },
    executedAt: new Date().toISOString(),
  });

  // Traverse graph node by node
  let currentNodeId: string | undefined = triggerNode.id;
  const maxIterations = 25;
  let count = 0;

  while (currentNodeId && count < maxIterations) {
    count++;

    const outgoingEdges = version.edgesConfig.filter((e) => e.source === currentNodeId);
    if (outgoingEdges.length === 0) break;

    let nextEdge = outgoingEdges[0];
    const targetNode = version.nodesConfig.find((n) => n.id === nextEdge.target);
    if (!targetNode) break;

    // Process Target Node
    if (targetNode.type === 'action') {
      const step = await executeActionNode(targetNode, tenant as any, event.payload, isTestMode);
      execution.steps.push(step);
      currentNodeId = targetNode.id;
    } else if (targetNode.type === 'condition') {
      const conditionField = targetNode.config?.field || 'rating';
      const operator = targetNode.config?.operator || 'greater_than';
      const targetVal = targetNode.config?.value ?? 3;
      const actualVal = event.payload[conditionField];

      const passed = evaluateFilterCondition(actualVal, operator, targetVal);

      execution.steps.push({
        id: `step_${Date.now()}_${count}`,
        nodeId: targetNode.id,
        nodeType: 'condition',
        nodeName: targetNode.name,
        status: 'EXECUTED',
        evaluatedCondition: passed,
        outputData: { field: conditionField, actualValue: actualVal, conditionPassed: passed },
        executedAt: new Date().toISOString(),
      });

      const branchEdge = outgoingEdges.find((e) => e.conditionValue === passed) || outgoingEdges[0];
      currentNodeId = branchEdge.target;
    } else if (targetNode.type === 'wait') {
      const delayMinutes = targetNode.config?.delayMinutes || 15;
      const resumeAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
      const cancellationConditions = targetNode.config?.cancellationConditions || [];

      if (!isTestMode) {
        const waitState: WorkflowWaitStateData = {
          id: `wait_${Date.now()}`,
          executionId: execution.id,
          nodeId: targetNode.id,
          tenantId,
          contactId: event.payload.contactId,
          resumeAt,
          cancellationConditions,
          status: 'PENDING',
        };
        db.waitStates.push(waitState);

        execution.status = 'WAITING';
        execution.steps.push({
          id: `step_${Date.now()}_${count}`,
          nodeId: targetNode.id,
          nodeType: 'wait',
          nodeName: targetNode.name,
          status: 'EXECUTED',
          outputData: { delayMinutes, resumeAt, cancellationConditions },
          executedAt: new Date().toISOString(),
        });
        await db.saveWorkflowExecution(execution);
        return execution;
      } else {
        execution.steps.push({
          id: `step_${Date.now()}_${count}`,
          nodeId: targetNode.id,
          nodeType: 'wait',
          nodeName: targetNode.name,
          status: 'EXECUTED',
          outputData: { delayMinutes, resumeAt, cancellationConditions, note: 'Wait skipped in simulation mode' },
          executedAt: new Date().toISOString(),
        });
        currentNodeId = targetNode.id;
      }
    }
  }

  execution.status = 'COMPLETED';
  execution.completedAt = new Date().toISOString();
  await db.saveWorkflowExecution(execution);
  return execution;
}

async function executeActionNode(
  node: WorkflowNodeData,
  tenant: TenantData,
  payload: Record<string, any>,
  isTestMode?: boolean
): Promise<WorkflowExecutionStepData> {
  const actionType = node.actionType || 'SEND_SMS';

  // Capability checks
  if (actionType === 'SEND_SMS' && !tenant.smsEnabled) {
    return {
      id: `step_${Date.now()}`,
      nodeId: node.id,
      nodeType: 'action',
      nodeName: node.name,
      status: 'SKIPPED',
      outputData: { reason: 'SMS Capability is Disabled for Tenant' },
      executedAt: new Date().toISOString(),
    };
  }

  if (actionType === 'SEND_EMAIL' && !tenant.emailEnabled) {
    return {
      id: `step_${Date.now()}`,
      nodeId: node.id,
      nodeType: 'action',
      nodeName: node.name,
      status: 'SKIPPED',
      outputData: { reason: 'Email Capability is Disabled for Tenant' },
      executedAt: new Date().toISOString(),
    };
  }

  // Action: CREATE_OPPORTUNITY or MOVE_KANBAN_CARD
  if (
    actionType === 'CREATE_OPPORTUNITY' ||
    actionType === 'MOVE_KANBAN_CARD' ||
    actionType === 'CREATE_LEAD'
  ) {
    let createdOpp = null;
    if (!isTestMode && payload.contactId) {
      createdOpp = await db.createOpportunity({
        tenantId: tenant.id,
        contactId: payload.contactId,
        stageId: 'stage_lead_in',
        title: `${payload.contact?.firstName || payload.name || 'Lead'} - Quote Request`,
        value: Number(payload.fields?.estimateValue || payload.estimateValue || 350),
      });
    }

    return {
      id: `step_${Date.now()}`,
      nodeId: node.id,
      nodeType: 'action',
      nodeName: node.name,
      status: 'EXECUTED',
      outputData: {
        actionType: 'CREATE_OPPORTUNITY',
        stageName: 'New Lead',
        opportunityId: createdOpp?.id || `opp_sim_${Date.now()}`,
        resultSummary: `Created Opportunity card in New Lead stage for contactId: ${payload.contactId}`,
        isTestMode,
      },
      executedAt: new Date().toISOString(),
    };
  }

  // Variable Interpolation
  const rawMsg = node.config?.message || 'Thank you!';
  const formattedMsg = interpolateVariables(rawMsg, payload, tenant);

  let resultSummary = '';
  if (actionType === 'SEND_SMS') {
    resultSummary = `[SIMULATION] SMS sent to ${payload.phone || payload.contact?.phone || '(919) 555-0144'}: "${formattedMsg}"`;
  } else if (actionType === 'SEND_EMAIL') {
    resultSummary = `[SIMULATION] Email sent to ${payload.email || payload.contact?.email || 'customer@example.com'}: "${formattedMsg}"`;
  } else if (actionType === 'SEND_INTERNAL_NOTIFICATION') {
    resultSummary = `Internal notification sent to business owner: "New Quote Lead from ${payload.contact?.firstName || 'Customer'}"`;
  } else {
    resultSummary = `Executed action ${actionType} with config message: "${formattedMsg}"`;
  }

  return {
    id: `step_${Date.now()}`,
    nodeId: node.id,
    nodeType: 'action',
    nodeName: node.name,
    status: 'EXECUTED',
    outputData: { actionType, resultSummary, isTestMode },
    executedAt: new Date().toISOString(),
  };
}
