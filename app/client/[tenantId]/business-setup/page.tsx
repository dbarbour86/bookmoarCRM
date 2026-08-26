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
  SlidersHorizontal,
  Clock,
  ShieldCheck,
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

  const handleSaveSection = async (sectionName: string, sectionData: any) => {
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/crm/business-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          section: sectionName,
          data: sectionData,
          userId: 'user_master_admin',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg({
          success: true,
          message: `Saved ${sectionName.toUpperCase()} configuration successfully to PostgreSQL.`,
        });
        setConfig(data.config);
      } else {
        setStatusMsg({
          success: false,
          message: data.error || 'Failed to save configuration',
        });
      }
    } catch (err: any) {
      setStatusMsg({
        success: false,
        message: err.message || 'Error communicating with configuration API',
      });
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-sky-600 text-xs font-bold uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Master Admin Configuration Machinery</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {profile?.businessName || tenant?.name || 'Tenant'} Business Setup
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Industry: <strong className="text-slate-800">{profile?.industry}</strong> &bull; Service Type:{' '}
            <strong className="text-slate-800">{profile?.serviceType}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 font-mono border">
            Tenant ID: {tenantId}
          </span>
        </div>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            statusMsg.success ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMsg.message}</span>
        </div>
      )}

      {/* Tabs */}
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

      {/* Section 1: Business Info */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              Business Profile & Operating Model
            </h2>
            <button
              onClick={() => handleSaveSection('profile', profile)}
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

      {/* Section 2: Services & Pricing */}
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
          </div>

          <div className="space-y-4">
            {services.map((srv: any, idx: number) => (
              <div key={srv.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{srv.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      {srv.pricingType}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {srv.bookingMode}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {srv.pricingType === 'CUSTOM_QUOTE' ? 'Custom Quote' : `$${srv.basePrice}`} &bull; {srv.durationMinutes || 0} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Lead Intake */}
      {activeTab === 'intake' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              Dynamic Lead Intake Field Definitions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Public form intake fields are dynamically rendered from these definitions instead of hard-coding vehicle fields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leadFields.map((field: any, idx: number) => (
              <div key={field.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{field.label}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                    {field.fieldType}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Key: <code className="font-mono text-sky-700">{field.key}</code> &bull; Required:{' '}
                  <strong>{field.required ? 'YES' : 'NO'}</strong>
                </div>
                {field.options && field.options.length > 0 && (
                  <div className="text-[11px] text-slate-600 font-medium">
                    Options: {field.options.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Pipeline Stages */}
      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-sky-600" />
              Tenant Pipeline Stages & Semantic Types
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configured pipeline stages mapping custom business names to standardized stage types (NEW, QUOTED, BOOKED, COMPLETED, PAID).
            </p>
          </div>

          <div className="space-y-3">
            {pipelineStages.map((stage: any, idx: number) => (
              <div key={stage.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#0284c7' }}></span>
                  <div>
                    <span className="font-bold text-xs text-slate-900">{stage.name}</span>
                    <span className="text-[10px] text-slate-500 block">Order #{stage.order}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-800 border font-mono">
                  TYPE: {stage.stageType || 'CUSTOM'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-sky-600" />
              Payment Preferences & Acceptance Methods
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border bg-slate-50/60 space-y-2">
              <span className="font-bold text-slate-700 block uppercase">Accepted Payment Methods</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {(paymentConfig?.acceptedMethods || []).map((method: string) => (
                  <span key={method} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300">
                    {method}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50/60 space-y-2">
              <span className="font-bold text-slate-700 block uppercase">Payment Timing Policy</span>
              <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-lg text-xs font-bold border border-sky-300 inline-block font-mono">
                {paymentConfig?.paymentTiming || 'DUE_AFTER_SERVICE'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Section 6: Service Area */}
      {activeTab === 'area' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-600" />
              Service Area & Travel Rules
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border bg-slate-50/60 space-y-2">
              <span className="font-bold text-slate-700 block uppercase">Area Rule Type</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold border border-indigo-300 inline-block font-mono">
                {serviceArea?.areaType || 'ZIP_CODES'}
              </span>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50/60 space-y-2">
              <span className="font-bold text-slate-700 block uppercase">Configured Coverage Values</span>
              <div className="flex flex-wrap gap-1.5">
                {(serviceArea?.values || []).map((val: string) => (
                  <span key={val} className="px-2.5 py-1 bg-white border text-slate-800 font-mono font-bold rounded-md text-[11px]">
                    {val}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 7: Team Members */}
      {activeTab === 'team' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              Tenant Team Members & Roles
            </h2>
          </div>

          <div className="space-y-3">
            {members.map((member: any, idx: number) => (
              <div key={member.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{member.name}</span>
                  <span className="text-slate-500 text-[11px]">
                    {member.email} &bull; {member.phone}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white font-mono uppercase">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
