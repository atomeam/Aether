/**
 * @aether/config - Configuration Management
 * 
 * Provides configuration management for applications.
 * Supports environment variables, config files, and runtime configuration.
 */

import fs from 'fs';
import path from 'path';

export interface ConfigManagerOptions {
  envFile?: string;
  configDir?: string;
  defaultConfig?: Record<string, any>;
}

export class ConfigManager {
  private config: Record<string, any>;
  private envFile: string;
  private configDir: string;

  constructor(options: ConfigManagerOptions = {}) {
    const {
      envFile = '.env',
      configDir = 'config',
      defaultConfig = {}
    } = options;

    this.envFile = envFile;
    this.configDir = configDir;
    this.config = { ...defaultConfig };

    this.loadEnvironmentVariables();
    this.loadConfigFiles();
  }

  private loadEnvironmentVariables(): void {
    if (fs.existsSync(this.envFile)) {
      const envContent = fs.readFileSync(this.envFile, 'utf-8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          if (key && value) {
            process.env[key] = value;
            this.config[key] = value;
          }
        }
      }
    }

    // Load all environment variables
    for (const [key, value] of Object.entries(process.env)) {
      this.config[key] = value;
    }
  }

  private loadConfigFiles(): void {
    if (!fs.existsSync(this.configDir)) {
      return;
    }

    const files = fs.readdirSync(this.configDir);

    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.js')) {
        const filepath = path.join(this.configDir, file);
        const content = require(filepath);
        const configName = path.basename(file, path.extname(file));
        this.config[configName] = content;
      }
    }
  }

  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }

  merge(config: Record<string, any>): void {
    this.config = deepMerge(this.config, config);
  }
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Global config manager instance
let globalConfigManager: ConfigManager | null = null;

export function setupConfig(options?: ConfigManagerOptions): ConfigManager {
  globalConfigManager = new ConfigManager(options);
  return globalConfigManager;
}

export function getConfig(): ConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new ConfigManager();
  }
  return globalConfigManager;
}

export function getEnv(key: string, defaultValue?: string): string {
  return process.env[key] || defaultValue || '';
}