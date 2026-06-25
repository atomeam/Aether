#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scaffoldCommand } from './commands/scaffold.js';
import { packageCommand } from './commands/package.js';
import { deployCommand } from './commands/deploy.js';
import { devCommand } from './commands/dev.js';
import { generateCommand } from './commands/generate.js';
import { version } from '../package.json';

const program = new Command();

program
  .name('aether')
  .description('Aether CLI - Command-line interface for Aether development')
  .version(version);

// Add subcommands
program.addCommand(scaffoldCommand);
program.addCommand(packageCommand);
program.addCommand(deployCommand);
program.addCommand(devCommand);
program.addCommand(generateCommand);

// Global error handling
program.on('command:*', (operands) => {
  console.error(
    chalk.red(`error: unknown command '${operands[0]}'`)
  );
  process.exit(1);
});

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Export for programmatic use
export default program;
