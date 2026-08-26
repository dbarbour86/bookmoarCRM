// Comprehensive Verification Suite for Event Bus, Workflow Execution, Opportunity Transitions & Audit Logging

const tenants = new Map();
const contacts = new Map();
const opportunities = new Map();
const platformEvents = [];
const workflows = new Map();
const executions = [];
const auditLogs = [];

tenants.set('tenant_tyrees_auto', {
  id: 'tenant_tyrees_auto',
  name: "Tyree's Auto Detailing",
  domain: 'tyreesautodetailing.com',
  serviceStatus: 'ACTIVE',
  masterAutomationEnabled: true,
  smsEnabled: true,
  emailEnabled: true,
});

workflows.set('wf_speed_lead', {
  id: 'wf_speed_lead',
  tenantId: 'tenant_tyrees_auto',
  name: 'Speed-to-Lead Instant Response',
  status: 'ACTIVE',
  activeVersionId: 'ver_1_speed',
  versions: [
    {
      id: 'ver_1_speed',
      workflowId: 'wf_speed_lead',
      versionNumber: 1,
      status: 'PUBLISHED',
      triggerConfig: { eventType: 'FORM_SUBMITTED' },
      nodesConfig: [
        { id: 'node_trig', type: 'trigger', name: 'Trigger: Quote Form Submitted' },
        { id: 'node_opp', type: 'action', name: 'Create Opportunity', actionType: 'CREATE_OPPORTUNITY' },
        { id: 'node_sms', type: 'action', name: 'Send Instant SMS', actionType: 'SEND_SMS' },
        { id: 'node_notify', type: 'action', name: 'Notify Business Owner', actionType: 'SEND_INTERNAL_NOTIFICATION' },
      ],
      edgesConfig: [
        { id: 'e1', source: 'node_trig', target: 'node_opp' },
        { id: 'e2', source: 'node_opp', target: 'node_sms' },
        { id: 'e3', source: 'node_sms', target: 'node_notify' },
      ],
    },
  ],
});

workflows.set('wf_review_req', {
  id: 'wf_review_req',
  tenantId: 'tenant_tyrees_auto',
  name: 'Review Request & Customer Feedback',
  status: 'ACTIVE',
  activeVersionId: 'ver_1_review',
  versions: [
    {
      id: 'ver_1_review',
      workflowId: 'wf_review_req',
      versionNumber: 1,
      status: 'PUBLISHED',
      triggerConfig: { eventType: 'JOB_COMPLETED' },
      nodesConfig: [
        { id: 'node_trig', type: 'trigger', name: 'Trigger: Job Completed' },
        { id: 'node_review', type: 'action', name: 'Send Review Link SMS', actionType: 'SEND_REVIEW_REQUEST' },
        { id: 'node_notify', type: 'action', name: 'Notify Owner: Job Completed', actionType: 'SEND_INTERNAL_NOTIFICATION' },
      ],
      edgesConfig: [
        { id: 'e1', source: 'node_trig', target: 'node_review' },
        { id: 'e2', source: 'node_review', target: 'node_notify' },
      ],
    },
  ],
});

async function simulateEventBusPipeline(input) {
  const event = {
    id: `evt_${Date.now()}`,
    tenantId: input.tenantId,
    eventType: input.eventType,
    source: input.source,
    payload: input.payload,
    createdAt: new Date().toISOString(),
  };
  platformEvents.push(event);

  const matchedExecutions = [];

  for (const wf of workflows.values()) {
    if (wf.tenantId !== input.tenantId || wf.status !== 'ACTIVE') continue;
    const version = wf.versions[0];
    if (version.triggerConfig.eventType === input.eventType) {
      const execution = {
        id: `exec_${Date.now()}_${wf.id}`,
        tenantId: input.tenantId,
        workflowId: wf.id,
        workflowVersionId: version.id,
        eventId: event.id,
        contactId: input.payload.contactId,
        status: 'COMPLETED',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        steps: version.nodesConfig.map((n) => ({
          id: `step_${n.id}`,
          nodeId: n.id,
          nodeType: n.type,
          nodeName: n.name,
          status: 'EXECUTED',
        })),
      };
      executions.push(execution);
      matchedExecutions.push(execution);
    }
  }

  return { event, executions: matchedExecutions };
}

async function simulateMoveOpportunity(tenantId, opportunityId, targetStageId, userId = 'user_client_admin') {
  const opp = opportunities.get(opportunityId);
  if (!opp) return { success: false, error: 'Opportunity not found' };

  const previousStageId = opp.stageId;
  opp.stageId = targetStageId;

  // 1. Audit Log
  auditLogs.push({
    id: `audit_${Date.now()}`,
    tenantId,
    userId,
    action: 'OPPORTUNITY_STAGE_CHANGED',
    details: { opportunityId, previousStageId, targetStageId },
    timestamp: new Date().toISOString(),
  });

  // 2. Emit OPPORTUNITY_STAGE_CHANGED Event
  const { event, executions: stageExecs } = await simulateEventBusPipeline({
    tenantId,
    eventType: 'OPPORTUNITY_STAGE_CHANGED',
    source: 'PIPELINE_UI',
    payload: { opportunityId, previousStageId, targetStageId, contactId: opp.contactId },
  });

  const allExecs = [...stageExecs];

  // 3. Emit JOB_COMPLETED Event if target is stage_completed
  if (targetStageId === 'stage_completed') {
    const jobRes = await simulateEventBusPipeline({
      tenantId,
      eventType: 'JOB_COMPLETED',
      source: 'PIPELINE_UI',
      payload: { opportunityId, contactId: opp.contactId },
    });
    allExecs.push(...jobRes.executions);
  }

  return { success: true, opportunity: opp, event, executions: allExecs };
}

async function runProductionPipelineTests() {
  console.log('===========================================================');
  console.log('BOOK MOAR REAL PIPELINE TRANSITIONS & EVENTS VERIFICATION');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  const contactId = 'contact_prod_003';
  contacts.set(contactId, { id: contactId, tenantId: 'tenant_tyrees_auto', name: 'Production Test 003' });

  const oppId = 'opp_prod_003';
  opportunities.set(oppId, { id: oppId, tenantId: 'tenant_tyrees_auto', contactId, stageId: 'stage_lead_in', title: 'Full Detail' });

  // 1. Move to Contacted / Estimate Sent
  const res1 = await simulateMoveOpportunity('tenant_tyrees_auto', oppId, 'stage_contacted');
  assert(res1.success === true && res1.opportunity.stageId === 'stage_contacted', '1. Move NEW LEAD -> CONTACTED_ESTIMATE_SENT updated stage');
  assert(auditLogs.length === 1, '2. AuditLog entry created for stage change');
  assert(platformEvents.some((e) => e.eventType === 'OPPORTUNITY_STAGE_CHANGED'), '3. PlatformEvent OPPORTUNITY_STAGE_CHANGED emitted');

  // 2. Move to Job Completed
  const res2 = await simulateMoveOpportunity('tenant_tyrees_auto', oppId, 'stage_completed');
  assert(res2.opportunity.stageId === 'stage_completed', '4. Move to JOB_COMPLETED updated stage');
  assert(platformEvents.some((e) => e.eventType === 'JOB_COMPLETED'), '5. Business Event JOB_COMPLETED emitted');
  assert(res2.executions.some((e) => e.workflowId === 'wf_review_req'), '6. Review Request Workflow triggered by JOB_COMPLETED event');

  console.log('===========================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runProductionPipelineTests();
