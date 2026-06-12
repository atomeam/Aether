/**
 * @aether/request-cancellation - Request Cancellation Support
 * 
 * Provides request cancellation support for Express applications.
 * Allows clients to cancel long-running requests.
 */

export interface CancellationConfig {
  enableAbortController?: boolean;
  cancellationHeader?: string;
}

export class RequestCancellation {
  private enableAbortController: boolean;
  private cancellationHeader: string;

  constructor(config: CancellationConfig = {}) {
    const {
      enableAbortController = true,
      cancellationHeader = 'X-Request-Cancel'
    } = config;

    this.enableAbortController = enableAbortController;
    this.cancellationHeader = cancellationHeader;
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      // Check for cancellation header
      const cancelHeader = req.headers[this.cancellationHeader.toLowerCase()];
      
      if (cancelHeader === 'true' || cancelHeader === '1') {
        return res.status(499).json({
          error: 'Request cancelled by client',
          message: 'The client cancelled the request'
        });
      }

      // Set up AbortController if enabled
      if (this.enableAbortController) {
        req.abortController = new AbortController();
        req.signal = req.abortController.signal;

        // Listen for client disconnect
        req.on('close', () => {
          if (!res.writableEnded) {
            req.abortController.abort();
          }
        });
      }

      next();
    };
  }

  cancelRequest(req: any): void {
    if (req.abortController) {
      req.abortController.abort();
    }
  }

  isCancelled(req: any): boolean {
    return req.signal?.aborted || false;
  }
}

// Global request cancellation instance
let globalRequestCancellation: RequestCancellation | null = null;

export function setupRequestCancellation(config?: CancellationConfig): RequestCancellation {
  globalRequestCancellation = new RequestCancellation(config);
  return globalRequestCancellation;
}

export function getRequestCancellation(): RequestCancellation {
  if (!globalRequestCancellation) {
    globalRequestCancellation = new RequestCancellation();
  }
  return globalRequestCancellation;
}

// Express middleware
export function requestCancellation(config?: CancellationConfig) {
  const cancellation = setupRequestCancellation(config);
  return cancellation.middleware();
}