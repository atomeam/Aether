import { RetryConfig, JobResult } from '../types/job';

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', '503', '502', '429']
};

export function isRetryableError(error: Error, config: RetryConfig): boolean {
  const errorMessage = error.message;
  return config.retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError)
  );
}

export function isPermanentError(error: Error): boolean {
  const permanentErrorPatterns = [
    '401', // Unauthorized
    '403', // Forbidden
    '400', // Bad Request
    '404', // Not Found
    'authentication',
    'permission',
    'invalid input',
    'missing required'
  ];
  
  const errorMessage = error.message.toLowerCase();
  return permanentErrorPatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
}

export function isConfigurationError(error: Error): boolean {
  const configErrorPatterns = [
    'missing environment variable',
    'invalid configuration',
    'missing dependency',
    'config'
  ];
  
  const errorMessage = error.message.toLowerCase();
  return configErrorPatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig,
  logger?: any
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries) {
        if (logger) {
          logger.error('Max retries exceeded', { 
            attempt, 
            error: lastError.message 
          });
        }
        throw lastError;
      }

      if (isPermanentError(lastError)) {
        if (logger) {
          logger.error('Permanent error, not retrying', { 
            error: lastError.message 
          });
        }
        throw lastError;
      }

      if (isConfigurationError(lastError)) {
        if (logger) {
          logger.error('Configuration error, not retrying', { 
            error: lastError.message 
          });
        }
        throw lastError;
      }

      if (!isRetryableError(lastError, config)) {
        if (logger) {
          logger.error('Non-retryable error', { 
            error: lastError.message 
          });
        }
        throw lastError;
      }

      if (logger) {
        logger.warn('Retrying after error', { 
          attempt: attempt + 1, 
          maxRetries: config.maxRetries,
          delay,
          error: lastError.message 
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError!;
}

export function createJobResult(
  runId: string,
  status: 'started' | 'completed' | 'failed',
  startTime: Date,
  endTime?: Date,
  output?: unknown,
  error?: Error
): JobResult {
  const result: JobResult = {
    runId,
    status,
    startTime
  };

  if (endTime) {
    result.endTime = endTime;
    result.duration = endTime.getTime() - startTime.getTime();
  }

  if (output !== undefined) {
    result.output = output;
  }

  if (error) {
    result.error = error;
  }

  return result;
}
