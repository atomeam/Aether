/**
 * Secret Rotation Automation
 * Automated secret rotation for various services
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Cloudflare Secret Rotation
// ============================================================================

class CloudflareSecretRotator {
  constructor() {
    this.projectPath = path.resolve(__dirname, '../../apps/bridge');
  }

  async rotateSecret(secretName, newValue) {
    console.log(`🔄 Rotating Cloudflare secret: ${secretName}`);
    
    try {
      // Update secret
      const command = `cd ${this.projectPath} && echo "${newValue}" | npx wrangler secret put ${secretName}`;
      execSync(command, { stdio: 'inherit' });
      
      console.log(`✅ Successfully rotated ${secretName}`);
      return {
        success: true,
        secretName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Failed to rotate ${secretName}:`, error.message);
      return {
        success: false,
        secretName,
        error: error.message
      };
    }
  }

  getSecret(secretName) {
    try {
      const command = `cd ${this.projectPath} && npx wrangler secret list`;
      const output = execSync(command, { encoding: 'utf8' });
      const secrets = JSON.parse(output);
      const secret = secrets.find(s => s.name === secretName);
      return secret ? secret.name : null;
    } catch (error) {
      console.error(`Failed to get secret ${secretName}:`, error.message);
      return null;
    }
  }

  listSecrets() {
    try {
      const command = `cd ${this.projectPath} && npx wrangler secret list`;
      const output = execSync(command, { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (error) {
      console.error('Failed to list secrets:', error.message);
      return [];
    }
  }
}

// ============================================================================
// GitHub Token Rotation
// ============================================================================

class GitHubTokenRotator {
  constructor(token) {
    this.token = token;
    this.apiBase = 'https://api.github.com';
  }

  async rotateToken(tokenId, note) {
    console.log(`🔄 Rotating GitHub token: ${tokenId}`);
    
    try {
      // Delete old token
      await this.deleteToken(tokenId);
      
      // Create new token
      const newToken = await this.createToken(note);
      
      console.log(`✅ Successfully rotated GitHub token`);
      return {
        success: true,
        tokenId,
        newToken: newToken.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Failed to rotate GitHub token:`, error.message);
      return {
        success: false,
        tokenId,
        error: error.message
      };
    }
  }

  async createToken(note) {
    const response = await fetch(`${this.apiBase}/authorizations`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        scopes: ['repo', 'workflow'],
        note: note || 'Aether CI/CD Token (Rotated)',
        note_url: 'https://github.com/your-repo'
      })
    });
    
    const data = await response.json();
    return data.token;
  }

  async deleteToken(tokenId) {
    const response = await fetch(`${this.apiBase}/authorizations/${tokenId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete token: ${response.statusText}`);
    }
  }

  listTokens() {
    return fetch(`${this.apiBase}/authorizations`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }).then(res => res.json());
  }
}

// ============================================================================
// Stripe Key Rotation
// ============================================================================

class StripeKeyRotator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiBase = 'https://api.stripe.com/v1';
  }

  async rotateSecretKey() {
    console.log('🔄 Rotating Stripe secret key');
    
    try {
      // Create new secret key
      const newKey = await this.createSecretKey();
      
      // Delete old key (if we had the key ID)
      // Note: Stripe doesn't provide a direct API to delete keys via API key
      // This must be done manually in the dashboard
      
      console.log('✅ Successfully created new Stripe secret key');
      console.log('⚠️  Please manually delete the old key in Stripe dashboard');
      
      return {
        success: true,
        newKey: newKey.substring(0, 10) + '...',
        timestamp: new Date().toISOString(),
        requiresManualCleanup: true
      };
    } catch (error) {
      console.error('❌ Failed to rotate Stripe key:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createSecretKey() {
    const response = await fetch(`${this.apiBase}/api_keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'description': 'Aether Secret Key (Rotated)'
      })
    });
    
    const data = await response.json();
    return data.secret_key;
  }

  listKeys() {
    return fetch(`${this.apiBase}/api_keys`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    }).then(res => res.json());
  }
}

// ============================================================================
// Secret Rotation Manager
// ============================================================================

class SecretRotationManager {
  constructor() {
    this.cloudflareRotator = new CloudflareSecretRotator();
    this.rotationLog = [];
  }

  async rotateCloudflareSecret(secretName, newValue) {
    const result = await this.cloudflareRotator.rotateSecret(secretName, newValue);
    this.logRotation('cloudflare', secretName, result);
    return result;
  }

  async rotateAllCloudflareSecrets(newValues) {
    const secrets = this.cloudflareRotator.listSecrets();
    const results = [];
    
    for (const secret of secrets) {
      if (newValues[secret.name]) {
        const result = await this.rotateCloudflareSecret(secret.name, newValues[secret.name]);
        results.push(result);
      }
    }
    
    return results;
  }

  async rotateGitHubToken(githubToken, tokenId, note) {
    const rotator = new GitHubTokenRotator(githubToken);
    const result = await rotator.rotateToken(tokenId, note);
    this.logRotation('github', tokenId, result);
    return result;
  }

  async rotateStripeKey(stripeApiKey) {
    const rotator = new StripeKeyRotator(stripeApiKey);
    const result = await rotator.rotateSecretKey();
    this.logRotation('stripe', 'secret_key', result);
    return result;
  }

  logRotation(service, target, result) {
    const logEntry = {
      service,
      target,
      success: result.success,
      timestamp: new Date().toISOString(),
      result
    };
    
    this.rotationLog.push(logEntry);
    this.saveLog();
  }

  saveLog() {
    const logPath = path.resolve(__dirname, 'rotation-log.json');
    fs.writeFileSync(logPath, JSON.stringify(this.rotationLog, null, 2));
  }

  getRotationLog() {
    return this.rotationLog;
  }

  generateRotationReport() {
    const successful = this.rotationLog.filter(l => l.success);
    const failed = this.rotationLog.filter(l => !l.success);
    
    return {
      total: this.rotationLog.length,
      successful: successful.length,
      failed: failed.length,
      byService: this.groupByService(),
      lastRotation: this.rotationLog.length > 0 ? this.rotationLog[this.rotationLog.length - 1] : null
    };
  }

  groupByService() {
    const grouped = {};
    this.rotationLog.forEach(log => {
      if (!grouped[log.service]) {
        grouped[log.service] = { total: 0, successful: 0, failed: 0 };
      }
      grouped[log.service].total++;
      if (log.success) grouped[log.service].successful++;
      else grouped[log.service].failed++;
    });
    return grouped;
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const manager = new SecretRotationManager();

  switch (command) {
    case 'list-cloudflare':
      const secrets = manager.cloudflareRotator.listSecrets();
      console.log('📋 Cloudflare Secrets:');
      secrets.forEach(s => console.log(`  - ${s.name} (${s.type})`));
      break;

    case 'rotate-cloudflare':
      if (args[1] && args[2]) {
        const result = await manager.rotateCloudflareSecret(args[1], args[2]);
        console.log('Result:', result);
      } else {
        console.error('Usage: node secret-rotation.js rotate-cloudflare <secret-name> <new-value>');
      }
      break;

    case 'report':
      const report = manager.generateRotationReport();
      console.log('📊 Rotation Report:');
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'log':
      const log = manager.getRotationLog();
      console.log('📝 Rotation Log:');
      console.log(JSON.stringify(log, null, 2));
      break;

    default:
      console.log('🔐 Secret Rotation Automation');
      console.log('');
      console.log('Commands:');
      console.log('  list-cloudflare      - List all Cloudflare secrets');
      console.log('  rotate-cloudflare    - Rotate a Cloudflare secret');
      console.log('  report               - Generate rotation report');
      console.log('  log                  - Show rotation log');
      console.log('');
      console.log('Examples:');
      console.log('  node secret-rotation.js list-cloudflare');
      console.log('  node secret-rotation.js rotate-cloudflare STRIPE_SECRET_KEY "new_secret_value"');
      console.log('  node secret-rotation.js report');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  SecretRotationManager,
  CloudflareSecretRotator,
  GitHubTokenRotator,
  StripeKeyRotator
};
