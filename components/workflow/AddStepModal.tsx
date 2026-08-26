'use client';

import React from 'react';
import { X, MessageSquare, Mail, Users, Tag, GitBranch, Clock, Globe, ArrowRight } from 'lucide-react';

export interface AddStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStep: (type: 'action' | 'condition' | 'wait', actionType?: string, name?: string, config?: Record<string, any>) => void;
}

export const STEP_OPTIONS = [
  {
    category: 'Communication',
    items: [
      { actionType: 'SEND_SMS', type: 'action', name: 'Send SMS', icon: MessageSquare, desc: 'Send automated text message to contact' },
      { actionType: 'SEND_EMAIL', type: 'action', name: 'Send Email', icon: Mail, desc: 'Deliver automated email message' },
      { actionType: 'SEND_REVIEW_REQUEST', type: 'action', name: 'Send Review Request', icon: MessageSquare, desc: 'Send review survey link' },
    ],
  },
  {
    category: 'CRM & Pipeline',
    items: [
      { actionType: 'CREATE_LEAD', type: 'action', name: 'Create Contact / Lead', icon: Users, desc: 'Create lead record in CRM' },
      { actionType: 'MOVE_KANBAN_CARD', type: 'action', name: 'Move Kanban Card', icon: Users, desc: 'Update pipeline stage' },
      { actionType: 'ADD_TAG', type: 'action', name: 'Add Tag', icon: Tag, desc: 'Apply tag to contact' },
    ],
  },
  {
    category: 'Logic & Branching',
    items: [
      { actionType: 'CONDITION', type: 'condition', name: 'Condition / Branch (YES/NO)', icon: GitBranch, desc: 'Split workflow based on field rules' },
    ],
  },
  {
    category: 'Timing & Delay',
    items: [
      { actionType: 'WAIT_DURATION', type: 'wait', name: 'Wait / Delay', icon: Clock, desc: 'Pause workflow execution with cancellation rules' },
    ],
  },
  {
    category: 'Integrations',
    items: [
      { actionType: 'WEBHOOK', type: 'action', name: 'Send Webhook', icon: Globe, desc: 'POST payload to external HTTP URL' },
    ],
  },
];

export const AddStepModal: React.FC<AddStepModalProps> = ({ isOpen, onClose, onSelectStep }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Add Next Step</h3>
            <p className="text-xs text-slate-500">Choose an action, condition branch, or wait state to insert.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {STEP_OPTIONS.map((cat) => (
            <div key={cat.category} className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {cat.category}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        onSelectStep(item.type as any, item.actionType, item.name);
                        onClose();
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 text-left transition flex items-start gap-3 group"
                    >
                      <Icon className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-slate-900 group-hover:text-sky-900 flex items-center gap-1">
                          <span>{item.name}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-sky-600" />
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
