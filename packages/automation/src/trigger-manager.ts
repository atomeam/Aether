/**
 * @aether/automation - Trigger management system
 * 
 * Manages workflow triggers and evaluates when they should fire
 * 
 * @version 1.0.0
 */

import type { Trigger, TriggerType, TriggerEvent } from './types';

export interface TriggerListener {
  (event: TriggerEvent): void | Promise<void>;
}

/**
 * Trigger manager class
 */
export class TriggerManager {
  private triggers: Map<string, Trigger> = new Map();
  private listeners: Map<TriggerType, Set<TriggerListener>> = new Map();

  /**
   * Register a trigger
   */
  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  /**
   * Unregister a trigger
   */
  unregisterTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
  }

  /**
   * Get a trigger by ID
   */
  getTrigger(triggerId: string): Trigger | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * Get all triggers
   */
  getAllTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Get triggers by type
   */
  getTriggersByType(type: TriggerType): Trigger[] {
    return Array.from(this.triggers.values()).filter(
      (t) => t.type === type && t.enabled
    );
  }

  /**
   * Add a listener for a trigger type
   */
  addListener(type: TriggerType, listener: TriggerListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(type: TriggerType, listener: TriggerListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  /**
   * Emit a trigger event
   */
  async emit(event: TriggerEvent): Promise<void> {
    const listeners = this.listeners.get(event.type);
    if (!listeners) {
      return;
    }

    const promises = Array.from(listeners).map((listener) =>
      Promise.resolve(listener(event))
    );

    await Promise.allSettled(promises);
  }

  /**
   * Check if a trigger should fire based on event data
   */
  shouldTrigger(trigger: Trigger, event: TriggerEvent): boolean {
    if (!trigger.enabled) {
      return false;
    }

    if (trigger.type !== event.type) {
      return false;
    }

    // Check trigger-specific configuration
    const config = trigger.config;

    // Example: webhook trigger checks for matching URL path
    if (trigger.type === 'webhook') {
      const eventPath = event.data.path as string | undefined;
      const triggerPath = config.path as string | undefined;
      if (triggerPath && eventPath !== triggerPath) {
        return false;
      }
    }

    // Example: event trigger checks for matching event name
    if (trigger.type === 'event') {
      const eventName = event.data.eventName as string | undefined;
      const triggerEvent = config.eventName as string | undefined;
      if (triggerEvent && eventName !== triggerEvent) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find matching triggers for an event
   */
  findMatchingTriggers(event: TriggerEvent): Trigger[] {
    return this.getTriggersByType(event.type).filter((trigger) =>
      this.shouldTrigger(trigger, event)
    );
  }

  /**
   * Clear all triggers
   */
  clear(): void {
    this.triggers.clear();
    this.listeners.clear();
  }
}

/**
 * Global trigger manager instance
 */
export const triggerManager = new TriggerManager();
