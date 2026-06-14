/**
 * Metrics + Dashboards System
 * Tracks latency, success rate, throughput, error rate with dashboard interface
 */

const fs = require('fs');
const path = require('path');

class MetricsCollector {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.metrics = {
      counters: new Map(),
      gauges: new Map(),
      histograms: new Map(),
      timings: []
    };
    
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
    
    this.dataPath = path.resolve(__dirname, `metrics-${serviceName}.json`);
    this.loadMetrics();
  }

  // Increment a counter
  incrementCounter(name, value = 1, tags = {}) {
    const key = this.getCounterKey(name, tags);
    const current = this.metrics.counters.get(key) || 0;
    this.metrics.counters.set(key, current + value);
    this.saveMetrics();
  }

  // Set a gauge value
  setGauge(name, value, tags = {}) {
    const key = this.getGaugeKey(name, tags);
    this.metrics.gauges.set(key, value);
    this.saveMetrics();
  }

  // Record a timing
  recordTiming(name, duration, tags = {}) {
    const key = this.getHistogramKey(name, tags);
    
    if (!this.metrics.histograms.has(key)) {
      this.metrics.histograms.set(key, {
        count: 0,
        min: duration,
        max: duration,
        sum: duration,
        values: []
      });
    }
    
    const histogram = this.metrics.histograms.get(key);
    histogram.count++;
    histogram.min = Math.min(histogram.min, duration);
    histogram.max = Math.max(histogram.max, duration);
    histogram.sum += duration;
    histogram.values.push(duration);
    
    // Keep only last N values
    if (histogram.values.length > 100) {
      histogram.values.shift();
    }
    
    // Also add to timings array for dashboard
    this.metrics.timings.push({
      name,
      duration,
      tags,
      timestamp: Date.now()
    });
    
    if (this.metrics.timings.length > this.config.maxTimings) {
      this.metrics.timings.shift();
    }
    
    this.saveMetrics();
  }

  // Record operation
  recordOperation(operation, success, latency, tags = {}) {
    this.stats.totalOperations++;
    
    if (success) {
      this.stats.totalSuccess++;
      this.incrementCounter(`${operation}.success`, 1, tags);
    } else {
      this.stats.totalFailure++;
      this.incrementCounter(`${operation}.failure`, 1, tags);
    }
    
    if (latency) {
      this.stats.totalLatency += latency;
      this.recordTiming(`${operation}.latency`, latency, tags);
    }
    
    this.saveMetrics();
  }

  // Get counter value
  getCounter(name, tags = {}) {
    const key = this.getCounterKey(name, tags);
    return this.metrics.counters.get(key) || 0;
  }

  // Get gauge value
  getGauge(name, tags = {}) {
    const key = this.getGaugeKey(name, tags);
    return this.metrics.gauges.get(key) || 0;
  }

  // Get histogram statistics
  getHistogram(name, tags = {}) {
    const key = this.getHistogramKey(name, tags);
    const histogram = this.metrics.histograms.get(key);
    
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
  getAllMetrics() {
    return {
      serviceName: this.serviceName,
      counters: Object.fromEntries(this.metrics.counters),
      gauges: Object.fromEntries(this.metrics.gauges),
      histograms: Object.fromEntries(this.metrics.histograms),
      timings: this.metrics.timings.slice(-100), // Last 100 timings
      stats: this.stats
    };
  }

  // Get dashboard data
  getDashboardData() {
    const metrics = this.getAllMetrics();
    
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
      .filter(t => t.duration > 1000) // Consider >1s as potential error
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Clear old metrics
  clearOldMetrics(maxAgeMs = this.config.maxAge) {
    console.log(`🧹 Clearing metrics older than ${maxAgeMs}ms...`);
    
    const cutoffTime = Date.now() - maxAgeMs;
    const beforeSize = this.metrics.timings.length;
    
    this.metrics.timings = this.metrics.timings.filter(t => t.timestamp > cutoffTime);
    
    const cleared = beforeSize - this.metrics.timings.length;
    console.log(`🧹 Cleared ${cleared} old timing records`);
    
    this.saveMetrics();
    
    return cleared;
  }

  // Reset metrics
  resetMetrics() {
    console.log(`🔄 Resetting metrics for ${this.serviceName}`);
    
    this.metrics = {
      counters: new Map(),
      gauges: new Map(),
      histograms: new Map(),
      timings: []
    };
    
    this.stats = {
      totalOperations: 0,
      totalSuccess: 0,
      totalFailure: 0,
      totalLatency: 0
    };
    
    this.saveMetrics();
  }

  // Generate counter key
  getCounterKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return tagString ? `${name}:${tagString}` : name;
  }

  // Generate gauge key
  getGaugeKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return tagString ? `${name}:${tagString}` : name;
  }

  // Generate histogram key
  getHistogramKey(name, tags) {
    const tagString = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return tagString ? `${name}:${tagString}` : name;
  }

  // Load metrics
  loadMetrics() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Reconstruct Maps from objects
      this.metrics.counters = new Map(Object.entries(parsed.counters || {}));
      this.metrics.gauges = new Map(Object.entries(parsed.gauges || {}));
      this.metrics.histograms = new Map(Object.entries(parsed.histograms || {}));
      this.metrics.timings = parsed.timings || [];
      this.stats = parsed.stats || this.stats;
    }
  }

  // Save metrics
  saveMetrics() {
    fs.writeFileSync(this.dataPath, JSON.stringify({
      counters: Object.fromEntries(this.metrics.counters),
      gauges: Object.fromEntries(this.metrics.gauges),
      histograms: Object.fromEntries(this.metrics.histograms),
      timings: this.metrics.timings,
      stats: this.stats
    }, null, 2));
  }
}

// Metrics Registry for managing multiple services
class MetricsRegistry {
  constructor() {
    this.collectors = new Map();
  }

  // Get or create metrics collector for a service
  getMetricsCollector(serviceName) {
    if (!this.collectors.has(serviceName)) {
      this.collectors.set(serviceName, new MetricsCollector(serviceName));
    }
    return this.collectors.get(serviceName);
  }

  // Get all dashboard data
  getAllDashboardData() {
    const dashboardData = {};
    
    this.collectors.forEach((collector, name) => {
      dashboardData[name] = collector.getDashboardData();
    });
    
    return dashboardData;
  }

  // Get all metrics
  getAllMetrics() {
    const allMetrics = {};
    
    this.collectors.forEach((collector, name) => {
      allMetrics[name] = collector.getAllMetrics();
    });
    
    return allMetrics;
  }

  // Reset all metrics
  resetAll() {
    this.collectors.forEach((collector) => collector.resetMetrics());
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const registry = new MetricsRegistry();

  switch (command) {
    case 'record':
      if (args[1] && args[2] && args[3]) {
        const collector = registry.getMetricsCollector(args[1]);
        const success = args[2] === 'true';
        const latency = parseFloat(args[3]);
        collector.recordOperation('test-operation', success, latency);
        console.log('📊 Operation recorded');
      } else {
        console.error('Usage: node metrics-dashboard.js record <service> <success> <latency>');
      }
      break;

    case 'dashboard':
      if (args[1]) {
        const collector = registry.getMetricsCollector(args[1]);
        const dashboard = collector.getDashboardData();
        console.log(`📊 Dashboard for ${args[1]}:`);
        console.log(JSON.stringify(dashboard, null, 2));
      } else {
        const allDashboards = registry.getAllDashboardData();
        console.log('📊 All Dashboards:');
        console.log(JSON.stringify(allDashboards, null, 2));
      }
      break;

    case 'metrics':
      if (args[1]) {
        const collector = registry.getMetricsCollector(args[1]);
        const metrics = collector.getAllMetrics();
        console.log(`📊 Metrics for ${args[1]}:`);
        console.log(JSON.stringify(metrics, null, 2));
      } else {
        const allMetrics = registry.getAllMetrics();
        console.log('📊 All Metrics:');
        console.log(JSON.stringify(allMetrics, null, 2));
      }
      break;

    case 'clear':
      if (args[1]) {
        const collector = registry.getMetricsCollector(args[1]);
        const cleared = collector.clearOldMetrics();
        console.log(`🧹 Cleared ${cleared} old metrics for ${args[1]}`);
      } else {
        console.error('Usage: node metrics-dashboard.js clear <service>');
      }
      break;

    case 'reset':
      if (args[1]) {
        const collector = registry.getMetricsCollector(args[1]);
        collector.resetMetrics();
        console.log(`🔄 Reset metrics for ${args[1]}`);
      } else {
        registry.resetAll();
        console.log('🔄 Reset all metrics');
      }
      break;

    default:
      console.log('📊 Metrics + Dashboards System');
      console.log('');
      console.log('Commands:');
      console.log('  record    - Record an operation');
      console.log('  dashboard - Get dashboard data');
      console.log('  metrics   - Get all metrics');
      console.log('  clear     - Clear old metrics');
      console.log('  reset     - Reset metrics');
      console.log('');
      console.log('Examples:');
      console.log('  node metrics-dashboard.js record my-service true 150');
      console.log('  node metrics-dashboard.js dashboard my-service');
      console.log('  node metrics-dashboard.js metrics my-service');
      console.log('  node metrics-dashboard.js clear my-service');
      console.log('  node metrics-dashboard.js reset my-service');
      console.log('');
      console.log('Programmatic Usage:');
      console.log('  const registry = new MetricsRegistry();');
      console.log('  const collector = registry.getMetricsCollector("my-service");');
      console.log('  collector.recordOperation("operation", true, 150);');
      console.log('  const dashboard = collector.getDashboardData();');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  MetricsCollector,
  MetricsRegistry
};
