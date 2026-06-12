/**
 * Health Check Automation
 * Automated health checks for deployed applications
 */

import { HealthCheckConfig } from '../types';
import { HealthCheckConfigSchema } from '../schemas';

export interface HealthCheckResult {
  healthy: boolean;
  status: number;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

export class HealthChecker {
  private config: HealthCheckConfig;
  private history: HealthCheckResult[] = [];

  constructor(config: HealthCheckConfig) {
    // Validate config
    const validated = HealthCheckConfigSchema.parse(config);
    this.config = validated;
  }

  /**
   * Run a single health check
   */
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const response = await this.fetchWithTimeout(
        this.config.endpoint,
        this.config.method,
        this.config.timeout,
        this.config.headers
      );

      const responseTime = Date.now() - startTime;
      const healthy = response.status === this.config.expectedStatus;

      const result: HealthCheckResult = {
        healthy,
        status: response.status,
        responseTime,
        timestamp: new Date()
      };

      this.history.push(result);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const result: HealthCheckResult = {
        healthy: false,
        status: 0,
        responseTime,
        error: errorMessage,
        timestamp: new Date()
      };

      this.history.push(result);

      return result;
    }
  }

  /**
   * Run health checks with retries
   */
  async checkWithRetries(): Promise<HealthCheckResult> {
    let lastResult: HealthCheckResult | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      console.log(`Health check attempt ${attempt}/${this.config.retries}...`);

      const result = await this.check();
      lastResult = result;

      if (result.healthy) {
        console.log(`✓ Health check passed (status: ${result.status}, ${result.responseTime}ms)`);
        return result;
      }

      console.log(`⚠ Health check failed (status: ${result.status}, error: ${result.error})`);

      if (attempt < this.config.retries) {
        await this.sleep(this.config.interval);
      }
    }

    console.log(`✗ Health check failed after ${this.config.retries} attempts`);
    return lastResult!;
  }

  /**
   * Run continuous health checks
   */
  async startContinuousChecks(
    interval: number = 60000,
    callback?: (result: HealthCheckResult) => void
  ): Promise<void> {
    console.log(`Starting continuous health checks every ${interval}ms...`);

    const runCheck = async () => {
      const result = await this.check();
      if (callback) {
        callback(result);
      }
    };

    // Run immediately
    await runCheck();

    // Schedule subsequent checks
    setInterval(runCheck, interval);
  }

  /**
   * Get health check history
   */
  getHistory(): HealthCheckResult[] {
    return [...this.history];
  }

  /**
   * Get health statistics
   */
  getStatistics(): {
    total: number;
    healthy: number;
    unhealthy: number;
    successRate: number;
    averageResponseTime: number;
  } {
    const total = this.history.length;
    const healthy = this.history.filter(r => r.healthy).length;
    const unhealthy = total - healthy;
    const successRate = total > 0 ? (healthy / total) * 100 : 0;
    const averageResponseTime = total > 0
      ? this.history.reduce((sum, r) => sum + r.responseTime, 0) / total
      : 0;

    return {
      total,
      healthy,
      unhealthy,
      successRate,
      averageResponseTime
    };
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    method: 'GET' | 'POST',
    timeout: number,
    headers?: Record<string, string>
  ): Promise<{ status: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return { status: response.status };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Predefined health check configurations for Aether
 */
export const AETHER_HEALTH_CHECKS: Record<string, HealthCheckConfig> = {
  backend: {
    endpoint: 'https://aether.a-to-mind.com/api/stack',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    retries: 3,
    interval: 5000
  },
  frontend: {
    endpoint: 'https://aether.a-to-mind.com',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    retries: 3,
    interval: 5000
  },
  bridge: {
    endpoint: 'https://aether-bridge.a-to-mind.com/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    retries: 3,
    interval: 5000
  }
};

/**
 * Run comprehensive health checks for all Aether services
 */
export async function runAetherHealthChecks(): Promise<Record<string, HealthCheckResult>> {
  const results: Record<string, HealthCheckResult> = {};

  for (const [service, config] of Object.entries(AETHER_HEALTH_CHECKS)) {
    console.log(`Checking ${service}...`);
    const checker = new HealthChecker(config);
    results[service] = await checker.checkWithRetries();
  }

  return results;
}
