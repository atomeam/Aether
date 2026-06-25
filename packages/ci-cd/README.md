# @aether/ci-cd

CI/CD automation package for the Aether monorepo. Provides pipeline configuration, build automation, test automation, deployment automation, and rollback automation with full TypeScript type safety and Zod validation.

## Features

- **Pipeline Configuration**: Define and manage CI/CD pipeline stages and workflows
- **Build Automation**: Automated build processes with configurable steps
- **Test Automation**: Test execution automation with coverage reporting
- **Deployment Automation**: Automated deployment to multiple environments
- **Rollback Automation**: Automated rollback capabilities with version tracking
- **Type Safety**: Full TypeScript types for all CI/CD operations
- **Runtime Validation**: Zod schemas for validating pipeline configurations

## Installation

```bash
npm install @aether/ci-cd
```

## Usage

### Pipeline Configuration

```typescript
import { PipelineConfig, createPipeline } from '@aether/ci-cd';

const pipeline: PipelineConfig = {
  name: 'production-deploy',
  stages: [
    { name: 'build', steps: ['npm install', 'npm run build'] },
    { name: 'test', steps: ['npm run test'] },
    { name: 'deploy', steps: ['npm run deploy:prod'] },
  ],
  rollbackStrategy: 'auto',
};

const configuredPipeline = createPipeline(pipeline);
```

### Build Automation

```typescript
import { BuildConfig, executeBuild } from '@aether/ci-cd';

const buildConfig: BuildConfig = {
  command: 'npm run build',
  environment: 'production',
  cacheKey: 'build-cache',
  timeout: 300000,
};

const result = await executeBuild(buildConfig);
```

### Test Automation

```typescript
import { TestConfig, executeTests } from '@aether/ci-cd';

const testConfig: TestConfig = {
  command: 'npm run test',
  coverageThreshold: 80,
  parallel: true,
  timeout: 120000,
};

const result = await executeTests(testConfig);
```

### Deployment Automation

```typescript
import { DeployConfig, executeDeployment } from '@aether/ci-cd';

const deployConfig: DeployConfig = {
  environment: 'production',
  strategy: 'blue-green',
  healthCheckUrl: 'https://api.example.com/health',
  rollbackOnFailure: true,
};

const result = await executeDeployment(deployConfig);
```

### Rollback Automation

```typescript
import { RollbackConfig, executeRollback } from '@aether/ci-cd';

const rollbackConfig: RollbackConfig = {
  deploymentId: 'deploy-123',
  targetVersion: 'v1.2.3',
  reason: 'Deployment failed health checks',
};

const result = await executeRollback(rollbackConfig);
```

## API Reference

### Types

- `PipelineConfig` - Configuration for CI/CD pipelines
- `BuildConfig` - Configuration for build automation
- `TestConfig` - Configuration for test automation
- `DeployConfig` - Configuration for deployment automation
- `RollbackConfig` - Configuration for rollback automation
- `PipelineResult` - Result of pipeline execution
- `BuildResult` - Result of build execution
- `TestResult` - Result of test execution
- `DeployResult` - Result of deployment execution
- `RollbackResult` - Result of rollback execution

### Functions

- `createPipeline(config: PipelineConfig)` - Create a configured pipeline
- `executePipeline(pipeline: PipelineConfig)` - Execute a pipeline
- `executeBuild(config: BuildConfig)` - Execute build automation
- `executeTests(config: TestConfig)` - Execute test automation
- `executeDeployment(config: DeployConfig)` - Execute deployment automation
- `executeRollback(config: RollbackConfig)` - Execute rollback automation

## Validation

All configurations are validated using Zod schemas at runtime:

```typescript
import { PipelineConfigSchema } from '@aether/ci-cd';

const result = PipelineConfigSchema.safeParse(pipelineConfig);
if (!result.success) {
  console.error('Invalid pipeline config:', result.error);
}
```

## Testing

```bash
npm run test
```

## License

MIT
