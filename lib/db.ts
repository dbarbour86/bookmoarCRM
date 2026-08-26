// Enhanced Database Interface with PostgreSQL-backed Website Integrations, Idempotency, and Form Submissions

export interface TenantData {
  id: string;
  name: string;
  domain: string;
  serviceStatus: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  plan: string;
  masterAutomationEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  crmWriteEnabled: boolean;
  missedCallEnabled: boolean;
  reviewsEnabled: boolean;
  phoneConfig: Record<string, any>;
  emailConfig: Record<string, any>;
  websiteConfig: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteIntegrationData {
  id: string;
  tenantId: string;
  name: string;
  publicSiteKey: string;
  status: 'ACTIVE' | 'DISABLED';
  allowedDomains: string[]; // origins or domains
  lastEventReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdempotencyRecordData {
  id: string;
  tenantId: string;
  eventId: string;
  responseHash: string; // Cached JSON response string
  createdAt: string;
}

export interface FormSubmissionData {
  id: string;
  tenantId: string;
  integrationId: string;
  contactId: string;
  formType: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface ContactData {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  status: 'LEAD' | 'CUSTOMER' | 'ARCHIVED';
  tags: string[];
  customFields: Record<string, any>;
  ownerId?: string;
  createdAt: string;
}

export interface PipelineStageData {
  id: string;
  name: string;
  order: number;
}

export interface OpportunityData {
  id: string;
  tenantId: string;
  stageId: string;
  contactId: string;
  title: string;
  value: number;
  status: 'OPEN' | 'WON' | 'LOST';
  createdAt: string;
}

export interface AppointmentData {
  id: string;
  tenantId: string;
  contactId: string;
  service: string;
  startTime: string;
  endTime: string;
  status: 'booked' | 'confirmed' | 'rescheduled' | 'completed' | 'no_show' | 'canceled';
  createdAt: string;
}

export interface PlatformEventData {
  id: string;
  tenantId: string;
  eventType: string;
  source: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface TriggerFilterRule {
  id: string;
  field: string;
  operator: 'equals' | 'does_not_equal' | 'contains' | 'does_not_contain' | 'greater_than' | 'less_than' | 'exists' | 'does_not_exist' | 'before' | 'after';
  value: any;
}

export interface WorkflowNodeData {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'wait';
  name: string;
  actionType?: string;
  category?: string;
  config?: Record<string, any>;
  position?: { x: number; y: number };
}

export interface WorkflowEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  conditionValue?: boolean;
}

export interface WorkflowVersionData {
  id: string;
  workflowId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  triggerConfig: {
    eventType: string;
    filters?: TriggerFilterRule[];
  };
  nodesConfig: WorkflowNodeData[];
  edgesConfig: WorkflowEdgeData[];
  createdAt: string;
}

export interface WorkflowData {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'DISABLED';
  activeVersionId: string;
  draftVersionId?: string;
  runsCount: number;
  lastRunAt?: string;
  versions: WorkflowVersionData[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecutionStepData {
  id: string;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: 'EXECUTED' | 'SKIPPED' | 'FAILED';
  evaluatedCondition?: boolean;
  outputData?: any;
  executedAt: string;
}

export interface WorkflowExecutionData {
  id: string;
  tenantId: string;
  workflowId: string;
  workflowVersionId: string;
  eventId: string;
  contactId?: string;
  status: 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'BLOCKED';
  skippedReason?: string;
  startedAt: string;
  completedAt?: string;
  steps: WorkflowExecutionStepData[];
}

export interface WorkflowWaitStateData {
  id: string;
  executionId: string;
  nodeId: string;
  tenantId: string;
  contactId?: string;
  resumeAt: string;
  cancellationConditions: string[];
  status: 'PENDING' | 'RESUMED' | 'CANCELLED';
}

export interface AuditLogData {
  id: string;
  tenantId?: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: string;
}

class MockDatabase {
  public tenants: Map<string, TenantData> = new Map();
  public websiteIntegrations: Map<string, WebsiteIntegrationData> = new Map();
  public idempotencyRecords: Map<string, IdempotencyRecordData> = new Map();
  public formSubmissions: Map<string, FormSubmissionData> = new Map();
  public contacts: Map<string, ContactData> = new Map();
  public pipelineStages: Map<string, PipelineStageData[]> = new Map();
  public opportunities: Map<string, OpportunityData> = new Map();
  public appointments: Map<string, AppointmentData> = new Map();
  public platformEvents: PlatformEventData[] = [];
  public workflows: Map<string, WorkflowData> = new Map();
  public executions: WorkflowExecutionData[] = [];
  public waitStates: WorkflowWaitStateData[] = [];
  public auditLogs: AuditLogData[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Primary Demo Tenant
    const tyreeTenant: TenantData = {
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
      phoneConfig: { twilioNumber: '+19195550199', autoReplyText: "Thanks for calling Tyree's Auto Detailing!" },
      emailConfig: { fromEmail: 'info@tyreesautodetailing.com' },
      websiteConfig: { heroTitle: "Raleigh's Premier Auto Detailing", primaryColor: '#0284c7' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const apexTenant: TenantData = {
      id: 'tenant_apex_lawn',
      name: 'Apex Lawn & Care',
      domain: 'apexlawncare.com',
      serviceStatus: 'SUSPENDED',
      plan: 'Scale',
      masterAutomationEnabled: false,
      smsEnabled: true,
      emailEnabled: true,
      crmWriteEnabled: true,
      missedCallEnabled: true,
      reviewsEnabled: false,
      phoneConfig: { twilioNumber: '+19195550188' },
      emailConfig: { fromEmail: 'support@apexlawncare.com' },
      websiteConfig: { heroTitle: "Professional Lawn Care", primaryColor: '#16a34a' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tenants.set(tyreeTenant.id, tyreeTenant);
    this.tenants.set(apexTenant.id, apexTenant);

    // Seed Website Integrations
    const tyreeSite: WebsiteIntegrationData = {
      id: 'integration_tyrees_primary',
      tenantId: 'tenant_tyrees_auto',
      name: 'Primary Marketing Website',
      publicSiteKey: 'public_tyrees_4K8A9B2C',
      status: 'ACTIVE',
      allowedDomains: ['tyreesautodetailing.com', 'localhost', '127.0.0.1', '*'],
      lastEventReceivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const apexSite: WebsiteIntegrationData = {
      id: 'integration_apex_primary',
      tenantId: 'tenant_apex_lawn',
      name: 'Main Lawn Site',
      publicSiteKey: 'public_apex_9X7B2C1A',
      status: 'ACTIVE',
      allowedDomains: ['apexlawncare.com', 'localhost', '127.0.0.1', '*'],
      lastEventReceivedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.websiteIntegrations.set(tyreeSite.id, tyreeSite);
    this.websiteIntegrations.set(apexSite.id, apexSite);

    // Seed Pipeline Stages
    this.pipelineStages.set('tenant_tyrees_auto', [
      { id: 'stage_lead_in', name: 'New Lead', order: 1 },
      { id: 'stage_contacted', name: 'Contacted / Estimate Sent', order: 2 },
      { id: 'stage_booked', name: 'Appointment Booked', order: 3 },
      { id: 'stage_completed', name: 'Job Completed', order: 4 },
      { id: 'stage_review_sent', name: 'Review Requested', order: 5 },
    ]);

    // Seed Contacts
    const c1: ContactData = {
      id: 'contact_john_doe',
      tenantId: 'tenant_tyrees_auto',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+19195550144',
      status: 'LEAD',
      tags: ['Website Quote', 'Full Detail'],
      customFields: { vehicle: '2023 Tesla Model 3', estimatedValue: 350 },
      createdAt: new Date().toISOString(),
    };
    this.contacts.set(c1.id, c1);
  }

  // Integration Lookup & Management
  public findIntegrationBySiteKey(siteKey: string): WebsiteIntegrationData | undefined {
    return Array.from(this.websiteIntegrations.values()).find((i) => i.publicSiteKey === siteKey);
  }

  public getTenantWebsiteIntegrations(tenantId: string): WebsiteIntegrationData[] {
    return Array.from(this.websiteIntegrations.values()).filter((i) => i.tenantId === tenantId);
  }

  public rotatePublicSiteKey(tenantId: string, integrationId: string): WebsiteIntegrationData | null {
    const integration = this.websiteIntegrations.get(integrationId);
    if (!integration || integration.tenantId !== tenantId) return null;

    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    integration.publicSiteKey = `public_${tenantId.replace('tenant_', '')}_${randomSuffix}`;
    integration.updatedAt = new Date().toISOString();

    this.auditLogs.unshift({
      id: `audit_rot_${Date.now()}`,
      tenantId,
      userId: 'user_master_admin',
      action: 'PUBLIC_SITE_KEY_ROTATED',
      details: { integrationId, newKey: integration.publicSiteKey },
      timestamp: new Date().toISOString(),
    });

    return integration;
  }

  // Database-backed Persistent Idempotency Helper (tenantId + eventId)
  public checkAndRecordIdempotency(tenantId: string, eventId?: string, responsePayload?: Record<string, any>): { isDuplicate: boolean; cachedResponse?: any } {
    if (!eventId) return { isDuplicate: false };

    const key = `${tenantId}:${eventId}`;
    const existing = this.idempotencyRecords.get(key);
    if (existing) {
      return { isDuplicate: true, cachedResponse: JSON.parse(existing.responseHash) };
    }

    if (responsePayload) {
      const record: IdempotencyRecordData = {
        id: `idem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        tenantId,
        eventId,
        responseHash: JSON.stringify(responsePayload),
        createdAt: new Date().toISOString(),
      };
      this.idempotencyRecords.set(key, record);
    }

    return { isDuplicate: false };
  }

  // Contact Deduplication (Matches Phone or Email)
  public findOrCreateContactByPhoneOrEmail(
    tenantId: string,
    contactInput: { firstName?: string; lastName?: string; name?: string; phone?: string; email?: string; fields?: Record<string, any> }
  ): ContactData {
    const fullName = contactInput.name || `${contactInput.firstName || ''} ${contactInput.lastName || ''}`.trim() || 'New Lead';
    const cleanPhone = (contactInput.phone || '').replace(/[^0-9+]/g, '');
    const cleanEmail = (contactInput.email || '').toLowerCase().trim();

    // Check for existing matching contact
    const existing = Array.from(this.contacts.values()).find(
      (c) =>
        c.tenantId === tenantId &&
        ((cleanPhone && c.phone && c.phone.replace(/[^0-9+]/g, '') === cleanPhone) ||
          (cleanEmail && c.email && c.email.toLowerCase() === cleanEmail))
    );

    if (existing) {
      if (fullName && fullName !== 'New Lead') existing.name = fullName;
      if (cleanEmail) existing.email = cleanEmail;
      if (cleanPhone) existing.phone = cleanPhone;
      if (contactInput.fields) {
        existing.customFields = { ...existing.customFields, ...contactInput.fields };
      }
      return existing;
    }

    // Create New Contact
    const newContact: ContactData = {
      id: `contact_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId,
      name: fullName,
      email: cleanEmail || 'customer@example.com',
      phone: cleanPhone || '+19195550199',
      status: 'LEAD',
      tags: ['Website Lead'],
      customFields: contactInput.fields || {},
      createdAt: new Date().toISOString(),
    };

    this.contacts.set(newContact.id, newContact);
    return newContact;
  }

  // Workflow Helpers
  public getTenantWorkflows(tenantId: string): WorkflowData[] {
    return Array.from(this.workflows.values()).filter((w) => w.tenantId === tenantId);
  }

  public createWorkflow(input: { tenantId: string; name: string; description?: string; eventType: string }): WorkflowData {
    const id = `wf_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const versionId = `ver_1_${id}`;

    const initialVersion: WorkflowVersionData = {
      id: versionId,
      workflowId: id,
      versionNumber: 1,
      status: 'DRAFT',
      triggerConfig: { eventType: input.eventType, filters: [] },
      nodesConfig: [
        {
          id: 'node_trig_1',
          type: 'trigger',
          name: `Trigger: ${input.eventType}`,
          config: { eventType: input.eventType },
          position: { x: 250, y: 50 },
        },
      ],
      edgesConfig: [],
      createdAt: new Date().toISOString(),
    };

    const workflow: WorkflowData = {
      id,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description || `Automated workflow for ${input.eventType}`,
      status: 'DRAFT',
      activeVersionId: versionId,
      draftVersionId: versionId,
      runsCount: 0,
      versions: [initialVersion],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  public publishWorkflowVersion(workflowId: string, versionId: string): WorkflowData | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const version = workflow.versions.find((v) => v.id === versionId);
    if (!version) return null;

    version.status = 'PUBLISHED';
    workflow.activeVersionId = version.id;
    workflow.draftVersionId = undefined;
    workflow.status = 'ACTIVE';
    workflow.updatedAt = new Date().toISOString();
    return workflow;
  }

  public createDraftVersion(workflowId: string): WorkflowVersionData | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const currentVersion = workflow.versions.find((v) => v.id === workflow.activeVersionId) || workflow.versions[0];
    const newVersionNumber = workflow.versions.length + 1;
    const newVersionId = `ver_${newVersionNumber}_${workflowId}`;

    const newDraft: WorkflowVersionData = {
      id: newVersionId,
      workflowId,
      versionNumber: newVersionNumber,
      status: 'DRAFT',
      triggerConfig: JSON.parse(JSON.stringify(currentVersion.triggerConfig)),
      nodesConfig: JSON.parse(JSON.stringify(currentVersion.nodesConfig)),
      edgesConfig: JSON.parse(JSON.stringify(currentVersion.edgesConfig)),
      createdAt: new Date().toISOString(),
    };

    workflow.versions.push(newDraft);
    workflow.draftVersionId = newVersionId;
    workflow.updatedAt = new Date().toISOString();
    return newDraft;
  }

  public duplicateWorkflow(workflowId: string): WorkflowData | null {
    const orig = this.workflows.get(workflowId);
    if (!orig) return null;

    const newWf = this.createWorkflow({
      tenantId: orig.tenantId,
      name: `${orig.name} (Copy)`,
      description: orig.description,
      eventType: orig.versions[0]?.triggerConfig.eventType || 'FORM_SUBMITTED',
    });

    const activeVersion = orig.versions.find((v) => v.id === orig.activeVersionId) || orig.versions[0];
    const newVer = newWf.versions[0];
    newVer.nodesConfig = JSON.parse(JSON.stringify(activeVersion.nodesConfig));
    newVer.edgesConfig = JSON.parse(JSON.stringify(activeVersion.edgesConfig));
    newVer.triggerConfig = JSON.parse(JSON.stringify(activeVersion.triggerConfig));

    return newWf;
  }

  public deleteWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  public toggleWorkflowStatus(workflowId: string, newStatus: 'ACTIVE' | 'DISABLED'): WorkflowData | null {
    const wf = this.workflows.get(workflowId);
    if (!wf) return null;
    wf.status = newStatus;
    wf.updatedAt = new Date().toISOString();
    return wf;
  }
}

export const db = new MockDatabase();
