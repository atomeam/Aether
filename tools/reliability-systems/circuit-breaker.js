/**
 * Circuit Breaker System
 * Trips off a failing dependency so it doesn't cascade
 */

class CircuitBreaker {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.state = 'closed'; // closed, open, half-open
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      halfOpenMaxCalls: 3
    };
    
    this.stats = {
      totalCalls: 0,
      totalSuccess: 0,
      totalFailure: 0,
      totalTripped: 0,
      totalRecovered: 0
    };
  }

  // Execute operation with circuit breaker
  async execute(operation, context = {}) {
    this.stats.totalCalls++;
    
    // Check if circuit is open
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        console.log(`🔴 Circuit breaker OPEN for ${this.serviceName} - blocking call`);
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
      }
    }
    
    try {
      console.log(`🟢 Executing operation for ${this.serviceName} (state: ${this.state})`);
      
      const result = await operation(context);
      
      // Record success
      this.recordSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure();
      
      throw error;
    }
  }

  // Record success
  recordSuccess() {
    this.successCount++;
    this.lastSuccessTime = new Date();
    this.stats.totalSuccess++;
    
    if (this.state === 'half-open') {
      console.log(`🟡 Half-open success for ${this.serviceName} (${this.successCount}/${this.config.successThreshold})`);
      
      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }
  }

  // Record failure
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.stats.totalFailure++;
    
    console.log(`❌ Failure recorded for ${this.serviceName} (${this.failureCount}/${this.config.failureThreshold})`);
    
    if (this.state === 'closed' && this.failureCount >= this.config.failureThreshold) {
      this.transitionToOpen();
    } else if (this.state === 'half-open') {
      this.transitionToOpen();
    }
  }

  // Check if should attempt reset
  shouldAttemptReset() {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.timeout;
  }

  // Transition to open
  transitionToOpen() {
    console.log(`🔴 Circuit breaker OPENING for ${this.serviceName}`);
    this.state = 'open';
    this.failureCount = 0;
    this.successCount = 0;
    this.stats.totalTripped++;
  }

  // Transition to closed
  transitionToClosed() {
    console.log(`🟢 Circuit breaker CLOSING for ${this.serviceName}`);
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.stats.totalRecovered++;
  }

  // Transition to half-open
  transitionToHalfOpen() {
    console.log(`🟡 Circuit breaker HALF-OPEN for ${this.serviceName}`);
    this.state = 'half-open';
    this.failureCount = 0;
    this.successCount = 0;
  }

  // Get current state
  getState() {
    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      config: this.config
    };
  }

  // Get statistics
  getStatistics() {
    return {
      ...this.stats,
      state: this.state,
      failureRate: this.stats.totalCalls > 0 
        ? (this.stats.totalFailure / this.stats.totalCalls * 100).toFixed(2) 
        : 0,
      successRate: this.stats.totalCalls > 0 
        ? (this.stats.totalSuccess / this.stats.totalCalls * 100).toFixed(2) 
        : 0
    };
  }

  // Configure circuit breaker
  configure(config) {
    this.config = {
      ...this.config,
      ...config
    };
    return this.config;
  }

  // Reset circuit breaker
  reset() {
    console.log(`🔄 Resetting circuit breaker for ${this.serviceName}`);
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
  }
}

// Circuit Breaker Registry for managing multiple services
class CircuitBreakerRegistry {
  constructor() {
    this.circuitBreakers = new Map();
  }

  // Get or create circuit breaker for a service
  getCircuitBreaker(serviceName) {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, new CircuitBreaker(serviceName));
    }
    return this.circuitBreakers.get(serviceName);
  }

  // Get all circuit breaker states
  getAllStates() {
    const states = {};
    this.circuitBreakers.forEach((cb, name) => {
      states[name] = cb.getState();
    });
    return states;
  }

  // Get all statistics
  getAllStatistics() {
    const stats = {};
    this.circuitBreakers.forEach((cb, name) => {
      stats[name] = cb.getStatistics();
    });
    return stats;
  }

  // Reset all circuit breakers
  resetAll() {
    this.circuitBreakers.forEach((cb) => cb.reset());
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const registry = new CircuitBreakerRegistry();

  switch (command) {
    case 'test':
      const serviceName = args[1] || 'test-service';
      const cb = registry.getCircuitBreaker(serviceName);
      
      console.log(`🧪 Testing circuit breaker for ${serviceName}...`);
      
      let testCallCount = 0;
      const testOperation = async (context) => {
        testCallCount++;
        if (testCallCount <= 6) {
          throw new Error('Simulated failure');
        }
        return { success: true, message: 'Test passed' };
      };
      
      try {
        const result = await cb.execute(testOperation);
        console.log('✅ Test completed successfully:');
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('❌ Test failed:', error.message);
      }
      
      console.log('📊 Final state:');
      console.log(JSON.stringify(cb.getState(), null, 2));
      break;

    case 'state':
      if (args[1]) {
        const cb = registry.getCircuitBreaker(args[1]);
        const state = cb.getState();
        console.log(`📊 Circuit Breaker State for ${args[1]}:`);
        console.log(JSON.stringify(state, null, 2));
      } else {
        const allStates = registry.getAllStates();
        console.log('📊 All Circuit Breaker States:');
        console.log(JSON.stringify(allStates, null, 2));
      }
      break;

    case 'stats':
      if (args[1]) {
        const cb = registry.getCircuitBreaker(args[1]);
        const stats = cb.getStatistics();
        console.log(`📊 Circuit Breaker Statistics for ${args[1]}:`);
        console.log(JSON.stringify(stats, null, 2));
      } else {
        const allStats = registry.getAllStatistics();
        console.log('📊 All Circuit Breaker Statistics:');
        console.log(JSON.stringify(allStats, null, 2));
      }
      break;

    case 'configure':
      if (args[1] && args[2]) {
        const cb = registry.getCircuitBreaker(args[1]);
        const config = JSON.parse(args[2]);
        const result = cb.configure(config);
        console.log(`⚙️  Configuration updated for ${args[1]}:`);
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node circuit-breaker.js configure <service-name> <config-json>');
      }
      break;

    case 'reset':
      if (args[1]) {
        const cb = registry.getCircuitBreaker(args[1]);
        cb.reset();
        console.log(`🔄 Reset circuit breaker for ${args[1]}`);
      } else {
        registry.resetAll();
        console.log('🔄 Reset all circuit breakers');
      }
      break;

    default:
      console.log('🔌 Circuit Breaker System');
      console.log('');
      console.log('Commands:');
      console.log('  test       - Test circuit breaker with simulated failures');
      console.log('  state      - Get circuit breaker state');
      console.log('  stats      - Get circuit breaker statistics');
      console.log('  configure  - Configure circuit breaker');
      console.log('  reset      - Reset circuit breaker');
      console.log('');
      console.log('Examples:');
      console.log('  node circuit-breaker.js test my-service');
      console.log('  node circuit-breaker.js state my-service');
      console.log('  node circuit-breaker.js stats my-service');
      console.log('  node circuit-breaker.js configure my-service \'{"failureThreshold":10}\'');
      console.log('  node circuit-breaker.js reset my-service');
      console.log('');
      console.log('Programmatic Usage:');
      console.log('  const registry = new CircuitBreakerRegistry();');
      console.log('  const cb = registry.getCircuitBreaker("my-service");');
      console.log('  const result = await cb.execute(operation, context);');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  CircuitBreaker,
  CircuitBreakerRegistry
};
