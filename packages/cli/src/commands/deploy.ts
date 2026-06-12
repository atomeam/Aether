import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { execSync } from 'child_process';
import { DeployOptions, DeploymentTarget, DeployResult } from '../types.js';
import { DeployOptionsSchema } from '../types.js';
import { buildProject, deployToVercel, deployToCloudflare, deployToNetlify } from '../utils/deploy.js';

export const deployCommand = new Command('deploy')
  .description('Deploy your Aether project')
  .option('-t, --target <target>', 'Deployment target', 'vercel')
  .option('-e, --environment <environment>', 'Environment', 'production')
  .option('--no-build', 'Skip build step')
  .option('--preview', 'Deploy as preview')
  .option('-f, --force', 'Force deployment')
  .action(async (options: any) => {
    try {
      // Interactive mode if needed
      if (!options.target) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'target',
            message: 'Select deployment target:',
            choices: [
              { name: 'Vercel', value: 'vercel' },
              { name: 'Cloudflare Workers', value: 'cloudflare' },
              { name: 'Netlify', value: 'netlify' },
              { name: 'Local', value: 'local' },
            ],
          },
          {
            type: 'list',
            name: 'environment',
            message: 'Select environment:',
            choices: ['development', 'staging', 'production'],
            default: 'production',
          },
        ]);

        options = { ...options, ...answers };
      }

      const validatedOptions: DeployOptions = DeployOptionsSchema.parse({
        target: options.target as DeploymentTarget,
        environment: options.environment,
        build: options.build !== false,
        preview: options.preview || false,
        force: options.force || false,
      });

      const spinner = ora('Deploying project...').start();

      const startTime = Date.now();
      const result = await deployProject(validatedOptions);
      const duration = Date.now() - startTime;

      spinner.stop();

      if (result.success) {
        console.log(chalk.green('✓ Deployment successful!'));
        console.log(chalk.gray(`  Target: ${result.data?.target}`));
        console.log(chalk.gray(`  URL: ${result.data?.url}`));
        console.log(chalk.gray(`  Deployment ID: ${result.data?.deploymentId}`));
        console.log(chalk.gray(`  Duration: ${duration}ms`));
      } else {
        console.error(chalk.red('✗ Deployment failed'));
        console.error(chalk.red(result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function deployProject(options: DeployOptions): Promise<DeployResult> {
  try {
    // Build project if requested
    if (options.build) {
      const buildResult = await buildProject();
      if (!buildResult.success) {
        return {
          success: false,
          error: buildResult.error,
        };
      }
    }

    // Deploy based on target
    let deployResult;
    switch (options.target) {
      case DeploymentTarget.VERCEL:
        deployResult = await deployToVercel(options);
        break;
      case DeploymentTarget.CLOUDFLARE:
        deployResult = await deployToCloudflare(options);
        break;
      case DeploymentTarget.NETLIFY:
        deployResult = await deployToNetlify(options);
        break;
      case DeploymentTarget.LOCAL:
        deployResult = {
          success: true,
          data: {
            url: 'http://localhost:3000',
            deploymentId: 'local',
            target: DeploymentTarget.LOCAL,
          },
        };
        break;
      default:
        return {
          success: false,
          error: `Unknown deployment target: ${options.target}`,
        };
    }

    return deployResult;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
