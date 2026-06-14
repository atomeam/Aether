/**
 * Retry + Backoff Handler
 * Auto-retries failed steps with exponential backoff and jitter
 */

class RetryBackoffHandler {
  constructor() {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      jitter: true,
      jitterAmount: 0.1 // 10% jitter
    };
    
    this.attempts = new Map();
    this.stats = {
      totalAttempts: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalRetries: 0
    };
  }

  // Execute with retry logic
  async executeWithRetry(operation, context = {}) {
    const operationId = this.generateOperationId();
    const attempts = [];
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      this.stats.totalAttempts++;
      attempts.push({
        attempt,
        timestamp: new Date().toISOString()
      });
      
      try {
        console.log(`🔄 Attempt ${attempt}/${this.config.maxAttempts} for operation: ${operationId}`);
        
        const result = await operation(context);
        
        this.stats.totalSuccess++;
        console.log(`✅ Success on attempt ${attempt}`);
        
        return {
          success: true,
          result,
          attempts,
          operationId
        };
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed: ${error.message}`);
        
        // If this is the last attempt, throw the error
        if (attempt === this.config.maxAttempts) {
          this.stats.totalFailed++;
          throw error;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        
        await this.sleep(delay);
        this.stats.totalRetries++;
      }
    }
  }

  // Calculate delay with exponential backoff and jitter
  calculateDelay(attempt) {
    // Exponential backoff: baseDelay * (multiplier ^ (attempt - 1))
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    
    // Cap at max delay
    delay = Math.min(delay, this.config.maxDelay);
    
    // Add jitter if enabled
    if (this.config.jitter) {
      const jitterAmount = delay * this.config.jitterAmount;
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay = delay + jitter;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  // Sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Configure retry settings
  configure(config) {
    this.config = {
      ...this.config,
      ...config
    };
    return this.config;
  }

  // Get statistics
  getStatistics() {
    return {
      ...this.stats,
      successRate: this.stats.totalAttempts > 0 
        ? (this.stats.totalSuccess / this.stats.totalAttempts * 100).toFixed(2) 
        : 0,
      retryRate: this.stats.totalAttempts > 0 
        ? (this.stats.totalRetries / this.stats.totalAttempts * 100).toFixed(2) 
        : 0,
      config: this.config
    };
  }

  // Reset statistics
  resetStatistics() {
    this.stats = {
      totalAttempts: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalRetries: 0
    };
    this.attempts.clear();
  }

  // Generate operation ID
  generateOperationId() {
    return `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const retryHandler = new RetryBackoffHandler();

  switch (command) {
    case 'test':
      console.log('🧪 Testing retry handler...');
      
      let failureCount = 0;
      const testOperation = async (context) => {
        failureCount++;
        if (failureCount < 2) {
          throw new Error('Simulated failure');
        }
        return { success: true, message: 'Test passed' };
      };
      
      try {
        const result = await retryHandler.executeWithRetry(testOperation);
        console.log('✅ Test completed successfully:');
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('❌ Test failed:', error.message);
      }
      
      break;

    case 'stats':
      const stats = retryHandler.getStatistics();
      console.log('📊 Retry Handler Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'configure':
      if (args[1]) {
        const config = JSON.parse(args[1]);
        const result = retryHandler.configure(config);
        console.log('⚙️  Configuration updated:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node retry-backoff.js configure <config-json>');
      }
      break;

    case 'reset':
      retryHandler.resetStatistics();
      console.log('🔄 Statistics reset');
      break;

    default:
      console.log('🔄 Retry + Backoff Handler');
      console.log('');
      console.log('Commands:');
      console.log('  test       - Test retry logic with simulated failures');
      console.log('  stats      - Get statistics');
      console.log('  configure  - Configure retry settings');
      console.log('  reset      - Reset statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node retry-backoff.js test');
      console.log('  node retry-backoff.js stats');
      console.log('  node retry-backoff.js configure \'{"maxAttempts":5}\'');
      console.log('  node retry-backoff.js reset');
      console.log('');
      console.log('Programmatic Usage:');
      console.log('  const retryHandler = new RetryBackoffHandler();');
      console.log('  const result = await retryHandler.executeWithRetry(operation, context);');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  RetryBackoffHandler
};
