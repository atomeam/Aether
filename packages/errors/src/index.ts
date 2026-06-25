/**
 * AtoMind Error Catalog
 * Structured error codes for the entire platform
 */

export interface AetherError {
  code: string;
  message: string;
  module: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const ERROR_CODES = {
  // Build Errors
  AETHER_BUILD_001: { message: 'Invalid build request', module: 'build', severity: 'high' as const },
  AETHER_BUILD_002: { message: 'Curator rejected', module: 'build', severity: 'medium' as const },
  AETHER_BUILD_003: { message: 'Gemini API error', module: 'build', severity: 'high' as const },
  AETHER_BUILD_004: { message: 'Migration validation failed', module: 'build', severity: 'medium' as const },
  AETHER_BUILD_005: { message: 'Executor failure', module: 'build', severity: 'high' as const },

  // Auth Errors
  AETHER_AUTH_001: { message: 'Missing API key', module: 'auth', severity: 'medium' as const },
  AETHER_AUTH_002: { message: 'Invalid API key', module: 'auth', severity: 'high' as const },
  AETHER_AUTH_003: { message: 'Rate limited', module: 'auth', severity: 'low' as const },
  AETHER_AUTH_004: { message: 'Tier exceeded', module: 'auth', severity: 'medium' as const },

  // Database Errors
  AETHER_DB_001: { message: 'Query failed', module: 'database', severity: 'high' as const },
  AETHER_DB_002: { message: 'Table not found', module: 'database', severity: 'critical' as const },
  AETHER_DB_003: { message: 'Connection failed', module: 'database', severity: 'critical' as const },

  // Worker Errors
  AETHER_WORKER_001: { message: 'Binding not found', module: 'worker', severity: 'critical' as const },
  AETHER_WORKER_002: { message: 'Queue error', module: 'worker', severity: 'high' as const },
  AETHER_WORKER_003: { message: 'Cron error', module: 'worker', severity: 'medium' as const },

  // Gemini Errors
  AETHER_GEMINI_001: { message: 'Quota exceeded', module: 'gemini', severity: 'high' as const },
  AETHER_GEMINI_002: { message: 'Invalid response', module: 'gemini', severity: 'medium' as const },
  AETHER_GEMINI_003: { message: 'Timeout', module: 'gemini', severity: 'medium' as const },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export function createError(code: ErrorCode, details?: string): AetherError {
  const error = ERROR_CODES[code];
  return {
    code,
    message: details ? `${error.message}: ${details}` : error.message,
    module: error.module,
    severity: error.severity,
  };
}