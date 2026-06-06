/**
 * Scheduler Package
 * 
 * Cron-like job scheduling for automations.
 */

import { z } from 'zod';

// Job definition
export interface Job {
  id: string;
  name: string;
  schedule: string; // cron expression
  handler: () => Promise<any>;
  lastRun?: number;
  nextRun?: number;
  enabled: boolean;
}

// Cron expression parser (simplified)
interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

class Scheduler {
  private jobs: Map<string, Job> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private running: boolean = false;

  // Add a job
  addJob(job: Omit<Job, 'id' | 'lastRun' | 'nextRun'>): string {
    const id = `${job.name}-${Date.now()}`;
    const fullJob: Job = {
      ...job,
      id,
      lastRun: undefined,
      nextRun: this.calculateNextRun(job.schedule),
    };
    
    this.jobs.set(id, fullJob);
    
    if (this.running) {
      this.scheduleJob(fullJob);
    }
    
    return id;
  }

  // Remove a job
  removeJob(id: string): boolean {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
    
    return this.jobs.delete(id);
  }

  // List all jobs
  listJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  // Get a job by ID
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  // Enable/disable a job
  toggleJob(id: string, enabled: boolean): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    
    job.enabled = enabled;
    
    if (enabled && this.running) {
      this.scheduleJob(job);
    } else {
      const interval = this.intervals.get(id);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(id);
      }
    }
    
    return true;
  }

  // Start the scheduler
  start(): void {
    if (this.running) return;
    
    this.running = true;
    
    for (const job of this.jobs.values()) {
      if (job.enabled) {
        this.scheduleJob(job);
      }
    }
  }

  // Stop the scheduler
  stop(): void {
    this.running = false;
    
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    
    this.intervals.clear();
  }

  // Schedule a single job
  private scheduleJob(job: Job): void {
    const now = Date.now();
    const delay = job.nextRun ? job.nextRun - now : 60000; // Default 1 minute
    
    if (delay <= 0) {
      // Run immediately
      this.executeJob(job);
      return;
    }
    
    const interval = setTimeout(async () => {
      await this.executeJob(job);
      
      // Reschedule
      job.nextRun = this.calculateNextRun(job.schedule);
      if (job.enabled && this.running) {
        this.scheduleJob(job);
      }
    }, delay);
    
    this.intervals.set(job.id, interval as any);
  }

  // Execute a job
  private async executeJob(job: Job): Promise<void> {
    if (!job.enabled) return;
    
    try {
      job.lastRun = Date.now();
      await job.handler();
    } catch (error) {
      console.error(`Job ${job.name} failed:`, error);
    }
  }

  // Calculate next run time (simplified cron parser)
  private calculateNextRun(schedule: string): number {
    // For now, just use a simple parser
    // Supports: "*/5 * * * *" (every 5 minutes), "0 * * * *" (every hour)
    const parts = schedule.split(' ');
    if (parts.length !== 5) {
      return Date.now() + 60000; // Default 1 minute
    }
    
    const [minute, hour] = parts;
    const now = new Date();
    const next = new Date(now);
    
    // Handle minute intervals
    if (minute.includes('*/')) {
      const interval = parseInt(minute.replace('*/', ''));
      next.setMinutes(now.getMinutes() + (interval - (now.getMinutes() % interval)));
    } else if (minute === '*') {
      next.setMinutes(now.getMinutes() + 1);
    } else {
      const targetMinute = parseInt(minute);
      if (now.getMinutes() < targetMinute) {
        next.setMinutes(targetMinute);
      } else {
        next.setHours(now.getHours() + 1);
        next.setMinutes(targetMinute);
      }
    }
    
    return next.getTime();
  }
}

// Singleton instance
const scheduler = new Scheduler();

// Export the scheduler instance
export { scheduler };

// Export types
export type { Job };
