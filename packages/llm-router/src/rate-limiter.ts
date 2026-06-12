export class RateLimiter {
  private requestTimestamps: number[] = [];
  private tokenTimestamps: Array<{ tokens: number; timestamp: number }> = [];
  private maxRequestsPerMinute: number;
  private maxTokensPerMinute: number;

  constructor(
    maxRequestsPerMinute: number = 60,
    maxTokensPerMinute: number = 90000
  ) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.maxTokensPerMinute = maxTokensPerMinute;
  }

  canMakeRequest(tokens: number = 0): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    );
    this.tokenTimestamps = this.tokenTimestamps.filter(
      (item) => item.timestamp > oneMinuteAgo
    );

    // Check request limit
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      return false;
    }

    // Check token limit
    const tokensInMinute = this.tokenTimestamps.reduce(
      (sum, item) => sum + item.tokens,
      0
    );
    if (tokensInMinute + tokens > this.maxTokensPerMinute) {
      return false;
    }

    return true;
  }

  recordRequest(tokens: number = 0): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.tokenTimestamps.push({ tokens, timestamp: now });
  }

  getWaitTime(tokens: number = 0): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    );
    this.tokenTimestamps = this.tokenTimestamps.filter(
      (item) => item.timestamp > oneMinuteAgo
    );

    // Calculate wait time for requests
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      return oldestRequest + 60000 - now;
    }

    // Calculate wait time for tokens
    const tokensInMinute = this.tokenTimestamps.reduce(
      (sum, item) => sum + item.tokens,
      0
    );
    if (tokensInMinute + tokens > this.maxTokensPerMinute) {
      // Remove oldest tokens until we have space
      let tokensToRemove = tokensInMinute + tokens - this.maxTokensPerMinute;
      let i = 0;
      while (i < this.tokenTimestamps.length && tokensToRemove > 0) {
        tokensToRemove -= this.tokenTimestamps[i].tokens;
        i++;
      }
      if (i > 0) {
        const oldestTokens = this.tokenTimestamps[0];
        return oldestTokens.timestamp + 60000 - now;
      }
    }

    return 0;
  }

  reset(): void {
    this.requestTimestamps = [];
    this.tokenTimestamps = [];
  }

  getStats(): {
    requestsInMinute: number;
    tokensInMinute: number;
    requestLimit: number;
    tokenLimit: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    );
    this.tokenTimestamps = this.tokenTimestamps.filter(
      (item) => item.timestamp > oneMinuteAgo
    );

    const tokensInMinute = this.tokenTimestamps.reduce(
      (sum, item) => sum + item.tokens,
      0
    );

    return {
      requestsInMinute: this.requestTimestamps.length,
      tokensInMinute,
      requestLimit: this.maxRequestsPerMinute,
      tokenLimit: this.maxTokensPerMinute
    };
  }
}
