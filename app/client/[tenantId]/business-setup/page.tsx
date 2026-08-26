'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/db';
import {
  Building2,
  DollarSign,
  FileText,
  LayoutGrid,
  CreditCard,
  MapPin,
  Users,
  Save,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  SlidersHorizontal,
  X,
  AlertCircle,
} from 'lucide-react';

export default function BusinessSetupPage() {
  const params = useParams();
  const tenantId = (params?.tenantId as string) || 'tenant_tyrees_auto';
  const tenant = db.tenants.get(tenantId);

  const [activeTab, setActiveTab] = useState<'info' | 'services' | 'intake' | 'pipeline' | 'payments' | 'area' | 'team'>('info');
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; message: string } | null>(null);

  // Modals state
  const [serviceModal, setServiceModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [intakeModal, setIntakeModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [stageModal, setStageModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [memberModal, setMemberModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/crm/business-config?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (err: any) {
      console.warn('[CONFIG_FETCH_ERR]', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/crm/business-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          section: 'profile',
          data: config.profile,
          userId: 'user_master_admin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ success: true, message: 'Saved Profile configuration to PostgreSQL.' });
        setConfig(data.config);
      } else {
        setStatusMsg({ success: false, message: data.error || 'Failed to save Profile' });
      }
    } catch (err: any) {
      setStatusMsg({ success: false, message: err.message || 'Error communicating with server' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMutateEntity = async (entityType: string, action: string, payload: any) => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/crm/business-config/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          entityType,
          action,
          data: payload,
          userId: 'user_master_admin',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ success: true, message: `Successfully saved ${entityType} mutation to PostgreSQL.` });
        if (data.config) setConfig(data.config);
        setServiceModal({ open: false, data: null });
        setIntakeModal({ open: false, data: null });
        setStageModal({ open: false, data: null });
        setMemberModal({ open: false, data: null });
      } else {
        setStatusMsg({ success: false, message: data.error || 'Failed entity mutation' });
      }
    } catch (err: any) {
      setStatusMsg({ success: false, message: err.message || 'Error mutating configuration entity' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 shadow-sm">
        <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
        <span>Loading tenant business configuration...</span>
      </div>
    );
  }

  const { profile, services, leadFields, pipelineStages, paymentConfig, serviceArea, members } = config;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-sky-600 text-xs font-bold uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Master Admin Tenant Business Setup</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {profile?.businessName || tenant?.name || 'Tenant'} Configuration
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Industry: <strong className="text-slate-800">{profile?.industry}</strong> &bull; Mode:{' '}
            <strong className="text-slate-800">{profile?.serviceType}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 font-mono border">
            Tenant ID: {tenantId}
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            statusMsg.success ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {statusMsg.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{statusMsg.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'info', label: 'Business Info', icon: Building2 },
          { id: 'services', label: 'Services & Pricing', icon: DollarSign },
          { id: 'intake', label: 'Lead Intake', icon: FileText },
          { id: 'pipeline', label: 'Pipeline Stages', icon: LayoutGrid },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'area', label: 'Service Area', icon: MapPin },
          { id: 'team', label: 'Team', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                isActive ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Business Info */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              Business Profile & Operating Model
            </h2>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Business Info</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Business Name</label>
              <input
                type="text"
                value={profile?.businessName || ''}
                onChange={(e) => setConfig({ ...config, profile: { ...profile, businessName: e.target.value } })}
                className="w-full p-2.5 rounded-xl border font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Industry</label>
              <input
                type="text"
                value={profile?.industry || ''}
                onChange={(e) => setConfig({ ...config, profile: { ...profile, industry: e.target.value } })}
                className="w-full p-2.5 rounded-xl border font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Primary Phone</label>
              <input
                type="text"
                value={profile?.primaryPhone || ''}
                onChange={(e) => setConfig({ ...config, profile: { ...profile, primaryPhone: e.target.value } })}
                className="w-full p-2.5 rounded-xl border font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Primary Email</label>
              <input
                type="text"
                value={profile?.primaryEmail || ''}
                onChange={(e) => setConfig({ ...config, profile: { ...profile, primaryEmail: e.target.value } })}
                className="w-full p-2.5 rounded-xl border font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Service Model</label>
              <select
                value={profile?.serviceType || 'Both'}
                onChange={(e) => setConfig({ ...config, profile: { ...profile, serviceType: e.target.value } })}
                className="w-full p-2.5 rounded-xl border font-semibold text-slate-900 bg-white"
              >
                <option value="Mobile">Mobile (Travels to Customer)</option>
                <option value="Physical Location">Physical Location (Customer Visits)</option>
                <option value="Both">Both Mobile & Physical Location</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Default Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={profile?.taxRate || 0}
                onChange={(e) => setConfig({ ...config, profile: { ...profile, taxRate: parseFloat(e.target.value) } })}
                className="w-full p-2.5 rounded-xl border font-semibold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Services & Pricing */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-sky-600" />
                Services, Packages & Pricing Models
              </h2>
              <p className="text-xs text-slate-500">
                Supports FIXED, STARTING_AT, HOURLY, CUSTOM_QUOTE, FREE, and CONTACT_FOR_PRICE models.
              </p>
            </div>

            <button
              onClick={() =>
                setServiceModal({
                  open: true,
                  data: {
                    name: '',
                    category: 'General',
                    pricingType: 'FIXED',
                    basePrice: 150,
                    durationMinutes: 60,
                    bookingMode: 'REQUEST_APPOINTMENT',
                    requiresDeposit: false,
                    depositType: 'FIXED',
                    depositAmount: 0,
                    taxable: true,
                    status: 'ACTIVE',
                  },
                })
              }
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv: any, idx: number) => (
              <div key={srv.id || idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{srv.name}</h3>
                    <span className="text-[11px] text-slate-500">{srv.category}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setServiceModal({ open: true, data: { ...srv } })}
                      className="p-1.5 rounded-lg bg-white border hover:bg-slate-100 text-slate-700 transition"
                      title="Edit Service"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMutateEntity('SERVICE', 'DISABLE', srv)}
                      className="p-1.5 rounded-lg bg-white border hover:bg-rose-50 text-rose-600 transition"
                      title="Disable Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                  <span className="px-2.5 py-1 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                    PRICING: {srv.pricingType}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    MODE: {srv.bookingMode}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700">
                    STATUS: {srv.status}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 pt-1 border-t flex justify-between">
                  <span>
                    Price: {srv.pricingType === 'CUSTOM_QUOTE' ? 'Custom Quote' : `$${srv.basePrice}`}
                  </span>
                  <span>Duration: {srv.durationMinutes ? `${srv.durationMinutes} min` : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Lead Intake */}
      {activeTab === 'intake' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                Dynamic Lead Intake Field Definitions
              </h2>
              <p className="text-xs text-slate-500">
                Public form intake fields are dynamically rendered from these tenant definitions.
              </p>
            </div>

            <button
              onClick={() =>
                setIntakeModal({
                  open: true,
                  data: { label: '', key: '', fieldType: 'TEXT', required: false, placeholder: '', options: [] },
                })
              }
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Field</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leadFields.map((field: any, idx: number) => (
              <div key={field.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{field.label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setIntakeModal({ open: true, data: { ...field } })} className="p-1 rounded bg-white border">
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <button onClick={() => handleMutateEntity('LEAD_FIELD', 'DELETE', field)} className="p-1 rounded bg-white border">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Key: <code className="font-mono text-sky-700">{field.key}</code> &bull; Type: <strong>{field.fieldType}</strong> &bull; Required:{' '}
                  <strong>{field.required ? 'YES' : 'NO'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Pipeline Stages */}
      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-sky-600" />
                Tenant Pipeline Stages & Semantic Types
              </h2>
              <p className="text-xs text-slate-500">
                Maps custom business pipeline stages to standardized stage types (NEW, QUOTED, BOOKED, COMPLETED, PAID).
              </p>
            </div>

            <button
              onClick={() =>
                setStageModal({
                  open: true,
                  data: { name: '', order: pipelineStages.length + 1, stageType: 'CUSTOM', color: '#0284c7' },
                })
              }
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Stage</span>
            </button>
          </div>

          <div className="space-y-3">
            {pipelineStages.map((stage: any, idx: number) => (
              <div key={stage.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: stage.color || '#0284c7' }}></span>
                  <div>
                    <span className="font-bold text-xs text-slate-900">{stage.name}</span>
                    <span className="text-[10px] text-slate-500 block">Order #{stage.order}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-800 border font-mono">
                    TYPE: {stage.stageType || 'CUSTOM'}
                  </span>
                  <button onClick={() => setStageModal({ open: true, data: { ...stage } })} className="p-1.5 rounded-lg bg-white border">
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button onClick={() => handleMutateEntity('PIPELINE_STAGE', 'DELETE', stage)} className="p-1.5 rounded-lg bg-white border">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-sky-600" />
              Payment Preferences & Acceptance Methods
            </h2>
            <button
              onClick={() => handleMutateEntity('PAYMENT_CONFIG', 'SAVE', paymentConfig)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Payments</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl border bg-slate-50/60 space-y-3">
              <span className="font-bold text-slate-800 uppercase block">Accepted Payment Methods</span>
              <div className="space-y-2">
                {['Cash', 'Card', 'Check', 'ACH', 'PayPal', 'Financing'].map((method) => {
                  const isChecked = (paymentConfig?.acceptedMethods || []).includes(method);
                  return (
                    <label key={method} className="flex items-center gap-2 cursor-pointer text-slate-800 font-semibold">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = [...(paymentConfig?.acceptedMethods || [])];
                          const updated = e.target.checked ? [...current, method] : current.filter((m) => m !== method);
                          setConfig({ ...config, paymentConfig: { ...paymentConfig, acceptedMethods: updated } });
                        }}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>{method}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50/60 space-y-3">
              <span className="font-bold text-slate-800 uppercase block">Payment Timing Policy</span>
              <select
                value={paymentConfig?.paymentTiming || 'DUE_AFTER_SERVICE'}
                onChange={(e) => setConfig({ ...config, paymentConfig: { ...paymentConfig, paymentTiming: e.target.value } })}
                className="w-full p-2.5 rounded-xl border font-bold text-slate-900 bg-white"
              >
                <option value="AT_BOOKING">Payment Due At Booking</option>
                <option value="DEPOSIT_AT_BOOKING">Deposit Required At Booking</option>
                <option value="DUE_AFTER_SERVICE">Payment Due After Service Completion</option>
                <option value="INVOICE_REQUIRED">Invoice Issued After Completion</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Service Area */}
      {activeTab === 'area' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-600" />
              Service Area & Travel Rules
            </h2>
            <button
              onClick={() => handleMutateEntity('SERVICE_AREA', 'SAVE', serviceArea)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Service Area</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Service Area Rule Type</label>
              <select
                value={serviceArea?.areaType || 'ZIP_CODES'}
                onChange={(e) => setConfig({ ...config, serviceArea: { ...serviceArea, areaType: e.target.value } })}
                className="w-full p-2.5 rounded-xl border font-bold text-slate-900 bg-white"
              >
                <option value="ZIP_CODES">Zip Codes</option>
                <option value="CITIES">Cities</option>
                <option value="COUNTIES">Counties</option>
                <option value="RADIUS">Miles Radius from Base</option>
                <option value="STATES">States</option>
                <option value="NATIONAL">National</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Coverage Values (Comma-Separated)</label>
              <input
                type="text"
                value={(serviceArea?.values || []).join(', ')}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    serviceArea: { ...serviceArea, values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) },
                  })
                }
                className="w-full p-2.5 rounded-xl border font-semibold text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Team */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              Tenant Team Members & Roles
            </h2>
            <button
              onClick={() =>
                setMemberModal({
                  open: true,
                  data: { name: '', email: '', phone: '', role: 'TECHNICIAN', active: true },
                })
              }
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Member</span>
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member: any, idx: number) => (
              <div key={member.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">{member.name}</span>
                  <span className="text-slate-500 text-[11px]">
                    {member.email} &bull; {member.phone}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white font-mono uppercase">
                    {member.role}
                  </span>
                  <button onClick={() => setMemberModal({ open: true, data: { ...member } })} className="p-1.5 rounded-lg bg-white border">
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button onClick={() => handleMutateEntity('TEAM_MEMBER', 'DISABLE', member)} className="p-1.5 rounded-lg bg-white border">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service CRUD Modal */}
      {serviceModal.open && serviceModal.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {serviceModal.data.id ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button onClick={() => setServiceModal({ open: false, data: null })} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Service Name</label>
                <input
                  type="text"
                  value={serviceModal.data.name || ''}
                  onChange={(e) => setServiceModal({ open: true, data: { ...serviceModal.data, name: e.target.value } })}
                  className="w-full p-2.5 rounded-xl border font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pricing Type</label>
                  <select
                    value={serviceModal.data.pricingType || 'FIXED'}
                    onChange={(e) => setServiceModal({ open: true, data: { ...serviceModal.data, pricingType: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border font-semibold bg-white"
                  >
                    <option value="FIXED">FIXED</option>
                    <option value="STARTING_AT">STARTING_AT</option>
                    <option value="HOURLY">HOURLY</option>
                    <option value="CUSTOM_QUOTE">CUSTOM_QUOTE</option>
                    <option value="FREE">FREE</option>
                    <option value="CONTACT_FOR_PRICE">CONTACT_FOR_PRICE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={serviceModal.data.basePrice || 0}
                    onChange={(e) => setServiceModal({ open: true, data: { ...serviceModal.data, basePrice: parseFloat(e.target.value) } })}
                    disabled={['CUSTOM_QUOTE', 'FREE', 'CONTACT_FOR_PRICE'].includes(serviceModal.data.pricingType)}
                    className="w-full p-2.5 rounded-xl border font-semibold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Booking Mode</label>
                  <select
                    value={serviceModal.data.bookingMode || 'REQUEST_APPOINTMENT'}
                    onChange={(e) => setServiceModal({ open: true, data: { ...serviceModal.data, bookingMode: e.target.value } })}
                    className="w-full p-2.5 rounded-xl border font-semibold bg-white"
                  >
                    <option value="INSTANT_BOOK">INSTANT_BOOK</option>
                    <option value="REQUEST_APPOINTMENT">REQUEST_APPOINTMENT</option>
                    <option value="QUOTE_FIRST">QUOTE_FIRST</option>
                    <option value="MANUAL_ONLY">MANUAL_ONLY</option>
                    <option value="NOT_BOOKABLE">NOT_BOOKABLE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={serviceModal.data.durationMinutes || 60}
                    onChange={(e) => setServiceModal({ open: true, data: { ...serviceModal.data, durationMinutes: parseInt(e.target.value) } })}
                    className="w-full p-2.5 rounded-xl border font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setServiceModal({ open: false, data: null })} className="px-4 py-2 rounded-xl bg-slate-100 font-semibold">
                Cancel
              </button>
              <button
                onClick={() => handleMutateEntity('SERVICE', serviceModal.data.id ? 'UPDATE' : 'CREATE', serviceModal.data)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
              >
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
