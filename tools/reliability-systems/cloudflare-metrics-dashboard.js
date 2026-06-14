/**
 * Cloudflare-Native Metrics Dashboard
 * Uses Cloudflare KV for persistence instead of JSON files
 * Provides atomic operations and serverless compatibility
 */

const { persistence } = require('./cloudflare-persistence');

class CloudflareMetricsCollector {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.prefix = `metrics:${serviceName}:`;
    
    this.config = {
      maxTimings: 1000,
      maxAge: 3600000 // 1 hour
    };
    
    this.stats = {
      totalOperations: 0,
      totalSuccess: 0,
      totalFailure: 0,
      totalLatency: 0
    };
  }

  // Increment a counter
  async incrementCounter(name, value = 1, tags = {}) {
    const key = this.getCounterKey(name, tags);
    const current = await persistence.kvGet(key) || 0;
    const updated = current + value;
    await persistence.kvSet(key, updated);
  }

  // Set a gauge value
  async setGauge(name, value, tags = {}) {
    const key = this.getGaugeKey(name, tags);
    await persistence.kvSet(key, value);
  }

  // Record a timing
  async recordTiming(name, duration, tags = {}) {
    const key = this.getHistogramKey(name, tags);
    
    const histogram = await persistence.kvGet(key) || {
      count: 0,
      min: duration,
      max: duration,
      sum: duration,
      values: []
    };
    
    histogram.count++;
    histogram.min = Math.min(histogram.min, duration);
    histogram.max = Math.max(histogram.max, duration);
    histogram.sum += duration;
    histogram.values.push(duration);
    
    // Keep only last N values
    if (histogram.values.length > 100) {
      histogram.values.shift();
    }
    
    await persistence.kvSet(key, histogram);
    
    // Also add to timings array for dashboard
    const timingsKey = `${this.prefix}timings`;
    const timings = await persistence.kvGet(timingsKey) || [];
    
    timings.push({
      name,
      duration,
      tags,
      timestamp: Date.now()
    });
    
    if (timings.length > this.config.maxTimings) {
      timings.shift();
    }
    
    await persistence.kvSet(timingsKey, timings);
  }

  // Record operation
  async recordOperation(operation, success, latency, tags = {}) {
    this.stats.totalOperations++;
    
    if (success) {
      this.stats.totalSuccess++;
      await this.incrementCounter(`${operation}.success`, 1, tags);
    } else {
      this.stats.totalFailure++;
      await this.incrementCounter(`${operation}.failure`, 1, tags);
    }
    
    if (latency) {
      this.stats.totalLatency += latency;
      await this.recordTiming(`${operation}.latency`, latency, tags);
    }
    
    await this.updateStats();
  }

  // Get counter value
  async getCounter(name, tags = {}) {
    const key = this.getCounterKey(name, tags);
    return await persistence.kvGet(key) || 0;
  }

  // Get gauge value
  async getGauge(name, tags = {}) {
    const key = this.getGaugeKey(name, tags);
    return await persistence.kvGet(key) || 0;
  }

  // Get histogram statistics
  async getHistogram(name, tags = {}) {
    const key = this.getHistogramKey(name, tags);
    const histogram = await persistence.kvGet(key);
    
    if (!histogram) {
      return null;
    }
    
    const values = histogram.values;
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: histogram.count,
      min: histogram.min,
      max: histogram.max,
      avg: histogram.count > 0 ? (histogram.sum / histogram.count).toFixed(2) : 0,
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      p99: sorted[Math.floor(sorted.length * 0.99)] || 0
    };
  }

  // Get all metrics
  async getAllMetrics() {
    const timingsKey = `${this.prefix}timings`;
    const timings = await persistence.kvGet(timingsKey) || [];
    const statsKey = `${this.prefix}stats`;
    const storedStats = await persistence.kvGet(statsKey) || this.stats;
    
    // Get all counters
    const counterKeys = await persistence.kvList(`${this.prefix}counter:`);
    const counters = {};
    for (const key of counterKeys.keys) {
      counters[key.name.replace(this.prefix, '')] = await persistence.kvGet(key.name);
    }
    
    // Get all gauges
    const gaugeKeys = await persistence.kvList(`${this.prefix}gauge:`);
    const gauges = {};
    for (const key of gaugeKeys.keys) {
      gauges[key.name.replace(this.prefix, '')] = await persistence.kvGet(key.name);
    }
    
    // Get all histograms
    const histogramKeys = await persistence.kvList(`${this.prefix}histogram:`);
    const histograms = {};
    for (const key of histogramKeys.keys) {
      histograms[key.name.replace(this.prefix, '')] = await persistence.kvGet(key.name);
    }
    
    return {
      serviceName: this.serviceName,
      counters,
      gauges,
      histograms,
      timings: timings.slice(-100),
      stats: storedStats
    };
  }

  // Get dashboard data
  async getDashboardData() {
    const metrics = await this.getAllMetrics();
    
    return {
      serviceName: this.serviceName,
      timestamp: new Date().toISOString(),
      summary: {
        totalOperations: metrics.stats.totalOperations,
        successRate: metrics.stats.totalOperations > 0 
          ? (metrics.stats.totalSuccess / metrics.stats.totalOperations * 100).toFixed(2) 
          : 0,
        failureRate: metrics.stats.totalOperations > 0 
          ? (metrics.stats.totalFailure / metrics.stats.totalOperations * 100).toFixed(2) 
          : 0,
        avgLatency: metrics.stats.totalOperations > 0 
          ? (metrics.stats.totalLatency / metrics.stats.totalOperations).toFixed(2) 
          : 0
      },
      recentTimings: metrics.timings.slice(-20),
      topCounters: this.getTopCounters(metrics.counters, 10),
      topGauges: this.getTopGauges(metrics.gauges, 10),
      recentErrors: this.getRecentErrors(metrics.timings, 10)
    };
  }

  // Get top counters
  getTopCounters(counters, limit) {
    return Object.entries(counters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => ({ name, value }));
  }

  // Get top gauges
  getTopGauges(gauges, limit) {
    return Object.entries(gauges)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => ({ name, value }));
  }

  // Get recent errors
  getRecentErrors(timings, limit) {
    return timings
      .filter(t => t.duration > 1000)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Clear old metrics
  async clearOldMetrics(maxAgeMs = this.config.maxAge) {
    console.log(`🧹 Clearing metrics older than ${maxAgeMs}ms...`);
    
    const cutoffTime = Date.now() - maxAgeMs;
    const timingsKey = `${this.prefix}timings`;
    const timings = await persistence.kvGet(timingsKey) || [];
    
    const beforeSize = timings.length;
    const filteredTimings = timings.filter(t => t.timestamp > cutoffTime);
    
    await persistence.kvSet(timingsKey, filteredTimings);
    
    const cleared = beforeSize - filteredTimings.length;
    console.log(`🧹 Cleared ${cleared} old timing records`);
    
    return cleared;
  }

  // Reset metrics
  async resetMetrics() {
    console.log(`🔄 Resetting metrics for ${this.serviceName}`);
    
    // Delete all keys with this prefix
    const listed = await persistence.kvList(this.prefix);
    for (const key of listed.keys) {
      await persistence.kvDelete(key.name);
    }
    
    this.stats = {
      totalOperations: 0,
      totalSuccess: 0,
      totalFailure: 0,
      totalLatency: 0
    };
    
    await this.updateStats();
  }

  // Update statistics
  async updateStats() {
    const statsKey = `${this.prefix}stats`;
    await persistence.kvSet(statsKey, this.stats);
  }

  // Generate counter key
  getCounterKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${this.prefix}counter:${name}:${tagString}`;
  }

  // Generate gauge key
  getGaugeKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${this.prefix}gauge:${name}:${tagString}`;
  }

  // Generate histogram key
  getHistogramKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${this.prefix}histogram:${name}:${tagString}`;
  }
}

module.exports = {
  CloudflareMetricsCollector
};
