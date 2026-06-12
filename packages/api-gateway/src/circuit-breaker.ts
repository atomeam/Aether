/**
 * API Gateway Circuit Breaker
 * 
 * Implements circuit breaker pattern to prevent cascading failures.
 */

import type {
  CircuitBreakerConfig,
  CircuitBreakerState,
} from './types.js';

export class CircuitBreaker {
  private config: Required<CircuitBreakerConfig>;
  private state: CircuitBreakerState = {
    state: 'closed',
    failureCount: 0,
    successCount: 0,
  };
  private monitoringWindow: number[] = [];

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      threshold: config.threshold,
      timeout: config.timeout,
      resetTimeout: config.resetTimeout,
      monitoringPeriod: config.monitoringPeriod || 60000,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.state.lastSuccessTime = Date.now();
    this.state.successCount++;

    if (this.state.state === 'half-open') {
      // If successful in half-open, close the circuit
      this.transitionToClosed();
    } else if (this.state.state === 'closed') {
      // Reset failure count on success in closed state
      this.state.failureCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.state.lastFailureTime = Date.now();
    this.state.failureCount++;
    this.state.successCount = 0;

    // Add to monitoring window
    this.monitoringWindow.push(Date.now());
    this.cleanupMonitoringWindow();

    // Check if threshold exceeded
    if (this.state.state === 'closed' && this.shouldTrip()) {
      this.transitionToOpen();
    } else if (this.state.state === 'half-open') {
      // If failed in half-open, open the circuit again
      this.transitionToOpen();
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.transitionToOpen();
  }

  /**
   * Manually close the circuit
   */
  close(): void {
    this.transitionToClosed();
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = {
      state: 'closed',
      failureCount: 0,
      successCount: 0,
    };
    this.monitoringWindow = [];
  }

  /**
   * Check if circuit should trip
   */
  private shouldTrip(): boolean {
    // Check failure count in monitoring window
    const now = Date.now();
    const windowStart = now - this.config.monitoringPeriod;
    const failuresInWindow = this.monitoringWindow.filter(
      time => time >= windowStart
    ).length;

    return failuresInWindow >= this.config.threshold;
  }

  /**
   * Check if should attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.state.lastFailureTime) return false;
    return Date.now() - this.state.lastFailureTime >= this.config.resetTimeout;
  }

  /**
   * Transition to open state
   */
  private transitionToOpen(): void {
    this.state.state = 'open';
    this.state.lastFailureTime = Date.now();
  }

  /**
   * Transition to closed state
   */
  private transitionToClosed(): void {
    this.state.state = 'closed';
    this.state.failureCount = 0;
    this.state.successCount = 0;
    this.monitoringWindow = [];
  }

  /**
   * Transition to half-open state
   */
  private transitionToHalfOpen(): void {
    this.state.state = 'half-open';
    this.state.successCount = 0;
  }

  /**
   * Cleanup old entries from monitoring window
   */
  private cleanupMonitoringWindow(): void {
    const now = Date.now();
    const windowStart = now - this.config.monitoringPeriod;
    this.monitoringWindow = this.monitoringWindow.filter(
      time => time >= windowStart
    );
  }
}
