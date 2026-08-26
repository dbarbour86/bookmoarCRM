import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  exportContactsCSV,
  exportOpportunitiesCSV,
  exportFormSubmissionsCSV,
  exportAllDataZip,
  recordExportAudit,
  ExportType,
  ExportFormat,
} from '@/lib/export/clientDataExporter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, type = 'CONTACTS', format = 'csv', userId = 'user_master_admin', userRole = 'MASTER_ADMIN' } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
    }

    const tenant = db.tenants.get(tenantId);
    if (!tenant) {
      return NextResponse.json({ error: `Tenant ${tenantId} not found` }, { status: 404 });
    }

    // 1. Server-Side RBAC Permission Check ('data.export')
    const isMasterAdmin = userRole === 'MASTER_ADMIN';
    const isClientAdmin = userRole === 'CLIENT_ADMIN';

    if (!isMasterAdmin && !isClientAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Role does not possess data.export capability.' },
        { status: 403 }
      );
    }

    // 2. Generate Requested Export Data
    let fileContent: string | Buffer;
    let fileName = `${tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${type.toLowerCase()}`;
    let contentType = 'text/csv';
    let recordCount = 0;

    if (type === 'CONTACTS') {
      const res = exportContactsCSV(tenantId);
      fileContent = res.csv;
      recordCount = res.count;
      fileName += '.csv';
      contentType = 'text/csv';
    } else if (type === 'OPPORTUNITIES') {
      const res = exportOpportunitiesCSV(tenantId);
      fileContent = res.csv;
      recordCount = res.count;
      fileName += '.csv';
      contentType = 'text/csv';
    } else if (type === 'FORM_SUBMISSIONS') {
      const res = exportFormSubmissionsCSV(tenantId);
      fileContent = res.csv;
      recordCount = res.count;
      fileName += '.csv';
      contentType = 'text/csv';
    } else {
      // Export All Data (ZIP)
      const res = await exportAllDataZip(tenantId);
      fileContent = res.zipBuffer;
      recordCount = res.totalRecords;
      fileName += '-all-data.zip';
      contentType = 'application/zip';
    }

    // 3. Record AuditLog Entry in Database
    recordExportAudit({
      tenantId,
      userId,
      exportType: type as ExportType,
      format: format as ExportFormat,
      recordCount,
      serviceState: tenant.serviceStatus,
      status: 'SUCCESS',
    });

    // 4. Return File Download Stream Response
    return new NextResponse(fileContent as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
