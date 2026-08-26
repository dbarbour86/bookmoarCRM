import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, entityType, action, data, userId = 'user_master_admin' } = body;

    if (!tenantId || !entityType || !action || !data) {
      return NextResponse.json({ error: 'Missing tenantId, entityType, action, or data' }, { status: 400 });
    }

    console.log('[MUTATE_CONFIG_REQUEST]', { tenantId, entityType, action, userId });

    const result = await db.mutateBusinessConfig({
      tenantId,
      entityType,
      action,
      data,
      userId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to mutate business configuration' }, { status: 400 });
    }

    const config = await db.getTenantBusinessConfig(tenantId);

    return NextResponse.json({ success: true, item: result.data, config }, { status: 200 });
  } catch (err: any) {
    console.error('[MUTATE_BUSINESS_CONFIG_ERR]', err);
    return NextResponse.json({ error: err.message || 'Internal server error mutating business config' }, { status: 500 });
  }
}
