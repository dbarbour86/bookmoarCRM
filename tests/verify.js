// Automated Persistence Regression Suite for PostgreSQL Boundaries & Entity Lifecycle

const { db } = require('../lib/db');

async function runPersistenceRegressionTests() {
  console.log('===========================================================');
  console.log('BOOK MOAR DURABLE PERSISTENCE BOUNDARY VERIFICATION SUITE');
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

  try {
    // 1. Tenant Status Mutation Persistence
    const unsuspendRes = await db.updateTenantServiceStatus({
      tenantId,
      serviceStatus: 'ACTIVE',
      userId: 'user_master_admin',
    });
    assert(unsuspendRes.tenant.serviceStatus === 'ACTIVE', '1. Tenant status mutation to ACTIVE succeeded');

    const tenants = await db.getAllTenants();
    const apexTenant = tenants.find((t) => t.id === tenantId);
    assert(apexTenant && apexTenant.serviceStatus === 'ACTIVE', '2. Persisted tenant status ACTIVE returned from getAllTenants query');

    // 2. Contact Persistence
    const lead = await db.findOrCreateContactByPhoneOrEmail(tenantId, {
      name: 'Persistence Final Lead',
      email: 'persistence.lead@example.com',
      phone: '+19195559988',
      fields: { source: 'Automated Test' },
    });
    assert(lead && lead.name === 'Persistence Final Lead', '3. Contact created successfully');

    const contactList = await db.getTenantContacts(tenantId);
    assert(contactList.some((c) => c.id === lead.id), '4. Persisted Contact verified in getTenantContacts query');

    // 3. Opportunity Persistence
    const opp = await db.createOpportunity({
      tenantId,
      contactId: lead.id,
      stageId: 'st_1',
      title: 'Persistence Test Opportunity',
      value: 350,
    });
    assert(opp && opp.title === 'Persistence Test Opportunity', '5. Opportunity created successfully');

    const oppList1 = await db.getTenantOpportunities(tenantId);
    assert(oppList1.some((o) => o.id === opp.id), '6. Persisted Opportunity verified in getTenantOpportunities query');

    // 4. Pipeline Stage Move Persistence
    const moveRes = await db.moveOpportunity({
      tenantId,
      opportunityId: opp.id,
      targetStageId: 'st_2',
      userId: 'user_master_admin',
    });
    assert(moveRes.success === true && moveRes.opportunity.stageId === 'st_2', '7. Opportunity stage moved to st_2');

    const oppList2 = await db.getTenantOpportunities(tenantId);
    const movedOpp = oppList2.find((o) => o.id === opp.id);
    assert(movedOpp && movedOpp.stageId === 'st_2', '8. Persisted Opportunity stage st_2 verified in getTenantOpportunities query');

    // 5. Service Mutation Persistence
    const serviceRes = await db.mutateBusinessConfig({
      tenantId,
      entityType: 'SERVICE',
      action: 'CREATE',
      data: {
        name: 'Persistence Test Service',
        category: 'Testing',
        pricingType: 'FIXED',
        basePrice: 123,
        durationMinutes: 60,
        bookingMode: 'REQUEST_APPOINTMENT',
      },
    });
    assert(serviceRes.success === true, '9. Service mutation CREATE succeeded');

    const config = await db.getTenantBusinessConfig(tenantId);
    assert(
      config.services.some((s) => s.name === 'Persistence Test Service' && Number(s.basePrice) === 123),
      '10. Persisted Service with $123 price verified in getTenantBusinessConfig query'
    );
  } catch (err) {
    console.error('[TEST_FAILURE]', err);
    failed++;
  }

  console.log('===========================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runPersistenceRegressionTests();
