/**
 * Content Scheduler
 * Manages content scheduling and publishing
 */

import type { Content } from '../types/index.js';
import { ContentSchema } from '../schemas/index.js';

export interface ScheduledContent {
  contentId: string;
  scheduledAt: Date;
  action: 'publish' | 'unpublish' | 'archive';
}

export class ContentScheduler {
  private scheduled: Map<string, ScheduledContent> = new Map();
  private timer?: NodeJS.Timeout;

  /**
   * Schedule content to be published at a specific time
   */
  schedulePublish(
    contentId: string,
    scheduledAt: Date
  ): ScheduledContent {
    const scheduled: ScheduledContent = {
      contentId,
      scheduledAt,
      action: 'publish',
    };

    this.scheduled.set(contentId, scheduled);
    this.updateTimer();
    
    return scheduled;
  }

  /**
   * Schedule content to be unpublished at a specific time
   */
  scheduleUnpublish(
    contentId: string,
    scheduledAt: Date
  ): ScheduledContent {
    const scheduled: ScheduledContent = {
      contentId,
      scheduledAt,
      action: 'unpublish',
    };

    this.scheduled.set(contentId, scheduled);
    this.updateTimer();
    
    return scheduled;
  }

  /**
   * Schedule content to be archived at a specific time
   */
  scheduleArchive(
    contentId: string,
    scheduledAt: Date
  ): ScheduledContent {
    const scheduled: ScheduledContent = {
      contentId,
      scheduledAt,
      action: 'archive',
    };

    this.scheduled.set(contentId, scheduled);
    this.updateTimer();
    
    return scheduled;
  }

  /**
   * Cancel a scheduled action
   */
  cancelSchedule(contentId: string): boolean {
    const result = this.scheduled.delete(contentId);
    this.updateTimer();
    return result;
  }

  /**
   * Get scheduled content
   */
  getScheduledContent(contentId: string): ScheduledContent | undefined {
    return this.scheduled.get(contentId);
  }

  /**
   * List all scheduled content
   */
  listScheduled(): ScheduledContent[] {
    return Array.from(this.scheduled.values()).sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
    );
  }

  /**
   * List scheduled content by action type
   */
  listByAction(action: ScheduledContent['action']): ScheduledContent[] {
    return this.listScheduled().filter(s => s.action === action);
  }

  /**
   * List scheduled content for a date range
   */
  listByDateRange(start: Date, end: Date): ScheduledContent[] {
    return this.listScheduled().filter(
      s => s.scheduledAt >= start && s.scheduledAt <= end
    );
  }

  /**
   * Get upcoming scheduled content (next N items)
   */
  getUpcoming(count: number = 10): ScheduledContent[] {
    const now = new Date();
    return this.listScheduled()
      .filter(s => s.scheduledAt > now)
      .slice(0, count);
  }

  /**
   * Get overdue scheduled content
   */
  getOverdue(): ScheduledContent[] {
    const now = new Date();
    return this.listScheduled().filter(s => s.scheduledAt <= now);
  }

  /**
   * Process scheduled content (call this periodically)
   */
  async processScheduled(
    publishFn: (contentId: string) => Promise<void>,
    unpublishFn: (contentId: string) => Promise<void>,
    archiveFn: (contentId: string) => Promise<void>
  ): Promise<number> {
    const overdue = this.getOverdue();
    let processed = 0;

    for (const scheduled of overdue) {
      try {
        switch (scheduled.action) {
          case 'publish':
            await publishFn(scheduled.contentId);
            break;
          case 'unpublish':
            await unpublishFn(scheduled.contentId);
            break;
          case 'archive':
            await archiveFn(scheduled.contentId);
            break;
        }
        
        this.scheduled.delete(scheduled.contentId);
        processed++;
      } catch (error) {
        console.error(`Failed to process scheduled content ${scheduled.contentId}:`, error);
      }
    }

    this.updateTimer();
    return processed;
  }

  /**
   * Reschedule content to a new time
   */
  reschedule(
    contentId: string,
    newScheduledAt: Date
  ): ScheduledContent | null {
    const existing = this.scheduled.get(contentId);
    if (!existing) return null;

    const updated: ScheduledContent = {
      ...existing,
      scheduledAt: newScheduledAt,
    };

    this.scheduled.set(contentId, updated);
    this.updateTimer();
    
    return updated;
  }

  /**
   * Update the timer for the next scheduled action
   */
  private updateTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    const upcoming = this.getUpcoming(1);
    if (upcoming.length === 0) return;

    const next = upcoming[0];
    const delay = next.scheduledAt.getTime() - Date.now();

    if (delay > 0) {
      this.timer = setTimeout(() => {
        // Timer callback - in production, this would trigger the processing
        console.log(`Scheduled action for ${next.contentId} is due`);
      }, delay);
    }
  }

  /**
   * Clear all scheduled content
   */
  clearAll(): void {
    this.scheduled.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byAction: Record<string, number>;
    upcoming: number;
    overdue: number;
  } {
    const all = this.listScheduled();
    const now = new Date();

    return {
      total: all.length,
      byAction: {
        publish: all.filter(s => s.action === 'publish').length,
        unpublish: all.filter(s => s.action === 'unpublish').length,
        archive: all.filter(s => s.action === 'archive').length,
      },
      upcoming: all.filter(s => s.scheduledAt > now).length,
      overdue: all.filter(s => s.scheduledAt <= now).length,
    };
  }
}
