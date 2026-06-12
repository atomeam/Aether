/**
 * Operations Package
 * 
 * Task queue, retries, backoff, circuit breaker.
 * Makes the agent system robust.
 */

import { EventEmitter } from 'events';

// ============ Retry with Backoff ============

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  attempts: number;
  result?: T;
  error?: string;
  totalTime: number;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
  } = options;

  const startTime = Date.now();
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const result = await fn();
      return {
        success: true,
        attempts: attempt,
        result,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error as Error;
      
      if (attempt >= maxAttempts) {
        break;
      }
      
      // Calculate delay with backoff
      let delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
      
      // Add jitter (0.5 to 1.5 of delay)
      if (jitter) {
        delay = delay * (0.5 + Math.random());
      }
      
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return {
    success: false,
    attempts: attempt,
    error: lastError?.message,
    totalTime: Date.now() - startTime,
  };
}

// ============ Circuit Breaker ============

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',        // Failing, reject calls
  HALF_OPEN = 'half-open', // Testing if recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;  // Failures before opening
  successThreshold?: number;  // Successes to close
  timeout?: number;           // Time before half-open
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private nextAttempt = 0;
  
  constructor(private options: CircuitBreakerOptions = {}) {
    super();
    const {
      failureThreshold = 5,
      successThreshold = 2,
      timeout = 30000,
    } = options;
    
    this.options = { failureThreshold, successThreshold, timeout };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
      this.emit('stateChange', this.state);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold!) {
        this.state = CircuitState.CLOSED;
        this.emit('stateChange', this.state);
      }
    }
  }

  private onFailure() {
    this.successes = 0;
    this.failures++;
    
    if (this.state === CircuitState.HALF_OPEN || 
        this.failures >= this.options.failureThreshold!) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.timeout!;
      this.emit('stateChange', this.state);
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
  }
}

// ============ Simple Task Queue ============

export interface Task<T = unknown> {
  id: string;
  data: T;
  priority?: number;
  createdAt: number;
  attempts: number;
  maxAttempts?: number;
}

export type TaskHandler<T> = (task: Task<T>) => Promise<void>;

export class TaskQueue extends EventEmitter {
  private queue: Task<unknown>[] = [];
  private running = 0;
  private paused = false;

  constructor(private concurrency = 1) {
    super();
  }

  enqueue<T>(data: T, options?: { id?: string; priority?: number; maxAttempts?: number }): string {
    const task: Task<T> = {
      id: options?.id || crypto.randomUUID(),
      data,
      priority: options?.priority ?? 0,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
    };

    // Insert by priority (higher = first)
    const index = this.queue.findIndex(t => (t.priority || 0) < task.priority!);
    if (index === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(index, 0, task);
    }

    this.emit('enqueue', task);
    this.process();
    
    return task.id;
  }

  private async process() {
    if (this.paused || this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift()!;
    this.running++;
    this.emit('start', task);

    try {
      await this.executeHandler(task);
      this.emit('complete', task);
    } catch (error) {
      task.attempts++;
      
      if (task.attempts < (task.maxAttempts ?? 3)) {
        // Re-queue with backoff
        setTimeout(() => {
          this.queue.unshift(task);
          this.process();
        }, 1000 * task.attempts);
      } else {
        this.emit('failed', task, error);
      }
    }

    this.running--;
    this.process();
  }

  private executeHandler(task: Task<unknown>) {
    return this.handler?.(task);
  }

  setHandler<T>(handler: TaskHandler<T>) {
    this.handler = handler as TaskHandler<unknown>;
  }

  private handler?: TaskHandler<unknown>;

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.process();
  }

  size() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

import crypto from 'crypto';