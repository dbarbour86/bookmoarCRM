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

  try {
    const body = await req.json();
    const { siteKey, formType = 'quote', eventId, contact = {}, fields = {} } = body;

    if (!siteKey) {
      return NextResponse.json(
        { error: 'Missing publicSiteKey' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 1. Resolve WebsiteIntegration
    const integration = db.findIntegrationBySiteKey(siteKey);
    if (!integration || integration.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Invalid or disabled website integration key' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const tenant = db.tenants.get(integration.tenantId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 2. Persistent Idempotency Check (tenantId + eventId)
    if (eventId) {
      const idemCheck = db.checkAndRecordIdempotency(tenant.id, eventId);
      if (idemCheck.isDuplicate) {
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

    // 3. Contact Deduplication (Matches Phone or Email)
    const resolvedContact = db.findOrCreateContactByPhoneOrEmail(tenant.id, {
      firstName: contact.firstName,
      lastName: contact.lastName,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      fields,
    });

    // 4. Save Form Submission Record to Database
    const submissionId = `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const submission: FormSubmissionData = {
      id: submissionId,
      tenantId: tenant.id,
      integrationId: integration.id,
      contactId: resolvedContact.id,
      formType,
      payload: body,
      createdAt: new Date().toISOString(),
    };
    db.formSubmissions.set(submissionId, submission);

    // Update integration lastEventReceivedAt
    integration.lastEventReceivedAt = new Date().toISOString();

    const responsePayload = {
      success: true,
      submissionId,
      contactId: resolvedContact.id,
      tenantName: tenant.name,
    };

    // Record Idempotency Cache in DB
    if (eventId) {
      db.checkAndRecordIdempotency(tenant.id, eventId, responsePayload);
    }

    // 5. Emit PlatformEvent: FORM_SUBMITTED with resolved contactId
    // Note: Public API endpoint does NOT execute actions directly; Event Bus & Workflow Engine handle all automations
    EventBus.publish({
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

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
