'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/db';
import { EventBus } from '@/lib/events/eventBus';
import { MessageSquare, Send, Phone, User, CheckCheck, AlertCircle } from 'lucide-react';

export default function ConversationsPage() {
  const params = useParams();
  const tenantId = (params?.tenantId as string) || 'tenant_tyrees_auto';
  const tenant = db.tenants.get(tenantId);

  const [messages, setMessages] = useState([
    { id: 'm1', sender: 'CUSTOMER', body: 'Hi! How much for a full interior detail on a 2023 Tesla Model 3?', time: '10:14 AM' },
    { id: 'm2', sender: 'SYSTEM', body: 'Hi John! Thanks for requesting a quote from Tyree\'s Auto. Our Full Interior & Exterior Detail starts at $350. When would you like to book?', time: '10:14 AM (Automated Speed-to-Lead)' },
    { id: 'm3', sender: 'CUSTOMER', body: 'Can you do this Friday at 2 PM?', time: '10:16 AM' },
  ]);

  const [replyText, setReplyText] = useState('');

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !tenant) return;

    if (!tenant.smsEnabled) {
      alert('SMS capability is DISABLED for this tenant. Cannot send outgoing SMS.');
      return;
    }

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'USER',
      body: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMsg]);

    // Publish SMS_SENT event
    EventBus.publish({
      tenantId,
      eventType: 'SMS_SENT',
      source: 'CONVERSATION_UI',
      payload: { contactId: 'contact_john_doe', body: replyText },
    });

    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-sky-600" />
            {tenant?.name || 'Client'} Conversations & SMS
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Unified SMS and Email customer inbox with full automated message history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[500px]">
        {/* Left Thread List */}
        <div className="border-r border-slate-100 p-4 space-y-2">
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-sm">
              JD
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">John Doe</h4>
              <p className="text-[11px] text-slate-500">(919) 555-0144</p>
            </div>
          </div>
        </div>

        {/* Conversation View */}
        <div className="md:col-span-2 flex flex-col justify-between p-6 bg-slate-50/50">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'CUSTOMER' ? 'items-start' : 'items-end'
                }`}
              >
                <div
                  className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                    m.sender === 'CUSTOMER'
                      ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
                      : m.sender === 'SYSTEM'
                      ? 'bg-sky-600 text-white rounded-tr-none shadow'
                      : 'bg-slate-900 text-white rounded-tr-none shadow'
                  }`}
                >
                  <p className="font-semibold">{m.body}</p>
                  <span className="text-[10px] opacity-75 block text-right font-mono">{m.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSendReply} className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type an SMS reply..."
              disabled={tenant && !tenant.smsEnabled}
              className="flex-1 p-3 text-xs border rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <button
              type="submit"
              disabled={tenant && !tenant.smsEnabled}
              className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Send SMS
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
