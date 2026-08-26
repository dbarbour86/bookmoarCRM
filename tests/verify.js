// Comprehensive Verification Suite for Tenant Service Status Persistence & Unsuspend Controls

const { db } = require('../lib/db');

async function runTenantStatusVerificationTests() {
  console.log('===========================================================');
  console.log('BOOK MOAR TENANT SERVICE STATUS PERSISTENCE TESTS');
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

  const tenantId = 'tenant_apex_lawn';

  // 1. Initial status
  const allTenants1 = await db.getAllTenants();
  const apex1 = allTenants1.find((t) => t.id === tenantId);
  assert(apex1 !== undefined, '1. Tenant Apex Lawn & Care exists in tenant list');

  // 2. Unsuspend tenant (SUSPENDED -> ACTIVE)
  const unsuspendRes = await db.updateTenantServiceStatus({
    tenantId,
    serviceStatus: 'ACTIVE',
    userId: 'user_master_admin',
  });
  assert(unsuspendRes.tenant.serviceStatus === 'ACTIVE', '2. Update tenant status to ACTIVE succeeded');
  assert(unsuspendRes.tenant.masterAutomationEnabled === true, '3. Unsuspend automatically set masterAutomationEnabled to true');
  assert(unsuspendRes.auditLog.action === 'SERVICE_STATUS_CHANGED_ACTIVE', '4. Audit log entry recorded SERVICE_STATUS_CHANGED_ACTIVE');

  // 3. Re-query all tenants to verify persistent state
  const allTenants2 = await db.getAllTenants();
  const apex2 = allTenants2.find((t) => t.id === tenantId);
  assert(apex2.serviceStatus === 'ACTIVE', '5. Verified persistent ACTIVE status in getAllTenants query');

  // 4. Re-suspend tenant (ACTIVE -> SUSPENDED)
  const suspendRes = await db.updateTenantServiceStatus({
    tenantId,
    serviceStatus: 'SUSPENDED',
    userId: 'user_master_admin',
  });
  assert(suspendRes.tenant.serviceStatus === 'SUSPENDED', '6. Re-suspend status update succeeded');
  assert(suspendRes.tenant.masterAutomationEnabled === false, '7. Suspend automatically set masterAutomationEnabled to false');

  console.log('===========================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runTenantStatusVerificationTests();
