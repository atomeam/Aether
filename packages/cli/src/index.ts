/**
 * @aether/cli
 *
 * Aether CLI - Command-line interface for project scaffolding, package management,
 * deployment, and development.
 *
 * @example
 * ```bash
 * # Scaffold a new project
 * aether scaffold my-app --template fullstack
 *
 * # Add a package
 * aether package add lodash
 *
 * # Deploy to production
 * aether deploy --target vercel --environment production
 *
 * # Start development server
 * aether dev --port 3000
 *
 * # Generate a component
 * aether generate component Button --framework react
 * ```
 */

export * from './types.js';
export * from './commands/index.js';
export * from './utils/index.js';

// Re-export main CLI entry point for programmatic use
export { default as runCLI } from './cli.js';
