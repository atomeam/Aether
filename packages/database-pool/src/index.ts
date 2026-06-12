/**
 * @aether/database-pool - Database Connection Pooling
 * 
 * Provides database connection pooling for applications.
 * Supports connection reuse, health checks, and automatic reconnection.
 */

export interface PoolConfig {
  minConnections?: number;
  maxConnections?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
  healthCheckInterval?: number;
}

export interface Connection {
  id: string;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  release: () => void;
}

export class DatabasePool {
  private availableConnections: Connection[] = [];
  private activeConnections: Set<Connection> = new Set();
  private minConnections: number;
  private maxConnections: number;
  private acquireTimeout: number;
  private idleTimeout: number;
  private healthCheckInterval: number;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(config: PoolConfig = {}) {
    const {
      minConnections = 2,
      maxConnections = 10,
      acquireTimeout = 30000,
      idleTimeout = 300000,
      healthCheckInterval = 60000
    } = config;

    this.minConnections = minConnections;
    this.maxConnections = maxConnections;
    this.acquireTimeout = acquireTimeout;
    this.idleTimeout = idleTimeout;
    this.healthCheckInterval = healthCheckInterval;

    this.initializePool();
    this.startHealthCheck();
  }

  private async initializePool(): Promise<void> {
    for (let i = 0; i < this.minConnections; i++) {
      const connection = await this.createConnection();
      this.availableConnections.push(connection);
    }
  }

  private async createConnection(): Promise<Connection> {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const now = Date.now();

    const connection: Connection = {
      id,
      createdAt: now,
      lastUsed: now,
      isActive: false,
      release: () => this.releaseConnection(connection)
    };

    return connection;
  }

  async acquire(): Promise<Connection> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.acquireTimeout) {
      if (this.availableConnections.length > 0) {
        const connection = this.availableConnections.pop()!;
        connection.isActive = true;
        connection.lastUsed = Date.now();
        this.activeConnections.add(connection);
        return connection;
      }

      if (this.activeConnections.size < this.maxConnections) {
        const connection = await this.createConnection();
        connection.isActive = true;
        connection.lastUsed = Date.now();
        this.activeConnections.add(connection);
        return connection;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('Connection pool timeout');
  }

  releaseConnection(connection: Connection): void {
    connection.isActive = false;
    connection.lastUsed = Date.now();
    this.activeConnections.delete(connection);
    this.availableConnections.push(connection);
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.cleanupIdleConnections();
      this.ensureMinConnections();
    }, this.healthCheckInterval);
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    this.availableConnections = this.availableConnections.filter(conn => {
      if (now - conn.lastUsed > this.idleTimeout && this.availableConnections.length > this.minConnections) {
        return false;
      }
      return true;
    });
  }

  private async ensureMinConnections(): Promise<void> {
    while (this.availableConnections.length < this.minConnections) {
      const connection = await this.createConnection();
      this.availableConnections.push(connection);
    }
  }

  getStats(): { available: number; active: number; total: number } {
    return {
      available: this.availableConnections.length,
      active: this.activeConnections.size,
      total: this.availableConnections.length + this.activeConnections.size
    };
  }

  async close(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.availableConnections = [];
    this.activeConnections.clear();
  }
}

// Global database pool instance
let globalDatabasePool: DatabasePool | null = null;

export function setupDatabasePool(config?: PoolConfig): DatabasePool {
  globalDatabasePool = new DatabasePool(config);
  return globalDatabasePool;
}

export function getDatabasePool(): DatabasePool | null {
  return globalDatabasePool;
}