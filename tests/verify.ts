import { db } from '../lib/db';
import { EventBus, evaluateEventGuard } from '../lib/events/eventBus';
import { generateWebsiteExportZip } from '../lib/export/websiteExporter';
import '../lib/workflow/templates';

async function runSystemVerification() {
  console.log('===========================================================');
  console.log('BOOK MOAR PLATFORM SYSTEM VERIFICATION SUITE');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Verify Multi-tenant initialization
  const tyreeTenant = db.tenants.get('tenant_tyrees_auto');
  assert(!!tyreeTenant, 'Tenant "Tyree\'s Auto Detailing" exists');
  assert(tyreeTenant?.serviceStatus === 'ACTIVE', 'Default service status is ACTIVE');

  // 2. Verify Master Kill Switch & Granular Capability Guard
  const activeGuard = evaluateEventGuard('tenant_tyrees_auto', 'FORM_SUBMITTED');
  assert(activeGuard.allowed === true, 'Central Event Guard allows events when ACTIVE');

  // Toggle Master Kill Switch
  tyreeTenant!.masterAutomationEnabled = false;
  const killSwitchGuard = evaluateEventGuard('tenant_tyrees_auto', 'FORM_SUBMITTED');
  assert(killSwitchGuard.allowed === false && killSwitchGuard.failedFlag === 'masterAutomationEnabled', 'Master Kill Switch blocks events immediately when OFF');

  // Re-enable Master Switch & test Granular SMS flag
  tyreeTenant!.masterAutomationEnabled = true;
  tyreeTenant!.smsEnabled = false;
  const smsGuard = evaluateEventGuard('tenant_tyrees_auto', 'SMS_RECEIVED');
  assert(smsGuard.allowed === false && smsGuard.failedFlag === 'smsEnabled', 'Granular SMS flag blocks SMS events when OFF');
  tyreeTenant!.smsEnabled = true;

  // 3. Test Event Bus & Workflow Trigger Execution
  const res1 = EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'FORM_SUBMITTED',
    source: 'TEST_SUITE',
    payload: { contactId: 'contact_john_doe', formName: 'Quote Form', phone: '+19195550144' },
  });
  assert(res1.executions.length > 0, 'EventBus published FORM_SUBMITTED and triggered workflow execution');
  assert(res1.executions[0].status === 'COMPLETED', 'Speed-to-Lead workflow execution completed successfully');

  // 4. Test Missed Call Text Back Workflow
  const res2 = EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'MISSED_CALL',
    source: 'TWILIO_CALL_EVENT',
    payload: { contactId: 'contact_john_doe', phone: '+19195550144' },
  });
  assert(res2.executions.length > 0, 'MISSED_CALL event published and executed Missed-Call Text Back template');

  // 5. Test Review Request Branching (Score >= 4 vs Score < 4)
  const resHighScore = EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'RATING_RECEIVED',
    source: 'REVIEW_SURVEY',
    payload: { contactId: 'contact_john_doe', rating: 5 },
  });
  const highExec = resHighScore.executions[0];
  const condStepHigh = highExec.steps.find((s) => s.nodeType === 'condition');
  assert(condStepHigh?.evaluatedCondition === true, 'Rating 5 stars evaluated condition branch as TRUE (Google Review)');

  const resLowScore = EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'RATING_RECEIVED',
    source: 'REVIEW_SURVEY',
    payload: { contactId: 'contact_john_doe', rating: 2 },
  });
  const lowExec = resLowScore.executions[0];
  const condStepLow = lowExec.steps.find((s) => s.nodeType === 'condition');
  assert(condStepLow?.evaluatedCondition === false, 'Rating 2 stars evaluated condition branch as FALSE (Private Feedback)');

  // 6. Test Durable Wait States & Cancellation Conditions
  const resEstimate = EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'ESTIMATE_SENT',
    source: 'CRM_ESTIMATES',
    payload: { contactId: 'contact_john_doe', estimateValue: 500 },
  });
  assert(resEstimate.executions[0].status === 'WAITING', 'Estimate Sent workflow entered WAITING state');
  assert(db.waitStates.some((w) => w.tenantId === 'tenant_tyrees_auto' && w.status === 'PENDING'), 'Durable Wait state recorded in DB');

  // Publish Cancellation Event
  EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'ESTIMATE_ACCEPTED',
    source: 'CLIENT_ACTION',
    payload: { contactId: 'contact_john_doe' },
  });
  assert(db.waitStates.some((w) => w.tenantId === 'tenant_tyrees_auto' && w.status === 'CANCELLED'), 'Wait state was CANCELLED automatically upon receiving ESTIMATE_ACCEPTED event');

  // 7. Test Portable Website Exporter (Independent of Status)
  const exportResult = await generateWebsiteExportZip({
    tenantId: 'tenant_tyrees_auto',
    adapterType: 'WEB3FORMS',
  });
  assert(!!exportResult.filename && exportResult.zipBuffer.length > 0, 'Website Exporter generated ZIP buffer file');
  assert(exportResult.auditReport.includes('EXPORT_AUDIT_WARNINGS'), 'Audit Report generated with warning markers');
  assert(exportResult.auditReport.includes('WEB3FORMS'), 'Web3Forms portable adapter highlighted in export audit');

  console.log('===========================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSystemVerification();
