import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tenants = await db.getAllTenants();
    return NextResponse.json({ success: true, tenants }, { status: 200 });
  } catch (err: any) {
    console.error('[GET_TENANTS_ERR]', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch tenants' }, { status: 500 });
  }
}
