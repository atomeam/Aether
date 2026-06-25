/**
 * @aether/automation - Trigger manager tests
 * 
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriggerManager, triggerManager } from './trigger-manager';
import type { Trigger, TriggerEvent } from './types';

describe('TriggerManager', () => {
  let manager: TriggerManager;

  beforeEach(() => {
    manager = new TriggerManager();
  });

  describe('registerTrigger', () => {
    it('should register a trigger', () => {
      const trigger: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: { path: '/webhook' },
      };

      manager.registerTrigger(trigger);

      expect(manager.getTrigger('trigger-1')).toEqual(trigger);
    });

    it('should replace existing trigger with same ID', () => {
      const trigger1: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: { path: '/webhook1' },
      };

      const trigger2: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: { path: '/webhook2' },
      };

      manager.registerTrigger(trigger1);
      manager.registerTrigger(trigger2);

      expect(manager.getTrigger('trigger-1')).toEqual(trigger2);
    });
  });

  describe('unregisterTrigger', () => {
    it('should unregister a trigger', () => {
      const trigger: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: {},
      };

      manager.registerTrigger(trigger);
      manager.unregisterTrigger('trigger-1');

      expect(manager.getTrigger('trigger-1')).toBeUndefined();
    });
  });

  describe('getTrigger', () => {
    it('should return trigger by ID', () => {
      const trigger: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: {},
      };

      manager.registerTrigger(trigger);

      expect(manager.getTrigger('trigger-1')).toEqual(trigger);
    });

    it('should return undefined for non-existent trigger', () => {
      expect(manager.getTrigger('non-existent')).toBeUndefined();
    });
  });

  describe('getAllTriggers', () => {
    it('should return all triggers', () => {
      const trigger1: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: {},
      };

      const trigger2: Trigger = {
        id: 'trigger-2',
        type: 'schedule',
        config: {},
      };

      manager.registerTrigger(trigger1);
      manager.registerTrigger(trigger2);

      const triggers = manager.getAllTriggers();

      expect(triggers).toHaveLength(2);
      expect(triggers).toContainEqual(trigger1);
      expect(triggers).toContainEqual(trigger2);
    });
  });

  describe('getTriggersByType', () => {
    it('should return triggers of specific type', () => {
      const trigger1: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: {},
        enabled: true,
      };

      const trigger2: Trigger = {
        id: 'trigger-2',
        type: 'webhook',
        config: {},
        enabled: true,
      };

      const trigger3: Trigger = {
        id: 'trigger-3',
        type: 'schedule',
        config: {},
        enabled: true,
      };

      manager.registerTrigger(trigger1);
      manager.registerTrigger(trigger2);
      manager.registerTrigger(trigger3);

      const webhookTriggers = manager.getTriggersByType('webhook');

      expect(webhookTriggers).toHaveLength(2);
      expect(webhookTriggers).toContainEqual(trigger1);
      expect(webhookTriggers).toContainEqual(trigger2);
    });

    it('should not return disabled triggers', () => {
      const trigger1: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: {},
        enabled: true,
      };

      const trigger2: Trigger = {
        id: 'trigger-2',
        type: 'webhook',
        config: {},
        enabled: false,
      };

      manager.registerTrigger(trigger1);
      manager.registerTrigger(trigger2);

      const webhookTriggers = manager.getTriggersByType('webhook');

      expect(webhookTriggers).toHaveLength(1);
      expect(webhookTriggers).toContainEqual(trigger1);
    });
  });

  describe('listeners', () => {
    it('should add and call listener', async () => {
      const listener = vi.fn();

      manager.addListener('webhook', listener);

      const event: TriggerEvent = {
        type: 'webhook',
        data: { path: '/webhook' },
        timestamp: new Date().toISOString(),
      };

      await manager.emit(event);

      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should call multiple listeners', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.addListener('webhook', listener1);
      manager.addListener('webhook', listener2);

      const event: TriggerEvent = {
        type: 'webhook',
        data: {},
        timestamp: new Date().toISOString(),
      };

      await manager.emit(event);

      expect(listener1).toHaveBeenCalledWith(event);
      expect(listener2).toHaveBeenCalledWith(event);
    });

    it('should not call listeners for different type', async () => {
      const listener = vi.fn();

      manager.addListener('webhook', listener);

      const event: TriggerEvent = {
        type: 'schedule',
        data: {},
        timestamp: new Date().toISOString(),
      };

      await manager.emit(event);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should remove listener', async () => {
      const listener = vi.fn();

      manager.addListener('webhook', listener);
      manager.removeListener('webhook', listener);

      const event: TriggerEvent = {
        type: 'webhook',
        data: {},
        timestamp: new Date().toISOString(),
      };

      await manager.emit(event);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('shouldTrigger', () => {
    it('should return false for disabled trigger', () => {
      const trigger: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: {},
        enabled: false,
      };

      const event: TriggerEvent = {
        type: 'webhook',
        data: {},
        timestamp: new Date().toISOString(),
      };

      expect(manager.shouldTrigger(trigger, event)).toBe(false);
    });

    it('should return false for different type', () => {
      const trigger: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: {},
        enabled: true,
      };

      const event: TriggerEvent = {
        type: 'schedule',
        data: {},
        timestamp: new Date().toISOString(),
      };

      expect(manager.shouldTrigger(trigger, event)).toBe(false);
    });

    it('should check webhook path', () => {
      const trigger: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: { path: '/webhook' },
        enabled: true,
      };

      const event1: TriggerEvent = {
        type: 'webhook',
        data: { path: '/webhook' },
        timestamp: new Date().toISOString(),
      };

      const event2: TriggerEvent = {
        type: 'webhook',
        data: { path: '/other' },
        timestamp: new Date().toISOString(),
      };

      expect(manager.shouldTrigger(trigger, event1)).toBe(true);
      expect(manager.shouldTrigger(trigger, event2)).toBe(false);
    });

    it('should check event name', () => {
      const trigger: Trigger = {
        id: 'trigger-1',
        type: 'event',
        config: { eventName: 'user.created' },
        enabled: true,
      };

      const event1: TriggerEvent = {
        type: 'event',
        data: { eventName: 'user.created' },
        timestamp: new Date().toISOString(),
      };

      const event2: TriggerEvent = {
        type: 'event',
        data: { eventName: 'user.deleted' },
        timestamp: new Date().toISOString(),
      };

      expect(manager.shouldTrigger(trigger, event1)).toBe(true);
      expect(manager.shouldTrigger(trigger, event2)).toBe(false);
    });
  });

  describe('findMatchingTriggers', () => {
    it('should find matching triggers for event', () => {
      const trigger1: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: { path: '/webhook' },
        enabled: true,
      };

      const trigger2: Trigger = {
        id: 'trigger-2',
        type: 'webhook',
        config: { path: '/other' },
        enabled: true,
      };

      manager.registerTrigger(trigger1);
      manager.registerTrigger(trigger2);

      const event: TriggerEvent = {
        type: 'webhook',
        data: { path: '/webhook' },
        timestamp: new Date().toISOString(),
      };

      const matches = manager.findMatchingTriggers(event);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual(trigger1);
    });
  });

  describe('clear', () => {
    it('should clear all triggers and listeners', () => {
      const trigger: Trigger = {
        id: 'trigger-1',
        type: 'webhook',
        config: {},
      };

      manager.registerTrigger(trigger);
      manager.addListener('webhook', () => {});
      manager.clear();

      expect(manager.getAllTriggers()).toHaveLength(0);
    });
  });
});

describe('triggerManager (global instance)', () => {
  it('should be a singleton instance', () => {
    expect(triggerManager).toBeInstanceOf(TriggerManager);
  });
});
