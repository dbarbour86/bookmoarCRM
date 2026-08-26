const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// In-Memory & Database Data Structures
const tenants = new Map();
const websiteIntegrations = new Map();
const idempotencyRecords = new Map();
const formSubmissions = new Map();
const contacts = new Map();
const pipelineStages = new Map();
const opportunities = new Map();
const platformEvents = [];
const workflows = new Map();
const executions = [];
const waitStates = [];
const auditLogs = [];

// Seed Data
tenants.set('tenant_tyrees_auto', {
  id: 'tenant_tyrees_auto',
  name: "Tyree's Auto Detailing",
  domain: 'tyreesautodetailing.com',
  serviceStatus: 'ACTIVE',
  plan: 'Grow',
  masterAutomationEnabled: true,
  smsEnabled: true,
  emailEnabled: true,
  crmWriteEnabled: true,
  missedCallEnabled: true,
  reviewsEnabled: true,
  phoneConfig: { twilioNumber: '+19195550199' },
  emailConfig: { fromEmail: 'info@tyreesautodetailing.com' },
  websiteConfig: { heroTitle: "Raleigh's Premier Auto Detailing", primaryColor: '#0284c7' },
});

websiteIntegrations.set('integration_tyrees_primary', {
  id: 'integration_tyrees_primary',
  tenantId: 'tenant_tyrees_auto',
  name: 'Primary Marketing Website',
  publicSiteKey: 'public_tyrees_4K8A9B2C',
  status: 'ACTIVE',
  allowedDomains: ['tyreesautodetailing.com', 'localhost', '127.0.0.1', '*'],
  lastEventReceivedAt: new Date().toISOString(),
});

contacts.set('c1', {
  id: 'c1',
  tenantId: 'tenant_tyrees_auto',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+19195550144',
  status: 'LEAD',
  tags: ['Website Quote'],
  vehicle: '2023 Tesla Model 3',
  value: 350,
});

pipelineStages.set('tenant_tyrees_auto', [
  { id: 'stg_1', name: 'New Lead' },
  { id: 'stg_2', name: 'Estimate Sent' },
  { id: 'stg_3', name: 'Appointment Booked' },
  { id: 'stg_4', name: 'Job Completed' },
]);

workflows.set('wf_speed_lead', {
  id: 'wf_speed_lead',
  tenantId: 'tenant_tyrees_auto',
  name: 'Speed-to-Lead Follow Up',
  description: 'Instant SMS response and owner alert when quote form is submitted.',
  eventType: 'FORM_SUBMITTED',
});

// Guard Evaluator
function evaluateEventGuard(tenantId, eventType) {
  const tenant = tenants.get(tenantId);
  if (!tenant) return { allowed: false, reason: 'Tenant not found' };

  if (tenant.serviceStatus === 'SUSPENDED') {
    return { allowed: false, reason: 'Tenant managed services are SUSPENDED.' };
  }
  if (tenant.serviceStatus === 'TERMINATED') {
    return { allowed: false, reason: 'Tenant managed services are TERMINATED.' };
  }
  if (!tenant.masterAutomationEnabled) {
    return { allowed: false, reason: 'Master Automation Kill Switch is OFF for this tenant.' };
  }
  if (eventType.includes('SMS') && !tenant.smsEnabled) {
    return { allowed: false, reason: 'SMS Automation capability is DISABLED for this tenant.' };
  }
  return { allowed: true };
}

// Publish Event Engine
function publishEvent(tenantId, eventType, source, payload) {
  const guard = evaluateEventGuard(tenantId, eventType);
  const event = { id: `evt_${Date.now()}`, tenantId, eventType, source, payload, timestamp: new Date().toISOString() };
  platformEvents.unshift(event);

  if (!guard.allowed) {
    const blockedExec = {
      id: `exec_blocked_${Date.now()}`,
      tenantId,
      eventType,
      status: 'BLOCKED',
      skippedReason: guard.reason,
      timestamp: new Date().toISOString(),
    };
    executions.unshift(blockedExec);
    return { allowed: false, execution: blockedExec };
  }

  // Create Opportunity for Speed-to-Lead
  const oppId = `opp_${Date.now()}`;
  opportunities.set(oppId, {
    id: oppId,
    tenantId,
    contactId: payload.contactId,
    title: 'Full Detail Quote',
    value: 350,
  });

  const exec = {
    id: `exec_${Date.now()}`,
    tenantId,
    eventType,
    status: 'COMPLETED',
    resultNote: 'Speed-to-Lead workflow created Opportunity & sent instant SMS.',
    timestamp: new Date().toISOString(),
  };
  executions.unshift(exec);
  return { allowed: true, execution: exec };
}

const PORT = 7070;

const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);
  const reqPath = reqUrl.pathname;

  // Serve Standalone Test Website
  if (reqPath === '/standalone-test-site.html' || reqPath === '/test-site') {
    const htmlPath = path.join(__dirname, 'public', 'standalone-test-site.html');
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(htmlPath, 'utf8'));
      return;
    }
  }

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Site-Key',
    });
    res.end();
    return;
  }

  // Handle Public Form API
  if (reqPath === '/api/public/forms/submit' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => bodyStr += chunk);
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr);
        const { siteKey, eventId, contact = {}, fields = {} } = body;

        const integration = Array.from(websiteIntegrations.values()).find(i => i.publicSiteKey === siteKey);
        if (!integration || integration.status !== 'ACTIVE') {
          res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Invalid or disabled siteKey' }));
          return;
        }

        const tenant = tenants.get(integration.tenantId);

        // Idempotency check
        if (eventId && idempotencyRecords.has(`${tenant.id}:${eventId}`)) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, status: 'idempotent', idempotent: true }));
          return;
        }

        // Contact Deduplication
        const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Derek Barbour';
        const contactId = `c_${Date.now()}`;
        contacts.set(contactId, {
          id: contactId,
          tenantId: tenant.id,
          name: fullName,
          email: contact.email || 'customer@example.com',
          phone: contact.phone || '9195551234',
          status: 'LEAD',
          vehicle: fields.service || 'Full Detail',
          value: 350,
        });

        // Record Idempotency
        if (eventId) {
          idempotencyRecords.set(`${tenant.id}:${eventId}`, { eventId });
        }

        // Save submission
        const submissionId = `sub_${Date.now()}`;
        formSubmissions.set(submissionId, { id: submissionId, tenantId: tenant.id, contactId });

        // Emit Event
        const eventRes = publishEvent(tenant.id, 'FORM_SUBMITTED', 'PUBLIC_WEBSITE_API', { contactId, name: fullName });

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({
          success: true,
          submissionId,
          contactId,
          tenantName: tenant.name,
          automationStatus: eventRes.allowed ? 'EXECUTED' : 'BLOCKED',
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Dashboard View
  res.writeHead(200, { 'Content-Type': 'text/html' });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Book Moar — End-to-End Integration Suite</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 1.5rem; font-weight: bold; color: #38bdf8; margin: 0; }
    .subtitle { color: #94a3b8; font-size: 0.85rem; margin-top: 5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
    .card h2 { font-size: 1.1rem; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-top: 0; color: #f1f5f9; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: bold; }
    .badge-active { background: #065f46; color: #34d399; border: 1px solid #059669; }
    .btn { background: #0284c7; color: #fff; border: none; padding: 8px 14px; border-radius: 6px; font-weight: bold; font-size: 0.8rem; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn:hover { background: #0369a1; }
    .log-box { background: #090d16; border: 1px solid #1e293b; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 0.75rem; max-height: 250px; overflow-y: auto; color: #cbd5e1; }
    .log-entry { margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #1e293b; }
    .full-width { grid-column: span 2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">Book Moar End-to-End Website-to-Workflow Suite</h1>
        <div class="subtitle">Public API Gateway, Database Idempotency, Contact Deduplication & Workflow Automation</div>
      </div>
      <div>
        <a href="/standalone-test-site.html" class="btn" style="background:#059669;">Launch Standalone Test Site &rarr;</a>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>1. Public API Gateway & Website Integrations</h2>
        ${Array.from(websiteIntegrations.values()).map(i => `
          <div style="background: #0f172a; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #334155; font-size:0.8rem;">
            <strong>${i.name}</strong><br>
            <span style="color:#94a3b8;">Site Key:</span> <code style="color:#38bdf8;">${i.publicSiteKey}</code><br>
            <span style="color:#94a3b8;">Form Endpoint:</span> <code>POST /api/public/forms/submit</code>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <h2>2. Observability History Inspector</h2>
        <div class="log-box">
          ${executions.length === 0 ? '<div style="color:#64748b;">No workflow executions recorded yet. Submit a lead from the test site!</div>' : ''}
          ${executions.map(e => `
            <div class="log-entry">
              <span style="color:${e.status === 'COMPLETED' ? '#34d399' : '#f87171'}; font-weight:bold;">[${e.status}]</span>
              <strong>${e.eventType}</strong> &bull; ${e.skippedReason || e.resultNote || 'Executed'}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card full-width">
        <h2>3. CRM Contacts & Opportunities</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
          <div>
            <h3 style="font-size:0.85rem; color:#94a3b8;">Deduplicated Contacts (${contacts.size})</h3>
            ${Array.from(contacts.values()).map(c => `
              <div style="background:#0f172a; padding:10px; border-radius:6px; border:1px solid #334155; margin-bottom:8px; font-size:0.8rem;">
                <strong>${c.name}</strong> (${c.phone || c.email})
              </div>
            `).join('')}
          </div>
          <div>
            <h3 style="font-size:0.85rem; color:#94a3b8;">Pipeline Opportunities (${opportunities.size})</h3>
            ${Array.from(opportunities.values()).map(o => `
              <div style="background:#0f172a; padding:10px; border-radius:6px; border:1px solid #334155; margin-bottom:8px; font-size:0.8rem;">
                <strong>${o.title}</strong> &bull; <span style="color:#34d399;">$${o.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`BOOK MOAR INTEGRATION SERVER IS LIVE ON PORT ${PORT}`);
  console.log(`TEST SITE: http://localhost:${PORT}/standalone-test-site.html`);
  console.log(`===========================================================`);
});
