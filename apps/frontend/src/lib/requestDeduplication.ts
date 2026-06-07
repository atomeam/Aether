/**
 * Request deduplication utility
 * Prevents concurrent requests to the same endpoint
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly ttl: number; // Time to live for pending requests in ms

  constructor(ttl: number = 5000) {
    this.ttl = ttl;
  }

  /**
   * Execute a request with deduplication
   * If a request to the same URL is already pending, return the existing promise
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if there's a pending request for this key
    const existing = this.pendingRequests.get(key);
    
    if (existing) {
      // Check if the pending request is still valid (within TTL)
      if (Date.now() - existing.timestamp < this.ttl) {
        console.log(`[RequestDedup] Reusing pending request for: ${key}`);
        return existing.promise;
      } else {
        // Request is stale, remove it
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = requestFn()
      .finally(() => {
        // Clean up after request completes
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, 100); // Small delay to allow concurrent requests to reuse
      });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Clear expired pending requests
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.pendingRequests.entries()) {
      if (now - value.timestamp >= this.ttl) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Helper function to create a deduplicated fetch request
 */
export async function deduplicatedFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const key = `${url}:${JSON.stringify(options || {})}`;
  return requestDeduplicator.execute(key, () => fetch(url, options).then(res => res.json()));
}
