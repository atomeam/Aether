/**
 * Alternative Git Platform Integration
 * Supports GitLab, Bitbucket, and other platforms
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AlternativeGitPlatform {
  constructor() {
    this.platform = 'github'; // default
    this.config = {
      github: {
        enabled: true,
        cli: 'gh'
      },
      gitlab: {
        enabled: false,
        cli: 'glab',
        url: null
      },
      bitbucket: {
        enabled: false,
        cli: 'bb',
        url: null
      }
    };
    
    this.operations = [];
    this.dataPath = path.resolve(__dirname, 'alt-platform-ops.json');
    this.loadOperations();
  }

  // Switch platform
  switchPlatform(platform) {
    console.log(`🔄 Switching to ${platform}...`);
    
    if (!this.config[platform]) {
      throw new Error(`Platform ${platform} not supported`);
    }
    
    this.platform = platform;
    
    // Disable all platforms
    Object.keys(this.config).forEach(p => {
      this.config[p].enabled = false;
    });
    
    // Enable selected platform
    this.config[platform].enabled = true;
    
    return this.platform;
  }

  // Configure platform
  configurePlatform(platform, config) {
    console.log(`⚙️  Configuring ${platform}...`);
    
    this.config[platform] = {
      ...this.config[platform],
      ...config
    };
    
    return this.config[platform];
  }

  // Auto-create MR (GitLab) or PR (other platforms)
  async createMergeRequest(branch, title, body, labels = []) {
    console.log(`🔀 Creating merge request/PR for branch: ${branch}`);
    
    try {
      // Push branch first
      this.pushBranch(branch);
      
      let command;
      
      if (this.platform === 'gitlab') {
        command = `glab mr create --source ${branch} --target ${this.config.gitlab.defaultBranch || 'main'} --title "${title}" --description "${body}" ${labels.length > 0 ? `--label ${labels.join(',')}` : ''}`;
      } else if (this.platform === 'bitbucket') {
        command = `bb pr create ${branch} --title "${title}" --body "${body}"`;
      } else {
        // Fallback to GitHub
        command = `gh pr create --base ${this.config.github.defaultBranch || 'main'} --head ${branch} --title "${title}" --body "${body}" ${labels.length > 0 ? `--labels ${labels.join(',')}` : ''}`;
      }
      
      const output = execSync(command, { encoding: 'utf8', cwd: this.getProjectRoot() });
      
      const url = this.extractUrl(output);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'create_mr',
        platform: this.platform,
        branch,
        title,
        url,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      return operation;
    } catch (error) {
      console.error(`❌ Failed to create MR/PR: ${error.message}`);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'create_mr',
        platform: this.platform,
        branch,
        title,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      throw error;
    }
  }

  // Auto-merge MR/PR
  async autoMerge(mrNumber, method = 'merge') {
    console.log(`🔀 Auto-merging MR/PR #${mrNumber}...`);
    
    try {
      let command;
      
      if (this.platform === 'gitlab') {
        command = `glab mr merge ${mrNumber} --squash`;
      } else if (this.platform === 'bitbucket') {
        command = `bb pr merge ${mrNumber}`;
      } else {
        // Fallback to GitHub
        command = `gh pr merge ${mrNumber} --${method} --delete-branch`;
      }
      
      execSync(command, { encoding: 'utf8', cwd: this.getProjectRoot() });
      
      const operation = {
        id: this.generateOperationId(),
        type: 'merge_mr',
        platform: this.platform,
        mrNumber,
        method,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      return operation;
    } catch (error) {
      console.error(`❌ Failed to merge MR/PR: ${error.message}`);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'merge_mr',
        platform: this.platform,
        mrNumber,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      throw error;
    }
  }

  // Push branch
  pushBranch(branchName) {
    console.log(`📤 Pushing branch: ${branchName}`);
    
    try {
      let remote = 'origin';
      
      if (this.platform === 'gitlab' && this.config.gitlab.url) {
        remote = this.config.gitlab.url;
      } else if (this.platform === 'bitbucket' && this.config.bitbucket.url) {
        remote = this.config.bitbucket.url;
      }
      
      execSync(`git push -u ${remote} ${branchName}`, { encoding: 'utf8', cwd: this.getProjectRoot() });
      
      const operation = {
        id: this.generateOperationId(),
        type: 'push_branch',
        platform: this.platform,
        branchName,
        remote,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      return operation;
    } catch (error) {
      console.error(`❌ Failed to push branch: ${error.message}`);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'push_branch',
        platform: this.platform,
        branchName,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      throw error;
    }
  }

  // Extract URL from output
  extractUrl(output) {
    const patterns = [
      /https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/,
      /https:\/\/gitlab\.com\/[^\/]+\/[^\/]+\/-\/merge_requests\/\d+/,
      /https:\/\/bitbucket\.org\/[^\/]+\/[^\/]+\/pull-requests\/\d+/
    ];
    
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) return match[0];
    }
    
    return null;
  }

  // Get project root
  getProjectRoot() {
    return process.cwd();
  }

  // Get current platform
  getCurrentPlatform() {
    return this.platform;
  }

  // Get platform config
  getPlatformConfig(platform) {
    return this.config[platform];
  }

  // Get operations history
  getOperationsHistory() {
    return this.operations;
  }

  // Get statistics
  getStatistics() {
    const total = this.operations.length;
    const completed = this.operations.filter(o => o.status === 'completed').length;
    const failed = this.operations.filter(o => o.status === 'failed').length;
    
    const byPlatform = {};
    this.operations.forEach(op => {
      if (!byPlatform[op.platform]) {
        byPlatform[op.platform] = 0;
      }
      byPlatform[op.platform]++;
    });
    
    return {
      total,
      completed,
      failed,
      successRate: total > 0 ? (completed / total * 100).toFixed(2) : 0,
      byPlatform,
      currentPlatform: this.platform
    };
  }

  // Generate operation ID
  generateOperationId() {
    return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load operations
  loadOperations() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.operations = JSON.parse(data);
    }
  }

  // Save operations
  saveOperations() {
    if (this.operations.length > 1000) {
      this.operations = this.operations.slice(-1000);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.operations, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const altPlatform = new AlternativeGitPlatform();

  switch (command) {
    case 'switch':
      if (args[1]) {
        const result = altPlatform.switchPlatform(args[1]);
        console.log('🔄 Switched Platform:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node alt-platform.js switch <platform>');
      }
      break;

    case 'configure':
      if (args[1] && args[2]) {
        const config = JSON.parse(args[2]);
        const result = altPlatform.configurePlatform(args[1], config);
        console.log('⚙️  Configured Platform:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node alt-platform.js configure <platform> <config-json>');
      }
      break;

    case 'create-mr':
      if (args[1] && args[2] && args[3]) {
        const result = await altPlatform.createMergeRequest(args[1], args[2], args[3], args[4] ? args[4].split(',') : []);
        console.log('🔀 Created MR/PR:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node alt-platform.js create-mr <branch> <title> <body> [labels]');
      }
      break;

    case 'merge':
      if (args[1]) {
        const result = await altPlatform.autoMerge(parseInt(args[1]), args[2] || 'merge');
        console.log('🔀 Merged MR/PR:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node alt-platform.js merge <mr-number> [method]');
      }
      break;

    case 'current':
      const current = altPlatform.getCurrentPlatform();
      console.log('📊 Current Platform:');
      console.log(current);
      break;

    case 'config':
      if (args[1]) {
        const config = altPlatform.getPlatformConfig(args[1]);
        console.log('⚙️  Platform Config:');
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.error('Usage: node alt-platform.js config <platform>');
      }
      break;

    case 'stats':
      const stats = altPlatform.getStatistics();
      console.log('📊 Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('🔄 Alternative Git Platform Integration');
      console.log('');
      console.log('Supported Platforms:');
      console.log('  - GitHub (default)');
      console.log('  - GitLab');
      console.log('  - Bitbucket');
      console.log('');
      console.log('Commands:');
      console.log('  switch     - Switch platform');
      console.log('  configure  - Configure platform');
      console.log('  create-mr  - Create merge request/PR');
      console.log('  merge      - Auto-merge MR/PR');
      console.log('  current    - Get current platform');
      console.log('  config     - Get platform config');
      console.log('  stats      - Get statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node alt-platform.js switch gitlab');
      console.log('  node alt-platform.js configure gitlab \'{"url":"https://gitlab.com"}\'');
      console.log('  node alt-platform.js create-mr feature/test "Test" "Description"');
      console.log('  node alt-platform.js merge 123');
      console.log('  node alt-platform.js current');
      console.log('  node alt-platform.js config gitlab');
      console.log('  node alt-platform.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  AlternativeGitPlatform
};
