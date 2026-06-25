/**
 * @aether/email - Email system
 * 
 * Production-ready email system with SMTP, API, templates, tracking,
 * newsletter management, and analytics.
 * 
 * @version 1.0.0
 * 
 * @example
 * ```ts
 * import { EmailClient, TemplateManager, NewsletterManager } from '@aether/email';
 * 
 * const client = new EmailClient({
 *   provider: 'smtp',
 *   smtp: {
 *     host: 'smtp.example.com',
 *     port: 587,
 *     secure: false,
 *     auth: { user: 'user', pass: 'pass' }
 *   }
 * });
 * 
 * await client.send({
 *   from: { email: 'noreply@example.com' },
 *   to: [{ email: 'user@example.com' }],
 *   subject: 'Hello',
 *   html: '<p>Hello World</p>'
 * });
 * ```
 */

// Types
export type {
  EmailAddress,
  EmailAttachment,
  EmailMessage,
  EmailProvider,
  SMTPConfig,
  APIProviderConfig,
  EmailProviderConfig,
  EmailTemplate,
  TemplateVariable,
  TemplateRenderOptions,
  EmailTrackingConfig,
  EmailTrackingEvent,
  EmailTrackingStats,
  Newsletter,
  NewsletterSchedule,
  NewsletterList,
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterCampaignStats,
  EmailAnalytics,
  AnalyticsPeriod,
  ProviderAnalytics,
  TemplateAnalytics,
  DomainAnalytics,
} from './types.js';

export {
  EmailError,
  EmailValidationError,
  EmailProviderError,
  EmailTemplateError,
} from './types.js';

// Schemas
export type {
  EmailAddress as EmailAddressSchemaType,
  EmailAttachment as EmailAttachmentSchemaType,
  EmailMessage as EmailMessageSchemaType,
  EmailProvider as EmailProviderSchemaType,
  SMTPConfig as SMTPConfigSchemaType,
  APIProviderConfig as APIProviderConfigSchemaType,
  EmailProviderConfig as EmailProviderConfigSchemaType,
  TemplateVariable as TemplateVariableSchemaType,
  EmailTemplate as EmailTemplateSchemaType,
  TemplateRenderOptions as TemplateRenderOptionsSchemaType,
  EmailTrackingConfig as EmailTrackingConfigSchemaType,
  EmailTrackingEvent as EmailTrackingEventSchemaType,
  EmailTrackingStats as EmailTrackingStatsSchemaType,
  NewsletterSchedule as NewsletterScheduleSchemaType,
  Newsletter as NewsletterSchemaType,
  NewsletterSubscriber as NewsletterSubscriberSchemaType,
  NewsletterList as NewsletterListSchemaType,
  NewsletterCampaignStats as NewsletterCampaignStatsSchemaType,
  NewsletterCampaign as NewsletterCampaignSchemaType,
  AnalyticsPeriod as AnalyticsPeriodSchemaType,
  ProviderAnalytics as ProviderAnalyticsSchemaType,
  TemplateAnalytics as TemplateAnalyticsSchemaType,
  DomainAnalytics as DomainAnalyticsSchemaType,
  EmailAnalytics as EmailAnalyticsSchemaType,
} from './schemas.js';

export {
  EmailAddressSchema,
  EmailAttachmentSchema,
  EmailMessageSchema,
  EmailProviderSchema,
  SMTPConfigSchema,
  APIProviderConfigSchema,
  EmailProviderConfigSchema,
  TemplateVariableSchema,
  EmailTemplateSchema,
  TemplateRenderOptionsSchema,
  EmailTrackingConfigSchema,
  EmailTrackingEventSchema,
  EmailTrackingStatsSchema,
  NewsletterScheduleSchema,
  NewsletterSchema,
  NewsletterSubscriberSchema,
  NewsletterListSchema,
  NewsletterCampaignStatsSchema,
  NewsletterCampaignSchema,
  AnalyticsPeriodSchema,
  ProviderAnalyticsSchema,
  TemplateAnalyticsSchema,
  DomainAnalyticsSchema,
  EmailAnalyticsSchema,
  validateEmailMessage,
  safeValidateEmailMessage,
  validateEmailProviderConfig,
  validateEmailTemplate,
  validateNewsletter,
  validateNewsletterCampaign,
  validateEmailAnalytics,
} from './schemas.js';

// Core Classes
export {
  EmailClient,
  TemplateManager,
  TrackingManager,
  NewsletterManager,
  AnalyticsManager,
} from './email.js';
