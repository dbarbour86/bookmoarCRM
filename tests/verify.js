// Comprehensive Verification Suite for Business Configuration CRUD & Persistence

const { db } = require('../lib/db');

async function runBusinessConfigCrudVerificationTests() {
  console.log('===========================================================');
  console.log('BOOK MOAR BUSINESS CONFIGURATION CRUD & PERSISTENCE TESTS');
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

  const tenantId = 'tenant_tyrees_auto';

  // 1. Initial Config
  const initialConfig = await db.getTenantBusinessConfig(tenantId);
  assert(initialConfig.profile.industry === 'Auto Detailing', "1. Profile loaded for Tyree's Auto Detailing");

  // 2. Create Service
  const newServiceRes = await db.mutateBusinessConfig({
    tenantId,
    entityType: 'SERVICE',
    action: 'CREATE',
    data: {
      name: 'Engine Bay Detail',
      category: 'Detailing',
      pricingType: 'FIXED',
      basePrice: 95,
      durationMinutes: 45,
      bookingMode: 'INSTANT_BOOK',
    },
  });
  assert(newServiceRes.success === true, '2. Create Service mutation succeeded');

  // 3. Verify Created Service in Config
  const updatedConfig1 = await db.getTenantBusinessConfig(tenantId);
  assert(
    updatedConfig1.services.some((s) => s.name === 'Engine Bay Detail' && s.basePrice === 95),
    '3. Engine Bay Detail service persisted in tenant configuration'
  );

  // 4. Create Lead Field
  const newFieldRes = await db.mutateBusinessConfig({
    tenantId,
    entityType: 'LEAD_FIELD',
    action: 'CREATE',
    data: {
      key: 'paintCondition',
      label: 'Paint Oxidation Level',
      fieldType: 'SELECT',
      required: false,
      options: ['None', 'Light Oxidation', 'Heavy Swirls / Scratches'],
    },
  });
  assert(newFieldRes.success === true, '4. Create Lead Field mutation succeeded');

  // 5. Verify Created Lead Field in Config
  const updatedConfig2 = await db.getTenantBusinessConfig(tenantId);
  assert(
    updatedConfig2.leadFields.some((f) => f.key === 'paintCondition'),
    '5. Dynamic lead field paintCondition persisted in tenant intake definition'
  );

  console.log('===========================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runBusinessConfigCrudVerificationTests();
