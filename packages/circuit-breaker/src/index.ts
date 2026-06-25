/**
 * @aether/circuit-breaker - Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by failing fast when a service is down.
 * Implements the circuit breaker pattern with configurable thresholds.
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  resetTimeout: number;          // Time in ms before attempting to close
  monitoringPeriod: number;      // Time window for failure counting
  expectedResponseTime: number;  // Expected response time in ms
}

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  nextAttemptTime: number | null;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private failureWindow: number[] = [];

  constructor(public config: CircuitBreakerConfig) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if circuit should be reset
    this.checkReset(now);

    // Fail fast if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (now < (this.nextAttemptTime || 0)) {
        throw new Error('Circuit breaker is OPEN - failing fast');
      }
      // Attempt to close circuit
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      this.onSuccess(now);
      return result;
    } catch (error) {
      this.onFailure(now);
      throw error;
    }
  }

  /**
   * Record a successful execution
   */
  private onSuccess(now: number): void {
    this.successCount++;
    this.lastSuccessTime = now;
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Circuit recovered, close it
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.failureWindow = [];
    }
  }

  /**
   * Record a failed execution
   */
  private onFailure(now: number): void {
    this.failureCount++;
    this.lastFailureTime = now;
    
    // Add to failure window
    this.failureWindow.push(now);
    
    // Clean old failures outside monitoring period
    this.failureWindow = this.failureWindow.filter(
      time => now - time < this.config.monitoringPeriod
    );

    // Check if threshold exceeded
    if (this.failureWindow.length >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = now + this.config.resetTimeout;
    }
  }

  /**
   * Check if circuit should be reset
   */
  private checkReset(now: number): void {
    if (this.state === CircuitState.OPEN && this.nextAttemptTime && now >= this.nextAttemptTime) {
      this.state = CircuitState.HALF_OPEN;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;
    this.failureWindow = [];
  }

  /**
   * Force the circuit open
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
  }

  /**
   * Force the circuit closed
   */
  forceClose(): void {
    this.reset();
  }
}

// Pre-configured circuit breakers
export const strictCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 60000,      // 1 minute
  monitoringPeriod: 30000,  // 30 seconds
  expectedResponseTime: 1000
});

export const standardCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 120000,     // 2 minutes
  monitoringPeriod: 60000,  // 1 minute
  expectedResponseTime: 2000
});

export const looseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 10,
  resetTimeout: 300000,     // 5 minutes
  monitoringPeriod: 120000, // 2 minutes
  expectedResponseTime: 5000
});

// Circuit breaker registry for multiple services
export const circuitBreakerRegistry = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a specific service
 */
export function getCircuitBreaker(serviceName: string, config?: CircuitBreakerConfig): CircuitBreaker {
  let breaker = circuitBreakerRegistry.get(serviceName);
  
  if (!breaker) {
    breaker = new CircuitBreaker(config || standardCircuitBreaker.config);
    circuitBreakerRegistry.set(serviceName, breaker);
  }
  
  return breaker;
}

/**
 * Execute a function with a named circuit breaker
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  config?: CircuitBreakerConfig
): Promise<T> {
  const breaker = getCircuitBreaker(serviceName, config);
  return breaker.execute(fn);
}