/**
 * @aether/health-check - Health Check Endpoints
 * 
 * Provides health check endpoints for Kubernetes and monitoring.
 * Includes liveness, readiness, and startup probes.
 */

export interface HealthCheckConfig {
  livenessPath?: string;
  readinessPath?: string;
  startupPath?: string;
  metricsPath?: string;
  debugPath?: string;
  envPath?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks?: Record<string, boolean>;
  version?: string;
  uptime?: number;
}

export class HealthChecker {
  private isReady = false;
  private isLive = true;
  private isStarted = false;
  private checks: Map<string, () => boolean> = new Map();
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  setReady(ready: boolean): void {
    this.isReady = ready;
  }

  setLive(live: boolean): void {
    this.isLive = live;
  }

  setStarted(started: boolean): void {
    this.isStarted = started;
  }

  addCheck(name: string, check: () => boolean): void {
    this.checks.set(name, check);
  }

  removeCheck(name: string): void {
    this.checks.delete(name);
  }

  getHealthStatus(): HealthStatus {
    const checks: Record<string, boolean> = {};
    let allHealthy = true;

    for (const [name, check] of this.checks.entries()) {
      try {
        checks[name] = check();
        if (!checks[name]) {
          allHealthy = false;
        }
      } catch {
        checks[name] = false;
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      uptime: Date.now() - this.startTime
    };
  }

  getLivenessStatus(): HealthStatus {
    return {
      status: this.isLive ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    };
  }

  getReadinessStatus(): HealthStatus {
    return {
      status: this.isReady ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    };
  }

  getStartupStatus(): HealthStatus {
    return {
      status: this.isStarted ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    };
  }
}

// Global health checker instance
let globalHealthChecker: HealthChecker | null = null;

export function setupHealthChecker(): HealthChecker {
  globalHealthChecker = new HealthChecker();
  return globalHealthChecker;
}

export function getHealthChecker(): HealthChecker {
  if (!globalHealthChecker) {
    globalHealthChecker = new HealthChecker();
  }
  return globalHealthChecker;
}

// Express middleware for health endpoints
export function healthEndpoints(config: HealthCheckConfig = {}) {
  const {
    livenessPath = '/health/live',
    readinessPath = '/health/ready',
    startupPath = '/health/startup',
    metricsPath = '/metrics',
    debugPath = '/debug',
    envPath = '/env'
  } = config;

  const checker = getHealthChecker();

  return function (app: any) {
    // Liveness probe
    app.get(livenessPath, (req: any, res: any) => {
      const status = checker.getLivenessStatus();
      res.status(status.status === 'healthy' ? 200 : 503).json(status);
    });

    // Readiness probe
    app.get(readinessPath, (req: any, res: any) => {
      const status = checker.getReadinessStatus();
      res.status(status.status === 'healthy' ? 200 : 503).json(status);
    });

    // Startup probe
    app.get(startupPath, (req: any, res: any) => {
      const status = checker.getStartupStatus();
      res.status(status.status === 'healthy' ? 200 : 503).json(status);
    });

    // Health check
    app.get('/health', (req: any, res: any) => {
      const status = checker.getHealthStatus();
      res.status(status.status === 'healthy' ? 200 : 503).json(status);
    });

    // Metrics endpoint (placeholder)
    if (metricsPath) {
      app.get(metricsPath, (req: any, res: any) => {
        res.json({
          status: 'ok',
          metrics: checker.getHealthStatus()
        });
      });
    }

    // Debug endpoint
    if (debugPath) {
      app.get(debugPath, (req: any, res: any) => {
        const healthStatus = checker.getHealthStatus();
        res.json({
          status: 'ok',
          uptime: Date.now() - (healthStatus.uptime || 0),
          checks: healthStatus.checks
        });
      });
    }

    // Environment info endpoint
    if (envPath) {
      app.get(envPath, (req: any, res: any) => {
        const healthStatus = checker.getHealthStatus();
        res.json({
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          env: process.env.NODE_ENV || 'development',
          uptime: Date.now() - (healthStatus.uptime || 0)
        });
      });
    }
  };
}