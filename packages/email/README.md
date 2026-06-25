# @aether/email

Production-ready email system with SMTP, API, templates, tracking, newsletter management, and analytics.

## Features

- **Multiple Provider Support**: SMTP, SendGrid, SES, Mailgun, Postmark, and custom providers
- **Email Templates**: Create, manage, and render email templates with variable substitution
- **Email Tracking**: Track opens, clicks, bounces, complaints, and unsubscribes
- **Newsletter Management**: Create newsletters, manage subscriber lists, and send campaigns
- **Email Analytics**: Comprehensive analytics with delivery rates, open rates, click rates, and more
- **TypeScript Types**: Full TypeScript support with exported types
- **Zod Schemas**: Runtime validation with Zod schemas
- **Comprehensive Tests**: Full test coverage with Vitest

## Installation

```bash
npm install @aether/email
```

## Quick Start

### Basic Email Sending

```typescript
import { EmailClient } from '@aether/email';

const client = new EmailClient({
  provider: 'smtp',
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-username',
      pass: 'your-password',
    },
  },
  defaultFrom: {
    email: 'noreply@example.com',
    name: 'Your App',
  },
});

await client.send({
  from: { email: 'sender@example.com', name: 'Sender Name' },
  to: [{ email: 'recipient@example.com', name: 'Recipient Name' }],
  subject: 'Hello World',
  html: '<p>This is a test email.</p>',
  text: 'This is a test email.',
});
```

### Using API Providers

```typescript
import { EmailClient } from '@aether/email';

const client = new EmailClient({
  provider: 'sendgrid',
  api: {
    apiKey: 'your-sendgrid-api-key',
  },
});

await client.send({
  from: { email: 'sender@example.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Hello from SendGrid',
  html: '<p>Sent via SendGrid API</p>',
});
```

### Email Templates

```typescript
import { TemplateManager, EmailClient } from '@aether/email';

const templateManager = new TemplateManager();

// Create a template
const template = await templateManager.createTemplate({
  name: 'Welcome Email',
  subject: 'Welcome {{name}}!',
  html: '<p>Hello {{name}}, welcome to {{company}}!</p>',
  variables: [
    { name: 'name', type: 'string', required: true },
    { name: 'company', type: 'string', required: true },
  ],
});

// Render template
const rendered = templateManager.renderTemplate(template, {
  name: 'John Doe',
  company: 'Acme Inc',
});

console.log(rendered.subject); // "Welcome John Doe!"
console.log(rendered.html); // "<p>Hello John Doe, welcome to Acme Inc!</p>"
```

### Email Tracking

```typescript
import { EmailClient, TrackingManager } from '@aether/email';

const client = new EmailClient(
  {
    provider: 'smtp',
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: { user: 'user', pass: 'pass' },
    },
  },
  {
    enabled: true,
    openTracking: true,
    clickTracking: true,
    unsubscribeTracking: true,
    customDomain: 'https://track.yourdomain.com',
  }
);

const trackingManager = new TrackingManager();

// Record tracking events
await trackingManager.recordEvent({
  id: crypto.randomUUID(),
  emailId: 'email-id',
  recipient: 'user@example.com',
  eventType: 'opened',
  timestamp: new Date(),
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1',
});

// Get email statistics
const stats = await trackingManager.getStats('email-id');
console.log(stats.openRate); // 0.85 (85% open rate)
```

### Newsletter Management

```typescript
import { NewsletterManager, EmailClient } from '@aether/email';

const newsletterManager = new NewsletterManager();

// Create a subscriber list
const list = await newsletterManager.createList({
  name: 'Weekly Newsletter Subscribers',
  description: 'Subscribers to our weekly newsletter',
  subscribers: [],
});

// Add subscribers
await newsletterManager.addSubscriber(list.id, {
  email: 'user1@example.com',
  name: 'John Doe',
  status: 'active',
});

await newsletterManager.addSubscriber(list.id, {
  email: 'user2@example.com',
  name: 'Jane Smith',
  status: 'active',
});

// Create a newsletter
const newsletter = await newsletterManager.createNewsletter({
  name: 'Weekly Digest',
  description: 'Our weekly digest of news',
  from: { email: 'newsletter@example.com', name: 'Newsletter' },
  templateId: 'template-id',
  listId: list.id,
  status: 'draft',
});

// Create and send a campaign
const campaign = await newsletterManager.createCampaign({
  newsletterId: newsletter.id,
  listId: list.id,
  subject: 'Weekly Update - Week 42',
  variables: { week: 42 },
  status: 'draft',
});

const client = new EmailClient({
  provider: 'smtp',
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'user', pass: 'pass' },
  },
});

const stats = await newsletterManager.sendCampaign(campaign.id, client);
console.log(`Sent to ${stats.totalRecipients} recipients`);
console.log(`Delivery rate: ${(stats.deliveryRate * 100).toFixed(2)}%`);
```

### Email Analytics

```typescript
import { AnalyticsManager, TrackingManager } from '@aether/email';

const trackingManager = new TrackingManager();
const analyticsManager = new AnalyticsManager(trackingManager);

const analytics = await analyticsManager.getAnalytics({
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31'),
});

console.log(`Total sent: ${analytics.totalSent}`);
console.log(`Delivery rate: ${(analytics.deliveryRate * 100).toFixed(2)}%`);
console.log(`Open rate: ${(analytics.openRate * 100).toFixed(2)}%`);
console.log(`Click rate: ${(analytics.clickRate * 100).toFixed(2)}%`);
console.log(`Bounce rate: ${(analytics.bounceRate * 100).toFixed(2)}%`);
```

### Schema Validation

```typescript
import {
  validateEmailMessage,
  validateEmailProviderConfig,
  validateEmailTemplate,
  safeValidateEmailMessage,
} from '@aether/email';

// Validate email message
const message = validateEmailMessage({
  from: { email: 'sender@example.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Test',
  html: '<p>Test</p>',
});

// Safe validation (returns result instead of throwing)
const result = safeValidateEmailMessage(data);
if (result.success) {
  console.log('Valid message:', result.data);
} else {
  console.log('Validation errors:', result.error.errors);
}
```

## API Reference

### EmailClient

Main class for sending emails.

#### Constructor

```typescript
constructor(config: EmailProviderConfig, trackingConfig?: EmailTrackingConfig)
```

#### Methods

- `send(message: EmailMessage): Promise<string>` - Send a single email
- `sendBatch(messages: EmailMessage[]): Promise<string[]>` - Send multiple emails
- `sendTemplate(options: TemplateRenderOptions, to: EmailAddress[]): Promise<string>` - Send email using template

### TemplateManager

Manage email templates.

#### Methods

- `createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate>`
- `getTemplate(id: string): Promise<EmailTemplate | null>`
- `updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null>`
- `deleteTemplate(id: string): Promise<boolean>`
- `listTemplates(): Promise<EmailTemplate[]>`
- `renderTemplate(template: EmailTemplate, variables: Record<string, unknown>): RenderedTemplate`

### TrackingManager

Track email events and statistics.

#### Methods

- `recordEvent(event: EmailTrackingEvent): Promise<void>`
- `getEvents(emailId: string): Promise<EmailTrackingEvent[]>`
- `getStats(emailId: string): Promise<EmailTrackingStats>`
- `getEventsByType(eventType: EmailTrackingEvent['eventType']): Promise<EmailTrackingEvent[]>`

### NewsletterManager

Manage newsletters and campaigns.

#### Methods

- `createNewsletter(newsletter: Omit<Newsletter, 'id' | 'createdAt' | 'updatedAt'>): Promise<Newsletter>`
- `getNewsletter(id: string): Promise<Newsletter | null>`
- `updateNewsletter(id: string, updates: Partial<Newsletter>): Promise<Newsletter | null>`
- `deleteNewsletter(id: string): Promise<boolean>`
- `listNewsletters(): Promise<Newsletter[]>`
- `createList(list: Omit<NewsletterList, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsletterList>`
- `getList(id: string): Promise<NewsletterList | null>`
- `addSubscriber(listId: string, subscriber: Omit<NewsletterSubscriber, 'id' | 'subscribedAt'>): Promise<NewsletterSubscriber>`
- `removeSubscriber(listId: string, subscriberId: string): Promise<boolean>`
- `unsubscribeSubscriber(listId: string, subscriberId: string): Promise<boolean>`
- `createCampaign(campaign: Omit<NewsletterCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsletterCampaign>`
- `getCampaign(id: string): Promise<NewsletterCampaign | null>`
- `sendCampaign(campaignId: string, emailClient: EmailClient): Promise<NewsletterCampaignStats>`

### AnalyticsManager

Generate email analytics reports.

#### Methods

- `getAnalytics(period: AnalyticsPeriod): Promise<EmailAnalytics>`

## Types

### EmailMessage

```typescript
interface EmailMessage {
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
```

### EmailProviderConfig

```typescript
interface EmailProviderConfig {
  provider: EmailProvider;
  smtp?: SMTPConfig;
  api?: APIProviderConfig;
  defaultFrom?: EmailAddress;
}
```

### EmailTemplate

```typescript
interface EmailTemplate {
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
```

## Error Handling

The package provides custom error classes:

- `EmailError` - Base error class
- `EmailValidationError` - Validation errors with details
- `EmailProviderError` - Provider-specific errors
- `EmailTemplateError` - Template-related errors

```typescript
import { EmailClient, EmailProviderError } from '@aether/email';

try {
  await client.send(message);
} catch (error) {
  if (error instanceof EmailProviderError) {
    console.error(`Provider error: ${error.message}`);
    console.error(`Provider: ${error.provider}`);
  }
}
```

## Testing

```bash
npm run test
```

## License

MIT
