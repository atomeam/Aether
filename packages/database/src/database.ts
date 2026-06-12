/**
 * Base database class with common functionality
 */

import type {
  IDatabase,
  DatabaseConfig,
  QueryResult,
  QueryOptions,
  TransactionOptions,
  HealthCheckResult,
  ConnectionInfo,
} from './types/index';
import type { ITransaction } from './types/index';
import { DatabaseConfigSchema } from './schemas';

export abstract class BaseDatabase implements IDatabase {
  protected config: DatabaseConfig;
  protected connected: boolean = false;
  protected connectionId: string;

  constructor(config: DatabaseConfig) {
    this.config = DatabaseConfigSchema.parse(config);
    this.connectionId = this.generateConnectionId();
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract query<T = unknown>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>;
  abstract query<T = unknown>(sql: string, params: unknown[], options?: QueryOptions): Promise<QueryResult<T>>;
  abstract beginTransaction(options?: TransactionOptions): Promise<ITransaction>;
  abstract getConnectionInfo(): ConnectionInfo[];
  abstract healthCheck(): Promise<HealthCheckResult>;

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): DatabaseConfig {
    return { ...this.config };
  }

  protected generateConnectionId(): string {
    return `${this.config.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      const dbError = error as Error & { code?: string; severity?: string };
      throw {
        ...error,
        code: dbError.code,
        severity: dbError.severity,
      };
    }
    throw new Error(String(error));
  }
}
