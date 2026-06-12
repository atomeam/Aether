import { execSync } from 'child_process';
import { CommandResult, DeployOptions, DeployResult, DeploymentTarget } from '../types.js';

/**
 * Build the project
 */
export async function buildProject(): Promise<CommandResult<void>> {
  try {
    execSync('npm run build', { stdio: 'inherit' });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Build failed',
    };
  }
}

/**
 * Deploy to Vercel
 */
export async function deployToVercel(options: DeployOptions): Promise<DeployResult> {
  try {
    const args = [];
    if (options.preview) args.push('--preview');
    if (options.force) args.push('--force');
    if (options.environment !== 'production') args.push(`--env=${options.environment}`);

    const cmd = `vercel ${args.join(' ')}`;
    const output = execSync(cmd, { encoding: 'utf-8' });

    // Parse output to get URL
    const urlMatch = output.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : 'unknown';

    return {
      success: true,
      data: {
        url,
        deploymentId: Date.now().toString(),
        target: DeploymentTarget.VERCEL,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Vercel deployment failed',
    };
  }
}

/**
 * Deploy to Cloudflare Workers
 */
export async function deployToCloudflare(options: DeployOptions): Promise<DeployResult> {
  try {
    const args = [];
    if (options.environment !== 'production') {
      args.push('--env', options.environment);
    }

    const cmd = `npx wrangler deploy ${args.join(' ')}`;
    const output = execSync(cmd, { encoding: 'utf-8' });

    // Parse output to get URL
    const urlMatch = output.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : 'unknown';

    return {
      success: true,
      data: {
        url,
        deploymentId: Date.now().toString(),
        target: DeploymentTarget.CLOUDFLARE,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cloudflare deployment failed',
    };
  }
}

/**
 * Deploy to Netlify
 */
export async function deployToNetlify(options: DeployOptions): Promise<DeployResult> {
  try {
    const args = [];
    if (options.preview) args.push('--draft');
    if (options.environment !== 'production') {
      args.push('--message', `Deploy to ${options.environment}`);
    }

    const cmd = `netlify deploy ${args.join(' ')}`;
    const output = execSync(cmd, { encoding: 'utf-8' });

    // Parse output to get URL
    const urlMatch = output.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : 'unknown';

    return {
      success: true,
      data: {
        url,
        deploymentId: Date.now().toString(),
        target: DeploymentTarget.NETLIFY,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Netlify deployment failed',
    };
  }
}
