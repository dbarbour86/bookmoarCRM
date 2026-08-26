'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { db, AppointmentData } from '@/lib/db';
import { EventBus } from '@/lib/events/eventBus';
import { Calendar, Plus, Clock, User, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function AppointmentsPage() {
  const params = useParams();
  const tenantId = (params?.tenantId as string) || 'tenant_tyrees_auto';
  const tenant = db.tenants.get(tenantId);

  const [appointments, setAppointments] = useState<AppointmentData[]>([
    {
      id: 'app_1',
      tenantId,
      contactId: 'contact_john_doe',
      service: 'Full Interior & Exterior Detail',
      startTime: '2026-08-28T14:00:00Z',
      endTime: '2026-08-28T17:00:00Z',
      status: 'booked',
      createdAt: new Date().toISOString(),
    },
  ]);

  const handleUpdateStatus = (appId: string, newStatus: AppointmentData['status']) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    let eventType = 'APPOINTMENT_BOOKED';
    if (newStatus === 'completed') eventType = 'APPOINTMENT_COMPLETED';
    if (newStatus === 'no_show') eventType = 'APPOINTMENT_NOSHOW';
    if (newStatus === 'canceled') eventType = 'APPOINTMENT_CANCELED';

    // Publish event to Event Bus
    EventBus.publish({
      tenantId,
      eventType,
      source: 'APPOINTMENT_MANAGER',
      payload: {
        appointmentId: appId,
        contactId: 'contact_john_doe',
        status: newStatus,
        service: 'Full Interior & Exterior Detail',
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-600" />
            {tenant?.name || 'Client'} Appointments & Booking
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage client appointments, confirm bookings, or trigger no-show recovery workflows.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm">Scheduled Appointments</h3>

        <div className="space-y-3">
          {appointments.map((app) => (
            <div key={app.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{app.service}</h4>
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-sky-100 text-sky-800">
                    {app.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> John Doe
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Friday, Aug 28 @ 2:00 PM
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(app.id, 'completed')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => handleUpdateStatus(app.id, 'no_show')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Mark No-Show
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
