/**
 * Zod Schemas for Deployment Validation
 * Provides runtime validation for all deployment-related data structures
 */

import { z } from 'zod';

// Environment enum
export const EnvironmentSchema = z.enum(['dev', 'staging', 'prod']);

// Platform enum
export const DeploymentPlatformSchema = z.enum(['cloudflare', 'vercel']);

// Status enum
export const DeploymentStatusSchema = z.enum([
  'pending',
  'in_progress',
  'success',
  'failed',
  'rolled_back'
]);

// Base deployment config
export const DeploymentConfigSchema = z.object({
  environment: EnvironmentSchema,
  platform: DeploymentPlatformSchema,
  appName: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/),
  branch: z.string().min(1),
  commitSha: z.string().regex(/^[a-f0-9]{40}$/),
  deployedBy: z.string().min(1),
  timestamp: z.date()
});

// Cloudflare binding
export const CloudflareBindingSchema = z.object({
  type: z.enum(['kv', 'd1', 'r2', 'queue', 'service', 'browser']),
  name: z.string().min(1),
  id: z.string().optional(),
  service: z.string().optional(),
  bucket_name: z.string().optional(),
  database_name: z.string().optional(),
  database_id: z.string().optional()
}).refine(
  (data) => {
    // Validate that required fields are present based on type
    switch (data.type) {
      case 'kv':
      case 'r2':
      case 'queue':
        return !!data.id;
      case 'd1':
        return !!data.database_id;
      case 'service':
        return !!data.service;
      case 'browser':
        return true;
      default:
        return false;
    }
  },
  {
    message: 'Missing required fields for binding type'
  }
);

// Cloudflare deployment config
export const CloudflareDeploymentConfigSchema = DeploymentConfigSchema.extend({
  platform: z.literal('cloudflare'),
  accountId: z.string().min(1),
  workerName: z.string().min(1).max(100),
  zoneId: z.string().optional(),
  customDomain: z.string().optional(),
  routes: z.array(z.string()).optional(),
  bindings: z.array(CloudflareBindingSchema)
});

// Vercel deployment config
export const VercelDeploymentConfigSchema = DeploymentConfigSchema.extend({
  platform: z.literal('vercel'),
  projectId: z.string().min(1),
  teamId: z.string().optional(),
  framework: z.enum(['nextjs', 'vite', 'other']),
  buildCommand: z.string().min(1),
  outputDirectory: z.string().min(1),
  env: z.record(z.string())
});

// Environment variable
export const EnvironmentVariableSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.string(),
  required: z.boolean(),
  description: z.string(),
  environment: z.array(EnvironmentSchema),
  isSecret: z.boolean()
});

// Health check config
export const HealthCheckConfigSchema = z.object({
  endpoint: z.string().url(),
  method: z.enum(['GET', 'POST']),
  expectedStatus: z.number().min(100).max(599),
  timeout: z.number().min(1000).max(300000),
  retries: z.number().min(0).max(10),
  interval: z.number().min(1000).max(60000),
  headers: z.record(z.string()).optional()
});

// Rollback config
export const RollbackConfigSchema = z.object({
  enabled: z.boolean(),
  maxRetries: z.number().min(0).max(10),
  timeout: z.number().min(1000).max(600000),
  healthCheck: HealthCheckConfigSchema,
  rollbackStrategy: z.enum(['immediate', 'manual', 'automatic'])
});

// Deployment result
export const DeploymentResultSchema = z.object({
  success: z.boolean(),
  status: DeploymentStatusSchema,
  deploymentId: z.string().min(1),
  url: z.string().url().optional(),
  error: z.string().optional(),
  timestamp: z.date(),
  duration: z.number().min(0),
  logs: z.array(z.string())
});

// Pre-deployment check
export const PreDeploymentCheckSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  check: z.function().returns(z.promise(z.boolean())),
  required: z.boolean()
});

// Post-deployment validation
export const PostDeploymentValidationSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  validate: z.function().returns(z.promise(z.boolean())),
  required: z.boolean()
});

// Union type for deployment configs
export const AnyDeploymentConfigSchema = z.discriminatedUnion('platform', [
  CloudflareDeploymentConfigSchema,
  VercelDeploymentConfigSchema
]);

// Export types inferred from schemas
export type Environment = z.infer<typeof EnvironmentSchema>;
export type DeploymentPlatform = z.infer<typeof DeploymentPlatformSchema>;
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;
export type CloudflareBinding = z.infer<typeof CloudflareBindingSchema>;
export type CloudflareDeploymentConfig = z.infer<typeof CloudflareDeploymentConfigSchema>;
export type VercelDeploymentConfig = z.infer<typeof VercelDeploymentConfigSchema>;
export type EnvironmentVariable = z.infer<typeof EnvironmentVariableSchema>;
export type HealthCheckConfig = z.infer<typeof HealthCheckConfigSchema>;
export type RollbackConfig = z.infer<typeof RollbackConfigSchema>;
export type DeploymentResult = z.infer<typeof DeploymentResultSchema>;
export type AnyDeploymentConfig = z.infer<typeof AnyDeploymentConfigSchema>;
