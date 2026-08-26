'use client';

import React, { useState } from 'react';
import { X, Sparkles, FormInput, Users, Calendar, MessageSquare, DollarSign, Star, Clock, Zap } from 'lucide-react';

export interface NewWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, eventType: string, description?: string) => void;
}

export const TRIGGER_CATEGORIES = [
  {
    category: 'Forms',
    icon: FormInput,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
    triggers: [
      { id: 'FORM_SUBMITTED', name: 'Form Submitted', description: 'Any form submitted on client website' },
      { id: 'QUOTE_FORM_SUBMITTED', name: 'Quote Form Submitted', description: 'Quote/estimate form submitted' },
      { id: 'CONTACT_FORM_SUBMITTED', name: 'Contact Form Submitted', description: 'General contact form submitted' },
    ],
  },
  {
    category: 'CRM',
    icon: Users,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    triggers: [
      { id: 'CONTACT_CREATED', name: 'Contact Created', description: 'New contact record added' },
      { id: 'LEAD_CREATED', name: 'Lead Created', description: 'New sales lead created in CRM' },
      { id: 'KANBAN_CARD_MOVED', name: 'Kanban Card Moved', description: 'Opportunity moved to new stage' },
      { id: 'TAG_ADDED', name: 'Tag Added', description: 'Tag applied to contact' },
      { id: 'JOB_COMPLETED', name: 'Job Completed', description: 'Service job marked finished' },
    ],
  },
  {
    category: 'Appointments',
    icon: Calendar,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    triggers: [
      { id: 'APPOINTMENT_BOOKED', name: 'Appointment Booked', description: 'New calendar booking created' },
      { id: 'APPOINTMENT_CONFIRMED', name: 'Appointment Confirmed', description: 'Booking confirmed by client' },
      { id: 'APPOINTMENT_NOSHOW', name: 'Appointment No-Show', description: 'Customer missed appointment' },
      { id: 'APPOINTMENT_COMPLETED', name: 'Appointment Completed', description: 'Appointment marked completed' },
    ],
  },
  {
    category: 'Communications',
    icon: MessageSquare,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    triggers: [
      { id: 'SMS_RECEIVED', name: 'SMS Received', description: 'Incoming text message received' },
      { id: 'CUSTOMER_REPLIED', name: 'Customer Replied', description: 'Customer sent a reply' },
      { id: 'MISSED_CALL', name: 'Missed Call', description: 'Unanswered incoming phone call' },
    ],
  },
  {
    category: 'Estimates & Payments',
    icon: DollarSign,
    color: 'text-green-600 bg-green-50 border-green-200',
    triggers: [
      { id: 'ESTIMATE_SENT', name: 'Estimate Sent', description: 'Quote/estimate delivered to lead' },
      { id: 'ESTIMATE_ACCEPTED', name: 'Estimate Accepted', description: 'Customer approved estimate' },
      { id: 'INVOICE_OVERDUE', name: 'Invoice Overdue', description: 'Invoice payment past due date' },
      { id: 'PAYMENT_FAILED', name: 'Payment Failed', description: 'Card charge declined' },
    ],
  },
  {
    category: 'Reviews',
    icon: Star,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    triggers: [
      { id: 'RATING_RECEIVED', name: 'Rating Received', description: 'Star rating submitted by customer' },
      { id: 'REVIEW_RECEIVED', name: 'Review Received', description: 'Written review posted' },
    ],
  },
  {
    category: 'Time',
    icon: Clock,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    triggers: [
      { id: 'CUSTOMER_INACTIVE', name: 'Customer Inactive For X Days', description: 'No activity in X months' },
      { id: 'APPOINTMENT_APPROACHING', name: 'Appointment Approaching', description: '24 hours before appointment' },
    ],
  },
  {
    category: 'Advanced',
    icon: Zap,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    triggers: [
      { id: 'WEBHOOK_RECEIVED', name: 'Webhook Received', description: 'External HTTP POST payload' },
      { id: 'MANUAL_TRIGGER', name: 'Manual Trigger', description: 'Started manually by admin' },
    ],
  },
];

export const NewWorkflowModal: React.FC<NewWorkflowModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Forms');
  const [selectedTrigger, setSelectedTrigger] = useState('FORM_SUBMITTED');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), selectedTrigger);
    setName('');
    onClose();
  };

  const activeCategoryObj = TRIGGER_CATEGORIES.find((c) => c.category === selectedCategory) || TRIGGER_CATEGORIES[0];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-600" />
              Create New Workflow
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set up a new trigger-driven automation for your local service business.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Name */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
            Workflow Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. New Quote Follow-Up"
            className="w-full p-3 text-sm border rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        {/* Step 2: Choose Trigger Category */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase text-slate-700">
            Choose How This Workflow Starts (Entry Trigger)
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TRIGGER_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.category;
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.category);
                    setSelectedTrigger(cat.triggers[0].id);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 ${
                    isSelected ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{cat.category}</span>
                </button>
              );
            })}
          </div>

          {/* Trigger List under selected category */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mt-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Specific {selectedCategory} Event:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeCategoryObj.triggers.map((trig) => (
                <button
                  key={trig.id}
                  type="button"
                  onClick={() => setSelectedTrigger(trig.id)}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    selectedTrigger === trig.id
                      ? 'border-sky-600 bg-white shadow-sm ring-2 ring-sky-500/20 text-slate-900 font-bold'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-slate-900">{trig.name}</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">{trig.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg"
          >
            Create Draft Workflow &rarr;
          </button>
        </div>
      </form>
    </div>
  );
};
