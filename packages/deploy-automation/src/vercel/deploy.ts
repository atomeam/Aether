/**
 * Vercel Deployment Script
 * Handles deployment to Vercel with full automation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { VercelDeploymentConfig, DeploymentResult, DeploymentStatus } from '../types';
import { VercelDeploymentConfigSchema } from '../schemas';

const execAsync = promisify(exec);

export class VercelDeployer {
  private config: VercelDeploymentConfig;
  private logs: string[] = [];

  constructor(config: VercelDeploymentConfig) {
    // Validate config
    const validated = VercelDeploymentConfigSchema.parse(config);
    this.config = validated;
  }

  /**
   * Deploy to Vercel
   */
  async deploy(): Promise<DeploymentResult> {
    const startTime = Date.now();
    const deploymentId = `vercel-${Date.now()}`;

    try {
      this.log('Starting Vercel deployment...');
      this.log(`Environment: ${this.config.environment}`);
      this.log(`Project: ${this.config.appName}`);
      this.log(`Version: ${this.config.version}`);

      // Pre-deployment checks
      await this.runPreDeploymentChecks();

      // Set environment variables
      await this.setEnvironmentVariables();

      // Build the project
      await this.buildProject();

      // Deploy to Vercel
      const url = await this.deployToVercel();

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

    // Check if Vercel CLI is installed
    try {
      await execAsync('npx vercel --version');
      this.log('✓ Vercel CLI is available');
    } catch (error) {
      throw new Error('Vercel CLI is not installed or not accessible');
    }

    // Check if VERCEL_TOKEN is set
    if (!process.env.VERCEL_TOKEN) {
      throw new Error('VERCEL_TOKEN environment variable is not set');
    }
    this.log('✓ VERCEL_TOKEN is set');

    // Check if VERCEL_ORG_ID is set
    if (!process.env.VERCEL_ORG_ID) {
      throw new Error('VERCEL_ORG_ID environment variable is not set');
    }
    this.log('✓ VERCEL_ORG_ID is set');

    // Check if VERCEL_PROJECT_ID is set
    if (!process.env.VERCEL_PROJECT_ID) {
      throw new Error('VERCEL_PROJECT_ID environment variable is not set');
    }
    this.log('✓ VERCEL_PROJECT_ID is set');

    // Validate vercel.json exists
    try {
      await execAsync('test -f vercel.json');
      this.log('✓ vercel.json exists');
    } catch (error) {
      this.log('⚠ vercel.json not found (optional)');
    }
  }

  /**
   * Set environment variables
   */
  private async setEnvironmentVariables(): Promise<void> {
    this.log('Setting environment variables...');

    for (const [key, value] of Object.entries(this.config.env)) {
      try {
        const env = this.config.environment === 'prod' ? 'production' : this.config.environment;
        const cmd = `npx vercel env add ${key} ${env} <<EOF
${value}
EOF`;

        await execAsync(cmd);
        this.log(`✓ Set ${key} for ${env}`);
      } catch (error) {
        this.log(`⚠ Failed to set ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Build the project
   */
  private async buildProject(): Promise<void> {
    this.log('Building project...');

    try {
      await execAsync(this.config.buildCommand);
      this.log('✓ Project built successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deploy to Vercel
   */
  private async deployToVercel(): Promise<string> {
    this.log('Deploying to Vercel...');

    try {
      // Set environment variables for Vercel CLI
      const env = {
        ...process.env,
        VERCEL_TOKEN: process.env.VERCEL_TOKEN,
        VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
        VERCEL_PROJECT_ID: this.config.projectId
      };

      // Deploy command
      const deployCmd = this.config.environment === 'prod'
        ? 'npx vercel --prod'
        : `npx vercel`;

      const { stdout, stderr } = await execAsync(deployCmd, { env });

      if (stderr) {
        this.log(`Vercel stderr: ${stderr}`);
      }

      this.log(stdout);

      // Extract URL from output
      const urlMatch = stdout.match(/https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/);
      if (urlMatch) {
        this.log(`✓ Deployed to: ${urlMatch[0]}`);
        return urlMatch[0];
      }

      throw new Error('Could not extract deployment URL from Vercel output');
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      // Promote previous deployment
      const url = await this.promoteDeployment(previousDeployment.url);

      const duration = Date.now() - startTime;

      return {
        success: true,
        status: 'rolled_back',
        deploymentId: `rollback-${Date.now()}`,
        url,
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
  private async getPreviousDeployment(): Promise<{ version: string; url: string } | null> {
    try {
      // List deployments
      const { stdout } = await execAsync('npx vercel list --limit 2');
      const lines = stdout.trim().split('\n');

      if (lines.length < 2) {
        return null;
      }

      // Parse second line (first deployment after current)
      const parts = lines[1].split(/\s+/);
      const url = parts[0];
      const version = 'previous';

      return { version, url };
    } catch (error) {
      this.log(`Failed to get previous deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Promote deployment to production
   */
  private async promoteDeployment(url: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`npx vercel promote ${url} --yes`);
      this.log(stdout);

      return url;
    } catch (error) {
      throw new Error(`Failed to promote deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
