import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, serviceStatus, userId = 'user_master_admin' } = body;

    if (!tenantId || !serviceStatus) {
      return NextResponse.json({ error: 'Missing tenantId or serviceStatus' }, { status: 400 });
    }

    console.log('[TENANT_STATUS_CHANGE_REQUEST]', { tenantId, serviceStatus, userId });

    const result = await db.updateTenantServiceStatus({
      tenantId,
      serviceStatus,
      userId,
    });

    console.log('[TENANT_STATUS_CHANGE_SUCCESS]', {
      tenantId,
      newStatus: result.tenant.serviceStatus,
      updatedAt: result.tenant.updatedAt,
    });

    return NextResponse.json(
      {
        success: true,
        tenant: result.tenant,
        auditLog: result.auditLog,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[TENANT_STATUS_CHANGE_ERR]', err);
    return NextResponse.json({ error: err.message || 'Failed to update tenant status' }, { status: 500 });
  }
}
