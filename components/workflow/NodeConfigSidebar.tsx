'use client';

import React, { useState, useEffect } from 'react';
import { WorkflowNodeData, TriggerFilterRule } from '@/lib/db';
import { X, SlidersHorizontal, Plus, Trash2, Sparkles, Tag, Clock, ShieldAlert, Check } from 'lucide-react';

export interface NodeConfigSidebarProps {
  node: WorkflowNodeData | null;
  onClose: () => void;
  onUpdateNode: (updatedNode: WorkflowNodeData) => void;
}

export const VARIABLE_TAGS = [
  { label: '{{contact.firstName}}', desc: 'Customer First Name' },
  { label: '{{contact.lastName}}', desc: 'Customer Last Name' },
  { label: '{{contact.phone}}', desc: 'Contact Phone Number' },
  { label: '{{business.name}}', desc: 'Your Business Name' },
  { label: '{{appointment.date}}', desc: 'Appointment Date' },
  { label: '{{appointment.time}}', desc: 'Appointment Time' },
  { label: '{{estimate.amount}}', desc: 'Quote Amount' },
];

export const NodeConfigSidebar: React.FC<NodeConfigSidebarProps> = ({ node, onClose, onUpdateNode }) => {
  const [nodeName, setNodeName] = useState('');
  const [message, setMessage] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(1440);
  const [cancellationConditions, setCancellationConditions] = useState<string[]>([]);
  const [filters, setFilters] = useState<TriggerFilterRule[]>([]);
  const [conditionField, setConditionField] = useState('rating');
  const [conditionOperator, setConditionOperator] = useState('greater_than');
  const [conditionValue, setConditionValue] = useState<any>(3);
  const [stageName, setStageName] = useState('New Lead');

  useEffect(() => {
    if (node) {
      setNodeName(node.name || '');
      setMessage(node.config?.message || '');
      setDelayMinutes(node.config?.delayMinutes || 1440);
      setCancellationConditions(node.config?.cancellationConditions || []);
      setFilters(node.config?.filters || []);
      setConditionField(node.config?.field || 'rating');
      setConditionOperator(node.config?.operator || 'greater_than');
      setConditionValue(node.config?.value ?? 3);
      setStageName(node.config?.stageName || 'New Lead');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    const updated: WorkflowNodeData = {
      ...node,
      name: nodeName,
      config: {
        ...node.config,
        message,
        delayMinutes,
        cancellationConditions,
        filters,
        field: conditionField,
        operator: conditionOperator,
        value: conditionValue,
        stageName,
      },
    };
    onUpdateNode(updated);
  };

  const handleAddVariable = (variableStr: string) => {
    setMessage((prev) => `${prev} ${variableStr}`);
  };

  const handleToggleCancellation = (evt: string) => {
    if (cancellationConditions.includes(evt)) {
      setCancellationConditions(cancellationConditions.filter((c) => c !== evt));
    } else {
      setCancellationConditions([...cancellationConditions, evt]);
    }
  };

  const handleAddFilter = () => {
    const newFilter: TriggerFilterRule = {
      id: `flt_${Date.now()}`,
      field: 'service',
      operator: 'equals',
      value: 'Full Detail',
    };
    setFilters([...filters, newFilter]);
  };

  const handleRemoveFilter = (filterId: string) => {
    setFilters(filters.filter((f) => f.id !== filterId));
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between h-full z-40">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600">
            Node Configuration
          </span>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            {node.type.toUpperCase()}: {node.actionType || node.type}
          </h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Form Body */}
      <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
        {/* Node Name */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">Step Name</label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            className="w-full p-2.5 border rounded-lg font-medium"
          />
        </div>

        {/* Trigger Filter Rules Configuration */}
        {node.type === 'trigger' && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Trigger Filters (Optional Rules)</label>
              <button
                type="button"
                onClick={handleAddFilter}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Filter
              </button>
            </div>

            {filters.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No filters added. Triggers for all events.</p>
            ) : (
              <div className="space-y-2">
                {filters.map((flt, idx) => (
                  <div key={flt.id} className="p-2.5 bg-slate-50 border rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Rule #{idx + 1}</span>
                      <button onClick={() => handleRemoveFilter(flt.id)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[11px]">
                      <input
                        type="text"
                        value={flt.field}
                        onChange={(e) => {
                          const updated = [...filters];
                          updated[idx].field = e.target.value;
                          setFilters(updated);
                        }}
                        placeholder="Field"
                        className="p-1 border rounded"
                      />
                      <select
                        value={flt.operator}
                        onChange={(e) => {
                          const updated = [...filters];
                          updated[idx].operator = e.target.value as any;
                          setFilters(updated);
                        }}
                        className="p-1 border rounded"
                      >
                        <option value="equals">equals</option>
                        <option value="contains">contains</option>
                        <option value="greater_than">&gt;</option>
                        <option value="less_than">&lt;</option>
                        <option value="exists">exists</option>
                      </select>
                      <input
                        type="text"
                        value={flt.value}
                        onChange={(e) => {
                          const updated = [...filters];
                          updated[idx].value = e.target.value;
                          setFilters(updated);
                        }}
                        placeholder="Value"
                        className="p-1 border rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SMS / Email Action Configuration */}
        {node.type === 'action' && (node.actionType === 'SEND_SMS' || node.actionType === 'SEND_EMAIL' || node.actionType === 'SEND_REVIEW_REQUEST') && (
          <div className="space-y-3 pt-3 border-t">
            <label className="block font-bold text-slate-800">Message Content & Variable Template</label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi {{contact.firstName}}, thanks for reaching out..."
              className="w-full p-3 border rounded-xl font-sans text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            />

            {/* Variable Insertion Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Click to Insert Variables:
              </span>
              <div className="flex flex-wrap gap-1">
                {VARIABLE_TAGS.map((vt) => (
                  <button
                    key={vt.label}
                    type="button"
                    onClick={() => handleAddVariable(vt.label)}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 border text-[10px] font-mono transition"
                    title={vt.desc}
                  >
                    + {vt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Move Kanban Stage Configuration */}
        {node.type === 'action' && node.actionType === 'MOVE_KANBAN_CARD' && (
          <div className="space-y-2 pt-3 border-t">
            <label className="block font-bold text-slate-800">Target Kanban Stage</label>
            <select
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
            >
              <option value="New Lead">New Lead</option>
              <option value="Contacted / Estimate Sent">Contacted / Estimate Sent</option>
              <option value="Appointment Booked">Appointment Booked</option>
              <option value="Job Completed">Job Completed</option>
              <option value="Review Requested">Review Requested</option>
            </select>
          </div>
        )}

        {/* Wait Node Configuration */}
        {node.type === 'wait' && (
          <div className="space-y-4 pt-3 border-t">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Wait Duration</label>
              <select
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="w-full p-2.5 border rounded-lg font-medium"
              >
                <option value={15}>15 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={1440}>24 Hours (1 Day)</option>
                <option value={2880}>48 Hours (2 Days)</option>
                <option value={10080}>1 Week (7 Days)</option>
              </select>
            </div>

            {/* Cancellation Conditions */}
            <div className="space-y-2">
              <label className="block font-bold text-amber-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Cancel this wait if... (Early Cancellation)
              </label>
              <div className="space-y-1 bg-amber-50/50 p-3 border border-amber-200 rounded-xl">
                {[
                  { id: 'ESTIMATE_ACCEPTED', label: 'Estimate Accepted' },
                  { id: 'CUSTOMER_REPLIED', label: 'Customer Replied' },
                  { id: 'APPOINTMENT_BOOKED', label: 'Appointment Booked' },
                  { id: 'INVOICE_PAID', label: 'Invoice Paid' },
                ].map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={cancellationConditions.includes(c.id)}
                      onChange={() => handleToggleCancellation(c.id)}
                      className="rounded text-sky-600"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Condition Node Configuration */}
        {node.type === 'condition' && (
          <div className="space-y-3 pt-3 border-t">
            <label className="block font-bold text-slate-800">Condition Evaluation Logic</label>
            <div className="space-y-2">
              <div>
                <span className="text-[11px] font-medium text-slate-600">Field to Compare:</span>
                <input
                  type="text"
                  value={conditionField}
                  onChange={(e) => setConditionField(e.target.value)}
                  placeholder="e.g. rating or estimatedValue"
                  className="w-full p-2 border rounded mt-0.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] font-medium text-slate-600">Operator:</span>
                  <select
                    value={conditionOperator}
                    onChange={(e) => setConditionOperator(e.target.value)}
                    className="w-full p-2 border rounded mt-0.5"
                  >
                    <option value="greater_than">greater than (&gt;)</option>
                    <option value="equals">equals (=)</option>
                    <option value="contains">contains</option>
                  </select>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-600">Value Target:</span>
                  <input
                    type="text"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="w-full p-2 border rounded mt-0.5"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700">
          Cancel
        </button>
        <button
          onClick={() => {
            handleSave();
            onClose();
          }}
          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1"
        >
          <Check className="w-4 h-4" />
          Apply Changes
        </button>
      </div>
    </div>
  );
};
