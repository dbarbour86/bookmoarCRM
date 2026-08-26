import { NextResponse } from 'next/server';
import { db, FormSubmissionData } from '@/lib/db';
import { EventBus } from '@/lib/events/eventBus';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Site-Key',
    },
  });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '*';
  const timestamp = new Date().toISOString();

  try {
    const body = await req.json();
    const { siteKey, formType = 'quote', eventId, contact = {}, fields = {} } = body;

    console.log('[PUBLIC_FORM_SUBMIT_RECEIVED]', {
      timestamp,
      siteKey: siteKey ? `${siteKey.substring(0, 10)}...` : 'MISSING',
      formType,
      eventId,
      contactName: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      phone: contact.phone,
      email: contact.email,
    });

    if (!siteKey) {
      console.warn('[PUBLIC_FORM_SUBMIT_REJECTED]', { timestamp, reason: 'Missing siteKey' });
      return NextResponse.json(
        { error: 'Missing publicSiteKey parameter' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 1. Resolve WebsiteIntegration & Tenant
    const integration = await db.findIntegrationBySiteKey(siteKey);
    if (!integration || integration.status !== 'ACTIVE') {
      console.warn('[PUBLIC_FORM_SUBMIT_REJECTED]', { timestamp, siteKey, reason: 'Invalid or disabled siteKey' });
      return NextResponse.json(
        { error: 'Invalid or disabled website integration key' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const tenant = db.tenants.get(integration.tenantId) || {
      id: integration.tenantId,
      name: "Tyree's Auto Detailing",
      serviceStatus: 'ACTIVE',
      masterAutomationEnabled: true,
      smsEnabled: true,
    };

    console.log('[PUBLIC_FORM_SUBMIT_RESOLVED]', {
      timestamp,
      tenantId: tenant.id,
      tenantName: (tenant as any).name,
      integrationId: integration.id,
    });

    // 2. Persistent Idempotency Check (tenantId + eventId)
    if (eventId) {
      const idemCheck = await db.checkAndRecordIdempotency(tenant.id, eventId);
      if (idemCheck.isDuplicate) {
        console.log('[PUBLIC_FORM_SUBMIT_IDEMPOTENT]', { timestamp, tenantId: tenant.id, eventId });
        return NextResponse.json(
          {
            success: true,
            status: 'idempotent',
            message: 'Duplicate event payload received (idempotency cached)',
            idempotent: true,
            eventId,
            ...idemCheck.cachedResponse,
          },
          { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }
    }

    // 3. Contact Deduplication & Persistence in Database
    const resolvedContact = await db.findOrCreateContactByPhoneOrEmail(tenant.id, {
      firstName: contact.firstName,
      lastName: contact.lastName,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      fields,
    });

    console.log('[PUBLIC_FORM_SUBMIT_CONTACT_SAVED]', {
      timestamp,
      contactId: resolvedContact.id,
      contactName: resolvedContact.name,
      phone: resolvedContact.phone,
      email: resolvedContact.email,
    });

    // 4. Save Form Submission Record
    const submissionId = `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const submission: FormSubmissionData = {
      id: submissionId,
      tenantId: tenant.id,
      integrationId: integration.id,
      contactId: resolvedContact.id,
      formType,
      payload: body,
      createdAt: timestamp,
    };
    db.formSubmissions.set(submissionId, submission);

    integration.lastEventReceivedAt = timestamp;

    const responsePayload = {
      success: true,
      submissionId,
      contactId: resolvedContact.id,
      tenantName: (tenant as any).name || tenant.id,
    };

    if (eventId) {
      await db.checkAndRecordIdempotency(tenant.id, eventId, responsePayload);
    }

    // 5. Emit PlatformEvent: FORM_SUBMITTED & Trigger Speed-to-Lead Workflow
    const busResult = await EventBus.publish({
      tenantId: tenant.id,
      eventType: 'FORM_SUBMITTED',
      source: 'PUBLIC_WEBSITE_API',
      payload: {
        eventId,
        formSubmissionId: submissionId,
        contactId: resolvedContact.id,
        tenantId: tenant.id,
        formType,
        source: 'WEBSITE',
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: resolvedContact.phone,
          email: resolvedContact.email,
        },
        fields,
      },
    });

    console.log('[PUBLIC_FORM_SUBMIT_SUCCESS]', {
      timestamp,
      submissionId,
      contactId: resolvedContact.id,
      tenantId: tenant.id,
    });

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  } catch (err: any) {
    console.error('[PUBLIC_FORM_SUBMIT_ERROR]', {
      timestamp,
      errorMessage: err.message,
      errorStack: err.stack,
    });

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
