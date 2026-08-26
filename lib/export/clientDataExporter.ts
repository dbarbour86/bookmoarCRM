import JSZip from 'jszip';
import { db, ContactData, OpportunityData, FormSubmissionData, TenantData } from '../db';

export type ExportType = 'CONTACTS' | 'OPPORTUNITIES' | 'FORM_SUBMISSIONS' | 'ALL';
export type ExportFormat = 'csv' | 'zip';

/**
 * Sanitizes cell values to prevent CSV Formula Injection in spreadsheet software
 * (e.g. =, +, -, @) and enforces RFC 4180 double-quote escaping.
 */
export function sanitizeCSVValue(value: any): string {
  if (value === undefined || value === null) return '""';
  let str = String(value);

  // Formula Injection Sanitization (Prefix formula triggers with single quote)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180 Quote Escaping
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function arrayToCSVRow(row: any[]): string {
  return row.map(sanitizeCSVValue).join(',');
}

/**
 * Exports Contacts / Leads to CSV format
 */
export function exportContactsCSV(tenantId: string): { csv: string; count: number } {
  const contacts = Array.from(db.contacts.values()).filter((c) => c.tenantId === tenantId);
  const stages = db.pipelineStages.get(tenantId) || [];
  const opportunities = Array.from(db.opportunities.values()).filter((o) => o.tenantId === tenantId);

  const headers = [
    'Contact ID',
    'First Name',
    'Last Name',
    'Full Name',
    'Phone',
    'Email',
    'Status',
    'Lead Source',
    'Tags',
    'Pipeline',
    'Pipeline Stage',
    'Last Activity Date',
    'Custom Fields',
    'Notes',
    'Created Date',
    'Updated Date',
  ];

  const rows = [arrayToCSVRow(headers)];

  for (const c of contacts) {
    const firstName = c.name ? c.name.split(' ')[0] : '';
    const lastName = c.name && c.name.split(' ').length > 1 ? c.name.split(' ').slice(1).join(' ') : '';
    const opp = opportunities.find((o) => o.contactId === c.id);
    const stage = opp ? stages.find((s) => s.id === opp.stageId) : null;

    const row = [
      c.id,
      firstName,
      lastName,
      c.name || '',
      c.phone || '',
      c.email || '',
      c.status || 'LEAD',
      'Website',
      (c.tags || []).join('; '),
      'Sales Pipeline',
      stage ? stage.name : 'Unassigned',
      c.createdAt,
      JSON.stringify(c.customFields || {}),
      '',
      c.createdAt,
      c.createdAt,
    ];

    rows.push(arrayToCSVRow(row));
  }

  return { csv: rows.join('\r\n'), count: contacts.length };
}

/**
 * Exports Opportunities to CSV format
 */
export function exportOpportunitiesCSV(tenantId: string): { csv: string; count: number } {
  const opportunities = Array.from(db.opportunities.values()).filter((o) => o.tenantId === tenantId);
  const stages = db.pipelineStages.get(tenantId) || [];

  const headers = [
    'Opportunity ID',
    'Contact ID',
    'Contact Name',
    'Opportunity Title',
    'Value ($)',
    'Pipeline Stage',
    'Status',
    'Created Date',
    'Updated Date',
  ];

  const rows = [arrayToCSVRow(headers)];

  for (const opp of opportunities) {
    const contact = db.contacts.get(opp.contactId);
    const stage = stages.find((s) => s.id === opp.stageId);

    const row = [
      opp.id,
      opp.contactId,
      contact ? contact.name : 'Unknown Contact',
      opp.title,
      opp.value,
      stage ? stage.name : opp.stageId,
      opp.status,
      opp.createdAt,
      opp.createdAt,
    ];

    rows.push(arrayToCSVRow(row));
  }

  return { csv: rows.join('\r\n'), count: opportunities.length };
}

/**
 * Exports Form Submissions to CSV format
 */
export function exportFormSubmissionsCSV(tenantId: string): { csv: string; count: number } {
  const submissions = Array.from(db.formSubmissions.values()).filter((s) => s.tenantId === tenantId);

  const headers = [
    'Submission ID',
    'Integration ID',
    'Contact ID',
    'Form Type',
    'Payload (JSON)',
    'Created Date',
  ];

  const rows = [arrayToCSVRow(headers)];

  for (const sub of submissions) {
    const row = [
      sub.id,
      sub.integrationId,
      sub.contactId,
      sub.formType,
      JSON.stringify(sub.payload || {}),
      sub.createdAt,
    ];

    rows.push(arrayToCSVRow(row));
  }

  return { csv: rows.join('\r\n'), count: submissions.length };
}

/**
 * Exports All Available Tenant Business Data as a ZIP package
 */
export async function exportAllDataZip(tenantId: string): Promise<{ zipBuffer: Buffer; totalRecords: number }> {
  const tenant = db.tenants.get(tenantId);
  const zip = new JSZip();

  const contactsRes = exportContactsCSV(tenantId);
  const oppsRes = exportOpportunitiesCSV(tenantId);
  const formsRes = exportFormSubmissionsCSV(tenantId);

  const totalRecords = contactsRes.count + oppsRes.count + formsRes.count;

  const summaryText = `BOOK MOAR BUSINESS DATA EXPORT SUMMARY
================================================
Client Tenant: ${tenant?.name || tenantId} (${tenant?.domain || ''})
Service State: ${tenant?.serviceStatus || 'ACTIVE'}
Export Date: ${new Date().toISOString()}

EXPORTED FILES CONTAINED:
- contacts.csv (${contactsRes.count} records)
- opportunities.csv (${oppsRes.count} records)
- form_submissions.csv (${formsRes.count} records)

SECURITY STATEMENT:
This export contains only portable client business and customer data. Proprietary Book Moar platform code, database credentials, API secrets, Twilio keys, and managed workflow templates are strictly excluded.
`;

  zip.file('contacts.csv', contactsRes.csv);
  zip.file('opportunities.csv', oppsRes.csv);
  zip.file('form_submissions.csv', formsRes.csv);
  zip.file('EXPORT_SUMMARY.txt', summaryText);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return { zipBuffer, totalRecords };
}

/**
 * Records AuditLog entry for client data export
 */
export function recordExportAudit(input: {
  tenantId: string;
  userId: string;
  exportType: ExportType;
  format: ExportFormat;
  recordCount: number;
  serviceState: string;
  status: 'SUCCESS' | 'FAILURE';
}) {
  db.auditLogs.unshift({
    id: `audit_exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    tenantId: input.tenantId,
    userId: input.userId,
    action: 'CLIENT_DATA_EXPORTED',
    details: {
      exportType: input.exportType,
      format: input.format,
      recordCount: input.recordCount,
      serviceState: input.serviceState,
      status: input.status,
    },
    timestamp: new Date().toISOString(),
  });
}
