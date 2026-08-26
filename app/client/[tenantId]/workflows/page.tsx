'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { db, WorkflowData, WorkflowVersionData, WorkflowExecutionData } from '@/lib/db';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';
import { NewWorkflowModal } from '@/components/workflow/NewWorkflowModal';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { TestWorkflowModal } from '@/components/workflow/TestWorkflowModal';
import {
  GitBranch,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Copy,
  Trash2,
  Power,
  ChevronLeft,
  SlidersHorizontal,
  FileCode2,
  ArrowRight,
  Zap,
} from 'lucide-react';

export default function WorkflowsPage() {
  const params = useParams();
  const tenantId = (params?.tenantId as string) || 'tenant_tyrees_auto';
  const tenant = db.tenants.get(tenantId);

  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'DRAFTS' | 'DISABLED' | 'TEMPLATES' | 'INSPECTOR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active Editor States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowData | null>(null);
  const [editingVersion, setEditingVersion] = useState<WorkflowVersionData | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecutionData[]>([]);

  const fetchExecutionsAndWorkflows = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/executions?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.workflows) setWorkflows(data.workflows);
        if (data.executions) setExecutions(data.executions);
      }
    } catch (err) {
      console.warn('[WORKFLOW_FETCH_ERR] Fallback:', err);
      setWorkflows(db.getTenantWorkflows(tenantId));
      setExecutions(db.executions.filter((e) => e.tenantId === tenantId));
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchExecutionsAndWorkflows();
  }, [fetchExecutionsAndWorkflows]);

  const refreshData = () => {
    fetchExecutionsAndWorkflows();

    if (editingWorkflow) {
      const updated = db.workflows.get(editingWorkflow.id);
      if (updated) {
        setEditingWorkflow(updated);
        const ver = updated.versions.find((v) => v.id === (updated.draftVersionId || updated.activeVersionId)) || updated.versions[0];
        setEditingVersion(ver);
      }
    }
  };

  // Create New Workflow
  const handleCreateWorkflow = (name: string, eventType: string) => {
    const newWf = db.createWorkflow({
      tenantId,
      name,
      eventType,
    });
    refreshData();
    // Open directly in editor
    setEditingWorkflow(newWf);
    setEditingVersion(newWf.versions[0]);
  };

  // Open Template
  const handleUseTemplate = (tmplId: string) => {
    const tmpl = WORKFLOW_TEMPLATES.find((t) => t.id === tmplId);
    if (!tmpl) return;

    const newWf = db.createWorkflow({
      tenantId,
      name: tmpl.name,
      description: tmpl.description,
      eventType: tmpl.eventType,
    });

    const version = newWf.versions[0];
    version.nodesConfig = JSON.parse(JSON.stringify(tmpl.nodes));
    version.edgesConfig = JSON.parse(JSON.stringify(tmpl.edges));

    refreshData();
    setEditingWorkflow(newWf);
    setEditingVersion(version);
  };

  // Publish Workflow Version
  const handlePublish = () => {
    if (!editingWorkflow || !editingVersion) return;
    db.publishWorkflowVersion(editingWorkflow.id, editingVersion.id);
    refreshData();
    alert(`Successfully published Version #${editingVersion.versionNumber}! This workflow is now live.`);
  };

  // Create New Draft Version
  const handleCreateDraft = () => {
    if (!editingWorkflow) return;
    const newDraft = db.createDraftVersion(editingWorkflow.id);
    refreshData();
    if (newDraft) setEditingVersion(newDraft);
  };

  // Duplicate Workflow
  const handleDuplicate = (wfId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    db.duplicateWorkflow(wfId);
    refreshData();
  };

  // Delete Workflow
  const handleDelete = (wfId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Are you sure you want to delete this workflow?')) {
      db.deleteWorkflow(wfId);
      if (editingWorkflow?.id === wfId) {
        setEditingWorkflow(null);
        setEditingVersion(null);
      }
      refreshData();
    }
  };

  // Toggle Disable/Enable
  const handleToggleStatus = (wf: WorkflowData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStat = wf.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    db.toggleWorkflowStatus(wf.id, newStat);
    refreshData();
  };

  // Filtered Workflows List
  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase()) || wf.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'ACTIVE') return wf.status === 'ACTIVE';
    if (activeTab === 'DRAFTS') return wf.status === 'DRAFT';
    if (activeTab === 'DISABLED') return wf.status === 'DISABLED';
    return true;
  });

  // Render Full Screen Workflow Editor View
  if (editingWorkflow && editingVersion) {
    return (
      <div className="space-y-4">
        {/* Editor Top Control Header */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingWorkflow(null);
                setEditingVersion(null);
                refreshData();
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Back to Workflows List"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{editingWorkflow.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    editingWorkflow.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : editingWorkflow.status === 'DRAFT'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {editingWorkflow.status}
                </span>
                <span className="text-xs font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Version #{editingVersion.versionNumber} ({editingVersion.status})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{editingWorkflow.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {editingVersion.status === 'PUBLISHED' && (
              <button
                onClick={handleCreateDraft}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
              >
                + Edit New Draft Version
              </button>
            )}

            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-600" />
              Test Workflow
            </button>

            <button
              onClick={() => refreshData()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Save Draft
            </button>

            <button
              onClick={handlePublish}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Publish Version #{editingVersion.versionNumber}
            </button>
          </div>
        </div>

        {/* Visual Interactive Canvas */}
        <WorkflowCanvas
          workflow={editingWorkflow}
          version={editingVersion}
          onUpdateVersion={(updatedVer) => {
            setEditingVersion(updatedVer);
            const verIdx = editingWorkflow.versions.findIndex((v) => v.id === updatedVer.id);
            if (verIdx !== -1) {
              editingWorkflow.versions[verIdx] = updatedVer;
            }
          }}
        />

        {/* Test Modal */}
        <TestWorkflowModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          workflow={editingWorkflow}
          version={editingVersion}
        />
      </div>
    );
  }

  // Render Main Workflows Management Screen
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-sky-600" />
            {tenant?.name || 'Client'} Workflows & Automations
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Create, edit, version, and manage trigger-driven business workflows.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          + New Workflow
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'ALL', label: 'All Workflows', count: workflows.length },
            { id: 'ACTIVE', label: 'Active', count: workflows.filter((w) => w.status === 'ACTIVE').length },
            { id: 'DRAFTS', label: 'Drafts', count: workflows.filter((w) => w.status === 'DRAFT').length },
            { id: 'DISABLED', label: 'Disabled', count: workflows.filter((w) => w.status === 'DISABLED').length },
            { id: 'TEMPLATES', label: 'Templates', count: WORKFLOW_TEMPLATES.length },
            { id: 'INSPECTOR', label: 'Observability Log Inspector', count: executions.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>
      </div>

      {/* Templates View Tab */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-xs text-sky-950 space-y-1">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              Pre-Built Workflow Templates
            </h3>
            <p>
              Click any template below to instantiate a real, fully editable workflow graph. You can customize nodes before publishing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WORKFLOW_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-sky-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                      {tmpl.category}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{tmpl.name}</h3>
                  </div>
                  <button
                    onClick={() => handleUseTemplate(tmpl.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow"
                  >
                    Use Template &rarr;
                  </button>
                </div>
                <p className="text-xs text-slate-500">{tmpl.description}</p>
                <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  Trigger Event: <strong>{tmpl.eventType}</strong> &bull; {tmpl.nodes.length} Nodes &bull; {tmpl.edges.length} Edges
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observability Inspector Tab */}
      {activeTab === 'INSPECTOR' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            Workflow Execution Trace & Observability Inspector ("Why did it run?")
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {executions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No workflow execution logs recorded yet.</p>
            ) : (
              executions.map((exec) => (
                <div
                  key={exec.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    exec.status === 'COMPLETED'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : exec.status === 'WAITING'
                      ? 'bg-purple-50/40 border-purple-200'
                      : exec.status === 'BLOCKED'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {db.workflows.get(exec.workflowId)?.name || exec.workflowId}
                      </span>
                      <span className="text-slate-400">&bull; Event: {exec.eventId}</span>
                    </div>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        exec.status === 'COMPLETED'
                          ? 'bg-emerald-200 text-emerald-900'
                          : exec.status === 'WAITING'
                          ? 'bg-purple-200 text-purple-900'
                          : exec.status === 'BLOCKED'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-rose-200 text-rose-900'
                      }`}
                    >
                      {exec.status}
                    </span>
                  </div>

                  {exec.skippedReason && (
                    <div className="bg-amber-100/70 text-amber-900 p-2 rounded border border-amber-300 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Blocked Reason: {exec.skippedReason}</span>
                    </div>
                  )}

                  {exec.steps.length > 0 && (
                    <div className="pl-4 border-l-2 border-slate-200 space-y-1 mt-2">
                      {exec.steps.map((step) => (
                        <div key={step.id} className="text-[11px] text-slate-600 flex items-center gap-2">
                          <span className="font-bold text-slate-800">&bull; [{step.nodeType.toUpperCase()}]</span>
                          <span>{step.nodeName}</span>
                          {step.outputData && (
                            <span className="text-slate-400 font-mono text-[10px]">
                              {JSON.stringify(step.outputData)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Workflows List View */}
      {activeTab !== 'TEMPLATES' && activeTab !== 'INSPECTOR' && (
        <div className="space-y-4">
          {filteredWorkflows.length === 0 ? (
            /* Useful Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <GitBranch className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create your first workflow</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Build custom trigger-logic-action automations from scratch or launch one of our pre-built templates.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md"
                >
                  Start From Scratch
                </button>
                <button
                  onClick={() => setActiveTab('TEMPLATES')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Browse Templates
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWorkflows.map((wf) => {
                const activeVer = wf.versions.find((v) => v.id === (wf.draftVersionId || wf.activeVersionId)) || wf.versions[0];
                return (
                  <div
                    key={wf.id}
                    onClick={() => {
                      setEditingWorkflow(wf);
                      setEditingVersion(activeVer);
                    }}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-sky-400 cursor-pointer transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{wf.name}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              wf.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : wf.status === 'DRAFT'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {wf.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{wf.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-3 font-mono">
                      <div>
                        Trigger: <strong className="text-indigo-700">{activeVer?.triggerConfig.eventType || 'N/A'}</strong>
                      </div>
                      <div>Runs: {wf.runsCount || 0}</div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWorkflow(wf);
                          setEditingVersion(activeVer);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                      >
                        Open & Edit Builder &rarr;
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleStatus(wf, e)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                          title={wf.status === 'DISABLED' ? 'Enable Workflow' : 'Disable Workflow'}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleDuplicate(wf.id, e)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                          title="Duplicate Workflow"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleDelete(wf.id, e)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                          title="Delete Workflow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Workflow Modal */}
      <NewWorkflowModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  );
}
