'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db, ContactData } from '@/lib/db';
import { EventBus } from '@/lib/events/eventBus';
import { Users, Plus, Tag, Phone, Mail, Car, AlertTriangle, Download, FileSpreadsheet, X } from 'lucide-react';

export default function ClientCRMPage() {
  const params = useParams();
  const tenantId = (params?.tenantId as string) || 'tenant_tyrees_auto';
  const tenant = db.tenants.get(tenantId);

  const [contacts, setContacts] = useState<ContactData[]>(
    Array.from(db.contacts.values()).filter((c) => c.tenantId === tenantId)
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'CONTACTS' | 'OPPORTUNITIES' | 'FORM_SUBMISSIONS' | 'ALL'>('CONTACTS');
  const [isExporting, setIsExporting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTag, setNewTag] = useState('Website Quote');
  const [newVehicle, setNewVehicle] = useState('');
  const [newEstValue, setNewEstValue] = useState(350);

  const refreshContacts = () => {
    setContacts(Array.from(db.contacts.values()).filter((c) => c.tenantId === tenantId));
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (!tenant.crmWriteEnabled) {
      alert('CRM Write Capability is currently DISABLED for this tenant.');
      return;
    }

    const newContact: ContactData = {
      id: `contact_${Date.now()}`,
      tenantId,
      name: newName,
      email: newEmail,
      phone: newPhone,
      status: 'LEAD',
      tags: [newTag],
      customFields: { vehicle: newVehicle, estimatedValue: Number(newEstValue) },
      createdAt: new Date().toISOString(),
    };

    db.contacts.set(newContact.id, newContact);

    EventBus.publish({
      tenantId,
      eventType: 'LEAD_CREATED',
      source: 'CRM',
      payload: {
        contactId: newContact.id,
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone,
        estimatedValue: Number(newEstValue),
      },
    });

    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewVehicle('');
    refreshContacts();
  };

  const handleExportData = async () => {
    if (!tenant) return;
    setIsExporting(true);

    try {
      const response = await fetch('/api/export/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          type: exportType,
          format: exportType === 'ALL' ? 'zip' : 'csv',
          userRole: 'CLIENT_ADMIN',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Export failed');
      }

      const blob = await response.blob();
      const contentDisp = response.headers.get('content-disposition');
      let filename = `${tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${exportType.toLowerCase()}.${exportType === 'ALL' ? 'zip' : 'csv'}`;
      if (contentDisp && contentDisp.includes('filename=')) {
        filename = contentDisp.split('filename=')[1].replace(/"/g, '');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Read Only Guard Alert */}
      {tenant && (!tenant.crmWriteEnabled || tenant.serviceStatus === 'SUSPENDED') && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">CRM Read-Only / Suspended Mode Active</p>
              <p className="text-amber-700 text-xs">
                Managed automations are suspended. Existing contact data is retained safely and can be exported at any time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            {tenant?.name || 'Client'} CRM & Leads
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage contacts, view custom fields, and export your business customer data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Data
          </button>
          <Link
            href={`/client/${tenantId}/pipeline`}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Pipeline &rarr;
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={tenant && !tenant.crmWriteEnabled}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 text-white hover:bg-sky-500 shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{contact.name}</h3>
                <span className="text-xs text-slate-400 font-mono">ID: {contact.id}</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  contact.status === 'LEAD'
                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {contact.status}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{contact.phone}</span>
              </div>
              {contact.customFields?.vehicle && (
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Car className="w-3.5 h-3.5 text-sky-600" />
                  <span>Vehicle: {contact.customFields.vehicle}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              {contact.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Export Business Data
                </h3>
                <p className="text-xs text-slate-500">Download your customer leads and pipeline data.</p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-700">Select Export Format:</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'CONTACTS', label: 'Export Contacts / Leads', desc: 'contacts.csv (Expanded fields)' },
                  { id: 'OPPORTUNITIES', label: 'Export Opportunities', desc: 'opportunities.csv (Pipeline)' },
                  { id: 'FORM_SUBMISSIONS', label: 'Export Form Submissions', desc: 'form_submissions.csv' },
                  { id: 'ALL', label: 'Export All Available Data', desc: 'all-data.zip (All CSVs + summary)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setExportType(opt.id as any)}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      exportType === opt.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">
                Cancel
              </button>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generating...' : 'Download File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateContact} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Lead</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(919) 555-0199"
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle / Custom Field</label>
                <input
                  type="text"
                  value={newVehicle}
                  onChange={(e) => setNewVehicle(e.target.value)}
                  placeholder="2024 Ford F-150"
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 text-white">
                Save & Trigger Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
