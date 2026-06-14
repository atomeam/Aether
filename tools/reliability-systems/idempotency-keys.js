/**
 * Idempotency Keys System
 * Prevents duplicate actions when a step re-runs - pairs with retry + DLQ
 * Critical for preventing double-firing Stripe/Wix or GitHub actions
 */

class IdempotencyKeys {
  constructor() {
    this.keys = new Map();
    this.config = {
      ttl: 3600000, // 1 hour default TTL
      maxKeys: 10000
    };
    
    this.stats = {
      totalChecks: 0,
      totalHits: 0,
      totalMisses: 0,
      totalDuplicates: 0,
      totalExpired: 0
    };
  }

  // Generate idempotency key
  async generateKey(operation, context = {}) {
    const keyData = {
      operation,
      context,
      timestamp: Date.now()
    };
    
    const keyString = JSON.stringify(keyData);
    
    // Use Web Crypto API for SHA-256 (Cloudflare Workers compatible)
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  // Check if operation is duplicate
  isDuplicate(idempotencyKey) {
    this.stats.totalChecks++;
    
    const record = this.keys.get(idempotencyKey);
    
    if (!record) {
      this.stats.totalMisses++;
      return { duplicate: false, record: null };
    }
    
    // Check if expired
    if (Date.now() > record.expiresAt) {
      this.keys.delete(idempotencyKey);
      this.stats.totalExpired++;
      return { duplicate: false, record: null };
    }
    
    this.stats.totalHits++;
    this.stats.totalDuplicates++;
    
    return {
      duplicate: true,
      record,
      message: 'Operation already executed with this idempotency key'
    };
  }

  // Record operation execution
  recordOperation(idempotencyKey, result, metadata = {}) {
    const record = {
      idempotencyKey,
      result,
      metadata,
      executedAt: Date.now(),
      expiresAt: Date.now() + this.config.ttl
    };
    
    this.keys.set(idempotencyKey, record);
    
    // Enforce max keys limit
    if (this.keys.size > this.config.maxKeys) {
      this.evictOldestKeys();
    }
    
    return record;
  }

  // Get operation result by idempotency key
  getResult(idempotencyKey) {
    const record = this.keys.get(idempotencyKey);
    
    if (!record) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > record.expiresAt) {
      this.keys.delete(idempotencyKey);
      this.stats.totalExpired++;
      return null;
    }
    
    return record;
  }

  // Execute operation with idempotency protection
  async executeWithIdempotency(operation, idempotencyKey, context = {}) {
    // Check for duplicate
    const duplicateCheck = this.isDuplicate(idempotencyKey);
    
    if (duplicateCheck.duplicate) {
      console.log(`🔒 Duplicate operation detected: ${idempotencyKey}`);
      return {
        idempotent: true,
        result: duplicateCheck.record.result,
        executedAt: duplicateCheck.record.executedAt,
        message: 'Returned cached result from previous execution'
      };
    }
    
    // Execute operation
    console.log(`🔓 Executing operation with idempotency key: ${idempotencyKey}`);
    const result = await operation(context);
    
    // Record execution
    this.recordOperation(idempotencyKey, result, context);
    
    return {
      idempotent: false,
      result,
      executedAt: Date.now(),
      message: 'Operation executed successfully'
    };
  }

  // Evict oldest keys when limit reached
  evictOldestKeys(count = 100) {
    const sortedKeys = Array.from(this.keys.entries())
      .sort((a, b) => a[1].executedAt - b[1].executedAt);
    
    for (let i = 0; i < Math.min(count, sortedKeys.length); i++) {
      this.keys.delete(sortedKeys[i][0]);
    }
    
    console.log(`🧹 Evicted ${Math.min(count, sortedKeys.length)} old idempotency keys`);
  }

  // Clear expired keys
  clearExpiredKeys() {
    const now = Date.now();
    let cleared = 0;
    
    this.keys.forEach((record, key) => {
      if (now > record.expiresAt) {
        this.keys.delete(key);
        cleared++;
        this.stats.totalExpired++;
      }
    });
    
    console.log(`🧹 Cleared ${cleared} expired idempotency keys`);
    
    return cleared;
  }

  // Get statistics
  getStatistics() {
    return {
      ...this.stats,
      activeKeys: this.keys.size,
      hitRate: this.stats.totalChecks > 0 
        ? (this.stats.totalHits / this.stats.totalChecks * 100).toFixed(2) 
        : 0,
      duplicateRate: this.stats.totalChecks > 0 
        ? (this.stats.totalDuplicates / this.stats.totalChecks * 100).toFixed(2) 
        : 0,
      config: this.config
    };
  }

  // Configure idempotency settings
  configure(config) {
    this.config = {
      ...this.config,
      ...config
    };
    return this.config;
  }

  // Reset statistics
  resetStatistics() {
    this.stats = {
      totalChecks: 0,
      totalHits: 0,
      totalMisses: 0,
      totalDuplicates: 0,
      totalExpired: 0
    };
  }

  // Clear all keys
  clearAllKeys() {
    console.log(`🧹 Clearing all idempotency keys (${this.keys.size} keys)`);
    this.keys.clear();
  }
}

// Idempotency Keys Registry for managing multiple operation types
class IdempotencyKeysRegistry {
  constructor() {
    this.registries = new Map();
  }

  // Get or create idempotency keys for an operation type
  getIdempotencyKeys(operationType) {
    if (!this.registries.has(operationType)) {
      this.registries.set(operationType, new IdempotencyKeys());
    }
    return this.registries.get(operationType);
  }

  // Get all statistics
  getAllStatistics() {
    const allStats = {};
    
    this.registries.forEach((registry, type) => {
      allStats[type] = registry.getStatistics();
    });
    
    return allStats;
  }

  // Clear all expired keys across all registries
  clearAllExpiredKeys() {
    let totalCleared = 0;
    
    this.registries.forEach((registry) => {
      totalCleared += registry.clearExpiredKeys();
    });
    
    return totalCleared;
  }

  // Reset all statistics
  resetAllStatistics() {
    this.registries.forEach((registry) => registry.resetStatistics());
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const registry = new IdempotencyKeysRegistry();

  switch (command) {
    case 'test':
      const idempotency = registry.getIdempotencyKeys('test-operation');
      
      console.log('🧪 Testing idempotency keys...');
      
      const testKey = await idempotency.generateKey('test-operation', { id: 123 });
      console.log(`🔑 Generated key: ${testKey}`);
      
      // First execution
      const result1 = await idempotency.executeWithIdempotency(
        async () => ({ success: true, data: 'test' }),
        testKey
      );
      console.log('✅ First execution:', result1);
      
      // Second execution (should be duplicate)
      const result2 = await idempotency.executeWithIdempotency(
        async () => ({ success: true, data: 'should-not-execute' }),
        testKey
      );
      console.log('✅ Second execution (duplicate):', result2);
      
      const stats = idempotency.getStatistics();
      console.log('📊 Statistics:', stats);
      break;

    case 'stats':
      if (args[1]) {
        const idempotency = registry.getIdempotencyKeys(args[1]);
        const stats = idempotency.getStatistics();
        console.log(`📊 Idempotency Statistics for ${args[1]}:`);
        console.log(JSON.stringify(stats, null, 2));
      } else {
        const allStats = registry.getAllStatistics();
        console.log('📊 All Idempotency Statistics:');
        console.log(JSON.stringify(allStats, null, 2));
      }
      break;

    case 'clear':
      if (args[1]) {
        const idempotency = registry.getIdempotencyKeys(args[1]);
        const cleared = idempotency.clearExpiredKeys();
        console.log(`🧹 Cleared ${cleared} expired keys for ${args[1]}`);
      } else {
        const totalCleared = registry.clearAllExpiredKeys();
        console.log(`🧹 Cleared ${totalCleared} expired keys across all registries`);
      }
      break;

    case 'reset':
      if (args[1]) {
        const idempotency = registry.getIdempotencyKeys(args[1]);
        idempotency.resetStatistics();
        console.log(`🔄 Reset statistics for ${args[1]}`);
      } else {
        registry.resetAllStatistics();
        console.log('🔄 Reset all statistics');
      }
      break;

    default:
      console.log('🔑 Idempotency Keys System');
      console.log('');
      console.log('Commands:');
      console.log('  test   - Test idempotency with duplicate detection');
      console.log('  stats  - Get idempotency statistics');
      console.log('  clear  - Clear expired keys');
      console.log('  reset  - Reset statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node idempotency-keys.js test');
      console.log('  node idempotency-keys.js stats test-operation');
      console.log('  node idempotency-keys.js clear test-operation');
      console.log('  node idempotency-keys.js reset test-operation');
      console.log('');
      console.log('Programmatic Usage:');
      console.log('  const registry = new IdempotencyKeysRegistry();');
      console.log('  const idempotency = registry.getIdempotencyKeys("operation");');
      console.log('  const key = idempotency.generateKey("operation", context);');
      console.log('  const result = await idempotency.executeWithIdempotency(operation, key, context);');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  IdempotencyKeys,
  IdempotencyKeysRegistry
};
