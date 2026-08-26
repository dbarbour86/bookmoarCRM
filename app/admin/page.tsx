'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db, TenantData, WebsiteIntegrationData } from '@/lib/db';
import { generateWebsiteExportZip } from '@/lib/export/websiteExporter';
import {
  ShieldAlert,
  Power,
  Download,
  ExternalLink,
  GitBranch,
  Users,
  AlertTriangle,
  FileCode2,
  Lock,
  Sparkles,
  SlidersHorizontal,
  X,
  Globe,
  RefreshCw,
  Copy,
  Check,
  FileSpreadsheet,
  FileArchive,
} from 'lucide-react';

export default function MasterAdminPage() {
  const [tenants, setTenants] = useState<TenantData[]>(Array.from(db.tenants.values()));
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const [exportModalTenant, setExportModalTenant] = useState<TenantData | null>(null);
  const [exportDataType, setExportDataType] = useState<'CONTACTS' | 'OPPORTUNITIES' | 'FORM_SUBMISSIONS' | 'ALL'>('ALL');
  const [adapterType, setAdapterType] = useState<'WEB3FORMS' | 'FORMSPREE' | 'CUSTOM_POST'>('WEB3FORMS');
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [logs, setLogs] = useState(db.auditLogs);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refreshTenants = () => {
    setTenants(Array.from(db.tenants.values()));
    setLogs([...db.auditLogs]);
  };

  const handleStatusChange = (tenantId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED') => {
    const tenant = db.tenants.get(tenantId);
    if (!tenant) return;

    tenant.serviceStatus = newStatus;
    if (newStatus === 'SUSPENDED' || newStatus === 'TERMINATED') {
      tenant.masterAutomationEnabled = false;
    } else if (newStatus === 'ACTIVE') {
      tenant.masterAutomationEnabled = true;
    }

    db.auditLogs.unshift({
      id: `audit_stat_${Date.now()}`,
      tenantId: tenant.id,
      userId: 'user_master_admin',
      action: `SERVICE_STATUS_CHANGED_${newStatus}`,
      details: { tenantName: tenant.name, newStatus },
      timestamp: new Date().toISOString(),
    });

    refreshTenants();
  };

  const handleToggleCapability = (tenantId: string, flag: keyof TenantData) => {
    const tenant = db.tenants.get(tenantId);
    if (!tenant) return;

    (tenant as any)[flag] = !(tenant as any)[flag];

    db.auditLogs.unshift({
      id: `audit_flag_${Date.now()}`,
      tenantId: tenant.id,
      userId: 'user_master_admin',
      action: `CAPABILITY_TOGGLED`,
      details: { flag, newValue: (tenant as any)[flag] },
      timestamp: new Date().toISOString(),
    });

    refreshTenants();
  };

  const handleRotateKey = (tenantId: string, integrationId: string) => {
    db.rotatePublicSiteKey(tenantId, integrationId);
    refreshTenants();
    alert('Public site key rotated successfully!');
  };

  const handleToggleIntegrationStatus = (integration: WebsiteIntegrationData) => {
    integration.status = integration.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    integration.updatedAt = new Date().toISOString();
    refreshTenants();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDataExport = async () => {
    if (!exportModalTenant) return;
    setIsExporting(true);

    try {
      const response = await fetch('/api/export/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: exportModalTenant.id,
          type: exportDataType,
          format: exportDataType === 'ALL' ? 'zip' : 'csv',
          userRole: 'MASTER_ADMIN',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate export');

      const blob = await response.blob();
      const contentDisp = response.headers.get('content-disposition');
      let filename = `${exportModalTenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${exportDataType.toLowerCase()}.${exportDataType === 'ALL' ? 'zip' : 'csv'}`;
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
      setExportModalTenant(null);
      refreshTenants();
    }
  };

  const handleGenerateExport = async () => {
    if (!selectedTenant) return;
    setIsExporting(true);

    try {
      const res = await generateWebsiteExportZip({
        tenantId: selectedTenant.id,
        adapterType,
        targetEmail: selectedTenant.emailConfig?.fromEmail || 'client@business.com',
      });

      setAuditReport(res.auditReport);

      const blob = new Blob([new Uint8Array(res.zipBuffer)], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
      refreshTenants();
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Lock className="w-4 h-4" />
            <span>Master System Control</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Book Moar Master Administration</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Manage business profiles, site keys, automation kill switches, client data exports (CSV/ZIP), and website bundles.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <div className="text-center px-3">
            <span className="text-xs text-slate-400 block font-medium uppercase">Total Clients</span>
            <span className="text-2xl font-bold text-white">{tenants.length}</span>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="text-center px-3">
            <span className="text-xs text-slate-400 block font-medium uppercase">Active Managed</span>
            <span className="text-2xl font-bold text-emerald-400">
              {tenants.filter((t) => t.serviceStatus === 'ACTIVE').length}
            </span>
          </div>
        </div>
      </div>

      {/* Client Accounts Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Managed Client Accounts & Offboarding Exports
          </h2>
          <span className="text-xs text-slate-500 font-medium">Master Admin Privileges Active</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tenants.map((tenant) => {
            const integrations = db.getTenantWebsiteIntegrations(tenant.id);
            const primaryIntegration = integrations[0];

            return (
              <div
                key={tenant.id}
                className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${
                  tenant.serviceStatus === 'ACTIVE'
                    ? 'border-emerald-200 ring-1 ring-emerald-100'
                    : tenant.serviceStatus === 'SUSPENDED'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-300 bg-slate-100/50'
                }`}
              >
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{tenant.name}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                        Plan: {tenant.plan}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono mt-1 block">
                      Domain: {tenant.domain} &bull; ID: {tenant.id}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Status</label>
                    <select
                      value={tenant.serviceStatus}
                      onChange={(e) => handleStatusChange(tenant.id, e.target.value as any)}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold border cursor-pointer shadow-sm transition ${
                        tenant.serviceStatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                          : tenant.serviceStatus === 'SUSPENDED'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                          : 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      <option value="ACTIVE">● ACTIVE (Service Enabled)</option>
                      <option value="SUSPENDED">▲ SUSPENDED (Paused)</option>
                      <option value="TERMINATED">■ TERMINATED (Closed)</option>
                    </select>
                  </div>
                </div>

                {/* Kill Switches */}
                <div className="p-5 bg-slate-50 border-b border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                      Automation Kill Switches & Capabilities
                    </span>
                    <button
                      onClick={() => handleToggleCapability(tenant.id, 'masterAutomationEnabled')}
                      disabled={tenant.serviceStatus === 'TERMINATED'}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                        tenant.masterAutomationEnabled
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      {tenant.masterAutomationEnabled ? 'MASTER ENABLED' : 'MASTER KILL SWITCH (OFF)'}
                    </button>
                  </div>
                </div>

                {/* Website Integration */}
                {primaryIntegration && (
                  <div className="p-5 border-b border-slate-100 bg-sky-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-sky-600" />
                        Website Integration ({primaryIntegration.name})
                      </span>
                      <button
                        onClick={() => handleToggleIntegrationStatus(primaryIntegration)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                          primaryIntegration.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {primaryIntegration.status}
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 block font-medium">Public Site Key:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-white p-2 rounded-lg border font-mono text-[11px] text-slate-800 font-bold select-all">
                            {primaryIntegration.publicSiteKey}
                          </code>
                          <button
                            onClick={() => handleCopy(primaryIntegration.publicSiteKey)}
                            className="p-2 rounded-lg bg-white border hover:bg-slate-50 text-slate-600"
                          >
                            {copiedKey === primaryIntegration.publicSiteKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleRotateKey(tenant.id, primaryIntegration.id)}
                            className="px-2.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Rotate Key
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="p-5 flex flex-wrap gap-3 items-center justify-between bg-slate-50/70 border-t border-slate-100">
                  <Link
                    href={`/client/${tenant.id}/crm`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-sky-600 hover:bg-sky-500 text-white shadow-md transition"
                  >
                    <Users className="w-4 h-4" />
                    Manage Client &rarr;
                  </Link>

                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => setExportModalTenant(tenant)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Export Data
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTenant(tenant);
                        setAuditReport(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow transition"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      Export Bundle
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Client Data Export Modal (CSV/ZIP) */}
      {exportModalTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Client Data Export
                </h3>
                <p className="text-xs text-slate-500">
                  Target Tenant: <strong className="text-slate-800">{exportModalTenant.name}</strong> ({exportModalTenant.serviceStatus})
                </p>
              </div>
              <button onClick={() => setExportModalTenant(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-700">Select Export Content & Format:</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'CONTACTS', label: 'Contacts / Leads', desc: 'contacts.csv (Expanded fields)' },
                  { id: 'OPPORTUNITIES', label: 'Opportunities', desc: 'opportunities.csv (Pipeline)' },
                  { id: 'FORM_SUBMISSIONS', label: 'Form Submissions', desc: 'form_submissions.csv (Payloads)' },
                  { id: 'ALL', label: 'Export All Data', desc: 'all-data.zip (Includes summary)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setExportDataType(opt.id as any)}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      exportDataType === opt.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900">
                <strong className="block font-bold">CSV Formula Injection Protection Active:</strong>
                Special characters (=, +, -, @) are sanitized automatically to ensure safe opening in Excel and Google Sheets.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <button onClick={() => setExportModalTenant(null)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700">
                Cancel
              </button>
              <button
                onClick={handleDataExport}
                disabled={isExporting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generating Download...' : `Download ${exportDataType === 'ALL' ? 'ZIP Archive' : 'CSV File'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Website Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-sky-600" />
                  Website Export Generator
                </h3>
                <p className="text-xs text-slate-500">
                  Target Tenant: <strong className="text-slate-800">{selectedTenant.name}</strong> ({selectedTenant.domain})
                </p>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Select Form Adapter:</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setAdapterType('WEB3FORMS')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      adapterType === 'WEB3FORMS' ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20' : 'border-slate-200'
                    }`}
                  >
                    <span className="block font-bold text-sm">Web3Forms</span>
                  </button>

                  <button
                    onClick={() => setAdapterType('FORMSPREE')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      adapterType === 'FORMSPREE' ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20' : 'border-slate-200'
                    }`}
                  >
                    <span className="block font-bold text-sm">Formspree</span>
                  </button>

                  <button
                    onClick={() => setAdapterType('CUSTOM_POST')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      adapterType === 'CUSTOM_POST' ? 'border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20' : 'border-slate-200'
                    }`}
                  >
                    <span className="block font-bold text-sm">Custom POST</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setSelectedTenant(null)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700">
                Close
              </button>
              <button
                onClick={handleGenerateExport}
                disabled={isExporting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generating ZIP...' : 'Generate & Download ZIP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-slate-600" />
          Master Administrative Audit Log
        </h3>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">{log.timestamp.split('T')[1].slice(0, 8)}</span>
                <span className="font-bold text-sky-700">{log.action}</span>
                <span className="text-slate-600">{JSON.stringify(log.details)}</span>
              </div>
              <span className="text-slate-400">User: {log.userId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
