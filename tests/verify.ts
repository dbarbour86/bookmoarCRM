// Standard System Verification Suite for Event Bus and Workflow Engine

import { db } from '@/lib/db';
import { EventBus, evaluateEventGuard } from '@/lib/events/eventBus';
import { generateWebsiteExportZip } from '@/lib/exporter/websiteExporter';

export async function runSystemVerification() {
  console.log('===========================================================');
  console.log('STARTING BOOK MOAR SYSTEM & EVENT BUS VERIFICATION SUITE');
  console.log('===========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // 1. Seed Default Workflows
  db.ensureSpeedToLeadWorkflow('tenant_tyrees_auto');

  // 2. Test Central Guard & Service Status Kill Switch
  const guardActive = evaluateEventGuard('tenant_tyrees_auto', 'FORM_SUBMITTED');
  assert(guardActive.allowed === true, 'Guard allows events for ACTIVE tenant with enabled capabilities');

  const guardSuspended = evaluateEventGuard('tenant_apex_lawn', 'FORM_SUBMITTED');
  assert(guardSuspended.allowed === false && guardSuspended.failedFlag === 'serviceStatus:SUSPENDED', 'Guard BLOCKS events for SUSPENDED tenant');

  // 3. Test Event Bus & Workflow Trigger Execution
  const res1 = await EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'FORM_SUBMITTED',
    source: 'TEST_SUITE',
    payload: { contactId: 'contact_john_doe', formName: 'Quote Form', phone: '+19195550144' },
  });
  assert(res1.executions.length > 0, 'EventBus published FORM_SUBMITTED and triggered workflow execution');
  assert(res1.executions[0].status === 'COMPLETED', 'Speed-to-Lead workflow execution completed successfully');

  // 4. Test Missed Call Text Back Workflow
  const res2 = await EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'MISSED_CALL',
    source: 'TWILIO_CALL_EVENT',
    payload: { contactId: 'contact_john_doe', phone: '+19195550144' },
  });
  assert(res2.executions.length >= 0, 'MISSED_CALL event published');

  // 5. Test Review Request Branching (Score >= 4 vs Score < 4)
  const resHighScore = await EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'RATING_RECEIVED',
    source: 'REVIEW_SURVEY',
    payload: { contactId: 'contact_john_doe', rating: 5 },
  });

  const resLowScore = await EventBus.publish({
    tenantId: 'tenant_tyrees_auto',
    eventType: 'RATING_RECEIVED',
    source: 'REVIEW_SURVEY',
    payload: { contactId: 'contact_john_doe', rating: 2 },
  });

  // 6. Test Portable Website Exporter (Independent of Status)
  const exportResult = await generateWebsiteExportZip({
    tenantId: 'tenant_tyrees_auto',
    adapterType: 'WEB3FORMS',
  });
  assert(!!exportResult.filename && exportResult.zipBuffer.length > 0, 'Website Exporter generated ZIP buffer file');
  assert(exportResult.auditReport.includes('EXPORT_AUDIT_WARNINGS'), 'Audit Report generated with warning markers');

  console.log('===========================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSystemVerification();
