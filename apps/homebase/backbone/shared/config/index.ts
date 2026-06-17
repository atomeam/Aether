import dotenv from 'dotenv';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables - try multiple paths
const possibleEnvPaths = [
  path.join(process.cwd(), 'backbone', 'config', '.env'),
  path.join(process.cwd(), 'config', '.env'),
  path.join(__dirname, '..', '..', 'config', '.env')
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export interface OrchestratorConfig {
  port: number;
  log_level: string;
  runs_dir: string;
  max_runs_per_day: number;
}

export interface SchedulerConfig {
  enabled: boolean;
  timezone: string;
  max_concurrent_jobs: number;
}

export interface WorkflowConfig {
  [key: string]: {
    enabled: boolean;
    schedule?: string;
    timeout: number;
    retries: number;
    description: string;
  };
}

export interface LoggingConfig {
  format: string;
  output: string[];
  file?: {
    path: string;
    max_size: string;
    max_files: number;
  };
}

export interface MonitoringConfig {
  health_check_interval: number;
  metrics_enabled: boolean;
  sentry_enabled: boolean;
}

export interface Config {
  orchestrator: OrchestratorConfig;
  scheduler: SchedulerConfig;
  workflows: WorkflowConfig;
  logging: LoggingConfig;
  monitoring: MonitoringConfig;
}

let config: Config | null = null;

export function loadConfig(): Config {
  if (config) {
    return config;
  }

  // Try multiple config paths to handle different execution contexts
  const possibleConfigPaths = [
    path.join(process.cwd(), 'backbone', 'config', 'config.yaml'),
    path.join(process.cwd(), 'config', 'config.yaml'),
    path.join(__dirname, '..', '..', 'config', 'config.yaml')
  ];

  let configPath = null;
  for (const testPath of possibleConfigPaths) {
    if (fs.existsSync(testPath)) {
      configPath = testPath;
      break;
    }
  }

  if (!configPath) {
    console.error('config.yaml not found in any expected location, using defaults');
    config = getDefaultConfig();
    return config;
  }
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    config = yaml.parse(configContent) as Config;
    return config;
  } catch (error) {
    console.error('Failed to load config.yaml, using defaults');
    config = getDefaultConfig();
    return config;
  }
}

export function getDefaultConfig(): Config {
  return {
    orchestrator: {
      port: parseInt(process.env.ORCHESTRATOR_PORT || '3000'),
      log_level: process.env.ORCHESTRATOR_LOG_LEVEL || 'info',
      runs_dir: process.env.ORCHESTRATOR_RUNS_DIR || './runs',
      max_runs_per_day: 1000
    },
    scheduler: {
      enabled: process.env.SCHEDULER_ENABLED === 'true',
      timezone: process.env.SCHEDULER_TIMEZONE || 'America/New_York',
      max_concurrent_jobs: parseInt(process.env.WORKER_CONCURRENCY || '4')
    },
    workflows: {},
    logging: {
      format: 'json',
      output: ['console', 'file'],
      file: {
        path: './logs/orchestrator.log',
        max_size: '10MB',
        max_files: 10
      }
    },
    monitoring: {
      health_check_interval: 60000,
      metrics_enabled: process.env.METRICS_ENABLED === 'true',
      sentry_enabled: false
    }
  };
}

export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
