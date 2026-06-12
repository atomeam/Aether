/**
 * Deployment Configuration Types
 * Defines the core types for deployment automation across Cloudflare Workers and Vercel
 */

export type Environment = 'dev' | 'staging' | 'prod';
export type DeploymentPlatform = 'cloudflare' | 'vercel';
export type DeploymentStatus = 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back';

export interface DeploymentConfig {
  environment: Environment;
  platform: DeploymentPlatform;
  appName: string;
  version: string;
  branch: string;
  commitSha: string;
  deployedBy: string;
  timestamp: Date;
}

export interface CloudflareDeploymentConfig extends DeploymentConfig {
  platform: 'cloudflare';
  accountId: string;
  workerName: string;
  zoneId?: string;
  customDomain?: string;
  routes?: string[];
  bindings: CloudflareBinding[];
}

export interface VercelDeploymentConfig extends DeploymentConfig {
  platform: 'vercel';
  projectId: string;
  teamId?: string;
  framework: 'nextjs' | 'vite' | 'other';
  buildCommand: string;
  outputDirectory: string;
  env: Record<string, string>;
}

export interface CloudflareBinding {
  type: 'kv' | 'd1' | 'r2' | 'queue' | 'service' | 'browser';
  name: string;
  id?: string;
  service?: string;
  bucket_name?: string;
  database_name?: string;
  database_id?: string;
}

export interface EnvironmentVariable {
  name: string;
  value: string;
  required: boolean;
  description: string;
  environment: Environment[];
  isSecret: boolean;
}

export interface HealthCheckConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  expectedStatus: number;
  timeout: number;
  retries: number;
  interval: number;
  headers?: Record<string, string>;
}

export interface RollbackConfig {
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  healthCheck: HealthCheckConfig;
  rollbackStrategy: 'immediate' | 'manual' | 'automatic';
}

export interface DeploymentResult {
  success: boolean;
  status: DeploymentStatus;
  deploymentId: string;
  url?: string;
  error?: string;
  timestamp: Date;
  duration: number;
  logs: string[];
}

export interface PreDeploymentCheck {
  name: string;
  description: string;
  check: () => Promise<boolean>;
  required: boolean;
}

export interface PostDeploymentValidation {
  name: string;
  description: string;
  validate: (result: DeploymentResult) => Promise<boolean>;
  required: boolean;
}
