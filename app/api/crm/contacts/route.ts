import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant_tyrees_auto';

    console.log('[CRM_CONTACTS_FETCH]', { timestamp: new Date().toISOString(), tenantId });

    const contacts = await db.getTenantContacts(tenantId);

    return NextResponse.json({ success: true, contacts }, { status: 200 });
  } catch (err: any) {
    console.error('[CRM_CONTACTS_FETCH_ERROR]', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch CRM contacts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId = 'tenant_tyrees_auto', name, email, phone, customFields = {} } = body;

    if (!name && !email && !phone) {
      return NextResponse.json({ error: 'At least name, email, or phone is required' }, { status: 400 });
    }

    const contact = await db.findOrCreateContactByPhoneOrEmail(tenantId, {
      name,
      email,
      phone,
      fields: customFields,
    });

    console.log('[CRM_CONTACT_CREATED]', { timestamp: new Date().toISOString(), contactId: contact.id, tenantId });

    return NextResponse.json({ success: true, contact }, { status: 200 });
  } catch (err: any) {
    console.error('[CRM_CONTACT_CREATE_ERROR]', err);
    return NextResponse.json({ error: err.message || 'Failed to create CRM contact' }, { status: 500 });
  }
}
