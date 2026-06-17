export interface JobDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule?: string;  // cron expression
  timeout: number;    // milliseconds
  retries: number;
  handler: string;   // path to handler function
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  dependencies: string[];
  credentials: string[];
}

export interface JobContext {
  input: Record<string, unknown>;
  config: Record<string, unknown>;
  logger: any;
  runId: string;
}

export interface JobResult {
  runId: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  output?: unknown;
  error?: Error;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RunHistory {
  timestamp: string;
  workflow: string;
  run_id: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  trigger: 'scheduler' | 'manual' | 'webhook';
  duration_ms?: number;
  error?: string;
  output?: unknown;
}
