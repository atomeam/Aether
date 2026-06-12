/**
 * @aether/rate-limiter-simple - Simple Rate Limiter
 */

export class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  check(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < window);
    
    if (validTimestamps.length >= limit) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }
}

export const simpleRateLimiter = new SimpleRateLimiter();