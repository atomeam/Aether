import fs from 'fs-extra';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { DevOptions, CommandResult } from '../types.js';

/**
 * Find the dev script in package.json
 */
export async function findDevScript(): Promise<string | null> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!(await fs.pathExists(packageJsonPath))) {
    return null;
  }

  const packageJson = await fs.readJson(packageJsonPath);

  if (packageJson.scripts?.dev) {
    return packageJson.scripts.dev;
  }

  if (packageJson.scripts?.start) {
    return packageJson.scripts.start;
  }

  return null;
}

/**
 * Start the development server
 */
export async function startDevServer(options: DevOptions): Promise<CommandResult> {
  try {
    const devScript = await findDevScript();

    if (!devScript) {
      return {
        success: false,
        error: 'No dev script found in package.json',
      };
    }

    // Parse the dev script
    const [cmd, ...args] = devScript.split(' ');

    // Add port and host options if using Vite
    if (cmd.includes('vite')) {
      args.push('--port', options.port.toString());
      args.push('--host', options.host);
    }

    // Start the process
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: options.port.toString(),
        HOST: options.host,
      },
    });

    // Handle process termination
    process.on('SIGINT', () => {
      child.kill();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      child.kill();
      process.exit(0);
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start dev server',
    };
  }
}
