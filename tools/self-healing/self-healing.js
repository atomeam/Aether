/**
 * Self-Healing Infrastructure Monitor
 * Automatically detects and heals infrastructure issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Service Health Monitor
// ============================================================================

class ServiceHealthMonitor {
  constructor() {
    this.services = {
      'aether-bridge': {
        type: 'cloudflare-worker',
        healthCheck: this.checkCloudflareWorker.bind(this),
        healingAction: this.deployCloudflareWorker.bind(this),
        retryCount: 0,
        maxRetries: 3,
        lastFailure: null,
        status: 'unknown'
      },
      'aether': {
        type: 'cloudflare-worker',
        healthCheck: this.checkCloudflareWorker.bind(this),
        healingAction: this.deployCloudflareWorker.bind(this),
        retryCount: 0,
        maxRetries: 3,
        lastFailure: null,
        status: 'unknown'
      },
      'notion-worker': {
        type: 'cloudflare-worker',
        healthCheck: this.checkCloudflareWorker.bind(this),
        healingAction: this.deployCloudflareWorker.bind(this),
        retryCount: 0,
        maxRetries: 3,
        lastFailure: null,
        status: 'unknown'
      }
    };
    this.healingLog = [];
    this.logPath = path.resolve(__dirname, 'healing-log.json');
    this.loadHealingLog();
  }

  async checkCloudflareWorker(serviceName) {
    try {
      const projectPath = path.resolve(__dirname, `../../apps/${serviceName}`);
      const command = `cd ${projectPath} && npx wrangler tail --format pretty --once`;
      
      // Try to get worker status via wrangler
      const statusCommand = `cd ${projectPath} && npx wrangler deployments list --name ${serviceName}`;
      const output = execSync(statusCommand, { encoding: 'utf8', timeout: 10000 });
      
      // Check if recent deployment exists
      const hasRecentDeployment = output.includes('Created') || output.includes('Deployed');
      
      return {
        healthy: hasRecentDeployment,
        message: hasRecentDeployment ? 'Worker deployed and active' : 'No recent deployment found',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async deployCloudflareWorker(serviceName) {
    try {
      console.log(`🔄 Healing ${serviceName} - deploying...`);
      const projectPath = path.resolve(__dirname, `../../apps/${serviceName}`);
      const command = `cd ${projectPath} && npx wrangler deploy`;
      execSync(command, { stdio: 'inherit', timeout: 60000 });
      
      return {
        success: true,
        message: `Successfully deployed ${serviceName}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Deployment failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkAllServices() {
    const results = {};
    
    for (const [serviceName, config] of Object.entries(this.services)) {
      console.log(`🔍 Checking ${serviceName}...`);
      const healthResult = await config.healthCheck(serviceName);
      
      config.status = healthResult.healthy ? 'healthy' : 'unhealthy';
      
      if (!healthResult.healthy) {
        config.lastFailure = new Date().toISOString();
        config.retryCount++;
        
        console.log(`⚠️  ${serviceName} is unhealthy, attempting healing...`);
        const healingResult = await config.healingAction(serviceName);
        
        if (healingResult.success) {
          config.status = 'healed';
          config.retryCount = 0;
          this.logHealing(serviceName, healthResult, healingResult);
        } else {
          config.status = 'failed';
          this.logHealing(serviceName, healthResult, healingResult);
        }
      } else {
        config.retryCount = 0;
      }
      
      results[serviceName] = {
        status: config.status,
        health: healthResult,
        retryCount: config.retryCount,
        lastFailure: config.lastFailure
      };
    }
    
    this.saveHealingLog();
    return results;
  }

  logHealing(serviceName, healthResult, healingResult) {
    const logEntry = {
      serviceName,
      timestamp: new Date().toISOString(),
      healthResult,
      healingResult,
      success: healingResult.success
    };
    
    this.healingLog.push(logEntry);
    this.saveHealingLog();
  }

  loadHealingLog() {
    if (fs.existsSync(this.logPath)) {
      const data = fs.readFileSync(this.logPath, 'utf8');
      this.healingLog = JSON.parse(data);
    }
  }

  saveHealingLog() {
    fs.writeFileSync(this.logPath, JSON.stringify(this.healingLog, null, 2));
  }

  getHealingLog() {
    return this.healingLog;
  }

  getHealingSummary() {
    const successful = this.healingLog.filter(l => l.success);
    const failed = this.healingLog.filter(l => !l.success);
    const byService = {};
    
    this.healingLog.forEach(log => {
      if (!byService[log.serviceName]) {
        byService[log.serviceName] = { total: 0, successful: 0, failed: 0 };
      }
      byService[log.serviceName].total++;
      if (log.success) byService[log.serviceName].successful++;
      else byService[log.serviceName].failed++;
    });
    
    return {
      total: this.healingLog.length,
      successful: successful.length,
      failed: failed.length,
      successRate: this.healingLog.length > 0 ? (successful.length / this.healingLog.length * 100).toFixed(2) + '%' : '0%',
      byService,
      lastHealing: this.healingLog.length > 0 ? this.healingLog[this.healingLog.length - 1] : null
    };
  }

  forceHeal(serviceName) {
    console.log(`🔄 Force healing ${serviceName}...`);
    const config = this.services[serviceName];
    
    if (!config) {
      console.error(`❌ Unknown service: ${serviceName}`);
      return { success: false, error: 'Unknown service' };
    }
    
    return config.healingAction(serviceName).then(result => {
      this.logHealing(serviceName, { healthy: false, message: 'Force heal triggered' }, result);
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

  const monitor = new ServiceHealthMonitor();

  switch (command) {
    case 'check':
      const results = await monitor.checkAllServices();
      console.log('📊 Health Check Results:');
      console.log(JSON.stringify(results, null, 2));
      break;

    case 'heal':
      if (args[1]) {
        const healResult = await monitor.forceHeal(args[1]);
        console.log('Healing Result:', healResult);
      } else {
        console.error('Usage: node self-healing.js heal <service-name>');
      }
      break;

    case 'log':
      const log = monitor.getHealingLog();
      console.log('📝 Healing Log:');
      console.log(JSON.stringify(log, null, 2));
      break;

    case 'summary':
      const summary = monitor.getHealingSummary();
      console.log('📊 Healing Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    default:
      console.log('🔧 Self-Healing Infrastructure Monitor');
      console.log('');
      console.log('Commands:');
      console.log('  check         - Check all services and auto-heal if needed');
      console.log('  heal          - Force heal a specific service');
      console.log('  log           - Show healing log');
      console.log('  summary       - Show healing summary');
      console.log('');
      console.log('Examples:');
      console.log('  node self-healing.js check');
      console.log('  node self-healing.js heal aether-bridge');
      console.log('  node self-healing.js summary');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  ServiceHealthMonitor
};
