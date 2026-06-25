/**
 * @aether/social - Social Analytics Module
 * 
 * Social media analytics functionality to track and analyze social media performance
 * including shares, clicks, impressions, engagement, and follower metrics.
 */

import type {
  OAuthProvider,
  SharePlatform,
  AnalyticsMetric,
  AnalyticsPeriod,
  AnalyticsData,
  AnalyticsQuery,
  AnalyticsReport,
  AnalyticsSummary,
  SocialPostAnalytics
} from './types.js';

// ============================================================================
// Analytics Data Store
// ============================================================================

interface AnalyticsEntry {
  provider: OAuthProvider;
  metric: AnalyticsMetric;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

class AnalyticsStore {
  private data: AnalyticsEntry[] = [];
  private postAnalytics: Map<string, SocialPostAnalytics> = new Map();

  /**
   * Add analytics data point
   */
  add(entry: AnalyticsEntry): void {
    this.data.push(entry);
  }

  /**
   * Add multiple analytics data points
   */
  addBatch(entries: AnalyticsEntry[]): void {
    this.data.push(...entries);
  }

  /**
   * Query analytics data
   */
  query(query: AnalyticsQuery): AnalyticsData[] {
    return this.data
      .filter(entry => {
        if (entry.provider !== query.provider) return false;
        if (!query.metrics.includes(entry.metric)) return false;
        if (entry.timestamp < query.startDate) return false;
        if (entry.timestamp > query.endDate) return false;
        return true;
      })
      .map(entry => ({
        provider: entry.provider,
        metric: entry.metric,
        value: entry.value,
        period: query.period,
        timestamp: entry.timestamp
      }));
  }

  /**
   * Get latest value for a metric
   */
  getLatest(provider: OAuthProvider, metric: AnalyticsMetric): AnalyticsEntry | undefined {
    const entries = this.data
      .filter(e => e.provider === provider && e.metric === metric)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return entries[0];
  }

  /**
   * Store post analytics
   */
  setPostAnalytics(postId: string, analytics: SocialPostAnalytics): void {
    this.postAnalytics.set(postId, analytics);
  }

  /**
   * Get post analytics
   */
  getPostAnalytics(postId: string): SocialPostAnalytics | undefined {
    return this.postAnalytics.get(postId);
  }

  /**
   * Get all post analytics
   */
  getAllPostAnalytics(): SocialPostAnalytics[] {
    return Array.from(this.postAnalytics.values());
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.data = [];
    this.postAnalytics.clear();
  }
}

// ============================================================================
// Social Analytics Manager Class
// ============================================================================

export class SocialAnalyticsManager {
  private store: AnalyticsStore;

  constructor() {
    this.store = new AnalyticsStore();
  }

  /**
   * Track a metric
   */
  trackMetric(
    provider: OAuthProvider,
    metric: AnalyticsMetric,
    value: number,
    timestamp: Date = new Date(),
    metadata?: Record<string, unknown>
  ): void {
    this.store.add({
      provider,
      metric,
      value,
      timestamp,
      metadata
    });
  }

  /**
   * Track multiple metrics at once
   */
  trackMetrics(entries: Array<{
    provider: OAuthProvider;
    metric: AnalyticsMetric;
    value: number;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
  }>): void {
    this.store.addBatch(
      entries.map(e => ({
        provider: e.provider,
        metric: e.metric,
        value: e.value,
        timestamp: e.timestamp || new Date(),
        metadata: e.metadata
      }))
    );
  }

  /**
   * Generate analytics report
   */
  generateReport(query: AnalyticsQuery): AnalyticsReport {
    const data = this.store.query(query);
    const summary = this.generateSummary(data, query);

    return {
      provider: query.provider,
      period: query.period,
      startDate: query.startDate,
      endDate: query.endDate,
      data,
      summary
    };
  }

  /**
   * Generate summary from analytics data
   */
  private generateSummary(data: AnalyticsData[], query: AnalyticsQuery): AnalyticsSummary {
    const summary: AnalyticsSummary = {};

    // Calculate totals for each metric
    const metricTotals: Record<AnalyticsMetric, number> = {} as any;
    const metricCounts: Record<AnalyticsMetric, number> = {} as any;

    for (const entry of data) {
      if (!metricTotals[entry.metric]) {
        metricTotals[entry.metric] = 0;
        metricCounts[entry.metric] = 0;
      }
      metricTotals[entry.metric] += entry.value;
      metricCounts[entry.metric]++;
    }

    // Map to summary fields
    if (metricTotals.shares) summary.totalShares = metricTotals.shares;
    if (metricTotals.clicks) summary.totalClicks = metricTotals.clicks;
    if (metricTotals.impressions) summary.totalImpressions = metricTotals.impressions;

    // Calculate average engagement rate
    if (metricTotals.engagement && metricCounts.engagement) {
      summary.averageEngagement = metricTotals.engagement / metricCounts.engagement;
    }

    // Calculate follower growth
    if (metricTotals.followers) {
      const followerEntries = data.filter(d => d.metric === 'followers');
      if (followerEntries.length >= 2) {
        const sorted = followerEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const first = sorted[0].value;
        const last = sorted[sorted.length - 1].value;
        summary.followerGrowth = last > 0 ? ((last - first) / first) * 100 : 0;
      }
    }

    // Get top performing content
    const postAnalytics = this.store.getAllPostAnalytics();
    const sortedPosts = postAnalytics
      .filter(p => p.platform === query.provider || p.platform === 'twitter') // Simplified mapping
      .sort((a, b) => b.shares - a.shares)
      .slice(0, 5);

    if (sortedPosts.length > 0) {
      summary.topPerformingContent = sortedPosts.map(p => ({
        url: p.url,
        shares: p.shares,
        clicks: p.clicks
      }));
    }

    return summary;
  }

  /**
   * Track post analytics
   */
  trackPostAnalytics(analytics: SocialPostAnalytics): void {
    this.store.setPostAnalytics(analytics.postId, analytics);

    // Also track individual metrics
    this.trackMetric(analytics.platform as OAuthProvider, 'shares', analytics.shares, analytics.publishedAt);
    this.trackMetric(analytics.platform as OAuthProvider, 'clicks', analytics.clicks, analytics.publishedAt);
    this.trackMetric(analytics.platform as OAuthProvider, 'impressions', analytics.impressions, analytics.publishedAt);
  }

  /**
   * Get post analytics
   */
  getPostAnalytics(postId: string): SocialPostAnalytics | undefined {
    return this.store.getPostAnalytics(postId);
  }

  /**
   * Get analytics for a time range
   */
  getTimeSeries(
    provider: OAuthProvider,
    metric: AnalyticsMetric,
    startDate: Date,
    endDate: Date,
    granularity: AnalyticsPeriod = 'daily'
  ): AnalyticsData[] {
    const query: AnalyticsQuery = {
      provider,
      metrics: [metric],
      period: granularity,
      startDate,
      endDate,
      granularity
    };

    return this.store.query(query);
  }

  /**
   * Compare metrics between two time periods
   */
  comparePeriods(
    provider: OAuthProvider,
    metric: AnalyticsMetric,
    period1: { start: Date; end: Date },
    period2: { start: Date; end: Date }
  ): { period1: number; period2: number; change: number; changePercent: number } {
    const data1 = this.getTimeSeries(provider, metric, period1.start, period1.end);
    const data2 = this.getTimeSeries(provider, metric, period2.start, period2.end);

    const sum1 = data1.reduce((acc, d) => acc + d.value, 0);
    const sum2 = data2.reduce((acc, d) => acc + d.value, 0);

    const change = sum2 - sum1;
    const changePercent = sum1 > 0 ? (change / sum1) * 100 : 0;

    return {
      period1: sum1,
      period2: sum2,
      change,
      changePercent
    };
  }

  /**
   * Get trending metrics
   */
  getTrendingMetrics(
    provider: OAuthProvider,
    limit: number = 5
  ): Array<{ metric: AnalyticsMetric; trend: 'up' | 'down' | 'stable'; change: number }> {
    const metrics: AnalyticsMetric[] = ['shares', 'clicks', 'impressions', 'engagement', 'followers'];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const trends = metrics.map(metric => {
      const comparison = this.comparePeriods(
        provider,
        metric,
        { start: twoWeeksAgo, end: weekAgo },
        { start: weekAgo, end: now }
      );

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (comparison.changePercent > 5) trend = 'up';
      if (comparison.changePercent < -5) trend = 'down';

      return {
        metric,
        trend,
        change: comparison.changePercent
      };
    });

    return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, limit);
  }

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(
    likes: number,
    comments: number,
    shares: number,
    impressions: number
  ): number {
    if (impressions === 0) return 0;
    return ((likes + comments + shares) / impressions) * 100;
  }

  /**
   * Get aggregate statistics for a provider
   */
  getProviderStats(provider: OAuthProvider, startDate: Date, endDate: Date): {
    totalShares: number;
    totalClicks: number;
    totalImpressions: number;
    averageEngagement: number;
    totalPosts: number;
  } {
    const shares = this.getTimeSeries(provider, 'shares', startDate, endDate);
    const clicks = this.getTimeSeries(provider, 'clicks', startDate, endDate);
    const impressions = this.getTimeSeries(provider, 'impressions', startDate, endDate);
    const engagement = this.getTimeSeries(provider, 'engagement', startDate, endDate);
    const posts = this.getTimeSeries(provider, 'posts', startDate, endDate);

    return {
      totalShares: shares.reduce((acc, d) => acc + d.value, 0),
      totalClicks: clicks.reduce((acc, d) => acc + d.value, 0),
      totalImpressions: impressions.reduce((acc, d) => acc + d.value, 0),
      averageEngagement: engagement.length > 0
        ? engagement.reduce((acc, d) => acc + d.value, 0) / engagement.length
        : 0,
      totalPosts: posts.reduce((acc, d) => acc + d.value, 0)
    };
  }

  /**
   * Export analytics data as CSV
   */
  exportToCSV(query: AnalyticsQuery): string {
    const data = this.store.query(query);
    
    const headers = ['Provider', 'Metric', 'Value', 'Period', 'Timestamp'];
    const rows = data.map(d => [
      d.provider,
      d.metric,
      d.value,
      d.period,
      d.timestamp.toISOString()
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Export analytics data as JSON
   */
  exportToJSON(query: AnalyticsQuery): string {
    const data = this.store.query(query);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.store.clear();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new social analytics manager instance
 */
export function createSocialAnalyticsManager(): SocialAnalyticsManager {
  return new SocialAnalyticsManager();
}

/**
 * Create a mock post analytics object
 */
export function createMockPostAnalytics(
  postId: string,
  platform: SharePlatform,
  url: string
): SocialPostAnalytics {
  return {
    postId,
    platform,
    url,
    shares: Math.floor(Math.random() * 1000),
    likes: Math.floor(Math.random() * 5000),
    comments: Math.floor(Math.random() * 500),
    clicks: Math.floor(Math.random() * 10000),
    impressions: Math.floor(Math.random() * 50000),
    engagementRate: Math.random() * 10,
    publishedAt: new Date()
  };
}

/**
 * Get available metrics
 */
export function getAvailableMetrics(): AnalyticsMetric[] {
  return ['shares', 'clicks', 'impressions', 'engagement', 'followers', 'following', 'posts', 'mentions', 'reach'];
}

/**
 * Get available periods
 */
export function getAvailablePeriods(): AnalyticsPeriod[] {
  return ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
}
