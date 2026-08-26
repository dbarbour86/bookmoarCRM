'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { db } from '@/lib/db';
import { ArrowLeft, Users, LayoutGrid, GitBranch, MessageSquare, Calendar, Globe, ShieldAlert } from 'lucide-react';

export default function TenantManagementLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const tenantId = (params?.tenantId as string) || 'tenant_tyrees_auto';
  const tenant = db.tenants.get(tenantId) || {
    id: tenantId,
    name: tenantId === 'tenant_tyrees_auto' ? "Tyree's Auto Detailing" : tenantId === 'tenant_apex_lawn' ? 'Apex Lawn & Care' : 'Client Business',
    serviceStatus: 'ACTIVE',
    plan: 'Grow',
  };

  const navItems = [
    { label: 'CRM & Leads', href: `/client/${tenantId}/crm`, icon: Users },
    { label: 'Pipeline', href: `/client/${tenantId}/pipeline`, icon: LayoutGrid },
    { label: 'Workflows', href: `/client/${tenantId}/workflows`, icon: GitBranch },
    { label: 'Conversations', href: `/client/${tenantId}/conversations`, icon: MessageSquare },
    { label: 'Appointments', href: `/client/${tenantId}/appointments`, icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Tenant Context Sub-Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Clients
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">{tenant.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${
                    tenant.serviceStatus === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : tenant.serviceStatus === 'SUSPENDED'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {tenant.serviceStatus}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Tenant ID: {tenantId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/site/${tenantId}`}
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Globe className="w-3.5 h-3.5" />
              View Client Site &rarr;
            </Link>
          </div>
        </div>

        {/* Dynamic Tenant Navigation Bar */}
        <nav className="flex flex-wrap gap-2 pt-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-sky-500 text-white shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Tenant Page Context */}
      <div>{children}</div>
    </div>
  );
}
