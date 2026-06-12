import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { ScaffoldOptions, ProjectTemplate, PackageManager, ScaffoldResult } from '../types.js';
import { ScaffoldOptionsSchema } from '../types.js';
import { detectPackageManager, createProjectStructure, installDependencies, initializeGit } from '../utils/project.js';

export const scaffoldCommand = new Command('scaffold')
  .description('Scaffold a new Aether project')
  .argument('[name]', 'Project name')
  .option('-t, --template <template>', 'Project template', 'basic')
  .option('-p, --package-manager <manager>', 'Package manager')
  .option('--no-typescript', 'Disable TypeScript')
  .option('--no-testing', 'Disable testing setup')
  .option('--no-linting', 'Disable linting setup')
  .option('--no-git', 'Disable Git initialization')
  .option('-d, --directory <directory>', 'Target directory')
  .action(async (name: string | undefined, options: any) => {
    try {
      // Interactive mode if no name provided
      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Project name:',
            validate: (input: string) => {
              if (!input.trim()) return 'Project name is required';
              if (!/^[a-z0-9-]+$/.test(input)) {
                return 'Project name must be lowercase and contain only letters, numbers, and hyphens';
              }
              return true;
            },
          },
          {
            type: 'list',
            name: 'template',
            message: 'Select template:',
            choices: [
              { name: 'Basic - Minimal setup', value: 'basic' },
              { name: 'Fullstack - Frontend + Backend', value: 'fullstack' },
              { name: 'API - API-only project', value: 'api' },
              { name: 'Worker - Cloudflare Worker', value: 'worker' },
              { name: 'Monorepo - Turborepo setup', value: 'monorepo' },
            ],
            default: 'basic',
          },
          {
            type: 'list',
            name: 'packageManager',
            message: 'Select package manager:',
            choices: ['npm', 'yarn', 'pnpm', 'bun'],
            default: 'npm',
          },
          {
            type: 'confirm',
            name: 'typescript',
            message: 'Use TypeScript?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'testing',
            message: 'Setup testing?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'linting',
            message: 'Setup linting?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'git',
            message: 'Initialize Git?',
            default: true,
          },
        ]);

        name = answers.name;
        options = { ...options, ...answers };
      }

      // Validate options
      const validatedOptions: ScaffoldOptions = ScaffoldOptionsSchema.parse({
        name,
        template: options.template as ProjectTemplate,
        packageManager: options.packageManager as PackageManager,
        typescript: options.typescript !== false,
        testing: options.testing !== false,
        linting: options.linting !== false,
        git: options.git !== false,
        directory: options.directory,
      });

      const spinner = ora('Creating project...').start();

      const startTime = Date.now();
      const result = await scaffoldProject(validatedOptions);
      const duration = Date.now() - startTime;

      spinner.stop();

      if (result.success) {
        console.log(chalk.green('✓ Project created successfully!'));
        console.log(chalk.gray(`  Template: ${result.data?.template}`));
        console.log(chalk.gray(`  Location: ${result.data?.projectPath}`));
        console.log(chalk.gray(`  Files created: ${result.data?.filesCreated.length}`));
        console.log(chalk.gray(`  Duration: ${duration}ms`));
        console.log();
        console.log(chalk.cyan('Next steps:'));
        console.log(chalk.gray(`  cd ${result.data?.projectPath}`));
        console.log(chalk.gray(`  ${validatedOptions.packageManager} install`));
        console.log(chalk.gray(`  ${validatedOptions.packageManager} run dev`));
      } else {
        console.error(chalk.red('✗ Failed to create project'));
        console.error(chalk.red(result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  try {
    const projectPath = options.directory
      ? path.resolve(options.directory, options.name)
      : path.resolve(process.cwd(), options.name);

    // Check if directory already exists
    if (await fs.pathExists(projectPath)) {
      return {
        success: false,
        error: `Directory '${projectPath}' already exists`,
      };
    }

    // Detect package manager if not specified
    const packageManager = options.packageManager || (await detectPackageManager());

    // Create project structure
    const filesCreated = await createProjectStructure(projectPath, options);

    // Initialize Git if requested
    if (options.git) {
      await initializeGit(projectPath);
    }

    return {
      success: true,
      data: {
        projectPath,
        template: options.template,
        filesCreated,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
