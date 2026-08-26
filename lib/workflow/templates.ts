import { db, WorkflowData, WorkflowVersionData, WorkflowNodeData, WorkflowEdgeData } from '../db';

export interface WorkflowTemplateDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  eventType: string;
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplateDefinition[] = [
  {
    id: 'template_speed_to_lead',
    name: 'Speed-to-Lead Follow Up',
    category: 'Forms',
    description: 'Instant SMS response and owner alert when a quote form is submitted.',
    eventType: 'FORM_SUBMITTED',
    nodes: [
      { id: 'n_trig', type: 'trigger', name: 'Quote Form Submitted', config: { eventType: 'FORM_SUBMITTED' }, position: { x: 250, y: 50 } },
      { id: 'n_contact', type: 'action', name: 'Create Contact', actionType: 'CREATE_LEAD', position: { x: 250, y: 150 } },
      { id: 'n_opp', type: 'action', name: 'Create Opportunity', actionType: 'MOVE_KANBAN_CARD', config: { stageName: 'New Lead' }, position: { x: 250, y: 250 } },
      { id: 'n_sms', type: 'action', name: 'Send Instant SMS to Customer', actionType: 'SEND_SMS', config: { message: "Hi {{contact.firstName}}, thanks for requesting a quote from {{business.name}}! When would you like us to come by?" }, position: { x: 250, y: 350 } },
      { id: 'n_notify', type: 'action', name: 'Notify Business Owner', actionType: 'SEND_INTERNAL_NOTIFICATION', position: { x: 250, y: 450 } },
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_contact' },
      { id: 'e2', source: 'n_contact', target: 'n_opp' },
      { id: 'e3', source: 'n_opp', target: 'n_sms' },
      { id: 'e4', source: 'n_sms', target: 'n_notify' },
    ],
  },
  {
    id: 'template_quote_followup',
    name: 'Quote / Estimate Follow-Up',
    category: 'Estimates & Payments',
    description: 'Waits 48 hours after estimate is sent. Cancels early if estimate is accepted or customer replies.',
    eventType: 'ESTIMATE_SENT',
    nodes: [
      { id: 'n_trig', type: 'trigger', name: 'Estimate Sent', config: { eventType: 'ESTIMATE_SENT' }, position: { x: 250, y: 50 } },
      { id: 'n_wait_48', type: 'wait', name: 'Wait 48 Hours', config: { delayMinutes: 2880, cancellationConditions: ['ESTIMATE_ACCEPTED', 'CUSTOMER_REPLIED'] }, position: { x: 250, y: 160 } },
      { id: 'n_cond', type: 'condition', name: 'Estimate Accepted Yet?', config: { field: 'status', operator: 'equals', value: 'accepted' }, position: { x: 250, y: 270 } },
      { id: 'n_end_accepted', type: 'action', name: 'End (Already Accepted)', actionType: 'STOP_WORKFLOW', position: { x: 100, y: 390 } },
      { id: 'n_sms_remind', type: 'action', name: 'Send Follow-Up SMS', actionType: 'SEND_SMS', config: { message: "Hi {{contact.firstName}}, just checking in on the estimate for {{business.name}}. Let us know if you have any questions!" }, position: { x: 400, y: 390 } },
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_wait_48' },
      { id: 'e2', source: 'n_wait_48', target: 'n_cond' },
      { id: 'e3', source: 'n_cond', target: 'n_end_accepted', label: 'YES', conditionValue: true },
      { id: 'e4', source: 'n_cond', target: 'n_sms_remind', label: 'NO', conditionValue: false },
    ],
  },
  {
    id: 'template_review_request',
    name: 'Review Request & Branching',
    category: 'Reviews',
    description: 'Requests rating after job completion. Directs 4-5 stars to Google Reviews, 1-3 stars privately to owner.',
    eventType: 'RATING_RECEIVED',
    nodes: [
      { id: 'n_trig', type: 'trigger', name: 'Customer Rating Received', config: { eventType: 'RATING_RECEIVED' }, position: { x: 250, y: 50 } },
      { id: 'n_cond', type: 'condition', name: 'Score >= 4 Stars?', config: { field: 'rating', operator: 'greater_than', value: 3 }, position: { x: 250, y: 160 } },
      { id: 'n_google', type: 'action', name: 'Send Google Review Link SMS', actionType: 'SEND_REVIEW_REQUEST', config: { link: 'https://g.page/r/tyrees-auto/review', message: "Thanks for rating us! Would you mind posting a quick review on Google? {{link}}" }, position: { x: 100, y: 280 } },
      { id: 'n_private', type: 'action', name: 'Send Private Alert to Owner', actionType: 'SEND_INTERNAL_NOTIFICATION', position: { x: 400, y: 280 } },
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_cond' },
      { id: 'e2', source: 'n_cond', target: 'n_google', label: 'YES (4-5★)', conditionValue: true },
      { id: 'e3', source: 'n_cond', target: 'n_private', label: 'NO (1-3★)', conditionValue: false },
    ],
  },
  {
    id: 'template_missed_call',
    name: 'Missed-Call Text Back',
    category: 'Communications',
    description: 'Automatically texts missed callers immediately so you never lose a hot lead.',
    eventType: 'MISSED_CALL',
    nodes: [
      { id: 'n_trig', type: 'trigger', name: 'Incoming Call Missed', config: { eventType: 'MISSED_CALL' }, position: { x: 250, y: 50 } },
      { id: 'n_sms', type: 'action', name: 'Send Missed Call Text', actionType: 'SEND_SMS', config: { message: "Sorry we missed your call from {{business.name}}! How can we help you today?" }, position: { x: 250, y: 160 } },
    ],
    edges: [{ id: 'e1', source: 'n_trig', target: 'n_sms' }],
  },
  {
    id: 'template_appointment_confirm',
    name: 'Appointment Confirmation & Reminder',
    category: 'Appointments',
    description: 'Instantly confirms appointment booking and updates pipeline.',
    eventType: 'APPOINTMENT_BOOKED',
    nodes: [
      { id: 'n_trig', type: 'trigger', name: 'Appointment Booked', config: { eventType: 'APPOINTMENT_BOOKED' }, position: { x: 250, y: 50 } },
      { id: 'n_sms', type: 'action', name: 'Send Booking Confirmation SMS', actionType: 'SEND_SMS', config: { message: "Your detail appointment with {{business.name}} is confirmed for {{appointment.date}} at {{appointment.time}}!" }, position: { x: 250, y: 160 } },
      { id: 'n_stage', type: 'action', name: 'Move Kanban Card to Booked', actionType: 'MOVE_KANBAN_CARD', config: { stageName: 'Appointment Booked' }, position: { x: 250, y: 270 } },
    ],
    edges: [
      { id: 'e1', source: 'n_trig', target: 'n_sms' },
      { id: 'e2', source: 'n_sms', target: 'n_stage' },
    ],
  },
  {
    id: 'template_noshow_recovery',
    name: 'No-Show Recovery',
    category: 'Appointments',
    description: 'Triggers when appointment is marked no-show to offer simple rebooking.',
    eventType: 'APPOINTMENT_NOSHOW',
    nodes: [
      { id: 'n_trig', type: 'trigger', name: 'Appointment Marked No-Show', config: { eventType: 'APPOINTMENT_NOSHOW' }, position: { x: 250, y: 50 } },
      { id: 'n_sms', type: 'action', name: 'Send Rebooking SMS', actionType: 'SEND_SMS', config: { message: "We missed you today at {{business.name}}! Reply back or click here to pick a new time." }, position: { x: 250, y: 160 } },
    ],
    edges: [{ id: 'e1', source: 'n_trig', target: 'n_sms' }],
  },
  {
    id: 'template_invoice_overdue',
    name: 'Overdue Invoice Reminder',
    category: 'Estimates & Payments',
    description: 'Sends SMS reminder when an invoice becomes overdue.',
    eventType: 'INVOICE_OVERDUE',
    nodes: [
      { id: 'n_trig', type: 'trigger', name: 'Invoice Marked Overdue', config: { eventType: 'INVOICE_OVERDUE' }, position: { x: 250, y: 50 } },
      { id: 'n_sms', type: 'action', name: 'Send Overdue Reminder SMS', actionType: 'SEND_SMS', config: { message: "Hi {{contact.firstName}}, your invoice from {{business.name}} is overdue. Please click here to complete payment." }, position: { x: 250, y: 160 } },
    ],
    edges: [{ id: 'e1', source: 'n_trig', target: 'n_sms' }],
  },
  {
    id: 'template_reengagement',
    name: 'Old Customer Re-Engagement',
    category: 'Time',
    description: 'Reaches out to past customers who haven\'t booked service in 6 months.',
    eventType: 'CUSTOMER_INACTIVE',
    nodes: [
      { id: 'n_trig', type: 'trigger', name: 'Customer Inactive for 6 Months', config: { eventType: 'CUSTOMER_INACTIVE' }, position: { x: 250, y: 50 } },
      { id: 'n_sms', type: 'action', name: 'Send Re-activation Offer SMS', actionType: 'SEND_SMS', config: { message: "Hi {{contact.firstName}}, it's been a while! Book your next detail with {{business.name}} this week and save 15%." }, position: { x: 250, y: 160 } },
    ],
    edges: [{ id: 'e1', source: 'n_trig', target: 'n_sms' }],
  },
];

export function initializeTenantWorkflows(tenantId: string) {
  for (const tmpl of WORKFLOW_TEMPLATES) {
    const workflowId = `wf_${tmpl.id}_${tenantId}`;
    const versionId = `ver_1_${workflowId}`;

    const version: WorkflowVersionData = {
      id: versionId,
      workflowId,
      versionNumber: 1,
      status: 'PUBLISHED',
      triggerConfig: {
        eventType: tmpl.eventType,
        filters: [],
      },
      nodesConfig: tmpl.nodes,
      edgesConfig: tmpl.edges,
      createdAt: new Date().toISOString(),
    };

    const workflow: WorkflowData = {
      id: workflowId,
      tenantId,
      name: tmpl.name,
      description: tmpl.description,
      status: tmpl.id === 'template_speed_to_lead' || tmpl.id === 'template_review_request' ? 'ACTIVE' : 'DRAFT',
      activeVersionId: versionId,
      runsCount: tmpl.id === 'template_speed_to_lead' ? 42 : tmpl.id === 'template_review_request' ? 18 : 0,
      lastRunAt: tmpl.id === 'template_speed_to_lead' ? new Date(Date.now() - 1000 * 60 * 15).toISOString() : undefined,
      versions: [version],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.workflows.set(workflow.id, workflow);
  }
}

// Auto-initialize seed workflows
initializeTenantWorkflows('tenant_tyrees_auto');
