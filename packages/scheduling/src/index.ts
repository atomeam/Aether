/**
 * @aether/scheduling - Job Scheduling Library
 *
 * A comprehensive scheduling library for cron scheduling, delayed jobs,
 * recurring tasks, job dependencies, and priority queues.
 *
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// TYPES AND SCHEMAS
// =============================================================================

/**
 * Job status types
 */
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

/**
 * Job priority levels
 */
export enum JobPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Schema for cron expression
 */
export const CronExpressionSchema = z.object({
  minute: z.string().default('*'),
  hour: z.string().default('*'),
  dayOfMonth: z.string().default('*'),
  month: z.string().default('*'),
  dayOfWeek: z.string().default('*'),
});

export type CronExpression = z.infer<typeof CronExpressionSchema>;

/**
 * Schema for job definition
 */
export const JobDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  handler: z.function().returns(z.promise(z.void()).or(z.void())),
  priority: z.nativeEnum(JobPriority).default(JobPriority.NORMAL),
  maxRetries: z.number().min(0).default(3),
  retryDelay: z.number().min(0).default(1000),
  timeout: z.number().min(0).optional(),
  dependencies: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

export type JobDefinition = z.infer<typeof JobDefinitionSchema>;

/**
 * Schema for job execution
 */
export const JobExecutionSchema = z.object({
  jobId: z.string(),
  executionId: z.string(),
  status: z.nativeEnum(JobStatus),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  result: z.any().optional(),
  error: z.string().optional(),
  attempt: z.number().default(1),
});

export type JobExecution = z.infer<typeof JobExecutionSchema>;

/**
 * Schema for scheduled job
 */
export const ScheduledJobSchema = z.object({
  definition: JobDefinitionSchema,
  nextRun: z.date(),
  lastRun: z.date().optional(),
  runCount: z.number().default(0),
  enabled: z.boolean().default(true),
});

export type ScheduledJob = z.infer<typeof ScheduledJobSchema>;

/**
 * Schema for scheduler configuration
 */
export const SchedulerConfigSchema = z.object({
  maxConcurrentJobs: z.number().min(1).default(10),
  retryFailedJobs: z.boolean().default(true),
  jobHistorySize: z.number().min(0).default(100),
  timezone: z.string().default('UTC'),
});

export type SchedulerConfig = z.infer<typeof SchedulerConfigSchema>;

/**
 * Schema for scheduler statistics
 */
export const SchedulerStatsSchema = z.object({
  totalJobs: z.number(),
  pendingJobs: z.number(),
  runningJobs: z.number(),
  completedJobs: z.number(),
  failedJobs: z.number(),
  cancelledJobs: z.number(),
  totalExecutions: z.number(),
  successfulExecutions: z.number(),
  failedExecutions: z.number(),
  averageExecutionTime: z.number(),
  uptime: z.number(),
});

export type SchedulerStats = z.infer<typeof SchedulerStatsSchema>;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Parse and validate cron expression
 */
export function parseCronExpression(data: unknown): CronExpression {
  return CronExpressionSchema.parse(data);
}

/**
 * Parse and validate job definition
 */
export function parseJobDefinition(data: unknown): JobDefinition {
  return JobDefinitionSchema.parse(data);
}

/**
 * Parse and validate job execution
 */
export function parseJobExecution(data: unknown): JobExecution {
  return JobExecutionSchema.parse(data);
}

/**
 * Parse and validate scheduled job
 */
export function parseScheduledJob(data: unknown): ScheduledJob {
  return ScheduledJobSchema.parse(data);
}

/**
 * Parse and validate scheduler configuration
 */
export function parseSchedulerConfig(data: unknown): SchedulerConfig {
  return SchedulerConfigSchema.parse(data);
}

// =============================================================================
// CRON SCHEDULING
// =============================================================================

/**
 * Cron expression parser and calculator
 */
export class CronScheduler {
  /**
   * Parse a cron string into a CronExpression object
   * Format: minute hour day-of-month month day-of-week
   */
  static parse(cronString: string): CronExpression {
    const parts = cronString.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression. Expected 5 parts: minute hour day-of-month month day-of-week');
    }

    return {
      minute: parts[0],
      hour: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4],
    };
  }

  /**
   * Calculate the next run time for a cron expression
   */
  static nextRun(cron: CronExpression, from: Date = new Date()): Date {
    let next = new Date(from);
    next.setSeconds(0, 0);

    // Find the next valid minute
    next = this.findNextValidTime(cron, next);
    return next;
  }

  /**
   * Check if a date matches a cron expression
   */
  static matches(cron: CronExpression, date: Date): boolean {
    return (
      this.matchesField(cron.minute, date.getMinutes()) &&
      this.matchesField(cron.hour, date.getHours()) &&
      this.matchesField(cron.dayOfMonth, date.getDate()) &&
      this.matchesField(cron.month, date.getMonth() + 1) &&
      this.matchesField(cron.dayOfWeek, date.getDay())
    );
  }

  private static findNextValidTime(cron: CronExpression, date: Date): Date {
    const maxIterations = 1000;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      if (this.matches(cron, date)) {
        return date;
      }

      date.setMinutes(date.getMinutes() + 1);

      // Handle month rollover
      if (date.getMinutes() === 0 && date.getHours() === 0 && date.getDate() === 1) {
        // Already handled by Date object
      }
    }

    throw new Error('Could not find next valid time within iteration limit');
  }

  private static matchesField(field: string, value: number): boolean {
    if (field === '*') return true;

    // Handle ranges (e.g., 1-5)
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      return value >= start && value <= end;
    }

    // Handle lists (e.g., 1,3,5)
    if (field.includes(',')) {
      const values = field.split(',').map(Number);
      return values.includes(value);
    }

    // Handle step (e.g., */5 or 1-10/2)
    if (field.includes('/')) {
      const [base, step] = field.split('/');
      const stepNum = parseInt(step, 10);
      if (base === '*') {
        return value % stepNum === 0;
      }
      const baseNum = parseInt(base, 10);
      return value >= baseNum && (value - baseNum) % stepNum === 0;
    }

    // Simple value match
    return parseInt(field, 10) === value;
  }
}

// =============================================================================
// PRIORITY QUEUE
// =============================================================================

/**
 * Priority queue for job scheduling
 */
export class JobQueue {
  private queue: Array<{ job: ScheduledJob; priority: number }> = [];
  private running: Set<string> = new Set();

  /**
   * Add a job to the queue
   */
  enqueue(job: ScheduledJob, priority: number = JobPriority.NORMAL): void {
    // Insert in priority order (higher priority first)
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < priority) {
        insertIndex = i;
        break;
      }
    }
    this.queue.splice(insertIndex, 0, { job, priority });
  }

  /**
   * Remove and return the next job from the queue
   */
  dequeue(): ScheduledJob | null {
    if (this.queue.length === 0) {
      return null;
    }

    const { job } = this.queue.shift()!;
    this.running.add(job.definition.id);
    return job;
  }

  /**
   * Mark a job as completed
   */
  complete(jobId: string): void {
    this.running.delete(jobId);
  }

  /**
   * Get the current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Get the number of jobs currently running
   */
  runningCount(): number {
    return this.running.size;
  }

  /**
   * Peek at the next job without removing it
   */
  peek(): ScheduledJob | null {
    return this.queue.length > 0 ? this.queue[0].job : null;
  }

  /**
   * Remove a job from the queue
   */
  remove(jobId: string): boolean {
    const index = this.queue.findIndex(item => item.job.definition.id === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.running.clear();
  }
}

// =============================================================================
// JOB EXECUTION
// =============================================================================

/**
 * Job executor with retry logic and timeout handling
 */
export class JobExecutor {
  private executions: JobExecution[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  /**
   * Execute a job with retry logic
   */
  async execute(job: JobDefinition): Promise<JobExecution> {
    const executionId = this.generateExecutionId();
    const startTime = new Date();
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= job.maxRetries + 1; attempt++) {
      const execution: JobExecution = {
        jobId: job.id,
        executionId,
        status: JobStatus.RUNNING,
        startTime,
        attempt,
      };

      try {
        // Execute with timeout if specified
        const result = job.timeout
          ? await this.executeWithTimeout(job.handler, job.timeout)
          : await job.handler();

        const endTime = new Date();
        const completedExecution: JobExecution = {
          ...execution,
          status: JobStatus.COMPLETED,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          result,
        };

        this.addExecution(completedExecution);
        return completedExecution;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);

        if (attempt < job.maxRetries + 1) {
          // Retry after delay
          await this.delay(job.retryDelay);
        }
      }
    }

    // All retries failed
    const endTime = new Date();
    const failedExecution: JobExecution = {
      jobId: job.id,
      executionId,
      status: JobStatus.FAILED,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      error: lastError,
      attempt: job.maxRetries + 1,
    };

    this.addExecution(failedExecution);
    return failedExecution;
  }

  /**
   * Get execution history for a job
   */
  getHistory(jobId: string): JobExecution[] {
    return this.executions.filter(e => e.jobId === jobId);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): JobExecution[] {
    return [...this.executions];
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executions = [];
  }

  private async executeWithTimeout(handler: () => Promise<void> | void, timeout: number): Promise<void> {
    return Promise.race([
      handler(),
      new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), timeout);
      }),
    ]);
  }

  private addExecution(execution: JobExecution): void {
    this.executions.push(execution);

    // Enforce max history size
    if (this.executions.length > this.maxHistory) {
      this.executions.shift();
    }
  }

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// SCHEDULER
// =============================================================================

/**
 * Main scheduler for managing jobs
 */
export class Scheduler {
  private config: SchedulerConfig;
  private queue: JobQueue;
  private executor: JobExecutor;
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: Date = new Date();
  private isRunning: boolean = false;

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.queue = new JobQueue();
    this.executor = new JobExecutor(config.jobHistorySize);
  }

  /**
   * Start the scheduler
   */
  start(tickInterval: number = 1000): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => this.tick(), tickInterval);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Schedule a one-time job with delay
   */
  scheduleDelayed(job: JobDefinition, delay: number): void {
    const scheduledJob: ScheduledJob = {
      definition: job,
      nextRun: new Date(Date.now() + delay),
      runCount: 0,
      enabled: true,
    };

    this.scheduledJobs.set(job.id, scheduledJob);
  }

  /**
   * Schedule a recurring job with cron expression
   */
  scheduleCron(job: JobDefinition, cron: CronExpression): void {
    const scheduledJob: ScheduledJob = {
      definition: job,
      nextRun: CronScheduler.nextRun(cron),
      runCount: 0,
      enabled: true,
    };

    this.scheduledJobs.set(job.id, scheduledJob);
  }

  /**
   * Schedule a recurring job with cron string
   */
  scheduleCronString(job: JobDefinition, cronString: string): void {
    const cron = CronScheduler.parse(cronString);
    this.scheduleCron(job, cron);
  }

  /**
   * Schedule a job to run immediately
   */
  scheduleNow(job: JobDefinition): void {
    const scheduledJob: ScheduledJob = {
      definition: job,
      nextRun: new Date(),
      runCount: 0,
      enabled: true,
    };

    this.scheduledJobs.set(job.id, scheduledJob);
  }

  /**
   * Cancel a scheduled job
   */
  cancel(jobId: string): boolean {
    const job = this.scheduledJobs.get(jobId);
    if (!job) {
      return false;
    }

    job.enabled = false;
    this.queue.remove(jobId);
    return true;
  }

  /**
   * Remove a job from the scheduler
   */
  remove(jobId: string): boolean {
    return this.scheduledJobs.delete(jobId);
  }

  /**
   * Get a scheduled job
   */
  getJob(jobId: string): ScheduledJob | undefined {
    return this.scheduledJobs.get(jobId);
  }

  /**
   * Get all scheduled jobs
   */
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values());
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    const executions = this.executor.getAllExecutions();
    const successful = executions.filter(e => e.status === JobStatus.COMPLETED);
    const failed = executions.filter(e => e.status === JobStatus.FAILED);

    const avgTime = successful.length > 0
      ? successful.reduce((sum, e) => sum + (e.duration || 0), 0) / successful.length
      : 0;

    return {
      totalJobs: this.scheduledJobs.size,
      pendingJobs: this.queue.size(),
      runningJobs: this.queue.runningCount(),
      completedJobs: successful.length,
      failedJobs: failed.length,
      cancelledJobs: executions.filter(e => e.status === JobStatus.CANCELLED).length,
      totalExecutions: executions.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      averageExecutionTime: avgTime,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Main scheduler tick - checks for due jobs and executes them
   */
  private async tick(): Promise<void> {
    const now = new Date();

    // Check for due jobs
    for (const [jobId, job] of this.scheduledJobs.entries()) {
      if (!job.enabled) {
        continue;
      }

      // Check if job is due
      if (job.nextRun <= now) {
        // Check dependencies
        if (this.areDependenciesMet(job.definition.dependencies)) {
          // Check if we can run more jobs
          if (this.queue.runningCount() < this.config.maxConcurrentJobs) {
            this.queue.enqueue(job, job.definition.priority);
            job.lastRun = now;
            job.runCount++;

            // Calculate next run time for cron jobs
            if (job.definition.id.startsWith('cron-')) {
              // In a real implementation, we'd store the cron expression
              // For now, we'll just reschedule in 1 minute
              job.nextRun = new Date(now.getTime() + 60000);
            } else {
              // One-time job, disable after run
              job.enabled = false;
            }
          }
        }
      }
    }

    // Execute queued jobs
    while (this.queue.runningCount() < this.config.maxConcurrentJobs) {
      const job = this.queue.dequeue();
      if (!job) {
        break;
      }

      this.executeJob(job);
    }
  }

  /**
   * Execute a job asynchronously
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    try {
      const execution = await this.executor.execute(job.definition);

      if (execution.status === JobStatus.FAILED && this.config.retryFailedJobs) {
        // Requeue for retry
        if (execution.attempt < job.definition.maxRetries) {
          job.enabled = true;
          job.nextRun = new Date(Date.now() + job.definition.retryDelay);
        }
      }
    } catch (error) {
      console.error(`Error executing job ${job.definition.id}:`, error);
    } finally {
      this.queue.complete(job.definition.id);
    }
  }

  /**
   * Check if job dependencies are met
   */
  private areDependenciesMet(dependencies: string[]): boolean {
    for (const depId of dependencies) {
      const depJob = this.scheduledJobs.get(depId);
      if (!depJob || depJob.enabled) {
        return false;
      }
    }
    return true;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a job definition
 */
export function createJobDefinition(
  id: string,
  name: string,
  handler: () => Promise<void> | void,
  options?: {
    priority?: JobPriority;
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    dependencies?: string[];
    metadata?: Record<string, unknown>;
  }
): JobDefinition {
  return {
    id,
    name,
    handler,
    priority: options?.priority || JobPriority.NORMAL,
    maxRetries: options?.maxRetries || 3,
    retryDelay: options?.retryDelay || 1000,
    timeout: options?.timeout,
    dependencies: options?.dependencies || [],
    metadata: options?.metadata,
  };
}

/**
 * Create a cron expression
 */
export function createCronExpression(
  minute: string = '*',
  hour: string = '*',
  dayOfMonth: string = '*',
  month: string = '*',
  dayOfWeek: string = '*'
): CronExpression {
  return {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
  };
}

/**
 * Create a scheduler with default configuration
 */
export function createScheduler(options?: Partial<SchedulerConfig>): Scheduler {
  const config: SchedulerConfig = {
    maxConcurrentJobs: options?.maxConcurrentJobs || 10,
    retryFailedJobs: options?.retryFailedJobs !== undefined ? options.retryFailedJobs : true,
    jobHistorySize: options?.jobHistorySize || 100,
    timezone: options?.timezone || 'UTC',
  };

  return new Scheduler(config);
}

/**
 * Common cron expressions
 */
export const CronExpressions = {
  EVERY_MINUTE: '* * * * *',
  EVERY_5_MINUTES: '*/5 * * * *',
  EVERY_15_MINUTES: '*/15 * * * *',
  EVERY_30_MINUTES: '*/30 * * * *',
  EVERY_HOUR: '0 * * * *',
  EVERY_2_HOURS: '0 */2 * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  EVERY_12_HOURS: '0 */12 * * *',
  EVERY_DAY_AT_MIDNIGHT: '0 0 * * *',
  EVERY_DAY_AT_NOON: '0 12 * * *',
  EVERY_MONDAY: '0 0 * * 1',
  EVERY_FRIDAY: '0 0 * * 5',
  EVERY_WEEKDAY: '0 0 * * 1-5',
  EVERY_WEEKEND: '0 0 * * 0,6',
  EVERY_MONTH: '0 0 1 * *',
  EVERY_YEAR: '0 0 1 1 *',
};
