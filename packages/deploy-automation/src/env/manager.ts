/**
 * Environment Variable Manager
 * Manages environment variables across different deployment environments
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Environment, EnvironmentVariable } from '../types';
import { EnvironmentVariableSchema, EnvironmentSchema } from '../schemas';

export class EnvironmentManager {
  private variables: Map<string, EnvironmentVariable> = new Map();
  private environment: Environment;

  constructor(environment: Environment = 'dev') {
    this.environment = EnvironmentSchema.parse(environment);
  }

  /**
   * Load environment variables from .env file
   */
  loadFromFile(filePath: string = '.env'): void {
    if (!existsSync(filePath)) {
      throw new Error(`Environment file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const [name, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');

      if (name && value !== undefined) {
        this.variables.set(name, {
          name,
          value,
          required: true,
          description: `Loaded from ${filePath}`,
          environment: [this.environment],
          isSecret: this.isSecret(name)
        });
      }
    }
  }

  /**
   * Add an environment variable
   */
  add(variable: EnvironmentVariable): void {
    const validated = EnvironmentVariableSchema.parse(variable);
    this.variables.set(validated.name, validated);
  }

  /**
   * Get an environment variable
   */
  get(name: string): EnvironmentVariable | undefined {
    return this.variables.get(name);
  }

  /**
   * Get value of an environment variable
   */
  getValue(name: string): string | undefined {
    return this.variables.get(name)?.value;
  }

  /**
   * Check if all required variables are set
   */
  validate(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const [name, variable] of this.variables) {
      if (variable.required && !variable.value) {
        missing.push(name);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Export variables to process.env
   */
  exportToProcess(): void {
    for (const [name, variable] of this.variables) {
      if (variable.value) {
        process.env[name] = variable.value;
      }
    }
  }

  /**
   * Export variables to .env file
   */
  exportToFile(filePath: string = '.env'): void {
    const lines: string[] = [];

    for (const [name, variable] of this.variables) {
      if (variable.environment.includes(this.environment)) {
        const prefix = variable.isSecret ? '# ' : '';
        lines.push(`${prefix}${name}=${variable.value}`);
      }
    }

    writeFileSync(filePath, lines.join('\n'), 'utf-8');
  }

  /**
   * Generate environment-specific .env file
   */
  generateEnvFile(environment: Environment, filePath: string): void {
    const lines: string[] = [];
    lines.push(`# Environment: ${environment}`);
    lines.push(`# Generated at: ${new Date().toISOString()}`);
    lines.push('');

    for (const [name, variable] of this.variables) {
      if (variable.environment.includes(environment)) {
        const prefix = variable.isSecret ? '# ' : '';
        lines.push(`${prefix}${name}=${variable.value}`);
        if (variable.description) {
          lines.push(`# ${variable.description}`);
        }
        lines.push('');
      }
    }

    writeFileSync(filePath, lines.join('\n'), 'utf-8');
  }

  /**
   * Get all variables for a specific environment
   */
  getVariablesForEnvironment(environment: Environment): EnvironmentVariable[] {
    return Array.from(this.variables.values()).filter(
      v => v.environment.includes(environment)
    );
  }

  /**
   * Check if a variable name suggests it's a secret
   */
  private isSecret(name: string): boolean {
    const secretKeywords = ['key', 'secret', 'token', 'password', 'api', 'auth'];
    const lowerName = name.toLowerCase();
    return secretKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Get all variable names
   */
  getVariableNames(): string[] {
    return Array.from(this.variables.keys());
  }

  /**
   * Remove a variable
   */
  remove(name: string): boolean {
    return this.variables.delete(name);
  }

  /**
   * Clear all variables
   */
  clear(): void {
    this.variables.clear();
  }

  /**
   * Get variable count
   */
  count(): number {
    return this.variables.size;
  }
}

/**
 * Predefined environment variables for Aether project
 */
export const AETHER_ENV_VARIABLES: EnvironmentVariable[] = [
  {
    name: 'NODE_ENV',
    value: 'development',
    required: true,
    description: 'Node environment (development, staging, production)',
    environment: ['dev', 'staging', 'prod'],
    isSecret: false
  },
  {
    name: 'GEMINI_API_KEY',
    value: '',
    required: true,
    description: 'Google Gemini API key for AI features',
    environment: ['dev', 'staging', 'prod'],
    isSecret: true
  },
  {
    name: 'CF_API_TOKEN',
    value: '',
    required: true,
    description: 'Cloudflare API token for worker deployment',
    environment: ['dev', 'staging', 'prod'],
    isSecret: true
  },
  {
    name: 'CF_ACCOUNT_ID',
    value: '',
    required: true,
    description: 'Cloudflare account ID',
    environment: ['dev', 'staging', 'prod'],
    isSecret: true
  },
  {
    name: 'VERCEL_TOKEN',
    value: '',
    required: true,
    description: 'Vercel authentication token',
    environment: ['dev', 'staging', 'prod'],
    isSecret: true
  },
  {
    name: 'VERCEL_ORG_ID',
    value: '',
    required: true,
    description: 'Vercel organization ID',
    environment: ['dev', 'staging', 'prod'],
    isSecret: true
  },
  {
    name: 'VERCEL_PROJECT_ID',
    value: '',
    required: true,
    description: 'Vercel project ID',
    environment: ['dev', 'staging', 'prod'],
    isSecret: true
  },
  {
    name: 'DATABASE_URL',
    value: '',
    required: false,
    description: 'Database connection URL',
    environment: ['staging', 'prod'],
    isSecret: true
  },
  {
    name: 'REDIS_URL',
    value: '',
    required: false,
    description: 'Redis connection URL',
    environment: ['staging', 'prod'],
    isSecret: true
  },
  {
    name: 'SENTRY_DSN',
    value: '',
    required: false,
    description: 'Sentry DSN for error tracking',
    environment: ['staging', 'prod'],
    isSecret: true
  },
  {
    name: 'LOG_LEVEL',
    value: 'info',
    required: false,
    description: 'Logging level (debug, info, warn, error)',
    environment: ['dev', 'staging', 'prod'],
    isSecret: false
  }
];
