'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/db';
import { Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function ClientWebsitePage() {
  const params = useParams();
  const tenantId = (params?.tenantId as string) || 'tenant_tyrees_auto';
  const tenant = db.tenants.get(tenantId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    success: boolean;
    httpStatus?: number;
    message: string;
    submissionId?: string;
    contactId?: string;
  } | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);

    const siteKey = 'public_tyrees_4K8A9B2C';
    const payload = {
      siteKey,
      formType: 'quote',
      eventId: `site_evt_${Date.now()}`,
      contact: {
        name,
        email,
        phone,
      },
      fields: {
        vehicle,
      },
    };

    try {
      const response = await fetch('/api/public/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Site-Key': siteKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmissionStatus({
          success: true,
          httpStatus: response.status,
          message: `Thank you, ${name}! Your quote request was received and saved in Book Moar CRM.`,
          submissionId: data.submissionId,
          contactId: data.contactId,
        });

        // Reset form inputs
        setName('');
        setEmail('');
        setPhone('');
        setVehicle('');
      } else {
        setSubmissionStatus({
          success: false,
          httpStatus: response.status,
          message: data.error || 'Public API rejected form submission',
        });
      }
    } catch (err: any) {
      setSubmissionStatus({
        success: false,
        httpStatus: 500,
        message: err.message || 'Database connection unavailable',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 -m-4 sm:-m-6 lg:-m-8">
      {/* Live Service Status Bar */}
      <div
        className={`p-3 text-center text-xs font-bold font-mono flex items-center justify-center gap-2 border-b ${
          tenant?.serviceStatus === 'ACTIVE'
            ? 'bg-emerald-600 text-white'
            : tenant?.serviceStatus === 'SUSPENDED'
            ? 'bg-amber-600 text-white'
            : 'bg-slate-800 text-slate-200'
        }`}
      >
        <span>CLIENT WEBSITE RUNTIME &bull; TENANT: {tenant?.name || tenantId}</span>
        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase">
          Service State: {tenant?.serviceStatus || 'ACTIVE'}
        </span>
      </div>

      {/* Website Navigation */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center max-w-6xl mx-auto">
        <span className="text-xl font-extrabold text-sky-700">{tenant?.name || "Tyree's Auto Detailing"}</span>
        <a href="#quote" className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-500 transition">
          Get Free Estimate
        </a>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-slate-200 py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            {tenant?.websiteConfig?.heroTitle || "Raleigh's Premier Auto Detailing Services"}
          </h1>
          <p className="text-slate-600 text-base">
            Professional paint correction, ceramic coatings, and deep interior cleaning delivered with precision.
          </p>
        </div>
      </section>

      {/* Interactive Form Section */}
      <section id="quote" className="py-12 px-6 max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Request a Free Quote</h2>
            <p className="text-xs text-slate-500 mt-1">
              Fill out the form below to receive an instant estimate for your vehicle.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production Test 002"
                className="w-full p-3 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="productiontest002@example.com"
                  className="w-full p-3 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9195550197"
                  className="w-full p-3 border rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vehicle Year / Make / Model</label>
              <input
                type="text"
                required
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="2024 Ford F-150"
                className="w-full p-3 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting to Book Moar Public API...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Quote Request
                </>
              )}
            </button>
          </form>

          {submissionStatus && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold space-y-1 ${
                submissionStatus.success
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {submissionStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>
                  {submissionStatus.success
                    ? 'Form Submission Saved in CRM'
                    : `Submission Failed (${submissionStatus.httpStatus})`}
                </span>
              </div>
              <p>{submissionStatus.message}</p>
              {submissionStatus.submissionId && (
                <div className="text-[11px] font-mono text-emerald-700 pt-1">
                  Submission ID: {submissionStatus.submissionId} &bull; Contact ID: {submissionStatus.contactId}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
