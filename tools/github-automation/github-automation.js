/**
 * GitHub Automation System
 * Automates GitHub operations without manual intervention
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubAutomation {
  constructor() {
    this.config = {
      owner: 'atomeam',
      repo: 'Aether',
      defaultBranch: 'main',
      autoMergeEnabled: false,
      requireReviews: true,
      requireChecks: true
    };
    
    this.operations = [];
    this.dataPath = path.resolve(__dirname, 'operations.json');
    this.loadOperations();
  }

  // Auto-create PR
  async createAutoPR(branch, title, body, labels = []) {
    console.log(`🔀 Creating auto-PR for branch: ${branch}`);
    
    try {
      // Push branch first
      this.pushBranch(branch);
      
      // Create PR using gh CLI
      const prCommand = `gh pr create --base ${this.config.defaultBranch} --head ${branch} --title "${title}" --body "${body}" ${labels.length > 0 ? `--labels ${labels.join(',')}` : ''}`;
      
      const output = execSync(prCommand, { encoding: 'utf8', cwd: this.getProjectRoot() });
      
      const prUrl = this.extractPRUrl(output);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'create_pr',
        branch,
        title,
        prUrl,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      return operation;
    } catch (error) {
      console.error(`❌ Failed to create PR: ${error.message}`);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'create_pr',
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

  // Auto-merge PR
  async autoMergePR(prNumber, mergeMethod = 'merge') {
    console.log(`🔀 Auto-merging PR #${prNumber}...`);
    
    if (!this.config.autoMergeEnabled) {
      throw new Error('Auto-merge is not enabled');
    }
    
    try {
      // Check if PR is mergeable
      const isMergeable = await this.checkPRMergeable(prNumber);
      
      if (!isMergeable) {
        throw new Error('PR is not mergeable (checks failed or reviews required)');
      }
      
      // Merge PR
      const mergeCommand = `gh pr merge ${prNumber} --${mergeMethod} --delete-branch`;
      
      execSync(mergeCommand, { encoding: 'utf8', cwd: this.getProjectRoot() });
      
      const operation = {
        id: this.generateOperationId(),
        type: 'merge_pr',
        prNumber,
        mergeMethod,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      return operation;
    } catch (error) {
      console.error(`❌ Failed to merge PR: ${error.message}`);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'merge_pr',
        prNumber,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      throw error;
    }
  }

  // Check if PR is mergeable
  async checkPRMergeable(prNumber) {
    console.log(`🔍 Checking if PR #${prNumber} is mergeable...`);
    
    try {
      const viewCommand = `gh pr view ${prNumber} --json mergeable,mergeStateStatus,reviewDecision,statusCheckRollup`;
      const output = execSync(viewCommand, { encoding: 'utf8', cwd: this.getProjectRoot() });
      const data = JSON.parse(output);
      
      // Check if mergeable
      if (!data.mergeable) {
        return false;
      }
      
      // Check if reviews required
      if (this.config.requireReviews && data.reviewDecision !== 'APPROVED') {
        return false;
      }
      
      // Check if checks required
      if (this.config.requireChecks) {
        const checks = data.statusCheckRollup || [];
        const failedChecks = checks.filter(c => c.conclusion !== 'SUCCESS');
        
        if (failedChecks.length > 0) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to check PR: ${error.message}`);
      return false;
    }
  }

  // Auto-create branch
  async createBranch(branchName, fromBranch = null) {
    console.log(`🌿 Creating branch: ${branchName}`);
    
    try {
      const from = fromBranch || this.config.defaultBranch;
      
      // Create and checkout branch
      execSync(`git checkout -b ${branchName} ${from}`, { encoding: 'utf8', cwd: this.getProjectRoot() });
      
      const operation = {
        id: this.generateOperationId(),
        type: 'create_branch',
        branchName,
        fromBranch: from,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      return operation;
    } catch (error) {
      console.error(`❌ Failed to create branch: ${error.message}`);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'create_branch',
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

  // Push branch
  pushBranch(branchName) {
    console.log(`📤 Pushing branch: ${branchName}`);
    
    try {
      execSync(`git push -u origin ${branchName}`, { encoding: 'utf8', cwd: this.getProjectRoot() });
      
      const operation = {
        id: this.generateOperationId(),
        type: 'push_branch',
        branchName,
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

  // Auto-commit with standard message
  async autoCommit(files, message) {
    console.log(`📝 Auto-committing ${files.length} files...`);
    
    try {
      // Stage files
      for (const file of files) {
        execSync(`git add ${file}`, { encoding: 'utf8', cwd: this.getProjectRoot() });
      }
      
      // Commit with standard message
      const commitMessage = this.formatCommitMessage(message);
      execSync(`git commit -m "${commitMessage}"`, { encoding: 'utf8', cwd: this.getProjectRoot() });
      
      const operation = {
        id: this.generateOperationId(),
        type: 'commit',
        files,
        message: commitMessage,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      return operation;
    } catch (error) {
      console.error(`❌ Failed to commit: ${error.message}`);
      
      const operation = {
        id: this.generateOperationId(),
        type: 'commit',
        files,
        error: error.message,
        timestamp: new Date().toISOString(),
        status: 'failed'
      };
      
      this.operations.push(operation);
      this.saveOperations();
      
      throw error;
    }
  }

  // Format commit message
  formatCommitMessage(message) {
    const timestamp = new Date().toISOString();
    return `${message}\n\nGenerated with [Devin](https://cli.devin.ai/docs)\n\nCo-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>`;
  }

  // Extract PR URL from output
  extractPRUrl(output) {
    const match = output.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/);
    return match ? match[0] : null;
  }

  // Get project root
  getProjectRoot() {
    return process.cwd();
  }

  // Configure automation
  configure(config) {
    console.log('⚙️  Configuring GitHub automation...');
    
    this.config = {
      ...this.config,
      ...config
    };
    
    return this.config;
  }

  // Enable auto-merge
  enableAutoMerge() {
    console.log('✅ Enabling auto-merge...');
    
    this.config.autoMergeEnabled = true;
    
    return this.config;
  }

  // Disable auto-merge
  disableAutoMerge() {
    console.log('❌ Disabling auto-merge...');
    
    this.config.autoMergeEnabled = false;
    
    return this.config;
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
    
    const byType = {};
    this.operations.forEach(op => {
      if (!byType[op.type]) {
        byType[op.type] = 0;
      }
      byType[op.type]++;
    });
    
    return {
      total,
      completed,
      failed,
      successRate: total > 0 ? (completed / total * 100).toFixed(2) : 0,
      byType
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

  const github = new GitHubAutomation();

  switch (command) {
    case 'create-pr':
      if (args[1] && args[2] && args[3]) {
        const result = await github.createAutoPR(args[1], args[2], args[3], args[4] ? args[4].split(',') : []);
        console.log('🔀 Created PR:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node github-automation.js create-pr <branch> <title> <body> [labels]');
      }
      break;

    case 'merge-pr':
      if (args[1]) {
        const result = await github.autoMergePR(parseInt(args[1]), args[2] || 'merge');
        console.log('🔀 Merged PR:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node github-automation.js merge-pr <pr-number> [method]');
      }
      break;

    case 'create-branch':
      if (args[1]) {
        const result = await github.createBranch(args[1], args[2]);
        console.log('🌿 Created Branch:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node github-automation.js create-branch <branch-name> [from-branch]');
      }
      break;

    case 'commit':
      if (args[1] && args[2]) {
        const files = args[1].split(',');
        const result = await github.autoCommit(files, args[2]);
        console.log('📝 Committed:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node github-automation.js commit <files> <message>');
      }
      break;

    case 'enable-auto-merge':
      const enabled = github.enableAutoMerge();
      console.log('✅ Auto-merge enabled:');
      console.log(JSON.stringify(enabled, null, 2));
      break;

    case 'disable-auto-merge':
      const disabled = github.disableAutoMerge();
      console.log('❌ Auto-merge disabled:');
      console.log(JSON.stringify(disabled, null, 2));
      break;

    case 'stats':
      const stats = github.getStatistics();
      console.log('📊 Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'history':
      const history = github.getOperationsHistory();
      console.log('📜 Operations History:');
      console.log(JSON.stringify(history, null, 2));
      break;

    default:
      console.log('🔀 GitHub Automation System');
      console.log('');
      console.log('Commands:');
      console.log('  create-pr       - Auto-create PR');
      console.log('  merge-pr        - Auto-merge PR');
      console.log('  create-branch  - Auto-create branch');
      console.log('  commit          - Auto-commit with standard message');
      console.log('  enable-auto-merge - Enable auto-merge');
      console.log('  disable-auto-merge - Disable auto-merge');
      console.log('  stats           - Get statistics');
      console.log('  history         - Get operations history');
      console.log('');
      console.log('Examples:');
      console.log('  node github-automation.js create-pr feature/test "Test PR" "Description"');
      console.log('  node github-automation.js merge-pr 123');
      console.log('  node github-automation.js create-branch feature/test');
      console.log('  node github-automation.js commit file1,file2 "Fix bug"');
      console.log('  node github-automation.js enable-auto-merge');
      console.log('  node github-automation.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  GitHubAutomation
};
