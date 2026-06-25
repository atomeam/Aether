import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { GenerateOptions, GenerateResult } from '../types.js';
import { GenerateOptionsSchema } from '../types.js';
import { generateComponent, generateApiClient, generateSchema, generateType, generateBoilerplate } from '../utils/generate.js';

export const generateCommand = new Command('generate')
  .alias('gen')
  .description('Generate code artifacts')
  .argument('<type>', 'Type to generate (component, api-client, schema, type, boilerplate)')
  .argument('[name]', 'Name of the artifact')
  .option('-p, --path <path>', 'Output path')
  .option('-f, --framework <framework>', 'Framework (react, vue, svelte, solid, none)')
  .option('-l, --language <language>', 'Language (typescript, javascript)', 'typescript')
  .option('-s, --styling <styling>', 'Styling (css, scss, tailwind, none)')
  .action(async (type: string, name: string | undefined, options: any) => {
    try {
      // Interactive mode if no name provided
      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Name:',
            validate: (input: string) => {
              if (!input.trim()) return 'Name is required';
              return true;
            },
          },
          {
            type: 'input',
            name: 'path',
            message: 'Output path (optional):',
            default: '',
          },
        ]);

        name = answers.name;
        options = { ...options, ...answers };
      }

      const validatedOptions: GenerateOptions = GenerateOptionsSchema.parse({
        type: type as any,
        name,
        path: options.path,
        framework: options.framework,
        language: options.language,
        styling: options.styling,
      });

      const spinner = ora('Generating code...').start();

      const startTime = Date.now();
      const result = await generateCode(validatedOptions);
      const duration = Date.now() - startTime;

      spinner.stop();

      if (result.success) {
        console.log(chalk.green('✓ Code generated successfully'));
        console.log(chalk.gray(`  Type: ${validatedOptions.type}`));
        console.log(chalk.gray(`  Name: ${validatedOptions.name}`));
        console.log(chalk.gray(`  Files created: ${result.data?.filesCreated.length}`));
        console.log(chalk.gray(`  Output: ${result.data?.outputPath}`));
        console.log(chalk.gray(`  Duration: ${duration}ms`));
      } else {
        console.error(chalk.red('✗ Failed to generate code'));
        console.error(chalk.red(result.error));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function generateCode(options: GenerateOptions): Promise<GenerateResult> {
  try {
    let result;

    switch (options.type) {
      case 'component':
        result = await generateComponent(options);
        break;
      case 'api-client':
        result = await generateApiClient(options);
        break;
      case 'schema':
        result = await generateSchema(options);
        break;
      case 'type':
        result = await generateType(options);
        break;
      case 'boilerplate':
        result = await generateBoilerplate(options);
        break;
      default:
        return {
          success: false,
          error: `Unknown generation type: ${options.type}`,
        };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
