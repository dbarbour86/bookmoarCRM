import { prisma } from './prisma';

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
  allowedDomains: string[];
  lastEventReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdempotencyRecordData {
  id: string;
  tenantId: string;
  eventId: string;
  responseHash: string;
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
  contactName?: string;
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

    this.pipelineStages.set('tenant_tyrees_auto', [
      { id: 'stage_lead_in', name: 'New Lead', order: 1 },
      { id: 'stage_contacted', name: 'Contacted / Estimate Sent', order: 2 },
      { id: 'stage_booked', name: 'Appointment Booked', order: 3 },
      { id: 'stage_completed', name: 'Job Completed', order: 4 },
      { id: 'stage_review_sent', name: 'Review Requested', order: 5 },
    ]);

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

  // Database / Storage Methods with Prisma PostgreSQL Auto-Sync
  public async findIntegrationBySiteKey(siteKey: string): Promise<WebsiteIntegrationData | undefined> {
    if (process.env.DATABASE_URL) {
      try {
        const found = await prisma.websiteIntegration.findUnique({
          where: { publicSiteKey: siteKey },
        });
        if (found) {
          return {
            id: found.id,
            tenantId: found.tenantId,
            name: found.name,
            publicSiteKey: found.publicSiteKey,
            status: found.status as 'ACTIVE' | 'DISABLED',
            allowedDomains: JSON.parse(found.allowedDomains || '[]'),
            lastEventReceivedAt: found.lastEventReceivedAt?.toISOString(),
            createdAt: found.createdAt.toISOString(),
            updatedAt: found.updatedAt.toISOString(),
          };
        }
      } catch (e) {
        console.warn('[DB_WARN] Prisma lookup failed:', (e as any).message);
      }
    }

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

  public async checkAndRecordIdempotency(tenantId: string, eventId?: string, responsePayload?: Record<string, any>): Promise<{ isDuplicate: boolean; cachedResponse?: any }> {
    if (!eventId) return { isDuplicate: false };

    if (process.env.DATABASE_URL) {
      try {
        const existing = await prisma.idempotencyRecord.findUnique({
          where: { tenantId_eventId: { tenantId, eventId } },
        });
        if (existing) {
          return { isDuplicate: true, cachedResponse: JSON.parse(existing.responseHash) };
        }

        if (responsePayload) {
          await prisma.idempotencyRecord.create({
            data: {
              tenantId,
              eventId,
              responseHash: JSON.stringify(responsePayload),
            },
          });
        }
        return { isDuplicate: false };
      } catch (e) {
        console.warn('[DB_WARN] Prisma idempotency error:', (e as any).message);
      }
    }

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

  public async findOrCreateContactByPhoneOrEmail(
    tenantId: string,
    contactInput: { firstName?: string; lastName?: string; name?: string; phone?: string; email?: string; fields?: Record<string, any> }
  ): Promise<ContactData> {
    const fullName = contactInput.name || `${contactInput.firstName || ''} ${contactInput.lastName || ''}`.trim() || 'New Lead';
    const cleanPhone = (contactInput.phone || '').replace(/[^0-9+]/g, '');
    const cleanEmail = (contactInput.email || '').toLowerCase().trim();

    if (process.env.DATABASE_URL) {
      try {
        const existingTenant = await prisma.clientTenant.findUnique({ where: { id: tenantId } });
        if (!existingTenant) {
          await prisma.clientTenant.create({
            data: {
              id: tenantId,
              name: tenantId === 'tenant_tyrees_auto' ? "Tyree's Auto Detailing" : 'Client Tenant',
              domain: 'tyreesautodetailing.com',
            },
          });
        }

        const existingPrismaContact = await prisma.contact.findFirst({
          where: {
            tenantId,
            OR: [
              ...(cleanPhone ? [{ phone: cleanPhone }] : []),
              ...(cleanEmail ? [{ email: cleanEmail }] : []),
            ],
          },
        });

        if (existingPrismaContact) {
          const updated = await prisma.contact.update({
            where: { id: existingPrismaContact.id },
            data: {
              name: fullName !== 'New Lead' ? fullName : existingPrismaContact.name,
              email: cleanEmail || existingPrismaContact.email,
              phone: cleanPhone || existingPrismaContact.phone,
              customFields: JSON.stringify({
                ...JSON.parse(existingPrismaContact.customFields || '{}'),
                ...(contactInput.fields || {}),
              }),
            },
          });

          const resContact: ContactData = {
            id: updated.id,
            tenantId: updated.tenantId,
            name: updated.name,
            email: updated.email || '',
            phone: updated.phone || '',
            status: updated.status as any,
            tags: JSON.parse(updated.tags || '[]'),
            customFields: JSON.parse(updated.customFields || '{}'),
            createdAt: updated.createdAt.toISOString(),
          };

          this.contacts.set(resContact.id, resContact);
          return resContact;
        }

        const newDbContact = await prisma.contact.create({
          data: {
            tenantId,
            name: fullName,
            email: cleanEmail || 'customer@example.com',
            phone: cleanPhone || '+19195550199',
            status: 'LEAD',
            tags: JSON.stringify(['Website Lead']),
            customFields: JSON.stringify(contactInput.fields || {}),
          },
        });

        const resContact: ContactData = {
          id: newDbContact.id,
          tenantId: newDbContact.tenantId,
          name: newDbContact.name,
          email: newDbContact.email || '',
          phone: newDbContact.phone || '',
          status: newDbContact.status as any,
          tags: JSON.parse(newDbContact.tags || '[]'),
          customFields: JSON.parse(newDbContact.customFields || '{}'),
          createdAt: newDbContact.createdAt.toISOString(),
        };

        this.contacts.set(resContact.id, resContact);
        return resContact;
      } catch (e) {
        console.warn('[DB_WARN] Prisma contact persistence fallback:', (e as any).message);
      }
    }

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

  public async getTenantContacts(tenantId: string): Promise<ContactData[]> {
    if (process.env.DATABASE_URL) {
      try {
        const list = await prisma.contact.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
        });

        if (list.length > 0) {
          return list.map((c) => ({
            id: c.id,
            tenantId: c.tenantId,
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            status: c.status as any,
            tags: JSON.parse(c.tags || '[]'),
            customFields: JSON.parse(c.customFields || '{}'),
            createdAt: c.createdAt.toISOString(),
          }));
        }
      } catch (e) {
        console.warn('[DB_WARN] Prisma getTenantContacts fallback:', (e as any).message);
      }
    }

    return Array.from(this.contacts.values()).filter((c) => c.tenantId === tenantId);
  }

  // Platform Event Persistence
  public async createPlatformEvent(input: { tenantId: string; eventType: string; source: string; payload: Record<string, any> }): Promise<PlatformEventData> {
    const id = `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const event: PlatformEventData = {
      id,
      tenantId: input.tenantId,
      eventType: input.eventType,
      source: input.source,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };

    if (process.env.DATABASE_URL) {
      try {
        const created = await prisma.platformEvent.create({
          data: {
            id,
            tenantId: input.tenantId,
            eventType: input.eventType,
            source: input.source,
            payload: JSON.stringify(input.payload),
          },
        });
        event.id = created.id;
      } catch (e) {
        console.warn('[DB_WARN] Prisma PlatformEvent create error:', (e as any).message);
      }
    }

    this.platformEvents.unshift(event);
    return event;
  }

  // Opportunity Persistence & Pipeline
  public async getTenantOpportunities(tenantId: string): Promise<OpportunityData[]> {
    if (process.env.DATABASE_URL) {
      try {
        const list = await prisma.opportunity.findMany({
          where: { tenantId },
          include: { contact: true },
          orderBy: { createdAt: 'desc' },
        });

        if (list.length > 0) {
          return list.map((o) => ({
            id: o.id,
            tenantId: o.tenantId,
            stageId: o.stageId,
            contactId: o.contactId,
            title: o.title,
            value: o.value,
            status: o.status as any,
            createdAt: o.createdAt.toISOString(),
            contactName: o.contact?.name,
          }));
        }
      } catch (e) {
        console.warn('[DB_WARN] Prisma getTenantOpportunities error:', (e as any).message);
      }
    }

    return Array.from(this.opportunities.values()).filter((o) => o.tenantId === tenantId);
  }

  public async createOpportunity(input: { tenantId: string; contactId: string; stageId?: string; title: string; value?: number }): Promise<OpportunityData> {
    const id = `opp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const stageId = input.stageId || 'stage_lead_in';
    const value = input.value ?? 350;

    const opp: OpportunityData = {
      id,
      tenantId: input.tenantId,
      contactId: input.contactId,
      stageId,
      title: input.title,
      value,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    if (process.env.DATABASE_URL) {
      try {
        // Ensure Pipeline and PipelineStage exist in DB
        let pipeline = await prisma.pipeline.findFirst({ where: { tenantId: input.tenantId } });
        if (!pipeline) {
          pipeline = await prisma.pipeline.create({
            data: { tenantId: input.tenantId, name: 'Default Pipeline', isDefault: true },
          });
        }

        let stage = await prisma.pipelineStage.findFirst({ where: { pipelineId: pipeline.id, name: 'New Lead' } });
        if (!stage) {
          stage = await prisma.pipelineStage.create({
            data: { id: stageId, pipelineId: pipeline.id, name: 'New Lead', order: 1 },
          });
        }

        const created = await prisma.opportunity.create({
          data: {
            id,
            tenantId: input.tenantId,
            contactId: input.contactId,
            stageId: stage.id,
            title: input.title,
            value,
            status: 'OPEN',
          },
        });
        opp.id = created.id;
        opp.stageId = created.stageId;
      } catch (e) {
        console.warn('[DB_WARN] Prisma Opportunity create error:', (e as any).message);
      }
    }

    this.opportunities.set(opp.id, opp);
    return opp;
  }

  // Workflows & Speed-to-Lead Auto-Seeder
  public async getTenantWorkflows(tenantId: string): Promise<WorkflowData[]> {
    let list = Array.from(this.workflows.values()).filter((w) => w.tenantId === tenantId);

    // Auto-seed Speed-to-Lead workflow if not present
    if (list.length === 0) {
      const speedLeadWf = this.ensureSpeedToLeadWorkflow(tenantId);
      list = [speedLeadWf];
    }

    return list;
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

  public ensureSpeedToLeadWorkflow(tenantId: string): WorkflowData {
    const existing = Array.from(this.workflows.values()).find((w) => w.tenantId === tenantId && w.name.includes('Speed-to-Lead'));
    if (existing) return existing;

    const id = `wf_speed_lead_${tenantId}`;
    const versionId = `ver_1_${id}`;

    const speedLeadVersion: WorkflowVersionData = {
      id: versionId,
      workflowId: id,
      versionNumber: 1,
      status: 'PUBLISHED',
      triggerConfig: { eventType: 'FORM_SUBMITTED', filters: [] },
      nodesConfig: [
        { id: 'node_trig', type: 'trigger', name: 'Trigger: Quote Form Submitted', config: { eventType: 'FORM_SUBMITTED' }, position: { x: 250, y: 50 } },
        { id: 'node_opp', type: 'action', name: 'Create Opportunity', actionType: 'CREATE_OPPORTUNITY', config: { stageName: 'New Lead' }, position: { x: 250, y: 180 } },
        { id: 'node_sms', type: 'action', name: 'Send Instant SMS', actionType: 'SEND_SMS', config: { message: 'Hi {{contact.firstName}}, thanks for contacting {{business.name}}! We received your quote request and will get back to you shortly.' }, position: { x: 250, y: 310 } },
        { id: 'node_notify', type: 'action', name: 'Notify Business Owner', actionType: 'SEND_INTERNAL_NOTIFICATION', position: { x: 250, y: 440 } },
      ],
      edgesConfig: [
        { id: 'e1', source: 'node_trig', target: 'node_opp' },
        { id: 'e2', source: 'node_opp', target: 'node_sms' },
        { id: 'e3', source: 'node_sms', target: 'node_notify' },
      ],
      createdAt: new Date().toISOString(),
    };

    const workflow: WorkflowData = {
      id,
      tenantId,
      name: 'Speed-to-Lead Instant Response',
      description: 'Automatically creates an Opportunity in Pipeline, sends instant SMS, and alerts owner when a quote form is submitted.',
      status: 'ACTIVE',
      activeVersionId: versionId,
      runsCount: 0,
      versions: [speedLeadVersion],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  public ensureReviewRequestWorkflow(tenantId: string): WorkflowData {
    const existing = Array.from(this.workflows.values()).find((w) => w.tenantId === tenantId && w.name.includes('Review Request'));
    if (existing) return existing;

    const id = `wf_review_req_${tenantId}`;
    const versionId = `ver_1_${id}`;

    const reviewVersion: WorkflowVersionData = {
      id: versionId,
      workflowId: id,
      versionNumber: 1,
      status: 'PUBLISHED',
      triggerConfig: { eventType: 'JOB_COMPLETED', filters: [] },
      nodesConfig: [
        { id: 'node_trig', type: 'trigger', name: 'Trigger: Job Completed', config: { eventType: 'JOB_COMPLETED' }, position: { x: 250, y: 50 } },
        { id: 'node_review', type: 'action', name: 'Send Review Link SMS', actionType: 'SEND_REVIEW_REQUEST', config: { message: 'Hi {{contact.firstName}}, thanks for choosing {{business.name}}! How would you rate your service today? {{link}}' }, position: { x: 250, y: 180 } },
        { id: 'node_notify', type: 'action', name: 'Notify Owner: Job Completed', actionType: 'SEND_INTERNAL_NOTIFICATION', position: { x: 250, y: 310 } },
      ],
      edgesConfig: [
        { id: 'e1', source: 'node_trig', target: 'node_review' },
        { id: 'e2', source: 'node_review', target: 'node_notify' },
      ],
      createdAt: new Date().toISOString(),
    };

    const workflow: WorkflowData = {
      id,
      tenantId,
      name: 'Review Request & Customer Feedback',
      description: 'Triggered when a job is marked COMPLETED in pipeline. Sends review link and notifies owner.',
      status: 'ACTIVE',
      activeVersionId: versionId,
      runsCount: 0,
      versions: [reviewVersion],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  public async moveOpportunity(input: {
    tenantId: string;
    opportunityId: string;
    targetStageId: string;
    userId?: string;
  }): Promise<{
    success: boolean;
    opportunity?: OpportunityData;
    event?: PlatformEventData;
    executions?: WorkflowExecutionData[];
    error?: string;
  }> {
    const { tenantId, opportunityId, targetStageId, userId = 'user_client_admin' } = input;

    let opp: OpportunityData | undefined = undefined;

    if (process.env.DATABASE_URL) {
      try {
        const found = await prisma.opportunity.findUnique({
          where: { id: opportunityId },
          include: { contact: true },
        });

        if (found) {
          if (found.tenantId !== tenantId) {
            return { success: false, error: 'Unauthorized: Opportunity does not belong to specified tenant' };
          }

          const previousStageId = found.stageId;

          const updated = await prisma.opportunity.update({
            where: { id: opportunityId },
            data: {
              stageId: targetStageId,
              updatedAt: new Date(),
            },
            include: { contact: true },
          });

          opp = {
            id: updated.id,
            tenantId: updated.tenantId,
            contactId: updated.contactId,
            stageId: updated.stageId,
            title: updated.title,
            value: updated.value,
            status: updated.status as any,
            createdAt: updated.createdAt.toISOString(),
            contactName: updated.contact?.name,
          };

          await prisma.auditLog.create({
            data: {
              tenantId,
              userId,
              action: 'OPPORTUNITY_STAGE_CHANGED',
              details: JSON.stringify({
                opportunityId,
                contactId: updated.contactId,
                previousStage: previousStageId,
                newStage: targetStageId,
              }),
            },
          });
        }
      } catch (e) {
        console.warn('[DB_WARN] Prisma moveOpportunity fallback:', (e as any).message);
      }
    }

    if (!opp) {
      const existingInMemory = this.opportunities.get(opportunityId);
      if (!existingInMemory || existingInMemory.tenantId !== tenantId) {
        return { success: false, error: 'Opportunity not found or access denied' };
      }
      const previousStageId = existingInMemory.stageId;
      existingInMemory.stageId = targetStageId;
      opp = existingInMemory;

      this.auditLogs.unshift({
        id: `audit_opp_${Date.now()}`,
        tenantId,
        userId,
        action: 'OPPORTUNITY_STAGE_CHANGED',
        details: { opportunityId, contactId: opp.contactId, previousStage: previousStageId, newStage: targetStageId },
        timestamp: new Date().toISOString(),
      });
    }

    const { EventBus } = await import('./events/eventBus');

    // Emit OPPORTUNITY_STAGE_CHANGED
    const { event, executions } = await EventBus.publish({
      tenantId,
      eventType: 'OPPORTUNITY_STAGE_CHANGED',
      source: 'PIPELINE_UI',
      payload: {
        opportunityId: opp.id,
        contactId: opp.contactId,
        previousStageId: opp.stageId,
        newStageId: targetStageId,
        changedByUserId: userId,
        title: opp.title,
        value: opp.value,
      },
    });

    // Emit JOB_COMPLETED if moved to stage_completed
    if (targetStageId === 'stage_completed' || targetStageId === 'JOB_COMPLETED') {
      const jobCompletedRes = await EventBus.publish({
        tenantId,
        eventType: 'JOB_COMPLETED',
        source: 'PIPELINE_UI',
        payload: {
          opportunityId: opp.id,
          contactId: opp.contactId,
          changedByUserId: userId,
          title: opp.title,
          value: opp.value,
        },
      });
      executions.push(...jobCompletedRes.executions);
    }

    return { success: true, opportunity: opp, event, executions };
  }

  // Workflow Execution Persistence & Run Counts
  public async saveWorkflowExecution(execution: WorkflowExecutionData): Promise<void> {
    if (process.env.DATABASE_URL) {
      try {
        await prisma.workflowExecution.create({
          data: {
            id: execution.id,
            tenantId: execution.tenantId,
            workflowId: execution.workflowId,
            workflowVersionId: execution.workflowVersionId,
            eventId: execution.eventId,
            contactId: execution.contactId,
            status: execution.status,
            skippedReason: execution.skippedReason,
            startedAt: new Date(execution.startedAt),
            completedAt: execution.completedAt ? new Date(execution.completedAt) : undefined,
            steps: {
              create: execution.steps.map((s) => ({
                id: s.id,
                nodeId: s.nodeId,
                nodeType: s.nodeType,
                nodeName: s.nodeName,
                status: s.status,
                evaluatedCondition: s.evaluatedCondition,
                outputData: JSON.stringify(s.outputData || {}),
                executedAt: new Date(s.executedAt),
              })),
            },
          },
        });
      } catch (e) {
        console.warn('[DB_WARN] Prisma saveWorkflowExecution error:', (e as any).message);
      }
    }

    this.executions.unshift(execution);

    // Update run stats on workflow object
    const wf = this.workflows.get(execution.workflowId);
    if (wf) {
      wf.runsCount = (wf.runsCount || 0) + 1;
      wf.lastRunAt = new Date().toISOString();
    }
  }

  public async getTenantExecutions(tenantId: string): Promise<WorkflowExecutionData[]> {
    if (process.env.DATABASE_URL) {
      try {
        const list = await prisma.workflowExecution.findMany({
          where: { tenantId },
          include: { steps: true },
          orderBy: { startedAt: 'desc' },
        });

        if (list.length > 0) {
          return list.map((e) => ({
            id: e.id,
            tenantId: e.tenantId,
            workflowId: e.workflowId,
            workflowVersionId: e.workflowVersionId,
            eventId: e.eventId,
            contactId: e.contactId || undefined,
            status: e.status as any,
            skippedReason: e.skippedReason || undefined,
            startedAt: e.startedAt.toISOString(),
            completedAt: e.completedAt?.toISOString(),
            steps: e.steps.map((s) => ({
              id: s.id,
              nodeId: s.nodeId,
              nodeType: s.nodeType,
              nodeName: s.nodeName,
              status: s.status as any,
              evaluatedCondition: s.evaluatedCondition ?? undefined,
              outputData: JSON.parse(s.outputData || '{}'),
              executedAt: s.executedAt.toISOString(),
            })),
          }));
        }
      } catch (e) {
        console.warn('[DB_WARN] Prisma getTenantExecutions error:', (e as any).message);
      }
    }

    return this.executions.filter((e) => e.tenantId === tenantId);
  }

  public async getWorkflowExecutionCount(workflowId: string): Promise<number> {
    if (process.env.DATABASE_URL) {
      try {
        const count = await prisma.workflowExecution.count({
          where: { workflowId },
        });
        return count;
      } catch (e) {
        console.warn('[DB_WARN] Prisma execution count error:', (e as any).message);
      }
    }

    const wf = this.workflows.get(workflowId);
    if (wf && wf.runsCount !== undefined) return wf.runsCount;
    return this.executions.filter((e) => e.workflowId === workflowId).length;
  }
}

export const db = new MockDatabase();
