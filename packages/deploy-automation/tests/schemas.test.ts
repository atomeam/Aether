/**
 * Tests for Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  EnvironmentSchema,
  DeploymentPlatformSchema,
  DeploymentStatusSchema,
  CloudflareBindingSchema,
  CloudflareDeploymentConfigSchema,
  VercelDeploymentConfigSchema,
  EnvironmentVariableSchema,
  HealthCheckConfigSchema,
  RollbackConfigSchema,
  DeploymentResultSchema,
  AnyDeploymentConfigSchema
} from '../src/schemas';

describe('EnvironmentSchema', () => {
  it('should validate valid environments', () => {
    expect(EnvironmentSchema.parse('dev')).toBe('dev');
    expect(EnvironmentSchema.parse('staging')).toBe('staging');
    expect(EnvironmentSchema.parse('prod')).toBe('prod');
  });

  it('should reject invalid environments', () => {
    expect(() => EnvironmentSchema.parse('production')).toThrow();
    expect(() => EnvironmentSchema.parse('test')).toThrow();
  });
});

describe('DeploymentPlatformSchema', () => {
  it('should validate valid platforms', () => {
    expect(DeploymentPlatformSchema.parse('cloudflare')).toBe('cloudflare');
    expect(DeploymentPlatformSchema.parse('vercel')).toBe('vercel');
  });

  it('should reject invalid platforms', () => {
    expect(() => DeploymentPlatformSchema.parse('aws')).toThrow();
    expect(() => DeploymentPlatformSchema.parse('gcp')).toThrow();
  });
});

describe('DeploymentStatusSchema', () => {
  it('should validate valid statuses', () => {
    expect(DeploymentStatusSchema.parse('pending')).toBe('pending');
    expect(DeploymentStatusSchema.parse('in_progress')).toBe('in_progress');
    expect(DeploymentStatusSchema.parse('success')).toBe('success');
    expect(DeploymentStatusSchema.parse('failed')).toBe('failed');
    expect(DeploymentStatusSchema.parse('rolled_back')).toBe('rolled_back');
  });

  it('should reject invalid statuses', () => {
    expect(() => DeploymentStatusSchema.parse('deployed')).toThrow();
  });
});

describe('CloudflareBindingSchema', () => {
  it('should validate KV binding', () => {
    const binding = {
      type: 'kv' as const,
      name: 'STATE',
      id: 'abc123'
    };
    expect(CloudflareBindingSchema.parse(binding)).toEqual(binding);
  });

  it('should validate D1 binding', () => {
    const binding = {
      type: 'd1' as const,
      name: 'DB',
      database_id: 'def456'
    };
    expect(CloudflareBindingSchema.parse(binding)).toEqual(binding);
  });

  it('should validate service binding', () => {
    const binding = {
      type: 'service' as const,
      name: 'BRIDGE',
      service: 'aether-bridge'
    };
    expect(CloudflareBindingSchema.parse(binding)).toEqual(binding);
  });

  it('should reject KV binding without id', () => {
    const binding = {
      type: 'kv' as const,
      name: 'STATE'
    };
    expect(() => CloudflareBindingSchema.parse(binding)).toThrow();
  });

  it('should reject D1 binding without database_id', () => {
    const binding = {
      type: 'd1' as const,
      name: 'DB'
    };
    expect(() => CloudflareBindingSchema.parse(binding)).toThrow();
  });
});

describe('CloudflareDeploymentConfigSchema', () => {
  it('should validate valid Cloudflare config', () => {
    const config = {
      environment: 'prod' as const,
      platform: 'cloudflare' as const,
      appName: 'aether',
      version: '1.0.0',
      branch: 'main',
      commitSha: 'a'.repeat(40),
      deployedBy: 'ci',
      timestamp: new Date(),
      accountId: 'abc123',
      workerName: 'aether',
      bindings: [
        {
          type: 'kv' as const,
          name: 'STATE',
          id: 'def456'
        }
      ]
    };
    expect(CloudflareDeploymentConfigSchema.parse(config)).toEqual(config);
  });

  it('should reject invalid version format', () => {
    const config = {
      environment: 'prod' as const,
      platform: 'cloudflare' as const,
      appName: 'aether',
      version: '1.0',
      branch: 'main',
      commitSha: 'a'.repeat(40),
      deployedBy: 'ci',
      timestamp: new Date(),
      accountId: 'abc123',
      workerName: 'aether',
      bindings: []
    };
    expect(() => CloudflareDeploymentConfigSchema.parse(config)).toThrow();
  });

  it('should reject invalid commit SHA', () => {
    const config = {
      environment: 'prod' as const,
      platform: 'cloudflare' as const,
      appName: 'aether',
      version: '1.0.0',
      branch: 'main',
      commitSha: 'abc',
      deployedBy: 'ci',
      timestamp: new Date(),
      accountId: 'abc123',
      workerName: 'aether',
      bindings: []
    };
    expect(() => CloudflareDeploymentConfigSchema.parse(config)).toThrow();
  });
});

describe('VercelDeploymentConfigSchema', () => {
  it('should validate valid Vercel config', () => {
    const config = {
      environment: 'prod' as const,
      platform: 'vercel' as const,
      appName: 'aether-frontend',
      version: '1.0.0',
      branch: 'main',
      commitSha: 'a'.repeat(40),
      deployedBy: 'ci',
      timestamp: new Date(),
      projectId: 'abc123',
      framework: 'vite' as const,
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      env: {}
    };
    expect(VercelDeploymentConfigSchema.parse(config)).toEqual(config);
  });

  it('should reject invalid framework', () => {
    const config = {
      environment: 'prod' as const,
      platform: 'vercel' as const,
      appName: 'aether-frontend',
      version: '1.0.0',
      branch: 'main',
      commitSha: 'a'.repeat(40),
      deployedBy: 'ci',
      timestamp: new Date(),
      projectId: 'abc123',
      framework: 'angular' as const,
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      env: {}
    };
    expect(() => VercelDeploymentConfigSchema.parse(config)).toThrow();
  });
});

describe('EnvironmentVariableSchema', () => {
  it('should validate valid environment variable', () => {
    const envVar = {
      name: 'API_KEY',
      value: 'secret123',
      required: true,
      description: 'API key',
      environment: ['prod' as const],
      isSecret: true
    };
    expect(EnvironmentVariableSchema.parse(envVar)).toEqual(envVar);
  });

  it('should reject empty name', () => {
    const envVar = {
      name: '',
      value: 'secret123',
      required: true,
      description: 'API key',
      environment: ['prod' as const],
      isSecret: true
    };
    expect(() => EnvironmentVariableSchema.parse(envVar)).toThrow();
  });
});

describe('HealthCheckConfigSchema', () => {
  it('should validate valid health check config', () => {
    const config = {
      endpoint: 'https://example.com/health',
      method: 'GET' as const,
      expectedStatus: 200,
      timeout: 10000,
      retries: 3,
      interval: 5000
    };
    expect(HealthCheckConfigSchema.parse(config)).toEqual(config);
  });

  it('should reject invalid URL', () => {
    const config = {
      endpoint: 'not-a-url',
      method: 'GET' as const,
      expectedStatus: 200,
      timeout: 10000,
      retries: 3,
      interval: 5000
    };
    expect(() => HealthCheckConfigSchema.parse(config)).toThrow();
  });

  it('should reject invalid status code', () => {
    const config = {
      endpoint: 'https://example.com/health',
      method: 'GET' as const,
      expectedStatus: 600,
      timeout: 10000,
      retries: 3,
      interval: 5000
    };
    expect(() => HealthCheckConfigSchema.parse(config)).toThrow();
  });
});

describe('RollbackConfigSchema', () => {
  it('should validate valid rollback config', () => {
    const config = {
      enabled: true,
      maxRetries: 3,
      timeout: 30000,
      healthCheck: {
        endpoint: 'https://example.com/health',
        method: 'GET' as const,
        expectedStatus: 200,
        timeout: 10000,
        retries: 3,
        interval: 5000
      },
      rollbackStrategy: 'automatic' as const
    };
    expect(RollbackConfigSchema.parse(config)).toEqual(config);
  });

  it('should reject invalid rollback strategy', () => {
    const config = {
      enabled: true,
      maxRetries: 3,
      timeout: 30000,
      healthCheck: {
        endpoint: 'https://example.com/health',
        method: 'GET' as const,
        expectedStatus: 200,
        timeout: 10000,
        retries: 3,
        interval: 5000
      },
      rollbackStrategy: 'fast' as const
    };
    expect(() => RollbackConfigSchema.parse(config)).toThrow();
  });
});

describe('DeploymentResultSchema', () => {
  it('should validate successful deployment result', () => {
    const result = {
      success: true,
      status: 'success' as const,
      deploymentId: 'deploy-123',
      url: 'https://example.com',
      timestamp: new Date(),
      duration: 1000,
      logs: ['Log message']
    };
    expect(DeploymentResultSchema.parse(result)).toEqual(result);
  });

  it('should validate failed deployment result', () => {
    const result = {
      success: false,
      status: 'failed' as const,
      deploymentId: 'deploy-123',
      error: 'Deployment failed',
      timestamp: new Date(),
      duration: 1000,
      logs: ['Log message']
    };
    expect(DeploymentResultSchema.parse(result)).toEqual(result);
  });
});

describe('AnyDeploymentConfigSchema', () => {
  it('should discriminate Cloudflare config', () => {
    const config = {
      environment: 'prod' as const,
      platform: 'cloudflare' as const,
      appName: 'aether',
      version: '1.0.0',
      branch: 'main',
      commitSha: 'a'.repeat(40),
      deployedBy: 'ci',
      timestamp: new Date(),
      accountId: 'abc123',
      workerName: 'aether',
      bindings: []
    };
    const parsed = AnyDeploymentConfigSchema.parse(config);
    expect(parsed.platform).toBe('cloudflare');
  });

  it('should discriminate Vercel config', () => {
    const config = {
      environment: 'prod' as const,
      platform: 'vercel' as const,
      appName: 'aether-frontend',
      version: '1.0.0',
      branch: 'main',
      commitSha: 'a'.repeat(40),
      deployedBy: 'ci',
      timestamp: new Date(),
      projectId: 'abc123',
      framework: 'vite' as const,
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      env: {}
    };
    const parsed = AnyDeploymentConfigSchema.parse(config);
    expect(parsed.platform).toBe('vercel');
  });
});
