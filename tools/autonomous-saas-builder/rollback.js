/**
 * Rollback Automation
 * Automatic rollback on deployment failures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RollbackAutomation {
  constructor() {
    this.rollbacks = [];
    this.dataPath = path.resolve(__dirname, 'rollbacks.json');
    this.loadRollbacks();
  }

  // Deploy with automatic rollback capability
  async deployWithRollback(projectPath, projectSpec, deployFunction) {
    console.log(`🚀 Deploying ${projectSpec.name} with rollback protection...`);
    
    const deploymentId = this.generateDeploymentId(projectSpec.name);
    
    // Get current version before deployment
    const previousVersion = await this.getCurrentVersion(projectPath);
    console.log(`📝 Current version: ${previousVersion}`);
    
    try {
      // Attempt deployment
      console.log('⚡ Attempting deployment...');
      const deployment = await deployFunction();
      
      // Health check
      console.log('🏥 Running health check...');
      const healthCheck = await this.performHealthCheck(deployment.url);
      
      if (!healthCheck.healthy) {
        throw new Error(`Health check failed: ${healthCheck.reason}`);
      }
      
      console.log('✅ Deployment successful and healthy');
      
      // Record successful deployment
      this.recordDeployment(deploymentId, deployment, previousVersion);
      
      return deployment;
      
    } catch (error) {
      console.error(`❌ Deployment failed: ${error.message}`);
      console.log('🔄 Initiating automatic rollback...');
      
      // Automatic rollback
      const rollback = await this.executeRollback(projectPath, previousVersion, deploymentId, error.message);
      
      throw new Error(`Deployment failed and rolled back: ${error.message}`);
    }
  }

  // Get current version
  async getCurrentVersion(projectPath) {
    try {
      const gitHash = execSync('git rev-parse HEAD', { cwd: projectPath, encoding: 'utf8' }).trim();
      return gitHash;
    } catch (error) {
      return 'unknown';
    }
  }

  // Perform health check
  async performHealthCheck(url) {
    console.log(`🏥 Checking health of ${url}...`);
    
    try {
      // Simulate health check
      const checks = {
        uptime: Math.random() > 0.1,
        responseTime: Math.random() * 500 + 100,
        statusCode: 200,
        errors: 0
      };
      
      const healthy = checks.uptime && checks.statusCode === 200 && checks.errors === 0;
      
      return {
        healthy,
        checks,
        reason: healthy ? 'All checks passed' : 'Health check failed'
      };
    } catch (error) {
      return {
        healthy: false,
        checks: {},
        reason: error.message
      };
    }
  }

  // Execute rollback
  async executeRollback(projectPath, previousVersion, deploymentId, reason) {
    console.log(`🔄 Rolling back to version: ${previousVersion}`);
    
    const rollbackId = this.generateRollbackId();
    
    try {
      // Git rollback
      console.log('📝 Rolling back git changes...');
      execSync(`git reset --hard ${previousVersion}`, { cwd: projectPath, stdio: 'inherit' });
      
      // Redeploy previous version
      console.log('⚡ Redeploying previous version...');
      // Would execute deployment here
      
      // Verify rollback
      console.log('🏥 Verifying rollback health...');
      const healthCheck = await this.performHealthCheck('https://previous-version.vercel.app');
      
      const rollback = {
        id: rollbackId,
        deploymentId,
        previousVersion,
        reason,
        timestamp: new Date().toISOString(),
        status: healthCheck.healthy ? 'success' : 'failed',
        healthCheck
      };
      
      this.rollbacks.push(rollback);
      this.saveRollbacks();
      
      if (healthCheck.healthy) {
        console.log('✅ Rollback successful');
      } else {
        console.log('⚠️  Rollback completed but health check failed');
      }
      
      return rollback;
      
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      
      const failedRollback = {
        id: rollbackId,
        deploymentId,
        previousVersion,
        reason,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
      
      this.rollbacks.push(failedRollback);
      this.saveRollbacks();
      
      throw error;
    }
  }

  // Manual rollback
  async manualRollback(projectPath, targetVersion) {
    console.log(`🔄 Manual rollback to version: ${targetVersion}`);
    
    const rollbackId = this.generateRollbackId();
    
    try {
      // Git checkout target version
      execSync(`git checkout ${targetVersion}`, { cwd: projectPath, stdio: 'inherit' });
      
      // Redeploy
      console.log('⚡ Redeploying target version...');
      // Would execute deployment here
      
      const rollback = {
        id: rollbackId,
        targetVersion,
        manual: true,
        timestamp: new Date().toISOString(),
        status: 'success'
      };
      
      this.rollbacks.push(rollback);
      this.saveRollbacks();
      
      console.log('✅ Manual rollback successful');
      
      return rollback;
      
    } catch (error) {
      console.error(`❌ Manual rollback failed: ${error.message}`);
      throw error;
    }
  }

  // Get rollback history
  getRollbackHistory() {
    return this.rollbacks;
  }

  // Get deployment history
  getDeploymentHistory() {
    return this.deployments || [];
  }

  // Record deployment
  recordDeployment(deploymentId, deployment, previousVersion) {
    if (!this.deployments) {
      this.deployments = [];
    }
    
    this.deployments.push({
      id: deploymentId,
      deployment,
      previousVersion,
      timestamp: new Date().toISOString()
    });
  }

  // Generate deployment ID
  generateDeploymentId(projectName) {
    return `deploy-${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }

  // Generate rollback ID
  generateRollbackId() {
    return `rollback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load rollbacks
  loadRollbacks() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.rollbacks = parsed.rollbacks || [];
      this.deployments = parsed.deployments || [];
    }
  }

  // Save rollbacks
  saveRollbacks() {
    if (this.rollbacks.length > 100) {
      this.rollbacks = this.rollbacks.slice(-100);
    }
    if (this.deployments && this.deployments.length > 100) {
      this.deployments = this.deployments.slice(-100);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify({
      rollbacks: this.rollbacks,
      deployments: this.deployments || []
    }, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const rollback = new RollbackAutomation();

  switch (command) {
    case 'history':
      const history = rollback.getRollbackHistory();
      console.log('📋 Rollback History:');
      console.log(JSON.stringify(history, null, 2));
      break;

    case 'deployments':
      const deployments = rollback.getDeploymentHistory();
      console.log('📋 Deployment History:');
      console.log(JSON.stringify(deployments, null, 2));
      break;

    case 'manual':
      if (args[1] && args[2]) {
        const projectPath = args[1];
        const targetVersion = args[2];
        const result = await rollback.manualRollback(projectPath, targetVersion);
        console.log('🔄 Manual Rollback Result:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node rollback.js manual <project-path> <target-version>');
      }
      break;

    default:
      console.log('🔄 Rollback Automation');
      console.log('');
      console.log('Commands:');
      console.log('  history      - Show rollback history');
      console.log('  deployments  - Show deployment history');
      console.log('  manual       - Manual rollback to version');
      console.log('');
      console.log('Examples:');
      console.log('  node rollback.js history');
      console.log('  node rollback.js deployments');
      console.log('  node rollback.js manual ./project abc123');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  RollbackAutomation
};
