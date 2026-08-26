import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant_tyrees_auto';

    const config = await db.getTenantBusinessConfig(tenantId);
    return NextResponse.json({ success: true, config }, { status: 200 });
  } catch (err: any) {
    console.error('[GET_BUSINESS_CONFIG_ERR]', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch business config' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, section, data, userId = 'user_master_admin' } = body;

    if (!tenantId || !section || !data) {
      return NextResponse.json({ error: 'Missing tenantId, section, or data parameter' }, { status: 400 });
    }

    const updated = await db.saveTenantBusinessConfig({
      tenantId,
      section,
      data,
      userId,
    });

    return NextResponse.json({ success: true, config: updated }, { status: 200 });
  } catch (err: any) {
    console.error('[POST_BUSINESS_CONFIG_ERR]', err);
    return NextResponse.json({ error: err.message || 'Failed to update business config' }, { status: 500 });
  }
}
