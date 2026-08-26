import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const timestamp = new Date().toISOString();
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        error: 'DATABASE_URL environment variable is missing in production deployment.',
        hasDatabaseUrl: false,
        timestamp,
      },
      { status: 500 }
    );
  }

  try {
    // Perform live query against PostgreSQL
    const tenantCount = await prisma.clientTenant.count();
    const contactCount = await prisma.contact.count();
    const opportunityCount = await prisma.opportunity.count();
    const submissionCount = await prisma.formSubmission.count();
    const eventCount = await prisma.platformEvent.count();
    const executionCount = await prisma.workflowExecution.count();

    return NextResponse.json(
      {
        status: 'HEALTHY',
        hasDatabaseUrl: true,
        databaseProvider: 'postgresql',
        counts: {
          tenants: tenantCount,
          contacts: contactCount,
          opportunities: opportunityCount,
          formSubmissions: submissionCount,
          platformEvents: eventCount,
          workflowExecutions: executionCount,
        },
        timestamp,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[DB_HEALTH_CHECK_ERROR]', err);
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        hasDatabaseUrl: true,
        error: err.message || 'PostgreSQL database query failed',
        timestamp,
      },
      { status: 500 }
    );
  }
}
