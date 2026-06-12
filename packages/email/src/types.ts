/**
 * @aether/email - Email system types
 * 
 * TypeScript types for email functionality including SMTP, API, templates,
 * tracking, newsletters, and analytics.
 * 
 * @version 1.0.0
 */

// =============================================================================
// EMAIL MESSAGE TYPES
// =============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

export interface EmailMessage {
  id?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// EMAIL PROVIDER TYPES
// =============================================================================

export type EmailProvider = 'smtp' | 'sendgrid' | 'ses' | 'mailgun' | 'postmark' | 'custom';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
}

export interface APIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface EmailProviderConfig {
  provider: EmailProvider;
  smtp?: SMTPConfig;
  api?: APIProviderConfig;
  defaultFrom?: EmailAddress;
}

// =============================================================================
// EMAIL TEMPLATE TYPES
// =============================================================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  text?: string;
  html: string;
  variables: TemplateVariable[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface TemplateRenderOptions {
  templateId: string;
  variables: Record<string, unknown>;
  locale?: string;
}

// =============================================================================
// EMAIL TRACKING TYPES
// =============================================================================

export interface EmailTrackingConfig {
  enabled: boolean;
  openTracking: boolean;
  clickTracking: boolean;
  unsubscribeTracking: boolean;
  customDomain?: string;
}

export interface EmailTrackingEvent {
  id: string;
  emailId: string;
  recipient: string;
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  timestamp: Date;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
}

export interface EmailTrackingStats {
  emailId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// =============================================================================
// NEWSLETTER TYPES
// =============================================================================

export interface Newsletter {
  id: string;
  name: string;
  description?: string;
  from: EmailAddress;
  templateId: string;
  listId: string;
  schedule?: NewsletterSchedule;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
}

export interface NewsletterSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  sendAt?: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
}

export interface NewsletterList {
  id: string;
  name: string;
  description?: string;
  subscribers: NewsletterSubscriber[];
  customFields?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'pending';
  customFields?: Record<string, unknown>;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface NewsletterCampaign {
  id: string;
  newsletterId: string;
  listId: string;
  subject: string;
  variables: Record<string, unknown>;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledFor?: Date;
  sentAt?: Date;
  stats?: NewsletterCampaignStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterCampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// =============================================================================
// EMAIL ANALYTICS TYPES
// =============================================================================

export interface EmailAnalytics {
  period: AnalyticsPeriod;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplained: number;
  totalUnsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
  byProvider: Record<string, ProviderAnalytics>;
  byTemplate: Record<string, TemplateAnalytics>;
  topDomains: DomainAnalytics[];
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
}

export interface ProviderAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface TemplateAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface DomainAnalytics {
  domain: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

// =============================================================================
// EMAIL ERROR TYPES
// =============================================================================

export class EmailError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'EmailError';
  }
}

export class EmailValidationError extends EmailError {
  constructor(message: string, public validationErrors: string[]) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'EmailValidationError';
  }
}

export class EmailProviderError extends EmailError {
  constructor(message: string, provider: string, originalError?: Error) {
    super(message, 'PROVIDER_ERROR', provider, originalError);
    this.name = 'EmailProviderError';
  }
}

export class EmailTemplateError extends EmailError {
  constructor(message: string, templateId?: string) {
    super(message, 'TEMPLATE_ERROR', undefined, undefined);
    this.name = 'EmailTemplateError';
  }
}
