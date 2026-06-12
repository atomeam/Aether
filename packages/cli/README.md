# @aether/cli

Command-line interface for Aether development - project scaffolding, package management, deployment, and code generation.

## Installation

```bash
npm install -g @aether/cli
```

Or use it directly in your project:

```bash
npm install @aether/cli
```

## Features

- **Project Scaffolding**: Create new Aether projects with various templates
- **Package Management**: Manage dependencies across different package managers
- **Deployment**: Deploy to Vercel, Cloudflare, Netlify, or local
- **Development Server**: Start development servers with hot reload
- **Code Generation**: Generate components, API clients, schemas, and more

## Usage

### Scaffold a New Project

```bash
# Interactive mode
aether scaffold

# With options
aether scaffold my-app --template fullstack --package-manager pnpm

# Available templates: basic, fullstack, api, worker, monorepo
```

### Package Management

```bash
# Install dependencies
aether package install

# Add a package
aether package add lodash

# Add as dev dependency
aether package add typescript --dev

# Remove a package
aether package remove lodash

# Update packages
aether package update

# List packages
aether package list
```

### Deployment

```bash
# Deploy to Vercel (default)
aether deploy

# Deploy to Cloudflare
aether deploy --target cloudflare

# Deploy to staging
aether deploy --environment staging

# Deploy as preview
aether deploy --preview

# Skip build
aether deploy --no-build
```

### Development Server

```bash
# Start dev server
aether dev

# Custom port
aether dev --port 4000

# Custom host
aether dev --host 0.0.0.0

# Open browser
aether dev --open

# Disable hot reload
aether dev --no-hot

# Enable inspector
aether dev --inspect
```

### Code Generation

```bash
# Generate a component
aether generate component Button --framework react --styling tailwind

# Generate an API client
aether generate api-client UserClient

# Generate a schema
aether generate schema UserSchema

# Generate types
aether generate type User

# Generate boilerplate
aether generate boilerplate Service
```

## Project Templates

### Basic
Minimal setup with TypeScript, testing, and linting.

### Fullstack
Frontend + Backend setup with apps and packages directories.

### API
API-only project with server setup.

### Worker
Cloudflare Worker project with wrangler configuration.

### Monorepo
Turborepo-based monorepo with multiple apps and packages.

## Configuration

Create a `.aether.json` file in your project root to configure defaults:

```json
{
  "defaultPackageManager": "pnpm",
  "defaultDeploymentTarget": "vercel",
  "defaultTemplate": "fullstack",
  "autoConfirm": false,
  "verbose": false,
  "color": true
}
```

## Programmatic Usage

```typescript
import { runCLI } from '@aether/cli';

// Run CLI programmatically
await runCLI();
```

## API

### Types

```typescript
import {
  ScaffoldOptions,
  PackageOptions,
  DeployOptions,
  DevOptions,
  GenerateOptions,
  CommandResult,
} from '@aether/cli';
```

### Utils

```typescript
import {
  detectPackageManager,
  createProjectStructure,
  installDependencies,
  initializeGit,
} from '@aether/cli/utils';
```

## License

MIT
