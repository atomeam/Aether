/**
 * @aether/observability - Log Aggregation
 * 
 * Centralized logging system with log level filtering,
 * structured logging, and log aggregation capabilities.
 */

import type {
  LogEntry,
  LogLevel,
  LogFilter,
  LogAggregator,
} from './types';

// ============================================================================
// Log Level Priorities
// ============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ============================================================================
// Logger Implementation
// ============================================================================

export class Logger {
  private service: string;
  private minLevel: LogLevel;
  private aggregator: LogAggregator;
  private source?: string;

  constructor(
    service: string,
    aggregator: LogAggregator,
    minLevel: LogLevel = 'info',
    source?: string,
  ) {
    this.service = service;
    this.aggregator = aggregator;
    this.minLevel = minLevel;
    this.source = source;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    traceId?: string,
    spanId?: string,
  ): LogEntry {
    return {
      timestamp: Date.now(),
      level,
      message,
      context,
      traceId,
      spanId,
      service: this.service,
      source: this.source,
    };
  }

  debug(message: string, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    if (this.shouldLog('debug')) {
      const entry = this.createEntry('debug', message, context, traceId, spanId);
      this.aggregator.log(entry);
    }
  }

  info(message: string, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    if (this.shouldLog('info')) {
      const entry = this.createEntry('info', message, context, traceId, spanId);
      this.aggregator.log(entry);
    }
  }

  warn(message: string, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    if (this.shouldLog('warn')) {
      const entry = this.createEntry('warn', message, context, traceId, spanId);
      this.aggregator.log(entry);
    }
  }

  error(message: string, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    if (this.shouldLog('error')) {
      const entry = this.createEntry('error', message, context, traceId, spanId);
      this.aggregator.log(entry);
    }
  }

  fatal(message: string, context?: Record<string, any>, traceId?: string, spanId?: string): void {
    if (this.shouldLog('fatal')) {
      const entry = this.createEntry('fatal', message, context, traceId, spanId);
      this.aggregator.log(entry);
    }
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  getMinLevel(): LogLevel {
    return this.minLevel;
  }
}

// ============================================================================
// Log Aggregator Implementation
// ============================================================================

export class InMemoryLogAggregator implements LogAggregator {
  private entries: LogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 10000) {
    this.maxEntries = maxEntries;
  }

  log(entry: LogEntry): void {
    this.entries.push(entry);

    // Enforce max entries limit (FIFO)
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  query(filter: LogFilter): LogEntry[] {
    return this.entries.filter(entry => {
      // Filter by level
      if (filter.level && entry.level !== filter.level) {
        return false;
      }

      // Filter by service
      if (filter.service && entry.service !== filter.service) {
        return false;
      }

      // Filter by trace ID
      if (filter.traceId && entry.traceId !== filter.traceId) {
        return false;
      }

      // Filter by time range
      if (filter.startTime && entry.timestamp < filter.startTime) {
        return false;
      }

      if (filter.endTime && entry.timestamp > filter.endTime) {
        return false;
      }

      // Filter by message pattern
      if (filter.messagePattern) {
        const pattern = new RegExp(filter.messagePattern, 'i');
        if (!pattern.test(entry.message)) {
          return false;
        }
      }

      return true;
    });
  }

  clear(): void {
    this.entries = [];
  }

  getAll(): LogEntry[] {
    return [...this.entries];
  }

  getRecent(count: number): LogEntry[] {
    return this.entries.slice(-count);
  }

  getCount(): number {
    return this.entries.length;
  }

  setMaxEntries(maxEntries: number): void {
    this.maxEntries = maxEntries;
    // Trim entries if necessary
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }
}

// ============================================================================
// Global Aggregator and Logger
// ============================================================================

export const globalLogAggregator = new InMemoryLogAggregator();

export const globalLogger = new Logger('default-service', globalLogAggregator, 'info');

// Convenience functions for global logger
export function logDebug(message: string, context?: Record<string, any>): void {
  globalLogger.debug(message, context);
}

export function logInfo(message: string, context?: Record<string, any>): void {
  globalLogger.info(message, context);
}

export function logWarn(message: string, context?: Record<string, any>): void {
  globalLogger.warn(message, context);
}

export function logError(message: string, context?: Record<string, any>): void {
  globalLogger.error(message, context);
}

export function logFatal(message: string, context?: Record<string, any>): void {
  globalLogger.fatal(message, context);
}

export function queryLogs(filter: LogFilter): LogEntry[] {
  return globalLogAggregator.query(filter);
}

export function getAllLogs(): LogEntry[] {
  return globalLogAggregator.getAll();
}

export function clearLogs(): void {
  globalLogAggregator.clear();
}

// ============================================================================
// Structured Logging Helpers
// ============================================================================

export function createLogger(
  service: string,
  minLevel: LogLevel = 'info',
  source?: string,
): Logger {
  return new Logger(service, globalLogAggregator, minLevel, source);
}

export function withTraceContext(
  logger: Logger,
  traceId: string,
  spanId?: string,
): Logger {
  const wrappedLogger = new Logger(
    (logger as any).service,
    (logger as any).aggregator,
    (logger as any).minLevel,
    (logger as any).source,
  );

  // Override methods to include trace context
  wrappedLogger.debug = (message: string, context?: Record<string, any>) =>
    logger.debug(message, context, traceId, spanId);
  wrappedLogger.info = (message: string, context?: Record<string, any>) =>
    logger.info(message, context, traceId, spanId);
  wrappedLogger.warn = (message: string, context?: Record<string, any>) =>
    logger.warn(message, context, traceId, spanId);
  wrappedLogger.error = (message: string, context?: Record<string, any>) =>
    logger.error(message, context, traceId, spanId);
  wrappedLogger.fatal = (message: string, context?: Record<string, any>) =>
    logger.fatal(message, context, traceId, spanId);

  return wrappedLogger;
}

// ============================================================================
// Log Export Formats
// ============================================================================

export function exportLogsAsJSON(entries: LogEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function exportLogsAsText(entries: LogEntry[]): string {
  return entries
    .map(entry => {
      const timestamp = new Date(entry.timestamp).toISOString();
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const traceStr = entry.traceId ? ` [trace:${entry.traceId}]` : '';
      return `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.service}]${traceStr} ${entry.message}${contextStr}`;
    })
    .join('\n');
}

export function exportLogsAsCSV(entries: LogEntry[]): string {
  const headers = ['timestamp', 'level', 'service', 'traceId', 'spanId', 'message', 'context'];
  const rows = entries.map(entry => {
    const contextStr = entry.context ? JSON.stringify(entry.context).replace(/"/g, '""') : '';
    return [
      new Date(entry.timestamp).toISOString(),
      entry.level,
      entry.service,
      entry.traceId || '',
      entry.spanId || '',
      `"${entry.message.replace(/"/g, '""')}"`,
      `"${contextStr}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
