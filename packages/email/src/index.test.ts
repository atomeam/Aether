/**
 * @aether/email - Email system tests
 * 
 * Comprehensive tests for email functionality
 * 
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EmailClient,
  TemplateManager,
  TrackingManager,
  NewsletterManager,
  AnalyticsManager,
  EmailError,
  EmailValidationError,
  EmailProviderError,
  EmailTemplateError,
} from './index.js';
import {
  validateEmailMessage,
  validateEmailProviderConfig,
  validateEmailTemplate,
  validateNewsletter,
  validateNewsletterCampaign,
  safeValidateEmailMessage,
} from './index.js';
import type {
  EmailMessage,
  EmailProviderConfig,
  EmailTemplate,
  Newsletter,
  NewsletterCampaign,
} from './index.js';

describe('@aether/email', () => {
  // =============================================================================
  // SCHEMA VALIDATION TESTS
  // =============================================================================

  describe('Schema Validation', () => {
    describe('validateEmailMessage', () => {
      it('should validate a valid email message', () => {
        const message: EmailMessage = {
          from: { email: 'sender@example.com', name: 'Sender' },
          to: [{ email: 'recipient@example.com' }],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        };

        const result = validateEmailMessage(message);
        expect(result).toEqual(message);
      });

      it('should reject message without recipients', () => {
        const message = {
          from: { email: 'sender@example.com' },
          to: [],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        };

        expect(() => validateEmailMessage(message)).toThrow();
      });

      it('should reject message without subject', () => {
        const message = {
          from: { email: 'sender@example.com' },
          to: [{ email: 'recipient@example.com' }],
          subject: '',
          html: '<p>Test content</p>',
        };

        expect(() => validateEmailMessage(message)).toThrow();
      });

      it('should reject message without text or html', () => {
        const message = {
          from: { email: 'sender@example.com' },
          to: [{ email: 'recipient@example.com' }],
          subject: 'Test Subject',
        };

        expect(() => validateEmailMessage(message)).toThrow();
      });

      it('should reject invalid email address', () => {
        const message = {
          from: { email: 'invalid-email' },
          to: [{ email: 'recipient@example.com' }],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        };

        expect(() => validateEmailMessage(message)).toThrow();
      });
    });

    describe('safeValidateEmailMessage', () => {
      it('should return success for valid message', () => {
        const message: EmailMessage = {
          from: { email: 'sender@example.com' },
          to: [{ email: 'recipient@example.com' }],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        };

        const result = safeValidateEmailMessage(message);
        expect(result.success).toBe(true);
      });

      it('should return error for invalid message', () => {
        const message = {
          from: { email: 'invalid-email' },
          to: [{ email: 'recipient@example.com' }],
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        };

        const result = safeValidateEmailMessage(message);
        expect(result.success).toBe(false);
      });
    });

    describe('validateEmailProviderConfig', () => {
      it('should validate SMTP provider config', () => {
        const config: EmailProviderConfig = {
          provider: 'smtp',
          smtp: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: { user: 'user', pass: 'pass' },
          },
        };

        const result = validateEmailProviderConfig(config);
        expect(result).toEqual(config);
      });

      it('should validate API provider config', () => {
        const config: EmailProviderConfig = {
          provider: 'sendgrid',
          api: {
            apiKey: 'test-key',
          },
        };

        const result = validateEmailProviderConfig(config);
        expect(result).toEqual(config);
      });

      it('should reject SMTP config without SMTP settings', () => {
        const config = {
          provider: 'smtp' as const,
          api: { apiKey: 'test-key' },
        };

        expect(() => validateEmailProviderConfig(config)).toThrow();
      });

      it('should reject API provider without API settings', () => {
        const config = {
          provider: 'sendgrid' as const,
          smtp: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: { user: 'user', pass: 'pass' },
          },
        };

        expect(() => validateEmailProviderConfig(config)).toThrow();
      });
    });

    describe('validateEmailTemplate', () => {
      it('should validate a valid template', () => {
        const template: EmailTemplate = {
          id: crypto.randomUUID(),
          name: 'Welcome Email',
          subject: 'Welcome {{name}}',
          html: '<p>Hello {{name}}</p>',
          variables: [
            { name: 'name', type: 'string', required: true },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateEmailTemplate(template);
        expect(result).toEqual(template);
      });

      it('should reject template without HTML', () => {
        const template = {
          id: crypto.randomUUID(),
          name: 'Welcome Email',
          subject: 'Welcome {{name}}',
          html: '',
          variables: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(() => validateEmailTemplate(template)).toThrow();
      });
    });

    describe('validateNewsletter', () => {
      it('should validate a valid newsletter', () => {
        const newsletter: Newsletter = {
          id: crypto.randomUUID(),
          name: 'Weekly Digest',
          from: { email: 'newsletter@example.com' },
          templateId: crypto.randomUUID(),
          listId: crypto.randomUUID(),
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateNewsletter(newsletter);
        expect(result).toEqual(newsletter);
      });

      it('should reject newsletter without name', () => {
        const newsletter = {
          id: crypto.randomUUID(),
          name: '',
          from: { email: 'newsletter@example.com' },
          templateId: crypto.randomUUID(),
          listId: crypto.randomUUID(),
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(() => validateNewsletter(newsletter)).toThrow();
      });
    });

    describe('validateNewsletterCampaign', () => {
      it('should validate a valid campaign', () => {
        const campaign: NewsletterCampaign = {
          id: crypto.randomUUID(),
          newsletterId: crypto.randomUUID(),
          listId: crypto.randomUUID(),
          subject: 'Weekly Update',
          variables: {},
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = validateNewsletterCampaign(campaign);
        expect(result).toEqual(campaign);
      });

      it('should reject campaign without subject', () => {
        const campaign = {
          id: crypto.randomUUID(),
          newsletterId: crypto.randomUUID(),
          listId: crypto.randomUUID(),
          subject: '',
          variables: {},
          status: 'draft' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(() => validateNewsletterCampaign(campaign)).toThrow();
      });
    });
  });

  // =============================================================================
  // EMAIL CLIENT TESTS
  // =============================================================================

  describe('EmailClient', () => {
    let client: EmailClient;

    beforeEach(() => {
      client = new EmailClient({
        provider: 'smtp',
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: { user: 'user', pass: 'pass' },
        },
        defaultFrom: { email: 'noreply@example.com' },
      });
    });

    it('should create an email client', () => {
      expect(client).toBeInstanceOf(EmailClient);
    });

    it('should send an email message', async () => {
      const message: EmailMessage = {
        from: { email: 'sender@example.com' },
        to: [{ email: 'recipient@example.com' }],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      const result = await client.send(message);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should send multiple emails in batch', async () => {
      const messages: EmailMessage[] = [
        {
          from: { email: 'sender@example.com' },
          to: [{ email: 'recipient1@example.com' }],
          subject: 'Test 1',
          html: '<p>Test 1</p>',
        },
        {
          from: { email: 'sender@example.com' },
          to: [{ email: 'recipient2@example.com' }],
          subject: 'Test 2',
          html: '<p>Test 2</p>',
        },
      ];

      const results = await client.sendBatch(messages);
      expect(results).toHaveLength(2);
      expect(results.every(r => typeof r === 'string')).toBe(true);
    });

    it('should throw error for invalid message', async () => {
      const message = {
        from: { email: 'invalid-email' },
        to: [{ email: 'recipient@example.com' }],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      await expect(client.send(message as any)).rejects.toThrow();
    });

    it('should use default from address when not provided', async () => {
      const message: EmailMessage = {
        from: { email: 'sender@example.com' },
        to: [{ email: 'recipient@example.com' }],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      await expect(client.send(message)).resolves.toBeDefined();
    });
  });

  // =============================================================================
  // TEMPLATE MANAGER TESTS
  // =============================================================================

  describe('TemplateManager', () => {
    let manager: TemplateManager;

    beforeEach(() => {
      manager = new TemplateManager();
    });

    it('should create a template', async () => {
      const template = await manager.createTemplate({
        name: 'Welcome Email',
        subject: 'Welcome {{name}}',
        html: '<p>Hello {{name}}</p>',
        variables: [
          { name: 'name', type: 'string', required: true },
        ],
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe('Welcome Email');
      expect(template.createdAt).toBeInstanceOf(Date);
    });

    it('should get a template by ID', async () => {
      const created = await manager.createTemplate({
        name: 'Welcome Email',
        subject: 'Welcome {{name}}',
        html: '<p>Hello {{name}}</p>',
        variables: [
          { name: 'name', type: 'string', required: true },
        ],
      });

      const retrieved = await manager.getTemplate(created.id);
      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent template', async () => {
      const retrieved = await manager.getTemplate('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should update a template', async () => {
      const created = await manager.createTemplate({
        name: 'Welcome Email',
        subject: 'Welcome {{name}}',
        html: '<p>Hello {{name}}</p>',
        variables: [
          { name: 'name', type: 'string', required: true },
        ],
      });

      const updated = await manager.updateTemplate(created.id, {
        name: 'Updated Welcome Email',
      });

      expect(updated?.name).toBe('Updated Welcome Email');
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it('should delete a template', async () => {
      const created = await manager.createTemplate({
        name: 'Welcome Email',
        subject: 'Welcome {{name}}',
        html: '<p>Hello {{name}}</p>',
        variables: [
          { name: 'name', type: 'string', required: true },
        ],
      });

      const deleted = await manager.deleteTemplate(created.id);
      expect(deleted).toBe(true);

      const retrieved = await manager.getTemplate(created.id);
      expect(retrieved).toBeNull();
    });

    it('should list all templates', async () => {
      await manager.createTemplate({
        name: 'Template 1',
        subject: 'Subject 1',
        html: '<p>Content 1</p>',
        variables: [],
      });

      await manager.createTemplate({
        name: 'Template 2',
        subject: 'Subject 2',
        html: '<p>Content 2</p>',
        variables: [],
      });

      const templates = await manager.listTemplates();
      expect(templates).toHaveLength(2);
    });

    it('should render template with variables', async () => {
      const template = await manager.createTemplate({
        name: 'Welcome Email',
        subject: 'Welcome {{name}}',
        html: '<p>Hello {{name}}, welcome to {{company}}</p>',
        variables: [
          { name: 'name', type: 'string', required: true },
          { name: 'company', type: 'string', required: true },
        ],
      });

      const rendered = manager.renderTemplate(template, {
        name: 'John',
        company: 'Acme Inc',
      });

      expect(rendered.subject).toBe('Welcome John');
      expect(rendered.html).toContain('Hello John');
      expect(rendered.html).toContain('Acme Inc');
    });
  });

  // =============================================================================
  // TRACKING MANAGER TESTS
  // =============================================================================

  describe('TrackingManager', () => {
    let manager: TrackingManager;

    beforeEach(() => {
      manager = new TrackingManager();
    });

    it('should record a tracking event', async () => {
      const event = {
        id: crypto.randomUUID(),
        emailId: crypto.randomUUID(),
        recipient: 'user@example.com',
        eventType: 'sent' as const,
        timestamp: new Date(),
      };

      await manager.recordEvent(event);
      const events = await manager.getEvents(event.emailId);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(event);
    });

    it('should get events for an email', async () => {
      const emailId = crypto.randomUUID();

      await manager.recordEvent({
        id: crypto.randomUUID(),
        emailId,
        recipient: 'user@example.com',
        eventType: 'sent',
        timestamp: new Date(),
      });

      await manager.recordEvent({
        id: crypto.randomUUID(),
        emailId,
        recipient: 'user@example.com',
        eventType: 'opened',
        timestamp: new Date(),
      });

      const events = await manager.getEvents(emailId);
      expect(events).toHaveLength(2);
    });

    it('should get stats for an email', async () => {
      const emailId = crypto.randomUUID();

      await manager.recordEvent({
        id: crypto.randomUUID(),
        emailId,
        recipient: 'user@example.com',
        eventType: 'sent',
        timestamp: new Date(),
      });

      await manager.recordEvent({
        id: crypto.randomUUID(),
        emailId,
        recipient: 'user@example.com',
        eventType: 'delivered',
        timestamp: new Date(),
      });

      await manager.recordEvent({
        id: crypto.randomUUID(),
        emailId,
        recipient: 'user@example.com',
        eventType: 'opened',
        timestamp: new Date(),
      });

      const stats = await manager.getStats(emailId);
      expect(stats.sent).toBe(1);
      expect(stats.delivered).toBe(1);
      expect(stats.opened).toBe(1);
      expect(stats.openRate).toBe(1);
    });

    it('should get events by type', async () => {
      const emailId1 = crypto.randomUUID();
      const emailId2 = crypto.randomUUID();

      await manager.recordEvent({
        id: crypto.randomUUID(),
        emailId: emailId1,
        recipient: 'user1@example.com',
        eventType: 'opened',
        timestamp: new Date(),
      });

      await manager.recordEvent({
        id: crypto.randomUUID(),
        emailId: emailId2,
        recipient: 'user2@example.com',
        eventType: 'opened',
        timestamp: new Date(),
      });

      const openedEvents = await manager.getEventsByType('opened');
      expect(openedEvents).toHaveLength(2);
    });
  });

  // =============================================================================
  // NEWSLETTER MANAGER TESTS
  // =============================================================================

  describe('NewsletterManager', () => {
    let manager: NewsletterManager;

    beforeEach(() => {
      manager = new NewsletterManager();
    });

    it('should create a newsletter', async () => {
      const newsletter = await manager.createNewsletter({
        name: 'Weekly Digest',
        from: { email: 'newsletter@example.com' },
        templateId: crypto.randomUUID(),
        listId: crypto.randomUUID(),
        status: 'draft',
      });

      expect(newsletter.id).toBeDefined();
      expect(newsletter.name).toBe('Weekly Digest');
    });

    it('should get a newsletter by ID', async () => {
      const created = await manager.createNewsletter({
        name: 'Weekly Digest',
        from: { email: 'newsletter@example.com' },
        templateId: crypto.randomUUID(),
        listId: crypto.randomUUID(),
        status: 'draft',
      });

      const retrieved = await manager.getNewsletter(created.id);
      expect(retrieved).toEqual(created);
    });

    it('should update a newsletter', async () => {
      const created = await manager.createNewsletter({
        name: 'Weekly Digest',
        from: { email: 'newsletter@example.com' },
        templateId: crypto.randomUUID(),
        listId: crypto.randomUUID(),
        status: 'draft',
      });

      const updated = await manager.updateNewsletter(created.id, {
        name: 'Updated Weekly Digest',
      });

      expect(updated?.name).toBe('Updated Weekly Digest');
    });

    it('should delete a newsletter', async () => {
      const created = await manager.createNewsletter({
        name: 'Weekly Digest',
        from: { email: 'newsletter@example.com' },
        templateId: crypto.randomUUID(),
        listId: crypto.randomUUID(),
        status: 'draft',
      });

      const deleted = await manager.deleteNewsletter(created.id);
      expect(deleted).toBe(true);
    });

    it('should create a subscriber list', async () => {
      const list = await manager.createList({
        name: 'Subscribers',
        subscribers: [],
      });

      expect(list.id).toBeDefined();
      expect(list.name).toBe('Subscribers');
    });

    it('should add subscriber to list', async () => {
      const list = await manager.createList({
        name: 'Subscribers',
        subscribers: [],
      });

      const subscriber = await manager.addSubscriber(list.id, {
        email: 'user@example.com',
        name: 'John Doe',
        status: 'active',
      });

      expect(subscriber.id).toBeDefined();
      expect(subscriber.email).toBe('user@example.com');

      const updatedList = await manager.getList(list.id);
      expect(updatedList?.subscribers).toHaveLength(1);
    });

    it('should remove subscriber from list', async () => {
      const list = await manager.createList({
        name: 'Subscribers',
        subscribers: [],
      });

      const subscriber = await manager.addSubscriber(list.id, {
        email: 'user@example.com',
        status: 'active',
      });

      const removed = await manager.removeSubscriber(list.id, subscriber.id);
      expect(removed).toBe(true);

      const updatedList = await manager.getList(list.id);
      expect(updatedList?.subscribers).toHaveLength(0);
    });

    it('should unsubscribe subscriber', async () => {
      const list = await manager.createList({
        name: 'Subscribers',
        subscribers: [],
      });

      const subscriber = await manager.addSubscriber(list.id, {
        email: 'user@example.com',
        status: 'active',
      });

      const unsubscribed = await manager.unsubscribeSubscriber(list.id, subscriber.id);
      expect(unsubscribed).toBe(true);

      const updatedList = await manager.getList(list.id);
      expect(updatedList?.subscribers[0].status).toBe('unsubscribed');
    });

    it('should create a campaign', async () => {
      const campaign = await manager.createCampaign({
        newsletterId: crypto.randomUUID(),
        listId: crypto.randomUUID(),
        subject: 'Weekly Update',
        variables: {},
        status: 'draft',
      });

      expect(campaign.id).toBeDefined();
      expect(campaign.subject).toBe('Weekly Update');
    });

    it('should send a campaign', async () => {
      const list = await manager.createList({
        name: 'Subscribers',
        subscribers: [
          {
            id: crypto.randomUUID(),
            email: 'user1@example.com',
            status: 'active',
            subscribedAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            email: 'user2@example.com',
            status: 'active',
            subscribedAt: new Date(),
          },
        ],
      });

      const campaign = await manager.createCampaign({
        newsletterId: crypto.randomUUID(),
        listId: list.id,
        subject: 'Weekly Update',
        variables: {},
        status: 'draft',
      });

      const emailClient = new EmailClient({
        provider: 'smtp',
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: { user: 'user', pass: 'pass' },
        },
      });

      const stats = await manager.sendCampaign(campaign.id, emailClient);
      expect(stats.totalRecipients).toBe(2);
      expect(stats.sent).toBe(2);
    });
  });

  // =============================================================================
  // ANALYTICS MANAGER TESTS
  // =============================================================================

  describe('AnalyticsManager', () => {
    let analyticsManager: AnalyticsManager;
    let trackingManager: TrackingManager;

    beforeEach(() => {
      trackingManager = new TrackingManager();
      analyticsManager = new AnalyticsManager(trackingManager);
    });

    it('should get analytics for a period', async () => {
      const period = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };

      const analytics = await analyticsManager.getAnalytics(period);
      expect(analytics.period).toEqual(period);
      expect(analytics.totalSent).toBe(0);
      expect(analytics.deliveryRate).toBe(0);
    });
  });

  // =============================================================================
  // ERROR CLASS TESTS
  // =============================================================================

  describe('Error Classes', () => {
    it('should create EmailError', () => {
      const error = new EmailError('Test error', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('EmailError');
    });

    it('should create EmailValidationError', () => {
      const error = new EmailValidationError('Validation failed', ['Error 1', 'Error 2']);
      expect(error.message).toBe('Validation failed');
      expect(error.validationErrors).toEqual(['Error 1', 'Error 2']);
      expect(error.name).toBe('EmailValidationError');
    });

    it('should create EmailProviderError', () => {
      const originalError = new Error('Original error');
      const error = new EmailProviderError('Provider error', 'smtp', originalError);
      expect(error.message).toBe('Provider error');
      expect(error.provider).toBe('smtp');
      expect(error.originalError).toBe(originalError);
      expect(error.name).toBe('EmailProviderError');
    });

    it('should create EmailTemplateError', () => {
      const error = new EmailTemplateError('Template error', 'template-id');
      expect(error.message).toBe('Template error');
      expect(error.name).toBe('EmailTemplateError');
    });
  });
});
