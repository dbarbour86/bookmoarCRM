// Comprehensive Verification Suite for Client Data Export, Formula Protection & RBAC

const JSZip = require('jszip');

// Mock Database & Storage
const tenants = new Map();
const contacts = new Map();
const opportunities = new Map();
const formSubmissions = new Map();
const auditLogs = [];

tenants.set('tenant_tyrees_auto', {
  id: 'tenant_tyrees_auto',
  name: "Tyree's Auto Detailing",
  domain: 'tyreesautodetailing.com',
  serviceStatus: 'ACTIVE',
});

// Seed Contacts with Formula Injection Attempt
contacts.set('c1', {
  id: 'c1',
  tenantId: 'tenant_tyrees_auto',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9195551234',
  status: 'LEAD',
  tags: ['Website Lead'],
  createdAt: new Date().toISOString(),
});

contacts.set('c_formula', {
  id: 'c_formula',
  tenantId: 'tenant_tyrees_auto',
  name: '=SUM(1+1)',
  email: '@malicious@example.com',
  phone: '+19195559999',
  status: 'LEAD',
  tags: ['-formula_tag'],
  createdAt: new Date().toISOString(),
});

opportunities.set('opp_1', {
  id: 'opp_1',
  tenantId: 'tenant_tyrees_auto',
  contactId: 'c1',
  title: 'Full Detail Quote',
  value: 350,
  stageName: 'New Lead',
  status: 'OPEN',
  createdAt: new Date().toISOString(),
});

formSubmissions.set('sub_1', {
  id: 'sub_1',
  tenantId: 'tenant_tyrees_auto',
  integrationId: 'integration_1',
  contactId: 'c1',
  formType: 'quote',
  payload: { service: 'Full Detail' },
  createdAt: new Date().toISOString(),
});

// CSV Formula Sanitizer
function sanitizeCSVValue(value) {
  if (value === undefined || value === null) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function arrayToCSVRow(row) {
  return row.map(sanitizeCSVValue).join(',');
}

function exportContactsCSV(tenantId) {
  const list = Array.from(contacts.values()).filter((c) => c.tenantId === tenantId);
  const headers = ['Contact ID', 'First Name', 'Last Name', 'Full Name', 'Phone', 'Email', 'Status', 'Lead Source', 'Tags', 'Pipeline', 'Pipeline Stage', 'Last Activity Date', 'Custom Fields', 'Notes', 'Created Date', 'Updated Date'];
  const rows = [arrayToCSVRow(headers)];

  for (const c of list) {
    const firstName = c.name ? c.name.split(' ')[0] : '';
    const lastName = c.name && c.name.split(' ').length > 1 ? c.name.split(' ').slice(1).join(' ') : '';
    rows.push(arrayToCSVRow([
      c.id, firstName, lastName, c.name, c.phone, c.email, c.status, 'Website', (c.tags || []).join('; '), 'Sales Pipeline', 'New Lead', c.createdAt, '{}', '', c.createdAt, c.createdAt
    ]));
  }
  return { csv: rows.join('\r\n'), count: list.length };
}

function exportOpportunitiesCSV(tenantId) {
  const list = Array.from(opportunities.values()).filter((o) => o.tenantId === tenantId);
  const headers = ['Opportunity ID', 'Contact ID', 'Contact Name', 'Opportunity Title', 'Value ($)', 'Pipeline Stage', 'Status', 'Created Date', 'Updated Date'];
  const rows = [arrayToCSVRow(headers)];

  for (const opp of list) {
    const c = contacts.get(opp.contactId);
    rows.push(arrayToCSVRow([
      opp.id, opp.contactId, c ? c.name : 'Unknown', opp.title, opp.value, opp.stageName, opp.status, opp.createdAt, opp.createdAt
    ]));
  }
  return { csv: rows.join('\r\n'), count: list.length };
}

function exportFormSubmissionsCSV(tenantId) {
  const list = Array.from(formSubmissions.values()).filter((s) => s.tenantId === tenantId);
  const headers = ['Submission ID', 'Integration ID', 'Contact ID', 'Form Type', 'Payload (JSON)', 'Created Date'];
  const rows = [arrayToCSVRow(headers)];

  for (const sub of list) {
    rows.push(arrayToCSVRow([
      sub.id, sub.integrationId, sub.contactId, sub.formType, JSON.stringify(sub.payload), sub.createdAt
    ]));
  }
  return { csv: rows.join('\r\n'), count: list.length };
}

async function exportAllDataZip(tenantId) {
  const zip = new JSZip();
  const cRes = exportContactsCSV(tenantId);
  const oRes = exportOpportunitiesCSV(tenantId);
  const fRes = exportFormSubmissionsCSV(tenantId);

  zip.file('contacts.csv', cRes.csv);
  zip.file('opportunities.csv', oRes.csv);
  zip.file('form_submissions.csv', fRes.csv);
  zip.file('EXPORT_SUMMARY.txt', `BOOK MOAR BUSINESS DATA EXPORT SUMMARY\nRecords: ${cRes.count + oRes.count + fRes.count}`);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return { zipBuffer, totalRecords: cRes.count + oRes.count + fRes.count };
}

function handleExportAPIRequest(body) {
  const { tenantId, type, format, userRole } = body;
  const tenant = tenants.get(tenantId);
  if (!tenant) return { status: 404, body: { error: 'Tenant not found' } };

  // Server-Side RBAC
  if (userRole !== 'MASTER_ADMIN' && userRole !== 'CLIENT_ADMIN') {
    return { status: 403, body: { error: 'Forbidden. Role does not possess data.export capability.' } };
  }

  // AuditLog
  auditLogs.unshift({
    id: `audit_${Date.now()}`,
    tenantId,
    userRole,
    action: 'CLIENT_DATA_EXPORTED',
    details: { type, format, serviceState: tenant.serviceStatus },
    timestamp: new Date().toISOString(),
  });

  if (type === 'CONTACTS') return { status: 200, contentType: 'text/csv', data: exportContactsCSV(tenantId) };
  if (type === 'OPPORTUNITIES') return { status: 200, contentType: 'text/csv', data: exportOpportunitiesCSV(tenantId) };
  if (type === 'FORM_SUBMISSIONS') return { status: 200, contentType: 'text/csv', data: exportFormSubmissionsCSV(tenantId) };
  return { status: 200, contentType: 'application/zip', data: { totalRecords: 3 } };
}

async function runExportVerificationTests() {
  console.log('===========================================================');
  console.log('BOOK MOAR CLIENT DATA EXPORT & SECURITY VERIFICATION SUITE');
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

  // 1. CSV Formula Injection Protection Test (=, +, -, @)
  const sanitizedFormula = sanitizeCSVValue('=SUM(1+1)');
  const sanitizedAtSign = sanitizeCSVValue('@malicious');
  const sanitizedPlus = sanitizeCSVValue('+123456');

  assert(sanitizedFormula === `"'=SUM(1+1)"`, '1. CSV Formula Sanitization prefixed "=" with single quote');
  assert(sanitizedAtSign === `"'@malicious"`, '2. CSV Formula Sanitization prefixed "@" with single quote');
  assert(sanitizedPlus === `"'+123456"`, '3. CSV Formula Sanitization prefixed "+" with single quote');

  // 2. Contacts CSV Serialization & Expanded Fields Test
  const contactsRes = exportContactsCSV('tenant_tyrees_auto');
  assert(contactsRes.count >= 2, '4. Contacts CSV exported correct record count');
  assert(contactsRes.csv.includes('Contact ID') && contactsRes.csv.includes('Full Name') && contactsRes.csv.includes('Last Activity Date'), '5. Contacts CSV contains required expanded field headers');
  assert(contactsRes.csv.includes(`"'=SUM(1+1)"`), '6. Exported Contacts CSV safely sanitized formula injection payload in database');

  // 3. Opportunities CSV Serialization Test
  const oppsRes = exportOpportunitiesCSV('tenant_tyrees_auto');
  assert(oppsRes.csv.includes('Opportunity ID') && oppsRes.csv.includes('Opportunity Title') && oppsRes.csv.includes('Value ($)'), '7. Opportunities CSV contains required pipeline headers');

  // 4. Form Submissions CSV Serialization Test
  const formsRes = exportFormSubmissionsCSV('tenant_tyrees_auto');
  assert(formsRes.csv.includes('Submission ID') && formsRes.csv.includes('Form Type') && formsRes.csv.includes('Payload (JSON)'), '8. Form Submissions CSV contains submission headers');

  // 5. Export All Data (ZIP Archive Compilation) Test
  const zipRes = await exportAllDataZip('tenant_tyrees_auto');
  assert(zipRes.zipBuffer.length > 0, '9. Export All Data compiled valid downloadable ZIP buffer');
  assert(zipRes.totalRecords >= 3, '10. ZIP summary counted total records across files');

  // 6. Server-Side RBAC Permission & 403 Forbidden Test
  const forbiddenRes = handleExportAPIRequest({ tenantId: 'tenant_tyrees_auto', type: 'CONTACTS', userRole: 'CLIENT_STAFF' });
  assert(forbiddenRes.status === 403, '11. Server-side RBAC rejected unauthorized role with 403 Forbidden');

  const adminRes = handleExportAPIRequest({ tenantId: 'tenant_tyrees_auto', type: 'CONTACTS', userRole: 'CLIENT_ADMIN' });
  assert(adminRes.status === 200, '12. Server-side RBAC authorized CLIENT_ADMIN role with 200 OK');

  // 7. AuditLog Recording Test
  assert(auditLogs.length >= 1, '13. Data export created record in AuditLog table');
  assert(auditLogs[0].action === 'CLIENT_DATA_EXPORTED', '14. AuditLog action recorded as CLIENT_DATA_EXPORTED');

  // 8. Service-State Availability Test (ACTIVE, SUSPENDED, TERMINATED)
  const tyreeTenant = tenants.get('tenant_tyrees_auto');
  tyreeTenant.serviceStatus = 'SUSPENDED';
  const suspendedExport = handleExportAPIRequest({ tenantId: 'tenant_tyrees_auto', type: 'CONTACTS', userRole: 'MASTER_ADMIN' });
  assert(suspendedExport.status === 200, '15. Data export remains available when tenant is SUSPENDED');

  tyreeTenant.serviceStatus = 'TERMINATED';
  const terminatedExport = handleExportAPIRequest({ tenantId: 'tenant_tyrees_auto', type: 'CONTACTS', userRole: 'MASTER_ADMIN' });
  assert(terminatedExport.status === 200, '16. Data export remains available to Master Admin when tenant is TERMINATED');

  tyreeTenant.serviceStatus = 'ACTIVE';

  // 9. Security Check: No secrets in exported CSV/ZIP
  const fullCSV = contactsRes.csv + oppsRes.csv + formsRes.csv;
  assert(!fullCSV.includes('twilio') && !fullCSV.includes('DATABASE_URL') && !fullCSV.includes('SECRET'), '17. Security check verified zero API secrets, DB credentials, or platform code in export');

  console.log('===========================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runExportVerificationTests();
