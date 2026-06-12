/**
 * Rollback Manager
 * Handles rollback operations for failed deployments
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { RollbackConfig, DeploymentResult, DeploymentStatus } from '../types';
import { RollbackConfigSchema } from '../schemas';

const execAsync = promisify(exec);

export class RollbackManager {
  private config: RollbackConfig;
  private logs: string[] = [];

  constructor(config: RollbackConfig) {
    // Validate config
    const validated = RollbackConfigSchema.parse(config);
    this.config = validated;
  }

  /**
   * Execute rollback with health checks
   */
  async rollback(deploymentId: string, platform: 'cloudflare' | 'vercel'): Promise<DeploymentResult> {
    const startTime = Date.now();

    try {
      this.log(`Starting rollback for deployment ${deploymentId}...`);
      this.log(`Strategy: ${this.config.rollbackStrategy}`);

      if (!this.config.enabled) {
        throw new Error('Rollback is disabled in configuration');
      }

      // Get previous deployment
      const previousDeployment = await this.getPreviousDeployment(platform);
      if (!previousDeployment) {
        throw new Error('No previous deployment found to rollback to');
      }

      this.log(`Found previous deployment: ${previousDeployment.version}`);

      // Execute rollback based on strategy
      let result: DeploymentResult;
      switch (this.config.rollbackStrategy) {
        case 'immediate':
          result = await this.immediateRollback(previousDeployment, platform);
          break;
        case 'automatic':
          result = await this.automaticRollback(previousDeployment, platform);
          break;
        case 'manual':
          result = await this.manualRollback(previousDeployment, platform);
          break;
        default:
          throw new Error(`Unknown rollback strategy: ${this.config.rollbackStrategy}`);
      }

      // Run health checks if rollback succeeded
      if (result.success) {
        this.log('Running post-rollback health checks...');
        const healthCheckResult = await this.runHealthChecks(result.url);
        if (!healthCheckResult) {
          this.log('⚠ Health checks failed after rollback');
          result.success = false;
          result.error = 'Health checks failed after rollback';
        } else {
          this.log('✓ Health checks passed');
        }
      }

      const duration = Date.now() - startTime;

      return {
        ...result,
        deploymentId: `rollback-${Date.now()}`,
        timestamp: new Date(),
        duration,
        logs: this.logs
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log(`Rollback failed: ${errorMessage}`);

      return {
        success: false,
        status: 'failed',
        deploymentId: `rollback-failed-${Date.now()}`,
        error: errorMessage,
        timestamp: new Date(),
        duration,
        logs: this.logs
      };
    }
  }

  /**
   * Immediate rollback - no retries
   */
  private async immediateRollback(
    previousDeployment: { version: string; commitSha?: string; url?: string },
    platform: 'cloudflare' | 'vercel'
  ): Promise<DeploymentResult> {
    this.log('Executing immediate rollback...');

    try {
      if (platform === 'cloudflare') {
        return await this.rollbackCloudflare(previousDeployment);
      } else {
        return await this.rollbackVercel(previousDeployment);
      }
    } catch (error) {
      throw new Error(`Immediate rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Automatic rollback - with retries
   */
  private async automaticRollback(
    previousDeployment: { version: string; commitSha?: string; url?: string },
    platform: 'cloudflare' | 'vercel'
  ): Promise<DeploymentResult> {
    this.log('Executing automatic rollback with retries...');

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      this.log(`Rollback attempt ${attempt}/${this.config.maxRetries}`);

      try {
        if (platform === 'cloudflare') {
          return await this.rollbackCloudflare(previousDeployment);
        } else {
          return await this.rollbackVercel(previousDeployment);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        this.log(`Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < this.config.maxRetries) {
          await this.sleep(this.config.timeout / this.config.maxRetries);
        }
      }
    }

    throw new Error(`Automatic rollback failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Manual rollback - requires confirmation
   */
  private async manualRollback(
    previousDeployment: { version: string; commitSha?: string; url?: string },
    platform: 'cloudflare' | 'vercel'
  ): Promise<DeploymentResult> {
    this.log('Manual rollback requires confirmation...');
    this.log('⚠ Manual rollback strategy requires human intervention');
    this.log('Please execute the rollback manually using the CLI');

    return {
      success: false,
      status: 'failed',
      deploymentId: 'manual-required',
      error: 'Manual rollback requires human intervention',
      timestamp: new Date(),
      duration: 0,
      logs: this.logs
    };
  }

  /**
   * Rollback Cloudflare deployment
   */
  private async rollbackCloudflare(
    previousDeployment: { version: string; commitSha?: string; url?: string }
  ): Promise<DeploymentResult> {
    this.log('Rolling back Cloudflare Worker...');

    try {
      if (previousDeployment.commitSha) {
        // Checkout and deploy previous commit
        await execAsync(`git checkout ${previousDeployment.commitSha}`);
        await execAsync('npx wrangler deploy --env production');
        await execAsync('git checkout main');
      } else if (previousDeployment.url) {
        // Use wrangler rollback if available
        await execAsync('npx wrangler rollback');
      } else {
        throw new Error('No commit SHA or URL available for rollback');
      }

      this.log('✓ Cloudflare rollback completed');

      return {
        success: true,
        status: 'rolled_back',
        deploymentId: 'cf-rollback',
        url: previousDeployment.url,
        timestamp: new Date(),
        duration: 0,
        logs: this.logs
      };
    } catch (error) {
      throw new Error(`Cloudflare rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rollback Vercel deployment
   */
  private async rollbackVercel(
    previousDeployment: { version: string; commitSha?: string; url?: string }
  ): Promise<DeploymentResult> {
    this.log('Rolling back Vercel deployment...');

    try {
      if (previousDeployment.url) {
        // Promote previous deployment
        await execAsync(`npx vercel promote ${previousDeployment.url} --yes`);
      } else {
        throw new Error('No URL available for Vercel rollback');
      }

      this.log('✓ Vercel rollback completed');

      return {
        success: true,
        status: 'rolled_back',
        deploymentId: 'vercel-rollback',
        url: previousDeployment.url,
        timestamp: new Date(),
        duration: 0,
        logs: this.logs
      };
    } catch (error) {
      throw new Error(`Vercel rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get previous deployment
   */
  private async getPreviousDeployment(platform: 'cloudflare' | 'vercel'): Promise<{
    version: string;
    commitSha?: string;
    url?: string;
  } | null> {
    try {
      const { stdout } = await execAsync('git log -2 --pretty=format:"%H %s"');
      const commits = stdout.trim().split('\n');

      if (commits.length < 2) {
        return null;
      }

      const [commitSha, ...messageParts] = commits[1].split(' ');
      const version = this.extractVersionFromMessage(messageParts.join(' '));

      if (platform === 'vercel') {
        // Try to get previous Vercel deployment URL
        try {
          const { stdout: vercelOutput } = await execAsync('npx vercel list --limit 2');
          const lines = vercelOutput.trim().split('\n');
          if (lines.length >= 2) {
            const url = lines[1].split(/\s+/)[0];
            return { version, commitSha, url };
          }
        } catch {
          // Ignore Vercel list errors
        }
      }

      return { version, commitSha };
    } catch (error) {
      this.log(`Failed to get previous deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Run health checks
   */
  private async runHealthChecks(url?: string): Promise<boolean> {
    if (!url) {
      this.log('⚠ No URL available for health checks');
      return false;
    }

    const { endpoint, method, expectedStatus, timeout, retries, interval, headers } = this.config.healthCheck;

    for (let attempt = 1; attempt <= retries; attempt++) {
      this.log(`Health check attempt ${attempt}/${retries}...`);

      try {
        const response = await this.fetchWithTimeout(endpoint, method, timeout, headers);

        if (response.status === expectedStatus) {
          this.log(`✓ Health check passed (status: ${response.status})`);
          return true;
        } else {
          this.log(`⚠ Health check failed (expected: ${expectedStatus}, got: ${response.status})`);
        }
      } catch (error) {
        this.log(`⚠ Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      if (attempt < retries) {
        await this.sleep(interval);
      }
    }

    return false;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    method: 'GET' | 'POST',
    timeout: number,
    headers?: Record<string, string>
  ): Promise<{ status: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return { status: response.status };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Extract version from commit message
   */
  private extractVersionFromMessage(message: string): string {
    const versionMatch = message.match(/v?(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : '0.0.0';
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log message
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }
}
