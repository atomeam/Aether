/**
 * @aether/retry-policy - Retry Policy
 */

export class RetryPolicy {
  async execute<T>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
    let lastError: Error;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    throw lastError!;
  }
}

export const retryPolicy = new RetryPolicy();