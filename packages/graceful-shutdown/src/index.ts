/**
 * @aether/graceful-shutdown - Graceful Shutdown Handler
 * 
 * Provides graceful shutdown handling for Node.js applications.
 * Handles SIGTERM, SIGINT, and uncaught exceptions.
 */

export interface ShutdownConfig {
  timeout?: number;        // Graceful shutdown timeout (ms)
  onShutdown?: () => Promise<void>;  // Shutdown callback
  onSignal?: (signal: string) => void;  // Signal callback
  forceExit?: boolean;      // Force exit after timeout
}

export class GracefulShutdown {
  private isShuttingDown = false;
  private shutdownTimeout: NodeJS.Timeout | null = null;

  constructor(private config: ShutdownConfig = {}) {
    const {
      timeout = 10000,  // 10 seconds
      forceExit = true
    } = config;

    this.setupSignalHandlers();
    this.setupErrorHandlers();
  }

  private setupSignalHandlers(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGHUP'];
    
    signals.forEach(signal => {
      process.on(signal as NodeJS.Signals, () => {
        this.handleShutdown(signal);
      });
    });
  }

  private setupErrorHandlers(): void {
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.handleShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.handleShutdown('unhandledRejection');
    });
  }

  private async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log('Already shutting down, ignoring signal:', signal);
      return;
    }

    this.isShuttingDown = true;
    console.log(`Received ${signal}, starting graceful shutdown...`);

    if (this.config.onSignal) {
      this.config.onSignal(signal);
    }

    // Set timeout for force exit
    if (this.config.forceExit) {
      this.shutdownTimeout = setTimeout(() => {
        console.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, this.config.timeout);
    }

    try {
      if (this.config.onShutdown) {
        await this.config.onShutdown();
      }
      
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }
      
      console.log('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  public isShutting(): boolean {
    return this.isShuttingDown;
  }

  public forceExitNow(): void {
    console.log('Forcing immediate exit');
    process.exit(1);
  }
}

// Global graceful shutdown instance
let globalShutdown: GracefulShutdown | null = null;

export function setupGracefulShutdown(config: ShutdownConfig = {}): GracefulShutdown {
  globalShutdown = new GracefulShutdown(config);
  return globalShutdown;
}

export function getGracefulShutdown(): GracefulShutdown | null {
  return globalShutdown;
}

export function isShuttingDown(): boolean {
  return globalShutdown?.isShutting() || false;
}