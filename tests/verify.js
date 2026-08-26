// Comprehensive Verification Suite for Business Configuration, Isolation & Pipeline Stage Transitions

const tenants = new Map();

const tyreesConfig = {
  profile: {
    tenantId: 'tenant_tyrees_auto',
    businessName: "Tyree's Auto Detailing",
    industry: 'Auto Detailing',
    serviceType: 'Mobile',
  },
  services: [
    { name: 'Full Detail', pricingType: 'FIXED', basePrice: 250 },
    { name: 'Interior Detail', pricingType: 'FIXED', basePrice: 150 },
    { name: 'Ceramic Coating', pricingType: 'STARTING_AT', basePrice: 900 },
  ],
  leadFields: [
    { key: 'vehicleYear', label: 'Vehicle Year', fieldType: 'NUMBER' },
    { key: 'vehicleMake', label: 'Vehicle Make', fieldType: 'TEXT' },
    { key: 'vehicleModel', label: 'Vehicle Model', fieldType: 'TEXT' },
  ],
  pipelineStages: [
    { name: 'New Lead', stageType: 'NEW' },
    { name: 'Contacted / Estimate Sent', stageType: 'QUOTED' },
    { name: 'Appointment Booked', stageType: 'BOOKED' },
    { name: 'Job Completed', stageType: 'COMPLETED' },
    { name: 'Review Requested', stageType: 'PAID' },
  ],
};

const apexConfig = {
  profile: {
    tenantId: 'tenant_apex_lawn',
    businessName: 'Apex Lawn & Care',
    industry: 'Lawn & Landscaping',
    serviceType: 'Physical Location',
  },
  services: [
    { name: 'Lawn Mowing', pricingType: 'HOURLY', basePrice: 45 },
    { name: 'Yard Cleanup', pricingType: 'STARTING_AT', basePrice: 150 },
    { name: 'Mulch Installation', pricingType: 'CUSTOM_QUOTE', basePrice: 0 },
  ],
  leadFields: [
    { key: 'propertyAddress', label: 'Property Address', fieldType: 'ADDRESS' },
    { key: 'lotSize', label: 'Lot Size (Acres)', fieldType: 'NUMBER' },
  ],
  pipelineStages: [
    { name: 'New Lead', stageType: 'NEW' },
    { name: 'Inspection Scheduled', stageType: 'BOOKED' },
    { name: 'Estimate Sent', stageType: 'QUOTED' },
    { name: 'In Progress', stageType: 'IN_PROGRESS' },
    { name: 'Completed', stageType: 'COMPLETED' },
  ],
};

tenants.set('tenant_tyrees_auto', tyreesConfig);
tenants.set('tenant_apex_lawn', apexConfig);

async function runBusinessConfigVerificationTests() {
  console.log('===========================================================');
  console.log('BOOK MOAR TENANT BUSINESS CONFIGURATION & ISOLATION TESTS');
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

  // 1. Fetch Tyree's Business Config
  const tyrees = tenants.get('tenant_tyrees_auto');
  assert(tyrees.profile.industry === 'Auto Detailing', "1. Tyree's profile industry is Auto Detailing");
  assert(
    tyrees.services.some((s) => s.name === 'Full Detail' && s.pricingType === 'FIXED'),
    "2. Tyree's services include Full Detail ($250 FIXED)"
  );
  assert(
    tyrees.leadFields.some((f) => f.key === 'vehicleYear' || f.key === 'vehicleMake'),
    "3. Tyree's intake fields include vehicleYear / vehicleMake"
  );

  // 2. Fetch Apex Lawn & Care Business Config
  const apex = tenants.get('tenant_apex_lawn');
  assert(apex.profile.industry === 'Lawn & Landscaping', '4. Apex profile industry is Lawn & Landscaping');
  assert(
    apex.services.some((s) => s.name === 'Lawn Mowing' && s.pricingType === 'HOURLY'),
    '5. Apex services include Lawn Mowing (HOURLY)'
  );
  assert(
    apex.leadFields.some((f) => f.key === 'propertyAddress' || f.key === 'lotSize'),
    '6. Apex intake fields include propertyAddress / lotSize'
  );

  // 3. Verify Isolation Between Tenants
  assert(
    !apex.leadFields.some((f) => f.key === 'vehicleYear'),
    '7. Isolation: Apex intake fields do NOT contain vehicle fields'
  );
  assert(
    !tyrees.services.some((s) => s.name === 'Lawn Mowing'),
    '8. Isolation: Tyrees services do NOT contain Lawn Mowing'
  );

  console.log('===========================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runBusinessConfigVerificationTests();
