import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant_tyrees_auto';

    const opportunities = await db.getTenantOpportunities(tenantId);

    return NextResponse.json({ success: true, opportunities }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId = 'tenant_tyrees_auto', contactId, stageId = 'stage_lead_in', title, value = 350 } = body;

    if (!contactId || !title) {
      return NextResponse.json({ error: 'Missing contactId or title' }, { status: 400 });
    }

    const opportunity = await db.createOpportunity({
      tenantId,
      contactId,
      stageId,
      title,
      value: Number(value),
    });

    return NextResponse.json({ success: true, opportunity }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create opportunity' }, { status: 500 });
  }
}
