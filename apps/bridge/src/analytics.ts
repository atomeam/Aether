// Analytics logging for a-to-mind API monetization tracking

interface AnalyticsEnv {
  AETHER_ANALYTICS: D1Database;
}

interface RequestLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  ip_address: string;
  user_agent?: string;
  api_key_hash?: string;
  tier: string;
  error_message?: string;
}

interface RateLimitHit {
  id: string;
  timestamp: string;
  ip_address: string;
  endpoint: string;
  limit_type: string;
  current_usage: number;
  tier: string;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Log API request to analytics database
export async function logRequest(
  env: AnalyticsEnv,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress: string,
  userAgent?: string,
  apiKeyHash?: string,
  tier: string = 'free',
  errorMessage?: string
): Promise<void> {
  try {
    const log: RequestLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: ipAddress,
      user_agent: userAgent,
      api_key_hash: apiKeyHash,
      tier,
      error_message: errorMessage
    };

    await env.AETHER_ANALYTICS.prepare(
      `INSERT INTO requests (id, timestamp, endpoint, method, status_code, response_time_ms, ip_address, user_agent, api_key_hash, tier, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      log.id,
      log.timestamp,
      log.endpoint,
      log.method,
      log.status_code,
      log.response_time_ms,
      log.ip_address,
      log.user_agent || null,
      log.api_key_hash || null,
      log.tier,
      log.error_message || null
    ).run();

    // Update user activity table
    await updateUserActivity(env, ipAddress, tier);
  } catch (error) {
    // Silently fail - don't break requests for analytics issues
    console.error('[Analytics] Failed to log request:', error);
  }
}

// Log rate limit hit (upgrade candidate)
export async function logRateLimitHit(
  env: AnalyticsEnv,
  ipAddress: string,
  endpoint: string,
  limitType: string,
  currentUsage: number,
  tier: string = 'free'
): Promise<void> {
  try {
    const hit: RateLimitHit = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ip_address: ipAddress,
      endpoint,
      limit_type: limitType,
      current_usage: currentUsage,
      tier
    };

    await env.AETHER_ANALYTICS.prepare(
      `INSERT INTO rate_limit_hits (id, timestamp, ip_address, endpoint, limit_type, current_usage, tier)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      hit.id,
      hit.timestamp,
      hit.ip_address,
      hit.endpoint,
      hit.limit_type,
      hit.current_usage,
      hit.tier
    ).run();
  } catch (error) {
    console.error('[Analytics] Failed to log rate limit hit:', error);
  }
}

// Update user activity for retention tracking
async function updateUserActivity(
  env: AnalyticsEnv,
  ipAddress: string,
  tier: string
): Promise<void> {
  try {
    // Check if user exists
    const existing = await env.AETHER_ANALYTICS.prepare(
      'SELECT total_requests FROM user_activity WHERE ip_address = ?'
    ).bind(ipAddress).first();

    if (existing) {
      // Update existing user
      await env.AETHER_ANALYTICS.prepare(
        'UPDATE user_activity SET last_seen = CURRENT_TIMESTAMP, total_requests = total_requests + 1, tier = ? WHERE ip_address = ?'
      ).bind(tier, ipAddress).run();
    } else {
      // Create new user
      await env.AETHER_ANALYTICS.prepare(
        'INSERT INTO user_activity (ip_address, first_seen, last_seen, total_requests, tier) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, ?)'
      ).bind(ipAddress, tier).run();
    }
  } catch (error) {
    console.error('[Analytics] Failed to update user activity:', error);
  }
}

// Get daily metrics for dashboard
export async function getDailyMetrics(
  env: AnalyticsEnv,
  date: string
): Promise<any> {
  try {
    const metrics = await env.AETHER_ANALYTICS.prepare(
      `SELECT endpoint, COUNT(*) as request_count, 
              COUNT(DISTINCT ip_address) as unique_users,
              AVG(response_time_ms) as avg_response_time_ms,
              SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as error_rate
       FROM requests 
       WHERE DATE(timestamp) = ?
       GROUP BY endpoint`
    ).bind(date).all();

    return metrics.results;
  } catch (error) {
    console.error('[Analytics] Failed to get daily metrics:', error);
    return [];
  }
}

// Get rate limit hits (upgrade candidates)
export async function getUpgradeCandidates(
  env: AnalyticsEnv,
  days: number = 7
): Promise<any> {
  try {
    const candidates = await env.AETHER_ANALYTICS.prepare(
      `SELECT ip_address, COUNT(*) as hit_count, 
              MAX(current_usage) as max_usage,
              endpoint
       FROM rate_limit_hits 
       WHERE timestamp > datetime('now', '-' || ? || ' days')
       GROUP BY ip_address, endpoint
       ORDER BY hit_count DESC
       LIMIT 50`
    ).bind(days).all();

    return candidates.results;
  } catch (error) {
    console.error('[Analytics] Failed to get upgrade candidates:', error);
    return [];
  }
}
