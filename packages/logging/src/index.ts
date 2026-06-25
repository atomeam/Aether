/**
 * @aether/logging - Logging Utilities
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export class Logger {
  private transports: Array<(entry: LogEntry) => void> = [];
  private filters: Array<(entry: LogEntry) => boolean> = [];
  private context: Record<string, any> = {};
  private minLevel: LogLevel = LogLevel.INFO;
  
  addTransport(transport: (entry: LogEntry) => void): void {
    this.transports.push(transport);
  }
  
  removeTransport(transport: (entry: LogEntry) => void): void {
    const idx = this.transports.indexOf(transport);
    if (idx !== -1) this.transports.splice(idx, 1);
  }
  
  addFilter(filter: (entry: LogEntry) => boolean): void {
    this.filters.push(filter);
  }
  
  removeFilter(filter: (entry: LogEntry) => boolean): void {
    const idx = this.filters.indexOf(filter);
    if (idx !== -1) this.filters.splice(idx, 1);
  }
  
  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }
  
  clearContext(): void {
    this.context = {};
  }
  
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }
  
  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) return;
    
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...context }
    };
    
    if (this.filters.every(filter => filter(entry))) {
      for (const transport of this.transports) {
        transport(entry);
      }
    }
  }
  
  child(context: Record<string, any>): Logger {
    const child = new Logger();
    child.transports = [...this.transports];
    child.filters = [...this.filters];
    child.context = { ...this.context, ...context };
    child.minLevel = this.minLevel;
    return child;
  }
}

export const logger = new Logger();

// Console transport
logger.addTransport(entry => {
  const levelName = LogLevel[entry.level];
  const timestamp = entry.timestamp.toISOString();
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  console.log(`[${timestamp}] [${levelName}] ${entry.message}${contextStr}`);
});

// Default min level
logger.setMinLevel(LogLevel.INFO);

export function createLogger(): Logger {
  return new Logger();
}