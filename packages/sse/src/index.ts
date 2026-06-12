/**
 * @aether/sse - Server-Sent Events (SSE)
 * 
 * Provides Server-Sent Events middleware for Express applications.
 * Enables real-time server-to-client communication.
 */

export interface SSEConfig {
  retryInterval?: number;    // Retry interval in milliseconds
  heartbeatInterval?: number;  // Heartbeat interval in milliseconds
}

export class SSEConnection {
  private res: any;
  private heartbeatInterval?: NodeJS.Timeout;
  private config: SSEConfig;

  constructor(res: any, config: SSEConfig = {}) {
    this.res = res;
    this.config = {
      retryInterval: 1000,
      heartbeatInterval: 30000,
      ...config
    };

    this.setupConnection();
  }

  private setupConnection(): void {
    // Set SSE headers
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache');
    this.res.setHeader('Connection', 'keep-alive');
    this.res.setHeader('X-Accel-Buffering', 'no');

    // Send initial retry interval
    this.send('', { retry: this.config.retryInterval });

    // Start heartbeat
    if (this.config.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.send(': heartbeat');
      }, this.config.heartbeatInterval);
    }
  }

  send(data: any, options?: { id?: string; event?: string; retry?: number }): void {
    let message = '';

    if (options?.id) {
      message += `id: ${options.id}\n`;
    }

    if (options?.event) {
      message += `event: ${options.event}\n`;
    }

    if (options?.retry) {
      message += `retry: ${options.retry}\n`;
    }

    if (typeof data === 'object') {
      message += `data: ${JSON.stringify(data)}\n`;
    } else {
      message += `data: ${data}\n`;
    }

    message += '\n';
    this.res.write(message);
  }

  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.res.end();
  }
}

export function sse(config: SSEConfig = {}) {
  return function (req: any, res: any, next: any) {
    const connection = new SSEConnection(res, config);
    req.sse = connection;
    next();
  };
}

// Global SSE connections manager
export class SSEManager {
  private connections: Map<string, SSEConnection> = new Map();

  add(id: string, connection: SSEConnection): void {
    this.connections.set(id, connection);
  }

  remove(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.close();
    }
    this.connections.delete(id);
  }

  get(id: string): SSEConnection | undefined {
    return this.connections.get(id);
  }

  broadcast(data: any, event?: string): void {
    for (const connection of this.connections.values()) {
      connection.send(data, { event });
    }
  }

  sendTo(id: string, data: any, event?: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.send(data, { event });
    }
  }

  closeAll(): void {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
  }

  getCount(): number {
    return this.connections.size;
  }
}

// Global SSE manager instance
let globalSSEManager: SSEManager | null = null;

export function getSSEManager(): SSEManager {
  if (!globalSSEManager) {
    globalSSEManager = new SSEManager();
  }
  return globalSSEManager;
}