/**
 * Secret Rotation Scheduler
 * Automated periodic secret rotation using cron-like scheduling
 */

const { SecretRotationManager } = require('./secret-rotation');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Rotation Schedule Configuration
// ============================================================================

const ROTATION_SCHEDULE = {
  // High-priority secrets (quarterly)
  'STRIPE_SECRET_KEY': {
    interval: '90d', // 90 days
    priority: 'high',
    service: 'stripe'
  },
  'GITHUB_TOKEN': {
    interval: '90d',
    priority: 'high',
    service: 'github'
  },
  'CLOUDFLARE_API_TOKEN': {
    interval: '90d',
    priority: 'high',
    service: 'cloudflare'
  },
  
  // Medium-priority secrets (semi-annually)
  'KRAKEN_API_SECRET': {
    interval: '180d',
    priority: 'medium',
    service: 'cloudflare'
  },
  'KRAKEN_API_KEY': {
    interval: '180d',
    priority: 'medium',
    service: 'cloudflare'
  },
  'NOTION_API_TOKEN': {
    interval: '180d',
    priority: 'medium',
    service: 'cloudflare'
  },
  'SENTRY_DSN': {
    interval: '180d',
    priority: 'medium',
    service: 'cloudflare'
  },
  
  // Low-priority secrets (annually)
  'BRIDGE_API_TOKEN': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'ATOMIND_DEVIN_SECRET': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'ATOMIND_GEMINI_SECRET': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'ATOMIND_VIKTOR_SECRET': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'STRIPE_PUBLISHABLE_KEY': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'GITHUB_REPO': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'GITHUB_WORKFLOW': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'NOTION_BRIDGE_COMMANDS_DB_ID': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'NOTION_BRIDGE_LOGS_DB_ID': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'NOTION_RUNS_DB_ID': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'ADMIN_HMAC_SECRET': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'BRIDGE_BASE_URL': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  },
  'CLOUDFLARE_ACCOUNT_ID': {
    interval: '365d',
    priority: 'low',
    service: 'cloudflare'
  }
};

// ============================================================================
// Rotation Scheduler
// ============================================================================

class SecretRotationScheduler {
  constructor() {
    this.manager = new SecretRotationManager();
    this.schedulePath = path.resolve(__dirname, 'rotation-schedule.json');
    this.loadSchedule();
  }

  loadSchedule() {
    if (fs.existsSync(this.schedulePath)) {
      const data = fs.readFileSync(this.schedulePath, 'utf8');
      this.schedule = JSON.parse(data);
    } else {
      this.schedule = this.initializeSchedule();
      this.saveSchedule();
    }
  }

  initializeSchedule() {
    const schedule = {};
    const now = new Date();
    
    for (const [secretName, config] of Object.entries(ROTATION_SCHEDULE)) {
      schedule[secretName] = {
        ...config,
        lastRotated: null,
        nextRotation: this.calculateNextRotation(now, config.interval),
        rotationCount: 0
      };
    }
    
    return schedule;
  }

  calculateNextRotation(fromDate, interval) {
    const next = new Date(fromDate);
    
    // Parse interval (e.g., '90d', '180d', '365d')
    const value = parseInt(interval);
    const unit = interval.slice(-1);
    
    switch (unit) {
      case 'd':
        next.setDate(next.getDate() + value);
        break;
      case 'w':
        next.setDate(next.getDate() + (value * 7));
        break;
      case 'm':
        next.setMonth(next.getMonth() + value);
        break;
      case 'y':
        next.setFullYear(next.getFullYear() + value);
        break;
    }
    
    return next.toISOString();
  }

  saveSchedule() {
    fs.writeFileSync(this.schedulePath, JSON.stringify(this.schedule, null, 2));
  }

  checkDueRotations() {
    const now = new Date();
    const dueRotations = [];
    
    for (const [secretName, config] of Object.entries(this.schedule)) {
      if (config.nextRotation && new Date(config.nextRotation) <= now) {
        dueRotations.push({
          secretName,
          priority: config.priority,
          service: config.service,
          overdueDays: Math.floor((now - new Date(config.nextRotation)) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    // Sort by priority (high first) then by overdue days
    dueRotations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.overdueDays - a.overdueDays;
    });
    
    return dueRotations;
  }

  async rotateDueSecrets() {
    const dueRotations = this.checkDueRotations();
    const results = [];
    
    console.log(`🔄 Found ${dueRotations.length} due rotations`);
    
    for (const rotation of dueRotations) {
      console.log(`\n🔐 Rotating ${rotation.secretName} (${rotation.priority} priority)`);
      
      let result;
      switch (rotation.service) {
        case 'cloudflare':
          // For Cloudflare, we need the new value
          // In production, this would come from a secure secret generator
          const newValue = this.generateSecret();
          result = await this.manager.rotateCloudflareSecret(rotation.secretName, newValue);
          break;
        case 'github':
          // For GitHub, we need the master token and token ID
          console.log('⚠️  GitHub rotation requires manual intervention');
          result = { success: false, error: 'Manual intervention required' };
          break;
        case 'stripe':
          // For Stripe, we need the API key
          console.log('⚠️  Stripe rotation requires manual intervention');
          result = { success: false, error: 'Manual intervention required' };
          break;
        default:
          result = { success: false, error: 'Unknown service' };
      }
      
      if (result.success) {
        this.updateSchedule(rotation.secretName);
      }
      
      results.push({ ...rotation, result });
    }
    
    return results;
  }

  updateSchedule(secretName) {
    const config = ROTATION_SCHEDULE[secretName];
    this.schedule[secretName] = {
      ...this.schedule[secretName],
      lastRotated: new Date().toISOString(),
      nextRotation: this.calculateNextRotation(new Date(), config.interval),
      rotationCount: (this.schedule[secretName].rotationCount || 0) + 1
    };
    this.saveSchedule();
  }

  generateSecret() {
    // Generate a cryptographically secure random secret
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  getSchedule() {
    return this.schedule;
  }

  getRotationSummary() {
    const now = new Date();
    const summary = {
      totalSecrets: Object.keys(this.schedule).length,
      dueForRotation: 0,
      overdue: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      nextRotations: []
    };
    
    for (const [secretName, config] of Object.entries(this.schedule)) {
      if (config.nextRotation && new Date(config.nextRotation) <= now) {
        summary.dueForRotation++;
        summary.overdue++;
        summary.byPriority[config.priority]++;
      } else if (config.nextRotation) {
        summary.nextRotations.push({
          secretName,
          nextRotation: config.nextRotation,
          priority: config.priority,
          daysUntilRotation: Math.floor((new Date(config.nextRotation) - now) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    return summary;
  }

  forceRotation(secretName) {
    console.log(`🔄 Forcing rotation of ${secretName}`);
    
    const config = ROTATION_SCHEDULE[secretName];
    if (!config) {
      console.error(`❌ Unknown secret: ${secretName}`);
      return { success: false, error: 'Unknown secret' };
    }
    
    const newValue = this.generateSecret();
    return this.manager.rotateCloudflareSecret(secretName, newValue).then(result => {
      if (result.success) {
        this.updateSchedule(secretName);
      }
      return result;
    });
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const scheduler = new SecretRotationScheduler();

  switch (command) {
    case 'check':
      const due = scheduler.checkDueRotations();
      console.log('📋 Due Rotations:');
      if (due.length === 0) {
        console.log('  No secrets due for rotation');
      } else {
        due.forEach(r => {
          console.log(`  - ${r.secretName} (${r.priority}, ${r.overdueDays} days overdue)`);
        });
      }
      break;

    case 'rotate-due':
      const results = await scheduler.rotateDueSecrets();
      console.log('📊 Rotation Results:');
      results.forEach(r => {
        console.log(`  ${r.secretName}: ${r.success ? '✅' : '❌'} ${r.success ? 'Success' : r.error}`);
      });
      break;

    case 'summary':
      const summary = scheduler.getRotationSummary();
      console.log('📊 Rotation Summary:');
      console.log(`  Total Secrets: ${summary.totalSecrets}`);
      console.log(`  Due for Rotation: ${summary.dueForRotation}`);
      console.log(`  Overdue: ${summary.overdue}`);
      console.log(`  By Priority: High=${summary.byPriority.high}, Medium=${summary.byPriority.medium}, Low=${summary.byPriority.low}`);
      console.log('\n  Next Rotations:');
      summary.nextRotations.forEach(r => {
        console.log(`    ${r.secretName}: ${r.daysUntilRotation} days (${r.priority})`);
      });
      break;

    case 'schedule':
      const schedule = scheduler.getSchedule();
      console.log('📅 Rotation Schedule:');
      console.log(JSON.stringify(schedule, null, 2));
      break;

    case 'force':
      if (args[1]) {
        const forceResult = await scheduler.forceRotation(args[1]);
        console.log('Result:', forceResult);
      } else {
        console.error('Usage: node scheduler.js force <secret-name>');
      }
      break;

    default:
      console.log('🔐 Secret Rotation Scheduler');
      console.log('');
      console.log('Commands:');
      console.log('  check         - Check for due rotations');
      console.log('  rotate-due    - Rotate all due secrets');
      console.log('  summary       - Show rotation summary');
      console.log('  schedule      - Show rotation schedule');
      console.log('  force         - Force rotation of a secret');
      console.log('');
      console.log('Examples:');
      console.log('  node scheduler.js check');
      console.log('  node scheduler.js rotate-due');
      console.log('  node scheduler.js summary');
      console.log('  node scheduler.js force STRIPE_SECRET_KEY');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  SecretRotationScheduler,
  ROTATION_SCHEDULE
};
