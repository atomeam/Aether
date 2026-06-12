/**
 * Cloudflare Workers Deployment Script
 * Handles deployment of Cloudflare Workers with full automation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { CloudflareDeploymentConfig, DeploymentResult, DeploymentStatus } from '../types';
import { CloudflareDeploymentConfigSchema } from '../schemas';

const execAsync = promisify(exec);

export class CloudflareDeployer {
  private config: CloudflareDeploymentConfig;
  private logs: string[] = [];

  constructor(config: CloudflareDeploymentConfig) {
    // Validate config
    const validated = CloudflareDeploymentConfigSchema.parse(config);
    this.config = validated;
  }

  /**
   * Deploy a Cloudflare Worker
   */
  async deploy(): Promise<DeploymentResult> {
    const startTime = Date.now();
    const deploymentId = `cf-${Date.now()}`;

    try {
      this.log('Starting Cloudflare Worker deployment...');
      this.log(`Environment: ${this.config.environment}`);
      this.log(`Worker: ${this.config.workerName}`);
      this.log(`Version: ${this.config.version}`);

      // Pre-deployment checks
      await this.runPreDeploymentChecks();

      // Build the worker
      await this.buildWorker();

      // Deploy to Cloudflare
      const url = await this.deployToCloudflare();

      const duration = Date.now() - startTime;

      return {
        success: true,
        status: 'success',
        deploymentId,
        url,
        timestamp: new Date(),
        duration,
        logs: this.logs
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log(`Deployment failed: ${errorMessage}`);

      return {
        success: false,
        status: 'failed',
        deploymentId,
        error: errorMessage,
        timestamp: new Date(),
        duration,
        logs: this.logs
      };
    }
  }

  /**
   * Run pre-deployment checks
   */
  private async runPreDeploymentChecks(): Promise<void> {
    this.log('Running pre-deployment checks...');

    // Check if wrangler is installed
    try {
      await execAsync('npx wrangler --version');
      this.log('✓ Wrangler CLI is available');
    } catch (error) {
      throw new Error('Wrangler CLI is not installed or not accessible');
    }

    // Check if CF_API_TOKEN is set
    if (!process.env.CF_API_TOKEN) {
      throw new Error('CF_API_TOKEN environment variable is not set');
    }
    this.log('✓ CF_API_TOKEN is set');

    // Check if CF_ACCOUNT_ID is set
    if (!process.env.CF_ACCOUNT_ID) {
      throw new Error('CF_ACCOUNT_ID environment variable is not set');
    }
    this.log('✓ CF_ACCOUNT_ID is set');

    // Validate wrangler.toml exists
    try {
      await execAsync('test -f wrangler.toml');
      this.log('✓ wrangler.toml exists');
    } catch (error) {
      throw new Error('wrangler.toml not found in current directory');
    }
  }

  /**
   * Build the worker
   */
  private async buildWorker(): Promise<void> {
    this.log('Building worker...');

    try {
      // Run build command based on environment
      const buildCmd = this.config.environment === 'prod'
        ? 'npm run build'
        : 'npm run build';

      await execAsync(buildCmd);
      this.log('✓ Worker built successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deploy to Cloudflare
   */
  private async deployToCloudflare(): Promise<string> {
    this.log('Deploying to Cloudflare...');

    try {
      // Set environment variables for wrangler
      const env = {
        ...process.env,
        CF_API_TOKEN: process.env.CF_API_TOKEN,
        CF_ACCOUNT_ID: this.config.accountId
      };

      // Deploy command
      const deployCmd = this.config.environment === 'prod'
        ? 'npx wrangler deploy --env production'
        : `npx wrangler deploy --env ${this.config.environment}`;

      const { stdout, stderr } = await execAsync(deployCmd, { env });

      if (stderr) {
        this.log(`Wrangler stderr: ${stderr}`);
      }

      this.log(stdout);

      // Extract URL from output
      const urlMatch = stdout.match(/https:\/\/[a-zA-Z0-9.-]+\.workers\.dev/);
      if (urlMatch) {
        this.log(`✓ Deployed to: ${urlMatch[0]}`);
        return urlMatch[0];
      }

      // Fallback: construct URL from worker name
      const url = `https://${this.config.workerName}.${this.config.accountId}.workers.dev`;
      this.log(`✓ Deployed to: ${url}`);
      return url;
    } catch (error) {
      throw new Error(`Cloudflare deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rollback to previous deployment
   */
  async rollback(deploymentId: string): Promise<DeploymentResult> {
    const startTime = Date.now();

    try {
      this.log(`Initiating rollback for deployment ${deploymentId}...`);

      // Get previous deployment
      const previousDeployment = await this.getPreviousDeployment();
      if (!previousDeployment) {
        throw new Error('No previous deployment found to rollback to');
      }

      this.log(`Rolling back to version ${previousDeployment.version}`);

      // Deploy previous version
      const result = await this.deployVersion(previousDeployment.commitSha);

      const duration = Date.now() - startTime;

      return {
        success: true,
        status: 'rolled_back',
        deploymentId: `rollback-${Date.now()}`,
        url: result.url,
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
   * Get previous deployment
   */
  private async getPreviousDeployment(): Promise<{ version: string; commitSha: string } | null> {
    try {
      // Get previous commit
      const { stdout } = await execAsync('git log -2 --pretty=format:"%H %s"');
      const commits = stdout.trim().split('\n');

      if (commits.length < 2) {
        return null;
      }

      const [commitSha, ...messageParts] = commits[1].split(' ');
      const version = this.extractVersionFromMessage(messageParts.join(' '));

      return { version, commitSha };
    } catch (error) {
      this.log(`Failed to get previous deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Deploy specific version
   */
  private async deployVersion(commitSha: string): Promise<{ url: string }> {
    try {
      // Checkout commit
      await execAsync(`git checkout ${commitSha}`);

      // Deploy
      const url = await this.deployToCloudflare();

      // Return to main branch
      await execAsync('git checkout main');

      return { url };
    } catch (error) {
      // Ensure we return to main branch even on error
      await execAsync('git checkout main').catch(() => {});
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
   * Log message
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }
}
