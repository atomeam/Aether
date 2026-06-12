/**
 * @aether/structured-logging - Structured Logging
 * 
 * Provides structured logging with JSON output.
 * Supports multiple log levels and contextual metadata.
 */

import fs from 'fs';
import path from 'path';

export interface LogConfig {
  level?: string;
  enableFileLogging?: boolean;
  logDirectory?: string;
  defaultMeta?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, any>;
}

export class StructuredLogger {
  private level: string;
  private enableFileLogging: boolean;
  private logDirectory: string;
  private defaultMeta: Record<string, any>;

  constructor(config: LogConfig = {}) {
    const {
      level = 'info',
      enableFileLogging = true,
      logDirectory = 'logs',
      defaultMeta = {}
    } = config;

    this.level = level;
    this.enableFileLogging = enableFileLogging;
    this.logDirectory = logDirectory;
    this.defaultMeta = defaultMeta;

    if (this.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    const currentLevelIndex = levels.indexOf(this.level);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex <= currentLevelIndex;
  }

  private formatLog(level: string, message: string, meta?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: { ...this.defaultMeta, ...meta }
    };
  }

  private log(level: string, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.formatLog(level, message, meta);
    const logLine = JSON.stringify(entry) + '\n';

    // Console output
    const colorCode = this.getColorCode(level);
    console.log(`${colorCode}${entry.timestamp} [${level.toUpperCase()}]: ${message}${this.resetColor()}`);
    if (entry.meta && Object.keys(entry.meta).length > 0) {
      console.log(JSON.stringify(entry.meta, null, 2));
    }

    // File output
    if (this.enableFileLogging) {
      const logFile = path.join(this.logDirectory, 'combined.log');
      fs.appendFileSync(logFile, logLine, 'utf8');

      if (level === 'error') {
        const errorFile = path.join(this.logDirectory, 'error.log');
        fs.appendFileSync(errorFile, logLine, 'utf8');
      }
    }
  }

  private getColorCode(level: string): string {
    const colors: Record<string, string> = {
      error: '\x1b[31m',    // Red
      warn: '\x1b[33m',     // Yellow
      info: '\x1b[36m',     // Cyan
      debug: '\x1b[35m',    // Magenta
      verbose: '\x1b[32m'   // Green
    };
    return colors[level] || '\x1b[0m';
  }

  private resetColor(): string {
    return '\x1b[0m';
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }

  verbose(message: string, meta?: Record<string, any>): void {
    this.log('verbose', message, meta);
  }

  child(defaultMeta: Record<string, any>): StructuredLogger {
    return new StructuredLogger({
      level: this.level,
      enableFileLogging: this.enableFileLogging,
      logDirectory: this.logDirectory,
      defaultMeta: { ...this.defaultMeta, ...defaultMeta }
    });
  }
}

// Global logger instance
let globalLogger: StructuredLogger | null = null;

export function setupLogger(config?: LogConfig): StructuredLogger {
  globalLogger = new StructuredLogger(config);
  return globalLogger;
}

export function getLogger(): StructuredLogger {
  if (!globalLogger) {
    globalLogger = new StructuredLogger();
  }
  return globalLogger;
}

export function logInfo(message: string, meta?: Record<string, any>): void {
  getLogger().info(message, meta);
}

export function logError(message: string, meta?: Record<string, any>): void {
  getLogger().error(message, meta);
}

export function logWarn(message: string, meta?: Record<string, any>): void {
  getLogger().warn(message, meta);
}

export function logDebug(message: string, meta?: Record<string, any>): void {
  getLogger().debug(message, meta);
}

// Express middleware for request logging
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logger = getLogger();
      
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
    });
    
    next();
  };
}