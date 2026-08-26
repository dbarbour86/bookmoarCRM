'use client';

import React, { useState } from 'react';
import { db, WorkflowData, WorkflowVersionData, WorkflowExecutionData } from '@/lib/db';
import { executeWorkflowInstance } from '@/lib/workflow/engine';
import { X, Play, CheckCircle2, AlertTriangle, Sparkles, Clock, ArrowRight } from 'lucide-react';

export interface TestWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowData | null;
  version: WorkflowVersionData | null;
}

export const TestWorkflowModal: React.FC<TestWorkflowModalProps> = ({ isOpen, onClose, workflow, version }) => {
  const [selectedContactId, setSelectedContactId] = useState('contact_john_doe');
  const [rating, setRating] = useState(5);
  const [testResult, setTestResult] = useState<WorkflowExecutionData | null>(null);

  if (!isOpen || !workflow || !version) return null;

  const handleRunSimulation = () => {
    const contact = db.contacts.get(selectedContactId) || { name: 'John Doe', email: 'john@example.com', phone: '+19195550144' };

    const simulatedEvent = {
      id: `evt_sim_${Date.now()}`,
      tenantId: workflow.tenantId,
      eventType: version.triggerConfig.eventType,
      source: 'SIMULATED_TEST_RUNNER',
      payload: {
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        rating: Number(rating),
        formName: 'Website Quote Form',
        estimateValue: 350,
      },
      createdAt: new Date().toISOString(),
    };

    const res = executeWorkflowInstance({
      tenantId: workflow.tenantId,
      workflow,
      version,
      event: simulatedEvent,
      isTestMode: true,
    });

    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-extrabold text-slate-900">Test Workflow Simulation</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate workflow execution with test payload data. No live SMS/email will be sent.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Options */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Sample Lead / Contact</label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full p-2.5 border rounded-xl"
            >
              <option value="contact_john_doe">John Doe - john@example.com - (919) 555-0144 (Tesla Model 3)</option>
              <option value="contact_sarah_smith">Sarah Smith - sarah@example.com - (919) 555-0177 (Porsche Macan)</option>
            </select>
          </div>

          {version.triggerConfig.eventType === 'RATING_RECEIVED' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Simulated Rating Score (1 to 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                      rating === star ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {star} ★
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleRunSimulation}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            Run Interactive Test Simulation
          </button>
        </div>

        {/* Simulation Output Step Inspector */}
        {testResult && (
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl space-y-3 font-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                SIMULATION RESULT: {testResult.status}
              </span>
              <span className="text-[10px] text-slate-400">Execution ID: {testResult.id}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Visual Execution Trace:
              </span>
              {testResult.steps.map((step, idx) => (
                <div key={step.id} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300">
                      Step #{idx + 1}: [{step.nodeType.toUpperCase()}] {step.nodeName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
                      {step.status}
                    </span>
                  </div>

                  {step.evaluatedCondition !== undefined && (
                    <div className="text-[11px] font-bold text-amber-300">
                      Condition Branch Output: {step.evaluatedCondition ? 'YES (TRUE)' : 'NO (FALSE)'}
                    </div>
                  )}

                  {step.outputData?.resultSummary && (
                    <div className="text-[11px] text-slate-300">{step.outputData.resultSummary}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end border-t pt-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
            Close Test Window
          </button>
        </div>
      </div>
    </div>
  );
};
