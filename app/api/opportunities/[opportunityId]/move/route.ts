import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: { opportunityId: string } }
) {
  try {
    const { opportunityId } = params;
    const body = await req.json();
    const { tenantId, targetStage, userId = 'user_client_admin' } = body;

    if (!tenantId || !targetStage) {
      return NextResponse.json(
        { error: 'Missing tenantId or targetStage parameter' },
        { status: 400 }
      );
    }

    console.log('[MOVE_OPPORTUNITY_REQUEST]', {
      timestamp: new Date().toISOString(),
      opportunityId,
      tenantId,
      targetStage,
      userId,
    });

    const result = await db.moveOpportunity({
      tenantId,
      opportunityId,
      targetStageId: targetStage,
      userId,
    });

    if (!result.success) {
      console.warn('[MOVE_OPPORTUNITY_REJECTED]', { opportunityId, error: result.error });
      return NextResponse.json(
        { error: result.error || 'Failed to move opportunity' },
        { status: 400 }
      );
    }

    console.log('[MOVE_OPPORTUNITY_SUCCESS]', {
      opportunityId,
      tenantId,
      newStage: result.opportunity?.stageId,
      eventId: result.event?.id,
      executionsCount: result.executions?.length || 0,
    });

    return NextResponse.json(
      {
        success: true,
        opportunity: result.opportunity,
        event: result.event,
        executions: result.executions,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[MOVE_OPPORTUNITY_ERROR]', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error moving opportunity' },
      { status: 500 }
    );
  }
}
