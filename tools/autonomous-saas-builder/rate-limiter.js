/**
 * Rate Limiting System
 * Prevents excessive autonomous actions
 */

const fs = require('fs');
const path = require('path');

class RateLimitingSystem {
  constructor() {
    this.limits = {
      deployments: { max: 3, period: 'day', current: 0, history: [] },
      emails: { max: 100, period: 'hour', current: 0, history: [] },
      financialActions: { max: 10, period: 'day', current: 0, history: [] },
      apiCalls: { max: 1000, period: 'hour', current: 0, history: [] },
      builds: { max: 5, period: 'day', current: 0, history: [] }
    };
    
    this.dataPath = path.resolve(__dirname, 'rate-limits.json');
    this.loadRateLimits();
  }

  // Check if action is allowed
  async checkLimit(actionType) {
    const limit = this.limits[actionType];
    
    if (!limit) {
      console.log(`⚠️  Unknown action type: ${actionType}`);
      return { allowed: true, reason: 'No limit configured' };
    }
    
    // Clean old history
    this.cleanHistory(limit);
    
    // Check current count
    const currentCount = limit.history.length;
    
    if (currentCount >= limit.max) {
      const resetTime = this.calculateResetTime(limit);
      return {
        allowed: false,
        reason: `Rate limit exceeded (${currentCount}/${limit.max} per ${limit.period})`,
        resetTime,
        currentCount,
        max: limit.max
      };
    }
    
    return {
      allowed: true,
      remaining: limit.max - currentCount,
      currentCount,
      max: limit.max
    };
  }

  // Record action
  async recordAction(actionType) {
    const limit = this.limits[actionType];
    
    if (!limit) {
      console.log(`⚠️  Unknown action type: ${actionType}`);
      return;
    }
    
    limit.history.push({
      timestamp: new Date().toISOString(),
      action: actionType
    });
    
    this.saveRateLimits();
  }

  // Clean old history based on period
  cleanHistory(limit) {
    const now = new Date();
    const cutoff = this.calculateCutoff(limit.period);
    
    limit.history = limit.history.filter(entry => {
      const entryTime = new Date(entry.timestamp);
      return entryTime > cutoff;
    });
  }

  // Calculate cutoff time
  calculateCutoff(period) {
    const now = new Date();
    
    switch (period) {
      case 'minute':
        return new Date(now.getTime() - 60 * 1000);
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 60 * 60 * 1000);
    }
  }

  // Calculate reset time
  calculateResetTime(limit) {
    const cutoff = this.calculateCutoff(limit.period);
    return cutoff.toISOString();
  }

  // Get current status
  getStatus() {
    const status = {};
    
    for (const [actionType, limit] of Object.entries(this.limits)) {
      this.cleanHistory(limit);
      
      status[actionType] = {
        current: limit.history.length,
        max: limit.max,
        period: limit.period,
        remaining: limit.max - limit.history.length,
        resetTime: this.calculateResetTime(limit)
      };
    }
    
    return status;
  }

  // Set custom limit
  setLimit(actionType, max, period) {
    if (!this.limits[actionType]) {
      this.limits[actionType] = { max, period, current: 0, history: [] };
    } else {
      this.limits[actionType].max = max;
      this.limits[actionType].period = period;
    }
    
    this.saveRateLimits();
  }

  // Reset limit (admin function)
  resetLimit(actionType) {
    if (this.limits[actionType]) {
      this.limits[actionType].history = [];
      this.saveRateLimits();
    }
  }

  // Load rate limits
  loadRateLimits() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      for (const [actionType, limit] of Object.entries(parsed)) {
        if (this.limits[actionType]) {
          this.limits[actionType].history = limit.history || [];
        }
      }
    }
  }

  // Save rate limits
  saveRateLimits() {
    const data = {};
    
    for (const [actionType, limit] of Object.entries(this.limits)) {
      data[actionType] = {
        max: limit.max,
        period: limit.period,
        history: limit.history
      };
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const rateLimiter = new RateLimitingSystem();

  switch (command) {
    case 'check':
      if (args[1]) {
        const result = await rateLimiter.checkLimit(args[1]);
        console.log(`📊 Rate Limit Check (${args[1]}):`);
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node rate-limiter.js check <action-type>');
      }
      break;

    case 'record':
      if (args[1]) {
        await rateLimiter.recordAction(args[1]);
        console.log(`✅ Recorded action: ${args[1]}`);
      } else {
        console.error('Usage: node rate-limiter.js record <action-type>');
      }
      break;

    case 'status':
      const status = rateLimiter.getStatus();
      console.log('📊 Rate Limit Status:');
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'set':
      if (args[1] && args[2] && args[3]) {
        rateLimiter.setLimit(args[1], parseInt(args[2]), args[3]);
        console.log(`✅ Set limit: ${args[1]} = ${args[2]} per ${args[3]}`);
      } else {
        console.error('Usage: node rate-limiter.js set <action-type> <max> <period>');
      }
      break;

    case 'reset':
      if (args[1]) {
        rateLimiter.resetLimit(args[1]);
        console.log(`✅ Reset limit: ${args[1]}`);
      } else {
        console.error('Usage: node rate-limiter.js reset <action-type>');
      }
      break;

    default:
      console.log('🚦 Rate Limiting System');
      console.log('');
      console.log('Commands:');
      console.log('  check   - Check if action is allowed');
      console.log('  record  - Record an action');
      console.log('  status  - Get current status');
      console.log('  set     - Set custom limit');
      console.log('  reset   - Reset limit (admin)');
      console.log('');
      console.log('Examples:');
      console.log('  node rate-limiter.js check deployments');
      console.log('  node rate-limiter.js record deployments');
      console.log('  node rate-limiter.js status');
      console.log('  node rate-limiter.js set deployments 5 day');
      console.log('  node rate-limiter.js reset deployments');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  RateLimitingSystem
};
