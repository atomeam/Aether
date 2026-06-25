import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { PackageOptions, PackageManager, CommandResult } from '../types.js';
import { PackageOptionsSchema } from '../types.js';
import { detectPackageManager } from '../utils/project.js';
import { getPackageCommand } from '../utils/package.js';

export const packageCommand = new Command('package')
  .description('Manage packages in your project')
  .argument('<action>', 'Action to perform (install, add, remove, update, list)')
  .argument('[packages...]', 'Package names')
  .option('-D, --dev', 'Install as dev dependency')
  .option('-E, --exact', 'Install exact version')
  .option('-w, --workspace <workspace>', 'Target workspace in monorepo')
  .action(async (action: string, packages: string[], options: any) => {
    try {
      const validatedOptions: PackageOptions = PackageOptionsSchema.parse({
        action: action as any,
        packages: packages.length > 0 ? packages : undefined,
        dev: options.dev || false,
        exact: options.exact || false,
        workspace: options.workspace,
      });

      const spinner = ora('Managing packages...').start();

      const startTime = Date.now();
      const result = await managePackages(validatedOptions);
      const duration = Date.now() - startTime;

      spinner.stop();

      if (result.success) {
        console.log(chalk.green('✓ Packages managed successfully'));
        console.log(chalk.gray(`  Action: ${validatedOptions.action}`));
        console.log(chalk.gray(`  Duration: ${duration}ms`));
      } else {
        console.error(chalk.red('✗ Failed to manage packages'));
        console.error(chalk.red(result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function managePackages(options: PackageOptions): Promise<CommandResult<void>> {
  try {
    const packageManager = await detectPackageManager();
    const command = getPackageCommand(packageManager, options);

    let cmd = '';
    let args: string[] = [];

    switch (options.action) {
      case 'install':
        cmd = command.install;
        break;
      case 'add':
        cmd = command.add;
        if (options.packages) {
          args = options.packages;
        }
        if (options.dev) args.push(command.devFlag);
        if (options.exact) args.push(command.exactFlag);
        break;
      case 'remove':
        cmd = command.remove;
        if (options.packages) {
          args = options.packages;
        }
        break;
      case 'update':
        cmd = command.update;
        if (options.packages) {
          args = options.packages;
        }
        break;
      case 'list':
        cmd = command.list;
        break;
      default:
        return {
          success: false,
          error: `Unknown action: ${options.action}`,
        };
    }

    // Add workspace flag if specified
    if (options.workspace) {
      args.unshift(command.workspaceFlag(options.workspace));
    }

    const fullCommand = `${cmd} ${args.join(' ')}`;
    execSync(fullCommand, { stdio: 'inherit' });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
