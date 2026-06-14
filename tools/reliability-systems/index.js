/**
 * Reliability Systems - Main Export
 * Exports all reliability and resilience systems for easy integration
 */

const { DeadLetterQueue } = require('./dead-letter-queue');
const { RetryBackoffHandler } = require('./retry-backoff');
const { CircuitBreaker, CircuitBreakerRegistry } = require('./circuit-breaker');
const { DistributedTracing } = require('./distributed-tracing');
const { MetricsCollector, MetricsRegistry } = require('./metrics-dashboard');
const { ReliabilitySystemTester } = require('./test-all-systems');

module.exports = {
  // Individual systems
  DeadLetterQueue,
  RetryBackoffHandler,
  CircuitBreaker,
  CircuitBreakerRegistry,
  DistributedTracing,
  MetricsCollector,
  MetricsRegistry,
  
  // Testing
  ReliabilitySystemTester,
  
  // Convenience factory for creating all systems
  createReliabilityStack: (serviceName = 'default') => {
    return {
      deadLetterQueue: new DeadLetterQueue(),
      retryHandler: new RetryBackoffHandler(),
      circuitRegistry: new CircuitBreakerRegistry(),
      tracing: new DistributedTracing(),
      metricsRegistry: new MetricsRegistry(),
      metricsCollector: new MetricsRegistry().getMetricsCollector(serviceName)
    };
  }
};
