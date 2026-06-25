# Contributing to Aether

Thank you for your interest in contributing to Aether! This document provides comprehensive guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Adding New Packages](#adding-new-packages)
- [Adding New Apps](#adding-new-apps)
- [Adding New MCP Tools](#adding-new-mcp-tools)
- [Adding New Agents](#adding-new-agents)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 10.9.8
- **Git**: Latest version
- **Redis**: (optional, for caching)
- **Cloudflare account**: (for deployment)
- **Vercel account**: (for deployment)

### Initial Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/Aether.git
   cd Aether
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Run development servers**
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

## Development Setup

### Local Development

```bash
# Install dependencies
npm install

# Start backend (port 3000)
npm run dev:backend

# Start frontend (port 5173)
npm run dev:frontend

# Start bridge worker (local testing only)
npm run dev:bridge
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional
NEURAL_BRIDGE_URL=http://localhost:8080
ALLOW_DEGRADED=1
NODE_ENV=development
```

### IDE Configuration

**VS Code** (recommended):

Install these extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Vitest

**Recommended VS Code settings**:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Project Structure

```
Aether/
├── apps/                    # Application packages
│   ├── backend/            # Main API server (Express)
│   ├── frontend/           # React dashboard (Vite)
│   ├── bridge/             # Cloudflare Workers bridge
│   ├── cockpit/            # Admin dashboard
│   ├── homebase/           # Landing page
│   └── [40+ workers]       # Background processing services
├── packages/               # Shared libraries (205+)
│   ├── contracts/          # Zod schemas for type safety
│   ├── curator/            # Security gate
│   ├── mcp-tools/          # MCP tool registry
│   ├── governance/         # Audit & policy guardrails
│   ├── logger/             # Logging utilities
│   ├── cache/              # Caching layer
│   ├── metrics/            # Metrics collection
│   └── [200+ utilities]    # Data structures, algorithms, etc.
├── src/                    # Apex SPA (Vite + React)
├── docs/                   # Documentation
├── scripts/                # Development scripts
├── tests/                  # Integration & E2E tests
├── tools/                  # Development tools
├── config/                 # Shared configuration
├── .github/                # GitHub Actions workflows
├── turbo.json              # Turborepo configuration
├── package.json            # Root package.json
└── tsconfig.json           # Root TypeScript config
```

## Development Workflow

### Branch Strategy

- `main` - Production branch
- `develop` - Integration branch
- `feat/*` - Feature branches
- `fix/*` - Bug fix branches
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions/changes

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples**:
```
feat(backend): add rate limiting middleware

fix(curator): resolve allow-list validation bug

docs(readme): update installation instructions

test(contracts): add unit tests for BuildRequestSchema
```

### Pre-commit Hooks

The project uses Husky for git hooks:

```bash
# Install hooks (run once after cloning)
npm run prepare

# Hooks will run automatically:
# - lint-staged: lint and format staged files
# - commitlint: validate commit messages
```

## Adding New Packages

### Step-by-Step Guide

1. **Create package directory**
   ```bash
   mkdir packages/my-package
   cd packages/my-package
   ```

2. **Create package.json**
   ```json
   {
     "name": "@aether/my-package",
     "version": "0.1.0",
     "description": "Brief description of the package",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch",
       "test": "vitest",
       "typecheck": "tsc --noEmit",
       "clean": "rimraf dist"
     },
     "dependencies": {},
     "devDependencies": {
       "typescript": "^5.3.0",
       "vitest": "^1.0.0",
       "rimraf": "^5.0.0"
     }
   }
   ```

3. **Create tsconfig.json**
   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src",
       "composite": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist", "**/*.test.ts"]
   }
   ```

4. **Create source files**
   ```bash
   mkdir src
   touch src/index.ts
   ```

5. **Add exports in src/index.ts**
   ```typescript
   /**
    * @aether/my-package
    *
    * Brief description
    */

   export function myFunction() {
     // Implementation
   }
   ```

6. **Create tests**
   ```bash
   mkdir src/__tests__
   touch src/__tests__/index.test.ts
   ```

7. **Add to turbo.json**
   ```json
   {
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**"]
       },
       "test": {
         "dependsOn": ["build"]
       }
     }
   }
   ```

8. **Test the package**
   ```bash
   npm run build -w @aether/my-package
   npm run test -w @aether/my-package
   npm run typecheck -w @aether/my-package
   ```

## Adding New Apps

### Step-by-Step Guide

1. **Create app directory**
   ```bash
   mkdir apps/my-app
   cd apps/my-app
   ```

2. **Create package.json**
   ```json
   {
     "name": "@aether/my-app",
     "version": "0.1.0",
     "private": true,
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "test": "vitest"
     },
     "dependencies": {
       "@aether/contracts": "workspace:*"
     }
   }
   ```

3. **Create wrangler.toml** (if Cloudflare Worker)
   ```toml
   name = "my-app"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"

   [vars]
   ENVIRONMENT = "development"
   ```

4. **Create source files**
   ```bash
   mkdir src
   touch src/index.ts
   ```

5. **Add to agent registry** (if standalone service)
   ```json
   // agent-hub/agent-registry.json
   {
     "my-app": {
       "type": "worker",
       "description": "My app description"
     }
   }
   ```

## Adding New MCP Tools

### Step-by-Step Guide

1. **Add tool definition**
   ```typescript
   // packages/mcp-tools/src/index.ts
   export const MY_TOOL: MCPTool = {
     name: 'my_tool',
     description: 'Description of what the tool does',
     inputSchema: z.object({
       param1: z.string(),
       param2: z.number().optional()
     }),
     handler: async (input) => {
       // Implementation
       return { success: true, data: result };
     }
   };
   ```

2. **Register the tool**
   ```typescript
   export const TOOL_REGISTRY = {
     // ... existing tools
     my_tool: MY_TOOL
   };
   ```

3. **Add tests**
   ```typescript
   // packages/mcp-tools/src/__tests__/my-tool.test.ts
   import { describe, it, expect } from 'vitest';
   import { MY_TOOL } from '../index';

   describe('MY_TOOL', () => {
     it('should handle valid input', async () => {
       const result = await MY_TOOL.handler({ param1: 'test' });
       expect(result.success).toBe(true);
     });
   });
   ```

4. **Update documentation**
   ```markdown
   <!-- docs/mcp-tools.md -->
   ## my_tool

   Description of the tool.

   ### Parameters

   - param1 (string, required): Description
   - param2 (number, optional): Description

   ### Example

   ```json
   {
     "name": "my_tool",
     "arguments": {
       "param1": "value"
     }
   }
   ```
   ```

## Adding New Agents

### Step-by-Step Guide

1. **Create agent file**
   ```typescript
   // apps/backend/src/agents/my-agent.ts
   export interface MyAgentConfig {
     // Configuration options
   }

   export class MyAgent {
     constructor(private config: MyAgentConfig) {}

     async execute(input: any): Promise<any> {
       // Agent logic
     }
   }

   export function createMyAgent(config: MyAgentConfig) {
     return new MyAgent(config);
   }
   ```

2. **Register in agent loop**
   ```typescript
   // apps/backend/src/agents/agent-loop.ts
   import { createMyAgent } from './my-agent';

   // Add to agent registry
   ```

3. **Add tests**
   ```typescript
   // apps/backend/src/agents/__tests__/my-agent.test.ts
   import { describe, it, expect } from 'vitest';
   import { createMyAgent } from '../my-agent';

   describe('MyAgent', () => {
     it('should execute successfully', async () => {
       const agent = createMyAgent({});
       const result = await agent.execute({});
       expect(result).toBeDefined();
     });
   });
   ```

4. **Update documentation**
   ```markdown
   <!-- docs/agent-system.md -->
   ## MyAgent

   Description of the agent.

   ### Configuration

   - config1: Description
   - config2: Description

   ### Usage

   ```typescript
   const agent = createMyAgent({ config1: 'value' });
   const result = await agent.execute(input);
   ```
   ```

## Code Style

### TypeScript Guidelines

- **Strict mode**: Always use TypeScript strict mode
- **No `any` types**: Use proper types or `unknown`
- **Type inference**: Let TypeScript infer types when possible
- **Interfaces vs Types**: Use interfaces for object shapes, types for unions
- **Enums**: Use const enums or string literal types

### Naming Conventions

- **Variables/Functions**: camelCase (`myVariable`, `myFunction`)
- **Classes/Types**: PascalCase (`MyClass`, `MyType`)
- **Constants**: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- **Files**: kebab-case (`my-file.ts`)
- **Components**: PascalCase (`MyComponent.tsx`)

### Import Order

```typescript
// 1. Node.js built-ins
import fs from 'fs';
import path from 'path';

// 2. External packages
import express from 'express';
import { z } from 'zod';

// 3. Internal packages (@aether/*)
import { myFunction } from '@aether/my-package';

// 4. Relative imports
import { myLocalFunction } from './utils';
```

### Code Organization

```typescript
// 1. Imports
import { ... } from '...';

// 2. Types
interface MyType {
  // ...
}

// 3. Constants
const MY_CONSTANT = 'value';

// 4. Functions
function myFunction() {
  // ...
}

// 5. Exports
export { myFunction, MyType };
```

### Comments

- **JSDoc**: Use JSDoc for exported functions and classes
- **Inline comments**: Use for complex logic
- **TODO/FIXME**: Use for temporary notes

```typescript
/**
 * Calculates the factorial of a number.
 *
 * @param n - The number to calculate factorial for
 * @returns The factorial of n
 * @throws {Error} If n is negative
 */
export function factorial(n: number): number {
  if (n < 0) {
    throw new Error('n must be non-negative');
  }
  // TODO: Optimize for large numbers
  return n === 0 ? 1 : n * factorial(n - 1);
}
```

## Testing

### Test Structure

```typescript
// src/__tests__/my-function.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from '../index';

describe('myFunction', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should handle valid input', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should throw on invalid input', () => {
    expect(() => myFunction('invalid')).toThrow();
  });
});
```

### Running Tests

```bash
# Run all tests
npx turbo run test

# Run tests for specific package
npm run test -w @aether/contracts

# Run tests with coverage
npx turbo run test:coverage

# Run tests in watch mode
npx turbo run test -- --watch

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Test Guidelines

- **Unit tests**: Test individual functions and classes
- **Integration tests**: Test API endpoints and service interactions
- **E2E tests**: Test complete user flows
- **Coverage**: Aim for 80%+ code coverage
- **Mocking**: Mock external services (Gemini, Stripe, Notion)
- **Test names**: Use descriptive test names

### Mocking External Services

```typescript
import { vi } from 'vitest';

// Mock Gemini API
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({ actions: [] })
      })
    }
  }))
}));
```

## Documentation

### Code Documentation

- **JSDoc**: Document all exported functions and classes
- **README.md**: Each package should have a README
- **Examples**: Include usage examples in documentation

### Generating Documentation

```bash
cd packages/docs
npm run build
npm run generate:all
```

### Documentation Updates

- Update README.md for package changes
- Update API.md for API changes
- Update ARCHITECTURE.md for architecture changes
- Update CHANGELOG.md for release notes

## Pull Request Process

### Before Submitting

1. **Run tests**
   ```bash
   npx turbo run test
   npx turbo run typecheck
   ```

2. **Format code**
   ```bash
   npm run format
   ```

3. **Lint code**
   ```bash
   npm run lint
   ```

4. **Build packages**
   ```bash
   npx turbo run build
   ```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123
Related to #456

## Changes Made
- Change 1
- Change 2

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### PR Review Process

1. **Automated checks**: CI/CD runs tests and linting
2. **Code review**: Maintainer reviews code
3. **Feedback**: Address review comments
4. **Approval**: Maintainer approves PR
5. **Merge**: PR is merged to target branch

### PR Title Format

Follow conventional commits:

```
feat(backend): add rate limiting middleware
fix(curator): resolve allow-list validation bug
docs(readme): update installation instructions
test(contracts): add unit tests for BuildRequestSchema
refactor(api): extract route modules from server.ts
```

## Release Process

### Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Steps

1. **Update version numbers**
   ```bash
   # Update root package.json
   # Update affected packages
   ```

2. **Update CHANGELOG.md**
   ```markdown
   ## [1.0.0] - 2024-01-01

   ### Added
   - New feature 1
   - New feature 2

   ### Fixed
   - Bug fix 1
   - Bug fix 2

   ### Changed
   - Breaking change 1
   ```

3. **Create release tag**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

4. **Deploy**
   ```bash
   # Vercel deployment
   vercel --prod

   # Cloudflare Workers deployment (via CI)
   ```

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

### Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Discord/Slack**: For real-time chat (if available)

### Reporting Security Issues

Do not report security issues publicly. Instead:

1. Send an email to security@a-to-mind.com
2. Include details of the vulnerability
3. Wait for confirmation before disclosing

## Questions?

- Open an issue on GitHub
- Join our community discussions
- Check existing documentation

---

Thank you for contributing to Aether! 🚀
