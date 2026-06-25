import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { DevOptions, CommandResult } from '../types.js';
import { DevOptionsSchema } from '../types.js';
import { findDevScript, startDevServer } from '../utils/dev.js';

export const devCommand = new Command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host address', 'localhost')
  .option('-o, --open', 'Open browser automatically')
  .option('--no-hot', 'Disable hot module replacement')
  .option('--inspect', 'Enable Node inspector')
  .action(async (options: any) => {
    try {
      const validatedOptions: DevOptions = DevOptionsSchema.parse({
        port: parseInt(options.port, 10),
        host: options.host,
        open: options.open || false,
        hot: options.hot !== false,
        inspect: options.inspect || false,
      });

      const spinner = ora('Starting development server...').start();

      const startTime = Date.now();
      const result = await startDevServer(validatedOptions);
      const duration = Date.now() - startTime;

      spinner.stop();

      if (result.success) {
        console.log(chalk.green('✓ Development server started'));
        console.log(chalk.gray(`  URL: http://${validatedOptions.host}:${validatedOptions.port}`));
        console.log(chalk.gray(`  Hot reload: ${validatedOptions.hot ? 'enabled' : 'disabled'}`));
        console.log(chalk.gray(`  Duration: ${duration}ms`));
        console.log();
        console.log(chalk.cyan('Press Ctrl+C to stop'));
      } else {
        console.error(chalk.red('✗ Failed to start development server'));
        console.error(chalk.red(result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });
