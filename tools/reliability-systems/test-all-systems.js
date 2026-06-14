/**
 * Comprehensive Test Suite for All Reliability Systems
 * Tests Dead-letter Queue, Retry Backoff, Circuit Breaker, Distributed Tracing, and Metrics Dashboard
 */

const { DeadLetterQueue } = require('./dead-letter-queue');
const { RetryBackoffHandler } = require('./retry-backoff');
const { CircuitBreaker, CircuitBreakerRegistry } = require('./circuit-breaker');
const { DistributedTracing } = require('./distributed-tracing');
const { MetricsCollector, MetricsRegistry } = require('./metrics-dashboard');

class ReliabilitySystemTester {
  constructor() {
    this.dlq = new DeadLetterQueue();
    this.retryHandler = new RetryBackoffHandler();
    this.circuitRegistry = new CircuitBreakerRegistry();
    this.tracing = new DistributedTracing();
    this.metricsRegistry = new MetricsRegistry();
    
    this.testResults = {
      dlq: { passed: 0, failed: 0 },
      retry: { passed: 0, failed: 0 },
      circuit: { passed: 0, failed: 0 },
      tracing: { passed: 0, failed: 0 },
      metrics: { passed: 0, failed: 0 }
    };
  }

  // Test Dead-letter Queue
  async testDeadLetterQueue() {
    console.log('\n🧪 Testing Dead-letter Queue System...');
    
    try {
      // Test 1: Add failed job
      const testJob = { id: 'test-job-1', data: 'test data' };
      const testError = new Error('Test error');
      const deadLetterJob = await this.dlq.addFailedJob(testJob, testError, { context: 'test' });
      
      if (deadLetterJob && deadLetterJob.id) {
        console.log('✅ Test 1 passed: Failed job added to DLQ');
        this.testResults.dlq.passed++;
      } else {
        console.log('❌ Test 1 failed: Failed job not added to DLQ');
        this.testResults.dlq.failed++;
      }
      
      // Test 2: Get failed jobs
      const failedJobs = this.dlq.getFailedJobs();
      if (failedJobs.length > 0) {
        console.log('✅ Test 2 passed: Failed jobs retrieved');
        this.testResults.dlq.passed++;
      } else {
        console.log('❌ Test 2 failed: Failed jobs not retrieved');
        this.testResults.dlq.failed++;
      }
      
      // Test 3: Replay job
      const replayResult = await this.dlq.replayJob(deadLetterJob.id, async (job) => {
        return { success: true, replayed: true };
      });
      
      if (replayResult.success) {
        console.log('✅ Test 3 passed: Job replayed successfully');
        this.testResults.dlq.passed++;
      } else {
        console.log('❌ Test 3 failed: Job replay failed');
        this.testResults.dlq.failed++;
      }
      
      // Test 4: Get statistics
      const stats = this.dlq.getStatistics();
      if (stats.totalFailed > 0 && stats.totalReplayed > 0) {
        console.log('✅ Test 4 passed: Statistics retrieved');
        this.testResults.dlq.passed++;
      } else {
        console.log('❌ Test 4 failed: Statistics not retrieved');
        this.testResults.dlq.failed++;
      }
      
    } catch (error) {
      console.error('❌ Dead-letter Queue test failed:', error.message);
      this.testResults.dlq.failed += 4;
    }
  }

  // Test Retry Backoff Handler
  async testRetryBackoff() {
    console.log('\n🧪 Testing Retry Backoff Handler...');
    
    try {
      // Test 1: Successful operation
      let successCount = 0;
      const successOperation = async () => {
        successCount++;
        return { success: true };
      };
      
      const result1 = await this.retryHandler.executeWithRetry(successOperation);
      if (result1.success && successCount === 1) {
        console.log('✅ Test 1 passed: Successful operation executed');
        this.testResults.retry.passed++;
      } else {
        console.log('❌ Test 1 failed: Successful operation not executed');
        this.testResults.retry.failed++;
      }
      
      // Test 2: Retry on failure
      let failureCount = 0;
      const failureOperation = async () => {
        failureCount++;
        if (failureCount < 2) {
          throw new Error('Simulated failure');
        }
        return { success: true };
      };
      
      const result2 = await this.retryHandler.executeWithRetry(failureOperation);
      if (result2.success && failureCount === 2) {
        console.log('✅ Test 2 passed: Retry on failure works');
        this.testResults.retry.passed++;
      } else {
        console.log('❌ Test 2 failed: Retry on failure failed');
        this.testResults.retry.failed++;
      }
      
      // Test 3: Max attempts exceeded
      let maxFailureCount = 0;
      const maxFailureOperation = async () => {
        maxFailureCount++;
        throw new Error('Always fails');
      };
      
      try {
        await this.retryHandler.executeWithRetry(maxFailureOperation);
        console.log('❌ Test 3 failed: Should have thrown error');
        this.testResults.retry.failed++;
      } catch (error) {
        if (maxFailureCount === 3) {
          console.log('✅ Test 3 passed: Max attempts exceeded');
          this.testResults.retry.passed++;
        } else {
          console.log('❌ Test 3 failed: Max attempts not reached');
          this.testResults.retry.failed++;
        }
      }
      
      // Test 4: Get statistics
      const stats = this.retryHandler.getStatistics();
      if (stats.totalAttempts > 0) {
        console.log('✅ Test 4 passed: Statistics retrieved');
        this.testResults.retry.passed++;
      } else {
        console.log('❌ Test 4 failed: Statistics not retrieved');
        this.testResults.retry.failed++;
      }
      
    } catch (error) {
      console.error('❌ Retry Backoff test failed:', error.message);
      this.testResults.retry.failed += 4;
    }
  }

  // Test Circuit Breaker
  async testCircuitBreaker() {
    console.log('\n🧪 Testing Circuit Breaker System...');
    
    try {
      const cb = this.circuitRegistry.getCircuitBreaker('test-service');
      
      // Test 1: Successful operation
      let successCount = 0;
      const successOperation = async () => {
        successCount++;
        return { success: true };
      };
      
      const result1 = await cb.execute(successOperation);
      if (result1.success && successCount === 1) {
        console.log('✅ Test 1 passed: Successful operation executed');
        this.testResults.circuit.passed++;
      } else {
        console.log('❌ Test 1 failed: Successful operation not executed');
        this.testResults.circuit.failed++;
      }
      
      // Test 2: Circuit breaker trips
      let failureCount = 0;
      const failureOperation = async () => {
        failureCount++;
        throw new Error('Simulated failure');
      };
      
      // Configure for quick testing
      cb.configure({ failureThreshold: 3 });
      
      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(failureOperation);
        } catch (error) {
          // Expected to fail
        }
      }
      
      const state = cb.getState();
      if (state.state === 'open') {
        console.log('✅ Test 2 passed: Circuit breaker tripped');
        this.testResults.circuit.passed++;
      } else {
        console.log('❌ Test 2 failed: Circuit breaker not tripped');
        this.testResults.circuit.failed++;
      }
      
      // Test 3: Circuit breaker blocks calls
      try {
        await cb.execute(successOperation);
        console.log('❌ Test 3 failed: Circuit breaker should block calls');
        this.testResults.circuit.failed++;
      } catch (error) {
        if (error.message.includes('Circuit breaker is OPEN')) {
          console.log('✅ Test 3 passed: Circuit breaker blocks calls');
          this.testResults.circuit.passed++;
        } else {
          console.log('❌ Test 3 failed: Wrong error message');
          this.testResults.circuit.failed++;
        }
      }
      
      // Test 4: Get statistics
      const stats = cb.getStatistics();
      if (stats.totalCalls > 0) {
        console.log('✅ Test 4 passed: Statistics retrieved');
        this.testResults.circuit.passed++;
      } else {
        console.log('❌ Test 4 failed: Statistics not retrieved');
        this.testResults.circuit.failed++;
      }
      
      // Reset for next tests
      cb.reset();
      
    } catch (error) {
      console.error('❌ Circuit Breaker test failed:', error.message);
      this.testResults.circuit.failed += 4;
    }
  }

  // Test Distributed Tracing
  async testDistributedTracing() {
    console.log('\n🧪 Testing Distributed Tracing System...');
    
    try {
      // Test 1: Start trace
      const traceId = this.tracing.startTrace('test-operation', { metadata: 'test' });
      if (traceId) {
        console.log('✅ Test 1 passed: Trace started');
        this.testResults.tracing.passed++;
      } else {
        console.log('❌ Test 1 failed: Trace not started');
        this.testResults.tracing.failed++;
      }
      
      // Test 2: Start span
      const spanId = this.tracing.startSpan('sub-operation', { context: 'test' });
      if (spanId) {
        console.log('✅ Test 2 passed: Span started');
        this.testResults.tracing.passed++;
      } else {
        console.log('❌ Test 2 failed: Span not started');
        this.testResults.tracing.failed++;
      }
      
      // Test 3: End span
      this.tracing.endSpan(spanId);
      const trace = this.tracing.getTrace(traceId);
      if (trace && trace.spans.length > 0 && trace.spans[0].status === 'completed') {
        console.log('✅ Test 3 passed: Span ended');
        this.testResults.tracing.passed++;
      } else {
        console.log('❌ Test 3 failed: Span not ended');
        this.testResults.tracing.failed++;
      }
      
      // Test 4: End trace
      this.tracing.endTrace();
      const completedTrace = this.tracing.getTrace(traceId);
      if (completedTrace && completedTrace.status === 'completed') {
        console.log('✅ Test 4 passed: Trace ended');
        this.testResults.tracing.passed++;
      } else {
        console.log('❌ Test 4 failed: Trace not ended');
        this.testResults.tracing.failed++;
      }
      
      // Test 5: Get statistics
      const stats = this.tracing.getSystemStatistics();
      if (stats.totalTraces > 0) {
        console.log('✅ Test 5 passed: Statistics retrieved');
        this.testResults.tracing.passed++;
      } else {
        console.log('❌ Test 5 failed: Statistics not retrieved');
        this.testResults.tracing.failed++;
      }
      
    } catch (error) {
      console.error('❌ Distributed Tracing test failed:', error.message);
      this.testResults.tracing.failed += 5;
    }
  }

  // Test Metrics Dashboard
  async testMetricsDashboard() {
    console.log('\n🧪 Testing Metrics Dashboard System...');
    
    try {
      const collector = this.metricsRegistry.getMetricsCollector('test-service');
      
      // Test 1: Record operation
      collector.recordOperation('test-operation', true, 150, { context: 'test' });
      const stats = collector.getAllMetrics();
      if (stats.stats.totalOperations > 0) {
        console.log('✅ Test 1 passed: Operation recorded');
        this.testResults.metrics.passed++;
      } else {
        console.log('❌ Test 1 failed: Operation not recorded');
        this.testResults.metrics.failed++;
      }
      
      // Test 2: Increment counter
      collector.incrementCounter('test-counter', 1, { tag: 'test' });
      const counterValue = collector.getCounter('test-counter', { tag: 'test' });
      if (counterValue > 0) {
        console.log('✅ Test 2 passed: Counter incremented');
        this.testResults.metrics.passed++;
      } else {
        console.log('❌ Test 2 failed: Counter not incremented');
        this.testResults.metrics.failed++;
      }
      
      // Test 3: Set gauge
      collector.setGauge('test-gauge', 42, { tag: 'test' });
      const gaugeValue = collector.getGauge('test-gauge', { tag: 'test' });
      if (gaugeValue === 42) {
        console.log('✅ Test 3 passed: Gauge set');
        this.testResults.metrics.passed++;
      } else {
        console.log('❌ Test 3 failed: Gauge not set');
        this.testResults.metrics.failed++;
      }
      
      // Test 4: Record timing
      collector.recordTiming('test-timing', 250, { tag: 'test' });
      const histogram = collector.getHistogram('test-timing', { tag: 'test' });
      if (histogram && histogram.count > 0) {
        console.log('✅ Test 4 passed: Timing recorded');
        this.testResults.metrics.passed++;
      } else {
        console.log('❌ Test 4 failed: Timing not recorded');
        this.testResults.metrics.failed++;
      }
      
      // Test 5: Get dashboard data
      const dashboard = collector.getDashboardData();
      if (dashboard && dashboard.summary) {
        console.log('✅ Test 5 passed: Dashboard data retrieved');
        this.testResults.metrics.passed++;
      } else {
        console.log('❌ Test 5 failed: Dashboard data not retrieved');
        this.testResults.metrics.failed++;
      }
      
    } catch (error) {
      console.error('❌ Metrics Dashboard test failed:', error.message);
      this.testResults.metrics.failed += 5;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Reliability Systems Test Suite...');
    console.log('=' .repeat(60));
    
    await this.testDeadLetterQueue();
    await this.testRetryBackoff();
    await this.testCircuitBreaker();
    await this.testDistributedTracing();
    await this.testMetricsDashboard();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary:');
    console.log('=' .repeat(60));
    
    const totalPassed = Object.values(this.testResults).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, r) => sum + r.failed, 0);
    const totalTests = totalPassed + totalFailed;
    
    console.log(`\n📋 Dead-letter Queue: ${this.testResults.dlq.passed}/${this.testResults.dlq.passed + this.testResults.dlq.failed} passed`);
    console.log(`📋 Retry Backoff: ${this.testResults.retry.passed}/${this.testResults.retry.passed + this.testResults.retry.failed} passed`);
    console.log(`📋 Circuit Breaker: ${this.testResults.circuit.passed}/${this.testResults.circuit.passed + this.testResults.circuit.failed} passed`);
    console.log(`📋 Distributed Tracing: ${this.testResults.tracing.passed}/${this.testResults.tracing.passed + this.testResults.tracing.failed} passed`);
    console.log(`📋 Metrics Dashboard: ${this.testResults.metrics.passed}/${this.testResults.metrics.passed + this.testResults.metrics.failed} passed`);
    
    console.log(`\n🎯 Total: ${totalPassed}/${totalTests} tests passed (${((totalPassed / totalTests) * 100).toFixed(2)}%)`);
    
    if (totalPassed === totalTests) {
      console.log('\n🎉 All tests passed! Reliability systems are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the logs above.');
    }
    
    return {
      totalPassed,
      totalFailed,
      totalTests,
      successRate: (totalPassed / totalTests) * 100,
      details: this.testResults
    };
  }
}

// CLI Interface
async function main() {
  const tester = new ReliabilitySystemTester();
  const results = await tester.runAllTests();
  
  process.exit(results.totalFailed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  ReliabilitySystemTester
};
