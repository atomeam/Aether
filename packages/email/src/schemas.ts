/**
 * @aether/email - Email system Zod schemas
 * 
 * Zod validation schemas for email functionality including SMTP, API, templates,
 * tracking, newsletters, and analytics.
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// EMAIL MESSAGE SCHEMAS
// =============================================================================

export const EmailAddressSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
});

export type EmailAddress = z.infer<typeof EmailAddressSchema>;

export const EmailAttachmentSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  content: z.union([z.string(), z.instanceof(Buffer)]),
  contentType: z.string().optional(),
  encoding: z.string().optional(),
});

export type EmailAttachment = z.infer<typeof EmailAttachmentSchema>;

export const EmailMessageSchema = z.object({
  id: z.string().uuid().optional(),
  from: EmailAddressSchema,
  to: z.array(EmailAddressSchema).min(1, 'At least one recipient is required'),
  cc: z.array(EmailAddressSchema).optional(),
  bcc: z.array(EmailAddressSchema).optional(),
  subject: z.string().min(1, 'Subject is required').max(998, 'Subject too long'),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(EmailAttachmentSchema).optional(),
  headers: z.record(z.string()).optional(),
  tags: z.record(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.text || data.html,
  'Either text or html content is required'
);

export type EmailMessage = z.infer<typeof EmailMessageSchema>;

// =============================================================================
// EMAIL PROVIDER SCHEMAS
// =============================================================================

export const EmailProviderSchema = z.enum(['smtp', 'sendgrid', 'ses', 'mailgun', 'postmark', 'custom']);

export type EmailProvider = z.infer<typeof EmailProviderSchema>;

export const SMTPConfigSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  auth: z.object({
    user: z.string().min(1, 'SMTP username is required'),
    pass: z.string().min(1, 'SMTP password is required'),
  }),
  pool: z.boolean().optional(),
  maxConnections: z.number().int().min(1).optional(),
  maxMessages: z.number().int().min(1).optional(),
});

export type SMTPConfig = z.infer<typeof SMTPConfigSchema>;

export const APIProviderConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().url().optional(),
  timeout: z.number().int().min(1).optional(),
});

export type APIProviderConfig = z.infer<typeof APIProviderConfigSchema>;

export const EmailProviderConfigSchema = z.object({
  provider: EmailProviderSchema,
  smtp: SMTPConfigSchema.optional(),
  api: APIProviderConfigSchema.optional(),
  defaultFrom: EmailAddressSchema.optional(),
}).refine(
  (data) => {
    if (data.provider === 'smtp' && !data.smtp) {
      return false;
    }
    if (data.provider !== 'smtp' && !data.api) {
      return false;
    }
    return true;
  },
  'Provider configuration is invalid for the selected provider type'
);

export type EmailProviderConfig = z.infer<typeof EmailProviderConfigSchema>;

// =============================================================================
// EMAIL TEMPLATE SCHEMAS
// =============================================================================

export const TemplateVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required'),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  description: z.string().optional(),
});

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;

export const EmailTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Template subject is required'),
  text: z.string().optional(),
  html: z.string().min(1, 'Template HTML is required'),
  variables: z.array(TemplateVariableSchema),
  category: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

export const TemplateRenderOptionsSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.record(z.unknown()),
  locale: z.string().optional(),
});

export type TemplateRenderOptions = z.infer<typeof TemplateRenderOptionsSchema>;

// =============================================================================
// EMAIL TRACKING SCHEMAS
// =============================================================================

export const EmailTrackingConfigSchema = z.object({
  enabled: z.boolean(),
  openTracking: z.boolean(),
  clickTracking: z.boolean(),
  unsubscribeTracking: z.boolean(),
  customDomain: z.string().optional(),
});

export type EmailTrackingConfig = z.infer<typeof EmailTrackingConfigSchema>;

export const EmailTrackingEventSchema = z.object({
  id: z.string().uuid(),
  emailId: z.string().uuid(),
  recipient: z.string().email(),
  eventType: z.enum(['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed']),
  timestamp: z.coerce.date(),
  metadata: z.record(z.unknown()).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  url: z.string().optional(),
});

export type EmailTrackingEvent = z.infer<typeof EmailTrackingEventSchema>;

export const EmailTrackingStatsSchema = z.object({
  emailId: z.string().uuid(),
  sent: z.number().int().min(0),
  delivered: z.number().int().min(0),
  opened: z.number().int().min(0),
  clicked: z.number().int().min(0),
  bounced: z.number().int().min(0),
  complained: z.number().int().min(0),
  unsubscribed: z.number().int().min(0),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
});

export type EmailTrackingStats = z.infer<typeof EmailTrackingStatsSchema>;

// =============================================================================
// NEWSLETTER SCHEMAS
// =============================================================================

export const NewsletterScheduleSchema = z.object({
  type: z.enum(['immediate', 'scheduled', 'recurring']),
  sendAt: z.coerce.date().optional(),
  recurring: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  }).optional(),
}).refine(
  (data) => {
    if (data.type === 'scheduled' && !data.sendAt) {
      return false;
    }
    if (data.type === 'recurring' && !data.recurring) {
      return false;
    }
    return true;
  },
  'Schedule configuration is invalid for the selected schedule type'
);

export type NewsletterSchedule = z.infer<typeof NewsletterScheduleSchema>;

export const NewsletterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Newsletter name is required'),
  description: z.string().optional(),
  from: EmailAddressSchema,
  templateId: z.string().uuid(),
  listId: z.string().uuid(),
  schedule: NewsletterScheduleSchema.optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'paused']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sentAt: z.coerce.date().optional(),
});

export type Newsletter = z.infer<typeof NewsletterSchema>;

export const NewsletterSubscriberSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  status: z.enum(['active', 'unsubscribed', 'bounced', 'pending']),
  customFields: z.record(z.unknown()).optional(),
  subscribedAt: z.coerce.date(),
  unsubscribedAt: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type NewsletterSubscriber = z.infer<typeof NewsletterSubscriberSchema>;

export const NewsletterListSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'List name is required'),
  description: z.string().optional(),
  subscribers: z.array(NewsletterSubscriberSchema),
  customFields: z.record(z.string()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type NewsletterList = z.infer<typeof NewsletterListSchema>;

export const NewsletterCampaignStatsSchema = z.object({
  totalRecipients: z.number().int().min(0),
  sent: z.number().int().min(0),
  delivered: z.number().int().min(0),
  opened: z.number().int().min(0),
  clicked: z.number().int().min(0),
  bounced: z.number().int().min(0),
  unsubscribed: z.number().int().min(0),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
});

export type NewsletterCampaignStats = z.infer<typeof NewsletterCampaignStatsSchema>;

export const NewsletterCampaignSchema = z.object({
  id: z.string().uuid(),
  newsletterId: z.string().uuid(),
  listId: z.string().uuid(),
  subject: z.string().min(1, 'Campaign subject is required'),
  variables: z.record(z.unknown()),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed']),
  scheduledFor: z.coerce.date().optional(),
  sentAt: z.coerce.date().optional(),
  stats: NewsletterCampaignStatsSchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type NewsletterCampaign = z.infer<typeof NewsletterCampaignSchema>;

// =============================================================================
// EMAIL ANALYTICS SCHEMAS
// =============================================================================

export const AnalyticsPeriodSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
}).refine(
  (data) => data.end >= data.start,
  'End date must be after start date'
);

export type AnalyticsPeriod = z.infer<typeof AnalyticsPeriodSchema>;

export const ProviderAnalyticsSchema = z.object({
  sent: z.number().int().min(0),
  delivered: z.number().int().min(0),
  opened: z.number().int().min(0),
  clicked: z.number().int().min(0),
  bounced: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(1),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
});

export type ProviderAnalytics = z.infer<typeof ProviderAnalyticsSchema>;

export const TemplateAnalyticsSchema = z.object({
  sent: z.number().int().min(0),
  delivered: z.number().int().min(0),
  opened: z.number().int().min(0),
  clicked: z.number().int().min(0),
  bounced: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(1),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
});

export type TemplateAnalytics = z.infer<typeof TemplateAnalyticsSchema>;

export const DomainAnalyticsSchema = z.object({
  domain: z.string().min(1),
  sent: z.number().int().min(0),
  delivered: z.number().int().min(0),
  opened: z.number().int().min(0),
  clicked: z.number().int().min(0),
  bounced: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(1),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
});

export type DomainAnalytics = z.infer<typeof DomainAnalyticsSchema>;

export const EmailAnalyticsSchema = z.object({
  period: AnalyticsPeriodSchema,
  totalSent: z.number().int().min(0),
  totalDelivered: z.number().int().min(0),
  totalOpened: z.number().int().min(0),
  totalClicked: z.number().int().min(0),
  totalBounced: z.number().int().min(0),
  totalComplained: z.number().int().min(0),
  totalUnsubscribed: z.number().int().min(0),
  deliveryRate: z.number().min(0).max(1),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
  complaintRate: z.number().min(0).max(1),
  unsubscribeRate: z.number().min(0).max(1),
  byProvider: z.record(ProviderAnalyticsSchema),
  byTemplate: z.record(TemplateAnalyticsSchema),
  topDomains: z.array(DomainAnalyticsSchema),
});

export type EmailAnalytics = z.infer<typeof EmailAnalyticsSchema>;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate an email message
 */
export function validateEmailMessage(data: unknown): EmailMessage {
  return EmailMessageSchema.parse(data);
}

/**
 * Safely validate an email message
 */
export function safeValidateEmailMessage(data: unknown): z.SafeParseReturnType<EmailMessage, EmailMessage> {
  return EmailMessageSchema.safeParse(data);
}

/**
 * Validate email provider configuration
 */
export function validateEmailProviderConfig(data: unknown): EmailProviderConfig {
  return EmailProviderConfigSchema.parse(data);
}

/**
 * Validate email template
 */
export function validateEmailTemplate(data: unknown): EmailTemplate {
  return EmailTemplateSchema.parse(data);
}

/**
 * Validate newsletter
 */
export function validateNewsletter(data: unknown): Newsletter {
  return NewsletterSchema.parse(data);
}

/**
 * Validate newsletter campaign
 */
export function validateNewsletterCampaign(data: unknown): NewsletterCampaign {
  return NewsletterCampaignSchema.parse(data);
}

/**
 * Validate email analytics
 */
export function validateEmailAnalytics(data: unknown): EmailAnalytics {
  return EmailAnalyticsSchema.parse(data);
}
