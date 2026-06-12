/**
 * Tests for @aether/ci-cd
 */

import { describe, it, expect } from 'vitest';
import {
  PipelineConfigSchema,
  BuildConfigSchema,
  TestConfigSchema,
  DeployConfigSchema,
  RollbackConfigSchema,
  parsePipelineConfig,
  safeParsePipelineConfig,
  parseBuildConfig,
  parseTestConfig,
  parseDeployConfig,
  parseRollbackConfig,
  createPipeline,
  validatePipeline,
  executeBuild,
  executeTests,
  executeDeployment,
  executeRollback,
  executePipeline,
  type PipelineConfig,
  type BuildConfig,
  type TestConfig,
  type DeployConfig,
  type RollbackConfig,
} from './index';

describe('PipelineConfigSchema', () => {
  it('parses a valid pipeline configuration', () => {
    const valid: PipelineConfig = {
      name: 'production-deploy',
      environment: 'production',
      timeout: 3600000,
      rollbackStrategy: 'manual',
      stages: [
        {
          name: 'build',
          parallel: false,
          steps: [
            {
              name: 'install',
              command: 'npm install',
              timeout: 300000,
              retryOnFailure: false,
              maxRetries: 0,
              continueOnError: false,
            },
            {
              name: 'build',
              command: 'npm run build',
              timeout: 300000,
              retryOnFailure: false,
              maxRetries: 0,
              continueOnError: false,
            },
          ],
        },
        {
          name: 'test',
          parallel: false,
          steps: [
            {
              name: 'test',
              command: 'npm run test',
              timeout: 300000,
              retryOnFailure: false,
              maxRetries: 0,
              continueOnError: false,
            },
          ],
        },
      ],
    };

    const result = PipelineConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('production-deploy');
      expect(result.data.stages).toHaveLength(2);
    }
  });

  it('rejects pipeline without name', () => {
    const invalid = {
      environment: 'production',
      stages: [],
    };

    const result = PipelineConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects pipeline without stages', () => {
    const invalid = {
      name: 'test',
      environment: 'production',
      stages: [],
    };

    const result = PipelineConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default rollback strategy', () => {
    const partial = {
      name: 'test',
      environment: 'production',
      stages: [
        {
          name: 'build',
          parallel: false,
          steps: [{ name: 'build', command: 'npm run build', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false }],
        },
      ],
    };

    const result = PipelineConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rollbackStrategy).toBe('manual');
    }
  });

  it('applies default timeout', () => {
    const partial = {
      name: 'test',
      environment: 'production',
      stages: [
        {
          name: 'build',
          parallel: false,
          steps: [{ name: 'build', command: 'npm run build', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false }],
        },
      ],
    };

    const result = PipelineConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeout).toBe(3600000);
    }
  });
});

describe('BuildConfigSchema', () => {
  it('parses a valid build configuration', () => {
    const valid: BuildConfig = {
      command: 'npm run build',
      environment: 'production',
      timeout: 3600000,
      dockerBuild: false,
    };

    const result = BuildConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.command).toBe('npm run build');
    }
  });

  it('rejects build without command', () => {
    const invalid = {
      environment: 'production',
    };

    const result = BuildConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default timeout', () => {
    const partial = {
      command: 'npm run build',
      environment: 'production',
    };

    const result = BuildConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.timeout).toBe(300000);
    }
  });

  it('parses build with docker configuration', () => {
    const valid: BuildConfig = {
      command: 'docker build',
      environment: 'production',
      timeout: 3600000,
      dockerBuild: true,
      dockerContext: '.',
      dockerfile: 'Dockerfile',
    };

    const result = BuildConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dockerBuild).toBe(true);
    }
  });
});

describe('TestConfigSchema', () => {
  it('parses a valid test configuration', () => {
    const valid: TestConfig = {
      command: 'npm run test',
      timeout: 600000,
      parallel: false,
      retries: 0,
    };

    const result = TestConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.command).toBe('npm run test');
    }
  });

  it('rejects test without command', () => {
    const invalid = {};

    const result = TestConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates coverage threshold range', () => {
    const invalid: TestConfig = {
      command: 'npm run test',
      timeout: 600000,
      parallel: false,
      retries: 0,
      coverageThreshold: 150,
    };

    const result = TestConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default parallel flag', () => {
    const partial = {
      command: 'npm run test',
    };

    const result = TestConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parallel).toBe(false);
    }
  });
});

describe('DeployConfigSchema', () => {
  it('parses a valid deployment configuration', () => {
    const valid: DeployConfig = {
      environment: 'production',
      maxRetries: 3,
      strategy: 'rolling',
      healthCheckTimeout: 30000,
      healthCheckInterval: 5000,
      rollbackOnFailure: true,
      preDeployCommands: [],
      postDeployCommands: [],
      autoPromote: false,
      waitTimeBetweenSteps: 30000,
    };

    const result = DeployConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.environment).toBe('production');
    }
  });

  it('rejects deployment without environment', () => {
    const invalid = {};

    const result = DeployConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default strategy', () => {
    const partial = {
      environment: 'production',
    };

    const result = DeployConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strategy).toBe('rolling');
    }
  });

  it('validates health check URL', () => {
    const invalid: DeployConfig = {
      environment: 'production',
      maxRetries: 3,
      strategy: 'rolling',
      healthCheckTimeout: 30000,
      healthCheckInterval: 5000,
      rollbackOnFailure: true,
      preDeployCommands: [],
      postDeployCommands: [],
      autoPromote: false,
      waitTimeBetweenSteps: 30000,
      healthCheckUrl: 'not-a-url',
    };

    const result = DeployConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('parses canary deployment configuration', () => {
    const valid: DeployConfig = {
      environment: 'production',
      maxRetries: 3,
      strategy: 'canary',
      healthCheckTimeout: 30000,
      healthCheckInterval: 5000,
      rollbackOnFailure: true,
      preDeployCommands: [],
      postDeployCommands: [],
      autoPromote: false,
      waitTimeBetweenSteps: 30000,
      canaryPercentage: 10,
    };

    const result = DeployConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.strategy).toBe('canary');
      expect(result.data.canaryPercentage).toBe(10);
    }
  });
});

describe('RollbackConfigSchema', () => {
  it('parses a valid rollback configuration', () => {
    const valid: RollbackConfig = {
      deploymentId: 'deploy-123',
      targetVersion: 'v1.2.3',
      reason: 'Deployment failed',
      skipHealthCheck: false,
      force: false,
    };

    const result = RollbackConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deploymentId).toBe('deploy-123');
    }
  });

  it('rejects rollback without deploymentId', () => {
    const invalid = {
      targetVersion: 'v1.2.3',
      reason: 'Deployment failed',
    };

    const result = RollbackConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects rollback without targetVersion', () => {
    const invalid = {
      deploymentId: 'deploy-123',
      reason: 'Deployment failed',
    };

    const result = RollbackConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects rollback without reason', () => {
    const invalid = {
      deploymentId: 'deploy-123',
      targetVersion: 'v1.2.3',
    };

    const result = RollbackConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default skipHealthCheck', () => {
    const partial = {
      deploymentId: 'deploy-123',
      targetVersion: 'v1.2.3',
      reason: 'Deployment failed',
    };

    const result = RollbackConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skipHealthCheck).toBe(false);
    }
  });
});

describe('Validator Functions', () => {
  it('parsePipelineConfig throws on invalid data', () => {
    expect(() => parsePipelineConfig({})).toThrow();
  });

  it('parsePipelineConfig returns parsed data on success', () => {
    const input = {
      name: 'test',
      environment: 'production',
      stages: [
        {
          name: 'build',
          parallel: false,
          steps: [{ name: 'build', command: 'npm run build', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false }],
        },
      ],
    };
    const result = parsePipelineConfig(input);
    expect(result.name).toBe('test');
  });

  it('safeParsePipelineConfig returns result object', () => {
    const input = {
      name: 'test',
      environment: 'production',
      stages: [
        {
          name: 'build',
          parallel: false,
          steps: [{ name: 'build', command: 'npm run build', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false }],
        },
      ],
    };
    const result = safeParsePipelineConfig(input);
    expect(result.success).toBe(true);
  });

  it('parseBuildConfig throws on invalid data', () => {
    expect(() => parseBuildConfig({})).toThrow();
  });

  it('parseTestConfig throws on invalid data', () => {
    expect(() => parseTestConfig({})).toThrow();
  });

  it('parseDeployConfig throws on invalid data', () => {
    expect(() => parseDeployConfig({})).toThrow();
  });

  it('parseRollbackConfig throws on invalid data', () => {
    expect(() => parseRollbackConfig({})).toThrow();
  });
});

describe('createPipeline', () => {
  it('creates a configured pipeline', () => {
    const config: PipelineConfig = {
      name: 'test',
      environment: 'production',
      timeout: 3600000,
      rollbackStrategy: 'manual',
      stages: [
        {
          name: 'build',
          parallel: false,
          steps: [{ name: 'build', command: 'npm run build', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false }],
        },
      ],
    };

    const pipeline = createPipeline(config);
    expect(pipeline.name).toBe('test');
  });

  it('throws on invalid config', () => {
    const invalid = {} as PipelineConfig;
    expect(() => createPipeline(invalid)).toThrow();
  });
});

describe('validatePipeline', () => {
  it('returns true for valid pipeline', () => {
    const config = {
      name: 'test',
      environment: 'production',
      stages: [
        {
          name: 'build',
          steps: [{ name: 'build', command: 'npm run build', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false }],
        },
      ],
    };

    expect(validatePipeline(config)).toBe(true);
  });

  it('returns false for invalid pipeline', () => {
    expect(validatePipeline({})).toBe(false);
  });
});

describe('executeBuild', () => {
  it('executes build successfully', async () => {
    const config: BuildConfig = {
      command: 'npm run build',
      environment: 'production',
      timeout: 3600000,
      dockerBuild: false,
    };

    const result = await executeBuild(config);
    expect(result.success).toBe(true);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('validates config before execution', async () => {
    const invalid = {} as BuildConfig;
    await expect(executeBuild(invalid)).rejects.toThrow();
  });
});

describe('executeTests', () => {
  it('executes tests successfully', async () => {
    const config: TestConfig = {
      command: 'npm run test',
      timeout: 600000,
      parallel: false,
      retries: 0,
    };

    const result = await executeTests(config);
    expect(result.success).toBe(true);
    expect(result.totalTests).toBeGreaterThan(0);
    expect(result.passedTests).toBeGreaterThan(0);
  });

  it('validates config before execution', async () => {
    const invalid = {} as TestConfig;
    await expect(executeTests(invalid)).rejects.toThrow();
  });
});

describe('executeDeployment', () => {
  it('executes deployment successfully', async () => {
    const config: DeployConfig = {
      environment: 'production',
      maxRetries: 3,
      strategy: 'rolling',
      healthCheckTimeout: 30000,
      healthCheckInterval: 5000,
      rollbackOnFailure: true,
      preDeployCommands: [],
      postDeployCommands: [],
      autoPromote: false,
      waitTimeBetweenSteps: 30000,
    };

    const result = await executeDeployment(config);
    expect(result.success).toBe(true);
    expect(result.deploymentId).toBeDefined();
    expect(result.version).toBeDefined();
  });

  it('validates config before execution', async () => {
    const invalid = {} as DeployConfig;
    await expect(executeDeployment(invalid)).rejects.toThrow();
  });
});

describe('executeRollback', () => {
  it('executes rollback successfully', async () => {
    const config: RollbackConfig = {
      deploymentId: 'deploy-123',
      targetVersion: 'v1.2.3',
      reason: 'Deployment failed',
      skipHealthCheck: false,
      force: false,
    };

    const result = await executeRollback(config);
    expect(result.success).toBe(true);
    expect(result.rollbackId).toBeDefined();
    expect(result.currentVersion).toBe('v1.2.3');
  });

  it('validates config before execution', async () => {
    const invalid = {} as RollbackConfig;
    await expect(executeRollback(invalid)).rejects.toThrow();
  });
});

describe('executePipeline', () => {
  it('executes pipeline successfully', async () => {
    const config: PipelineConfig = {
      name: 'test-pipeline',
      environment: 'production',
      timeout: 3600000,
      rollbackStrategy: 'manual',
      stages: [
        {
          name: 'build',
          parallel: false,
          steps: [
            { name: 'install', command: 'npm install', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false },
            { name: 'build', command: 'npm run build', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false },
          ],
        },
        {
          name: 'test',
          parallel: false,
          steps: [{ name: 'test', command: 'npm run test', timeout: 300000, retryOnFailure: false, maxRetries: 0, continueOnError: false }],
        },
      ],
    };

    const result = await executePipeline(config);
    expect(result.status).toBe('succeeded');
    expect(result.pipelineId).toBeDefined();
    expect(result.stageResults).toHaveLength(2);
  });

  it('validates config before execution', async () => {
    const invalid = {} as PipelineConfig;
    await expect(executePipeline(invalid)).rejects.toThrow();
  });

  it('handles stage with continueOnError', async () => {
    const config: PipelineConfig = {
      name: 'test-pipeline',
      environment: 'production',
      timeout: 3600000,
      rollbackStrategy: 'manual',
      stages: [
        {
          name: 'build',
          parallel: false,
          steps: [
            {
              name: 'failing-step',
              command: 'false',
              timeout: 300000,
              retryOnFailure: false,
              maxRetries: 0,
              continueOnError: true,
            },
            {
              name: 'passing-step',
              command: 'true',
              timeout: 300000,
              retryOnFailure: false,
              maxRetries: 0,
              continueOnError: false,
            },
          ],
        },
      ],
    };

    const result = await executePipeline(config);
    expect(result.status).toBe('succeeded');
  });
});
