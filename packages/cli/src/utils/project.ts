import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { ScaffoldOptions, ProjectTemplate, PackageManager } from '../types.js';

/**
 * Detect the package manager being used in the current project
 */
export async function detectPackageManager(): Promise<PackageManager> {
  const cwd = process.cwd();

  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return PackageManager.PNPM;
  }
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return PackageManager.YARN;
  }
  if (await fs.pathExists(path.join(cwd, 'bun.lockb'))) {
    return PackageManager.BUN;
  }
  if (await fs.pathExists(path.join(cwd, 'package-lock.json'))) {
    return PackageManager.NPM;
  }

  // Default to npm
  return PackageManager.NPM;
}

/**
 * Create the project structure based on template
 */
export async function createProjectStructure(
  projectPath: string,
  options: ScaffoldOptions
): Promise<string[]> {
  const filesCreated: string[] = [];

  // Create base directory
  await fs.ensureDir(projectPath);

  // Create package.json
  const packageJson = createPackageJson(options);
  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  filesCreated.push('package.json');

  // Create tsconfig.json if TypeScript is enabled
  if (options.typescript) {
    const tsconfig = createTsConfig(options);
    await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsconfig, { spaces: 2 });
    filesCreated.push('tsconfig.json');
  }

  // Create .gitignore
  const gitignore = createGitIgnore();
  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
  filesCreated.push('.gitignore');

  // Create README.md
  const readme = createReadme(options);
  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  filesCreated.push('README.md');

  // Create template-specific structure
  switch (options.template) {
    case ProjectTemplate.BASIC:
      await createBasicStructure(projectPath, options, filesCreated);
      break;
    case ProjectTemplate.FULLSTACK:
      await createFullstackStructure(projectPath, options, filesCreated);
      break;
    case ProjectTemplate.API:
      await createApiStructure(projectPath, options, filesCreated);
      break;
    case ProjectTemplate.WORKER:
      await createWorkerStructure(projectPath, options, filesCreated);
      break;
    case ProjectTemplate.MONOREPO:
      await createMonorepoStructure(projectPath, options, filesCreated);
      break;
  }

  // Create testing setup if enabled
  if (options.testing) {
    await createTestingSetup(projectPath, options, filesCreated);
  }

  // Create linting setup if enabled
  if (options.linting) {
    await createLintingSetup(projectPath, options, filesCreated);
  }

  return filesCreated;
}

/**
 * Install dependencies
 */
export async function installDependencies(
  projectPath: string,
  packageManager: PackageManager
): Promise<void> {
  const originalCwd = process.cwd();
  process.chdir(projectPath);

  try {
    const installCmd = getInstallCommand(packageManager);
    execSync(installCmd, { stdio: 'inherit' });
  } finally {
    process.chdir(originalCwd);
  }
}

/**
 * Initialize Git repository
 */
export async function initializeGit(projectPath: string): Promise<void> {
  try {
    execSync('git init', { cwd: projectPath, stdio: 'inherit' });
    execSync('git add .', { cwd: projectPath, stdio: 'inherit' });
    execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'inherit' });
  } catch (error) {
    // Git might not be available, ignore error
  }
}

function createPackageJson(options: ScaffoldOptions): any {
  return {
    name: options.name,
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      test: 'vitest',
      lint: 'eslint . --ext .ts,.tsx',
      format: 'prettier --write "src/**/*.{ts,tsx}"',
    },
    dependencies: {},
    devDependencies: {
      typescript: '~5.8.2',
      vite: '^5.0.0',
      vitest: '^3.0.0',
      eslint: '^8.55.0',
      prettier: '^3.1.0',
    },
  };
}

function createTsConfig(options: ScaffoldOptions): any {
  return {
    compilerOptions: {
      target: 'ES2022',
      useDefineForClassFields: true,
      module: 'ESNext',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src'],
    references: [],
  };
}

function createGitIgnore(): string {
  return `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
dist
build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Turbo
.turbo

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
`;
}

function createReadme(options: ScaffoldOptions): string {
  return `# ${options.name}

A new Aether project.

## Getting Started

\`\`\`bash
# Install dependencies
${options.packageManager} install

# Start development server
${options.packageManager} run dev

# Build for production
${options.packageManager} run build

# Run tests
${options.packageManager} run test
\`\`\`

## Project Structure

- \`src/\` - Source code
- \`public/\` - Static assets
- \`tests/\` - Test files

## License

MIT
`;
}

async function createBasicStructure(
  projectPath: string,
  options: ScaffoldOptions,
  filesCreated: string[]
): Promise<void> {
  const srcDir = path.join(projectPath, 'src');
  await fs.ensureDir(srcDir);

  if (options.typescript) {
    await fs.writeFile(
      path.join(srcDir, 'index.ts'),
      `console.log('Hello from ${options.name}!');\n`
    );
    filesCreated.push('src/index.ts');
  } else {
    await fs.writeFile(
      path.join(srcDir, 'index.js'),
      `console.log('Hello from ${options.name}!');\n`
    );
    filesCreated.push('src/index.js');
  }
}

async function createFullstackStructure(
  projectPath: string,
  options: ScaffoldOptions,
  filesCreated: string[]
): Promise<void> {
  await createBasicStructure(projectPath, options, filesCreated);

  const appsDir = path.join(projectPath, 'apps');
  await fs.ensureDir(appsDir);
  filesCreated.push('apps/');

  const packagesDir = path.join(projectPath, 'packages');
  await fs.ensureDir(packagesDir);
  filesCreated.push('packages/');
}

async function createApiStructure(
  projectPath: string,
  options: ScaffoldOptions,
  filesCreated: string[]
): Promise<void> {
  const srcDir = path.join(projectPath, 'src');
  await fs.ensureDir(srcDir);

  if (options.typescript) {
    await fs.writeFile(
      path.join(srcDir, 'server.ts'),
      `import { serve } from '@aether/server';

const app = serve({
  port: 3000,
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from ${options.name}!' });
});

app.start();
\n`
    );
    filesCreated.push('src/server.ts');
  }
}

async function createWorkerStructure(
  projectPath: string,
  options: ScaffoldOptions,
  filesCreated: string[]
): Promise<void> {
  const srcDir = path.join(projectPath, 'src');
  await fs.ensureDir(srcDir);

  if (options.typescript) {
    await fs.writeFile(
      path.join(srcDir, 'worker.ts'),
      `export default {
  async fetch(request: Request) {
    return new Response('Hello from ${options.name}!');
  },
};
\n`
    );
    filesCreated.push('src/worker.ts');
  }

  // Create wrangler.toml
  const wranglerToml = `name = "${options.name}"
main = "src/worker.ts"
compatibility_date = "2024-01-01"
`;
  await fs.writeFile(path.join(projectPath, 'wrangler.toml'), wranglerToml);
  filesCreated.push('wrangler.toml');
}

async function createMonorepoStructure(
  projectPath: string,
  options: ScaffoldOptions,
  filesCreated: string[]
): Promise<void> {
  // Create turbo.json
  const turboJson = {
    $schema: 'https://turbo.build/schema.json',
    pipeline: {
      build: {
        dependsOn: ['^build'],
        outputs: ['dist/**', '.next/**'],
      },
      test: {
        dependsOn: ['build'],
        outputs: ['coverage/**'],
      },
      lint: {},
      dev: {
        cache: false,
      },
    },
  };
  await fs.writeJson(path.join(projectPath, 'turbo.json'), turboJson, { spaces: 2 });
  filesCreated.push('turbo.json');

  // Update package.json for monorepo
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.workspaces = ['apps/*', 'packages/*'];
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    turbo: '^2.0.0',
  };
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  await createFullstackStructure(projectPath, options, filesCreated);
}

async function createTestingSetup(
  projectPath: string,
  options: ScaffoldOptions,
  filesCreated: string[]
): Promise<void> {
  const vitestConfig = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
`;
  await fs.writeFile(path.join(projectPath, 'vitest.config.ts'), vitestConfig);
  filesCreated.push('vitest.config.ts');

  const testsDir = path.join(projectPath, 'tests');
  await fs.ensureDir(testsDir);
  filesCreated.push('tests/');

  if (options.typescript) {
    await fs.writeFile(
      path.join(testsDir, 'example.test.ts'),
      `import { describe, it, expect } from 'vitest';

describe('Example', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
\n`
    );
    filesCreated.push('tests/example.test.ts');
  }
}

async function createLintingSetup(
  projectPath: string,
  options: ScaffoldOptions,
  filesCreated: string[]
): Promise<void> {
  const eslintConfig = {
    root: true,
    env: {
      node: true,
      es2022: true,
    },
    extends: ['eslint:recommended'],
    parser: options.typescript ? '@typescript-eslint/parser' : undefined,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  };
  await fs.writeJson(path.join(projectPath, '.eslintrc.json'), eslintConfig, { spaces: 2 });
  filesCreated.push('.eslintrc.json');

  const prettierConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
  };
  await fs.writeJson(path.join(projectPath, '.prettierrc'), prettierConfig, { spaces: 2 });
  filesCreated.push('.prettierrc');
}

function getInstallCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case PackageManager.YARN:
      return 'yarn install';
    case PackageManager.PNPM:
      return 'pnpm install';
    case PackageManager.BUN:
      return 'bun install';
    case PackageManager.NPM:
    default:
      return 'npm install';
  }
}
