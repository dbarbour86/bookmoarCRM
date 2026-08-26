import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || 'tenant_tyrees_auto';

    const executions = await db.getTenantExecutions(tenantId);
    const workflows = await db.getTenantWorkflows(tenantId);

    // Calculate dynamic run counts from persistent executions
    for (const wf of workflows) {
      wf.runsCount = await db.getWorkflowExecutionCount(wf.id);
    }

    return NextResponse.json({ success: true, executions, workflows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch executions' }, { status: 500 });
  }
}
