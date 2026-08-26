import JSZip from 'jszip';
import { db, TenantData } from '../db';

export interface ExportWebsiteOptions {
  tenantId: string;
  adapterType?: 'FORMSPREE' | 'WEB3FORMS' | 'CUSTOM_POST';
  targetEmail?: string;
}

export async function generateWebsiteExportZip(options: ExportWebsiteOptions): Promise<{ filename: string; zipBuffer: Buffer; auditReport: string }> {
  const tenant = db.tenants.get(options.tenantId);
  if (!tenant) {
    throw new Error(`Tenant with ID ${options.tenantId} not found.`);
  }

  const adapterType = options.adapterType || 'WEB3FORMS';
  const zip = new JSZip();

  const slug = tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const filename = `${slug}-standalone-website.zip`;

  // 1. Generate Portable HTML Home Page
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tenant.name} | Professional Services</title>
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>
  <header class="navbar">
    <div class="container">
      <a href="#" class="brand-logo">${tenant.name}</a>
      <nav>
        <a href="#services">Services</a>
        <a href="#quote" class="btn btn-primary">Request Quote</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <h1>${tenant.websiteConfig?.heroTitle || "Quality Local Services You Can Trust"}</h1>
      <p>Providing premium service in your area. Contact us today for a free estimate!</p>
      <a href="#quote" class="btn btn-large">Get Free Estimate</a>
    </div>
  </section>

  <section id="services" class="services">
    <div class="container">
      <h2>Our Featured Services</h2>
      <div class="grid">
        <div class="card">
          <h3>Full Interior & Exterior Detail</h3>
          <p>Deep clean, hand wash, clay bar, and paint protection.</p>
        </div>
        <div class="card">
          <h3>Ceramic Coating Protection</h3>
          <p>Multi-year hydrophobic paint shielding and high gloss shine.</p>
        </div>
        <div class="card">
          <h3>Express Wash & Vacuum</h3>
          <p>Quick maintenance detail for busy vehicle owners.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="quote" class="quote-section">
    <div class="container">
      <h2>Request a Free Quote</h2>
      <!-- Portable Standalone Form -->
      <form id="portableQuoteForm" class="contact-form">
        <div class="form-group">
          <label for="name">Your Name</label>
          <input type="text" id="name" name="name" required placeholder="John Doe">
        </div>
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" required placeholder="john@example.com">
        </div>
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone" required placeholder="(919) 555-0199">
        </div>
        <div class="form-group">
          <label for="details">Service Details</label>
          <textarea id="details" name="details" rows="4" placeholder="Tell us about your vehicle or service needs..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Submit Quote Request</button>
        <div id="formStatus" class="form-status"></div>
      </form>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${tenant.name}. All rights reserved.</p>
    </div>
  </footer>

  <script src="assets/js/portable-forms.js"></script>
</body>
</html>`;

  // 2. Generate CSS File
  const cssContent = `/* ${tenant.name} Standalone Website Styles */
:root {
  --primary-color: ${tenant.websiteConfig?.primaryColor || '#0284c7'};
  --bg-color: #f8fafc;
  --text-color: #0f172a;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg-color); color: var(--text-color); line-height: 1.6; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
.navbar { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 15px 0; display: flex; justify-content: space-between; }
.navbar .container { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.brand-logo { font-size: 1.4rem; font-weight: 700; color: var(--primary-color); text-decoration: none; }
nav a { text-decoration: none; color: #475569; margin-left: 20px; font-weight: 500; }
.btn { display: inline-block; background: var(--primary-color); color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; border: none; cursor: pointer; }
.hero { padding: 80px 0; text-align: center; background: #ffffff; border-bottom: 1px solid #e2e8f0; }
.hero h1 { font-size: 2.5rem; margin-bottom: 15px; }
.hero p { font-size: 1.2rem; color: #64748b; margin-bottom: 25px; }
.services { padding: 60px 0; }
.services h2 { text-align: center; margin-bottom: 30px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
.card { background: #fff; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0; }
.quote-section { padding: 60px 0; background: #fff; border-top: 1px solid #e2e8f0; }
.contact-form { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group input, .form-group textarea { padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; }
.form-status { margin-top: 15px; padding: 10px; border-radius: 6px; display: none; }
.form-status.success { display: block; background: #dcfce7; color: #166534; }
.form-status.error { display: block; background: #fee2e2; color: #991b1b; }
footer { text-align: center; padding: 30px 0; border-top: 1px solid #e2e8f0; color: #64748b; }
`;

  // 3. Generate Portable Form JavaScript Adapter
  let adapterScript = '';
  if (adapterType === 'FORMSPREE') {
    adapterScript = `// Formspree Portable Form Adapter
document.getElementById('portableQuoteForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('formStatus');
  const formData = new FormData(this);

  // ACTION REQUIRED: Replace 'YOUR_FORMSPREE_ID' with your real endpoint
  const endpoint = "https://formspree.io/f/YOUR_FORMSPREE_ID";

  statusDiv.className = 'form-status';
  statusDiv.innerText = 'Submitting quote request...';
  statusDiv.style.display = 'block';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      statusDiv.className = 'form-status success';
      statusDiv.innerText = 'Thank you! Your quote request has been received.';
      this.reset();
    } else {
      throw new Error('Submission failed');
    }
  } catch (err) {
    statusDiv.className = 'form-status error';
    statusDiv.innerText = 'Error submitting request. Please call us directly.';
  }
});`;
  } else if (adapterType === 'WEB3FORMS') {
    adapterScript = `// Web3Forms Portable Form Adapter
document.getElementById('portableQuoteForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('formStatus');
  const formData = new FormData(this);

  // ACTION REQUIRED: Add your Web3Forms Access Key below
  formData.append('access_key', 'YOUR_WEB3FORMS_ACCESS_KEY');

  statusDiv.className = 'form-status';
  statusDiv.innerText = 'Submitting quote request...';
  statusDiv.style.display = 'block';

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      statusDiv.className = 'form-status success';
      statusDiv.innerText = 'Thank you! Your quote request has been sent.';
      this.reset();
    } else {
      throw new Error(data.message || 'Submission failed');
    }
  } catch (err) {
    statusDiv.className = 'form-status error';
    statusDiv.innerText = 'Error submitting request. Please contact us by phone.';
  }
});`;
  } else {
    adapterScript = `// Custom Generic POST Form Adapter
document.getElementById('portableQuoteForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const statusDiv = document.getElementById('formStatus');
  const formData = new FormData(this);
  const json = Object.fromEntries(formData.entries());

  statusDiv.className = 'form-status';
  statusDiv.innerText = 'Sending...';
  statusDiv.style.display = 'block';

  try {
    const res = await fetch('/api/quote-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(json)
    });
    if (res.ok) {
      statusDiv.className = 'form-status success';
      statusDiv.innerText = 'Thank you! Request received.';
      this.reset();
    } else {
      throw new Error('API error');
    }
  } catch (err) {
    statusDiv.className = 'form-status error';
    statusDiv.innerText = 'Submission failed. Please call us directly.';
  }
});`;
  }

  // 4. Generate Export Audit Warnings Report
  const auditReport = `BOOK MOAR WEBSITE EXPORT AUDIT & HANDOFF REPORT
================================================
Client: ${tenant.name} (${tenant.domain})
Export Date: ${new Date().toISOString()}
Export Mode: Standalone Portable Bundle (Independent of Managed Service State)
Adapter Injected: ${adapterType}

PORTABLE WEBSITE ASSETS PACKAGED:
- index.html (Main Landing Page)
- assets/css/styles.css (Responsive Visual Layout)
- assets/js/portable-forms.js (Portable Form Endpoint Adapter)
- sitemap.xml (SEO Sitemap)
- robots.txt (Crawler Instructions)
- README.md & DEPLOYMENT.md (Handoff Instructions)

CONVERTED / ADAPTER COMPONENTS:
- Quote Form: Converted from Book Moar Live Managed CRM API to ${adapterType} Portable Adapter.

[ACTION REQUIRED BEFORE DEPLOYMENT]:
1. Open assets/js/portable-forms.js.
2. Configure your external form handler:
   - For Web3Forms: Replace 'YOUR_WEB3FORMS_ACCESS_KEY' with your free key from web3forms.com.
   - For Formspree: Replace 'YOUR_FORMSPREE_ID' with your endpoint ID from formspree.io.
3. Verify form submissions deliver directly to your target email inbox (${options.targetEmail || 'client@business.com'}).

PROTECTED BOOK MOAR BACKEND COMPONENTS (EXCLUDED FROM EXPORT):
- Book Moar CRM Infrastructure & Database Schemas
- Workflow Automation Engine & Execution Triggers
- Book Moar Master Admin Dashboard
- Twilio / Messaging API Credentials
- Internal System Logs & Other Client Accounts
`;

  const readmeContent = `# ${tenant.name} — Standalone Website Handoff

This archive contains the complete, portable website files for **${tenant.name}**.

## Deployment Quickstart
1. Unzip this package.
2. Follow instructions in \`EXPORT_AUDIT_WARNINGS.txt\` to configure your form destination in \`assets/js/portable-forms.js\`.
3. Upload the static files to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any standard web host.

Refer to \`DEPLOYMENT.md\` and \`DOMAIN-HANDOFF.md\` for complete instructions.
`;

  const deploymentContent = `# Website Deployment Guide

### Hosting Options
- **Netlify**: Drag and drop the unzipped folder to netlify.com.
- **Vercel**: Import folder using Vercel CLI or Dashboard.
- **Traditional CPanel**: Upload files via FTP to public_html.

### Form Configuration
See \`EXPORT_AUDIT_WARNINGS.txt\` for instructions on setting up your external form submission provider.
`;

  const domainContent = `# Domain Handoff Instructions

1. Log in to your domain registrar (GoDaddy, Namecheap, Google Domains).
2. Point your A Record to your new web host's IP address.
3. Update CNAME record for www to point to your new host.
`;

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${tenant.domain}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://${tenant.domain}/sitemap.xml`;

  // Add files to ZIP
  zip.file('index.html', htmlContent);
  zip.file('assets/css/styles.css', cssContent);
  zip.file('assets/js/portable-forms.js', adapterScript);
  zip.file('sitemap.xml', sitemapXml);
  zip.file('robots.txt', robotsTxt);
  zip.file('EXPORT_AUDIT_WARNINGS.txt', auditReport);
  zip.file('README.md', readmeContent);
  zip.file('DEPLOYMENT.md', deploymentContent);
  zip.file('DOMAIN-HANDOFF.md', domainContent);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  // Record Audit Log in DB
  db.auditLogs.unshift({
    id: `audit_exp_${Date.now()}`,
    tenantId: tenant.id,
    userId: 'user_master_admin',
    action: 'WEBSITE_EXPORT_GENERATED',
    details: { adapterType, filename },
    timestamp: new Date().toISOString(),
  });

  return { filename, zipBuffer, auditReport };
}
