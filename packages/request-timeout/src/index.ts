/**
 * @aether/request-timeout - Request Timeout Middleware
 * 
 * Provides request timeout handling for Express applications.
 * Aborts long-running requests after specified timeout.
 */

export interface TimeoutConfig {
  timeout?: number;        // Timeout in milliseconds
  onTimeout?: (req: any, res: any) => void;  // Timeout callback
}

export function requestTimeout(config: TimeoutConfig = {}) {
  const {
    timeout = 30000,  // 30 seconds default
    onTimeout
  } = config;

  return function (req: any, res: any, next: any) {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Request timeout exceeded',
          timeout
        });
      }
      
      if (onTimeout) {
        onTimeout(req, res);
      }
      
      req.destroy();
    }, timeout);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    // Clear timeout on error
    res.on('error', () => {
      clearTimeout(timeoutId);
    });

    // Clear timeout on close
    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
}

// Pre-configured timeouts
export const shortTimeout = requestTimeout({ timeout: 5000 });  // 5 seconds
export const mediumTimeout = requestTimeout({ timeout: 30000 });  // 30 seconds
export const longTimeout = requestTimeout({ timeout: 120000 });  // 2 minutes
export const extendedTimeout = requestTimeout({ timeout: 300000 });  // 5 minutes