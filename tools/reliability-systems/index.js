/**
 * Reliability Systems - Main Export
 * Exports all reliability and resilience systems for easy integration
 */

const { DeadLetterQueue } = require('./dead-letter-queue');
const { RetryBackoffHandler } = require('./retry-backoff');
const { CircuitBreaker, CircuitBreakerRegistry } = require('./circuit-breaker');
const { DistributedTracing } = require('./distributed-tracing');
const { MetricsCollector, MetricsRegistry } = require('./metrics-dashboard');
const { IdempotencyKeys, IdempotencyKeysRegistry } = require('./idempotency-keys');
const { ReliabilitySystemTester } = require('./test-all-systems');

// Cloudflare-native systems (for production serverless deployment)
const { CloudflareDeadLetterQueue } = require('./cloudflare-dead-letter-queue');
const { CloudflareMetricsCollector } = require('./cloudflare-metrics-dashboard');
const { CloudflareDistributedTracing } = require('./cloudflare-distributed-tracing');
const { persistence } = require('./cloudflare-persistence');

module.exports = {
  // JSON-based systems (for local development)
  DeadLetterQueue,
  RetryBackoffHandler,
  CircuitBreaker,
  CircuitBreakerRegistry,
  DistributedTracing,
  MetricsCollector,
  MetricsRegistry,
  IdempotencyKeys,
  IdempotencyKeysRegistry,
  
  // Cloudflare-native systems (for production serverless deployment)
  CloudflareDeadLetterQueue,
  CloudflareMetricsCollector,
  CloudflareDistributedTracing,
  persistence,
  
  // Testing
  ReliabilitySystemTester,
  
  // Convenience factory for creating all systems (JSON-based)
  createReliabilityStack: (serviceName = 'default') => {
    return {
      deadLetterQueue: new DeadLetterQueue(),
      retryHandler: new RetryBackoffHandler(),
      circuitRegistry: new CircuitBreakerRegistry(),
      tracing: new DistributedTracing(),
      metricsRegistry: new MetricsRegistry(),
      metricsCollector: new MetricsRegistry().getMetricsCollector(serviceName),
      idempotencyRegistry: new IdempotencyKeysRegistry()
    };
  },
  
  // Convenience factory for creating Cloudflare-native systems
  createCloudflareReliabilityStack: (serviceName = 'default') => {
    return {
      deadLetterQueue: new CloudflareDeadLetterQueue(),
      retryHandler: new RetryBackoffHandler(),
      circuitRegistry: new CircuitBreakerRegistry(),
      tracing: new CloudflareDistributedTracing(),
      metricsRegistry: new MetricsRegistry(),
      metricsCollector: new CloudflareMetricsCollector(serviceName),
      idempotencyRegistry: new IdempotencyKeysRegistry(),
      persistence
    };
  }
};
