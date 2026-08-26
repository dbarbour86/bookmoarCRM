'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db, OpportunityData, PipelineStageData } from '@/lib/db';
import { LayoutGrid, MoveRight, DollarSign, User, RefreshCw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function KanbanPipelinePage() {
  const params = useParams();
  const tenantId = (params?.tenantId as string) || 'tenant_tyrees_auto';
  const tenant = db.tenants.get(tenantId);

  const stages: PipelineStageData[] = db.pipelineStages.get(tenantId) || [
    { id: 'stage_lead_in', name: 'New Lead', order: 1 },
    { id: 'stage_contacted', name: 'Contacted / Estimate Sent', order: 2 },
    { id: 'stage_booked', name: 'Appointment Booked', order: 3 },
    { id: 'stage_completed', name: 'Job Completed', order: 4 },
    { id: 'stage_review_sent', name: 'Review Requested', order: 5 },
  ];

  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingOppId, setMovingOppId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ success: boolean; message: string } | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/crm/opportunities?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.opportunities) {
          setOpportunities(data.opportunities);
        }
      }
    } catch (err) {
      console.warn('[PIPELINE_FETCH_ERR] Fallback to memory:', err);
      setOpportunities(Array.from(db.opportunities.values()).filter((o) => o.tenantId === tenantId));
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleMoveStage = async (oppId: string, targetStageId: string, targetStageName: string) => {
    if (tenant && !tenant.crmWriteEnabled) {
      setStatusNotification({
        success: false,
        message: 'CRM Write capability is DISABLED for this tenant.',
      });
      return;
    }

    setMovingOppId(oppId);
    setStatusNotification(null);

    try {
      const res = await fetch(`/api/opportunities/${oppId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          targetStage: targetStageId,
          userId: 'user_client_admin',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusNotification({
          success: true,
          message: `Moved opportunity to stage "${targetStageName}". Events & Audit Logs created.`,
        });
        await fetchOpportunities();
      } else {
        setStatusNotification({
          success: false,
          message: data.error || 'Failed to move opportunity stage',
        });
      }
    } catch (err: any) {
      setStatusNotification({
        success: false,
        message: err.message || 'Error communicating with move API',
      });
    } finally {
      setMovingOppId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-sky-600" />
            {tenant?.name || 'Client'} Opportunity Pipeline
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Visual Kanban stage management. Moving opportunity cards automatically emits pipeline events.
          </p>
        </div>

        <button
          onClick={fetchOpportunities}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {/* Notification Toast */}
      {statusNotification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            statusNotification.success
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {statusNotification.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusNotification.message}</span>
        </div>
      )}

      {/* Kanban Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
          <span>Loading persistent pipeline opportunities...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageOpps = opportunities.filter((o) => o.stageId === stage.id);
            return (
              <div key={stage.id} className="bg-slate-100/70 rounded-xl p-4 border border-slate-200 flex flex-col space-y-3 min-w-[220px]">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">{stage.name}</h3>
                  <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {stageOpps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {stageOpps.length === 0 ? (
                    <div className="text-[11px] text-slate-400 text-center py-4 italic border border-dashed rounded-lg border-slate-200">
                      No cards
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div key={opp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <h4 className="font-bold text-xs text-slate-900">{opp.title}</h4>

                        <div className="text-[11px] text-slate-500 space-y-1">
                          <div className="flex items-center gap-1 font-semibold text-slate-700">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{opp.contactName || opp.contactId}</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-700 font-bold">
                            <DollarSign className="w-3 h-3 text-emerald-500" />
                            <span>${opp.value}</span>
                          </div>
                        </div>

                        {/* Stage Move Controls */}
                        <div className="pt-2 border-t flex flex-col gap-1.5">
                          {stages
                            .filter((s) => s.id !== stage.id)
                            .map((nextStage) => (
                              <button
                                key={nextStage.id}
                                disabled={movingOppId === opp.id}
                                onClick={() => handleMoveStage(opp.id, nextStage.id, nextStage.name)}
                                className="text-[10px] font-semibold px-2 py-1 bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 rounded border transition flex items-center justify-between disabled:opacity-50"
                              >
                                <span>Move to {nextStage.name}</span>
                                {movingOppId === opp.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-sky-600" />
                                ) : (
                                  <MoveRight className="w-2.5 h-2.5" />
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
