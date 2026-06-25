import { z } from 'zod';

/**
 * Command types for the CLI
 */
export enum CommandType {
  SCAFFOLD = 'scaffold',
  PACKAGE = 'package',
  DEPLOY = 'deploy',
  DEV = 'dev',
  GENERATE = 'generate',
}

/**
 * Project template types
 */
export enum ProjectTemplate {
  BASIC = 'basic',
  FULLSTACK = 'fullstack',
  API = 'api',
  WORKER = 'worker',
  MONOREPO = 'monorepo',
}

/**
 * Deployment target types
 */
export enum DeploymentTarget {
  VERCEL = 'vercel',
  CLOUDFLARE = 'cloudflare',
  NETLIFY = 'netlify',
  LOCAL = 'local',
}

/**
 * Package manager types
 */
export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
  BUN = 'bun',
}

/**
 * Zod schemas for CLI validation
 */

export const CommandTypeSchema = z.nativeEnum(CommandType);

export const ProjectTemplateSchema = z.nativeEnum(ProjectTemplate);

export const DeploymentTargetSchema = z.nativeEnum(DeploymentTarget);

export const PackageManagerSchema = z.nativeEnum(PackageManager);

export const ScaffoldOptionsSchema = z.object({
  name: z.string().min(1).max(100),
  template: ProjectTemplateSchema,
  packageManager: PackageManagerSchema.optional(),
  typescript: z.boolean().default(true),
  testing: z.boolean().default(true),
  linting: z.boolean().default(true),
  git: z.boolean().default(true),
  directory: z.string().optional(),
});

export type ScaffoldOptions = z.infer<typeof ScaffoldOptionsSchema>;

export const PackageOptionsSchema = z.object({
  action: z.enum(['install', 'add', 'remove', 'update', 'list']),
  packages: z.array(z.string()).optional(),
  dev: z.boolean().default(false),
  exact: z.boolean().default(false),
  workspace: z.string().optional(),
});

export type PackageOptions = z.infer<typeof PackageOptionsSchema>;

export const DeployOptionsSchema = z.object({
  target: DeploymentTargetSchema,
  environment: z.enum(['development', 'staging', 'production']).default('production'),
  build: z.boolean().default(true),
  preview: z.boolean().default(false),
  force: z.boolean().default(false),
});

export type DeployOptions = z.infer<typeof DeployOptionsSchema>;

export const DevOptionsSchema = z.object({
  port: z.number().int().min(1000).max(65535).default(3000),
  host: z.string().default('localhost'),
  open: z.boolean().default(false),
  hot: z.boolean().default(true),
  inspect: z.boolean().default(false),
});

export type DevOptions = z.infer<typeof DevOptionsSchema>;

export const GenerateOptionsSchema = z.object({
  type: z.enum(['component', 'api-client', 'schema', 'type', 'boilerplate']),
  name: z.string().min(1),
  path: z.string().optional(),
  framework: z.enum(['react', 'vue', 'svelte', 'solid', 'none']).optional(),
  language: z.enum(['typescript', 'javascript']).default('typescript'),
  styling: z.enum(['css', 'scss', 'tailwind', 'none']).optional(),
});

export type GenerateOptions = z.infer<typeof GenerateOptionsSchema>;

export const CLICommandSchema = z.object({
  type: CommandTypeSchema,
  options: z.union([
    ScaffoldOptionsSchema,
    PackageOptionsSchema,
    DeployOptionsSchema,
    DevOptionsSchema,
    GenerateOptionsSchema,
  ]),
});

export type CLICommand = z.infer<typeof CLICommandSchema>;

export const CLIConfigSchema = z.object({
  defaultPackageManager: PackageManagerSchema.optional(),
  defaultDeploymentTarget: DeploymentTargetSchema.optional(),
  defaultTemplate: ProjectTemplateSchema.optional(),
  autoConfirm: z.boolean().default(false),
  verbose: z.boolean().default(false),
  color: z.boolean().default(true),
});

export type CLIConfig = z.infer<typeof CLIConfigSchema>;

/**
 * Result types for CLI operations
 */
export interface CommandResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  duration?: number;
}

export interface ScaffoldResult extends CommandResult<{
  projectPath: string;
  template: ProjectTemplate;
  filesCreated: string[];
}> {}

export interface DeployResult extends CommandResult<{
  url: string;
  deploymentId: string;
  target: DeploymentTarget;
}> {}

export interface GenerateResult extends CommandResult<{
  filesCreated: string[];
  outputPath: string;
}> {}
