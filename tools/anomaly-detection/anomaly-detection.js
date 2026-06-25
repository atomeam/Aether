/**
 * AI-Powered Anomaly Detection
 * Detects unusual patterns in system metrics using statistical analysis
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Anomaly Detection Engine
// ============================================================================

class AnomalyDetector {
  constructor() {
    this.metrics = [];
    this.anomalies = [];
    this.thresholds = {
      responseTime: { warning: 1000, critical: 3000 },
      errorRate: { warning: 0.05, critical: 0.1 },
      cpuUsage: { warning: 0.7, critical: 0.9 },
      memoryUsage: { warning: 0.8, critical: 0.95 }
    };
    this.metricsPath = path.resolve(__dirname, 'metrics.json');
    this.anomaliesPath = path.resolve(__dirname, 'anomalies.json');
    this.loadMetrics();
    this.loadAnomalies();
  }

  // Statistical anomaly detection using Z-score
  calculateZScore(value, mean, stdDev) {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  calculateStatistics(data) {
    if (data.length === 0) return { mean: 0, stdDev: 0 };
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  }

  detectAnomaly(metricName, value, historicalData) {
    const stats = this.calculateStatistics(historicalData);
    const zScore = this.calculateZScore(value, stats.mean, stats.stdDev);
    
    // Z-score > 3 is typically considered anomalous
    const isAnomaly = Math.abs(zScore) > 3;
    
    // Also check against fixed thresholds
    const threshold = this.thresholds[metricName];
    let severity = 'normal';
    
    if (threshold) {
      if (value >= threshold.critical) {
        severity = 'critical';
      } else if (value >= threshold.warning) {
        severity = 'warning';
      }
    }
    
    if (isAnomaly && severity === 'normal') {
      severity = 'anomaly';
    }
    
    return {
      isAnomaly,
      severity,
      zScore,
      value,
      mean: stats.mean,
      stdDev: stats.stdDev,
      timestamp: new Date().toISOString()
    };
  }

  recordMetric(metricName, value, metadata = {}) {
    const metric = {
      name: metricName,
      value,
      timestamp: new Date().toISOString(),
      metadata
    };
    
    this.metrics.push(metric);
    this.saveMetrics();
    
    // Check for anomaly
    const historicalData = this.metrics
      .filter(m => m.name === metricName)
      .slice(-50) // Last 50 data points
      .map(m => m.value);
    
    if (historicalData.length > 10) {
      const anomaly = this.detectAnomaly(metricName, value, historicalData);
      
      if (anomaly.isAnomaly || anomaly.severity !== 'normal') {
        this.anomalies.push({
          ...anomaly,
          metricName,
          metadata
        });
        this.saveAnomalies();
        
        console.log(`🚨 Anomaly detected: ${metricName} = ${value} (Z-score: ${anomaly.zScore.toFixed(2)}, Severity: ${anomaly.severity})`);
      }
    }
    
    return metric;
  }

  loadMetrics() {
    if (fs.existsSync(this.metricsPath)) {
      const data = fs.readFileSync(this.metricsPath, 'utf8');
      this.metrics = JSON.parse(data);
    }
  }

  saveMetrics() {
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    fs.writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  loadAnomalies() {
    if (fs.existsSync(this.anomaliesPath)) {
      const data = fs.readFileSync(this.anomaliesPath, 'utf8');
      this.anomalies = JSON.parse(data);
    }
  }

  saveAnomalies() {
    // Keep only last 500 anomalies
    if (this.anomalies.length > 500) {
      this.anomalies = this.anomalies.slice(-500);
    }
    fs.writeFileSync(this.anomaliesPath, JSON.stringify(this.anomalies, null, 2));
  }

  getAnomalies(severity = null) {
    if (severity) {
      return this.anomalies.filter(a => a.severity === severity);
    }
    return this.anomalies;
  }

  getAnomalySummary() {
    const bySeverity = {
      normal: 0,
      warning: 0,
      critical: 0,
      anomaly: 0
    };
    
    const byMetric = {};
    
    this.anomalies.forEach(a => {
      bySeverity[a.severity]++;
      
      if (!byMetric[a.metricName]) {
        byMetric[a.metricName] = 0;
      }
      byMetric[a.metricName]++;
    });
    
    return {
      total: this.anomalies.length,
      bySeverity,
      byMetric,
      lastAnomaly: this.anomalies.length > 0 ? this.anomalies[this.anomalies.length - 1] : null
    };
  }

  // Simulate metrics for demo
  simulateMetrics() {
    const metrics = [
      { name: 'responseTime', base: 200, variance: 50 },
      { name: 'errorRate', base: 0.01, variance: 0.02 },
      { name: 'cpuUsage', base: 0.3, variance: 0.2 },
      { name: 'memoryUsage', base: 0.4, variance: 0.15 }
    ];
    
    metrics.forEach(metric => {
      // Generate random value with occasional spikes
      const spike = Math.random() > 0.95 ? metric.base * 3 : 0;
      const value = metric.base + (Math.random() - 0.5) * metric.variance * 2 + spike;
      
      this.recordMetric(metric.name, Math.max(0, value), {
        source: 'simulation'
      });
    });
  }

  clearAnomalies() {
    this.anomalies = [];
    this.saveAnomalies();
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const detector = new AnomalyDetector();

  switch (command) {
    case 'record':
      if (args[1] && args[2]) {
        const metricName = args[1];
        const value = parseFloat(args[2]);
        const metadata = args[3] ? JSON.parse(args[3]) : {};
        detector.recordMetric(metricName, value, metadata);
        console.log(`✅ Recorded metric: ${metricName} = ${value}`);
      } else {
        console.error('Usage: node anomaly-detection.js record <metric-name> <value> [metadata-json]');
      }
      break;

    case 'simulate':
      console.log('🎲 Simulating metrics...');
      for (let i = 0; i < 10; i++) {
        detector.simulateMetrics();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log('✅ Simulation complete');
      break;

    case 'anomalies':
      const severity = args[1];
      const anomalies = detector.getAnomalies(severity);
      console.log('🚨 Anomalies:');
      console.log(JSON.stringify(anomalies, null, 2));
      break;

    case 'summary':
      const summary = detector.getAnomalySummary();
      console.log('📊 Anomaly Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    case 'clear':
      detector.clearAnomalies();
      console.log('✅ Anomalies cleared');
      break;

    default:
      console.log('🔍 AI-Powered Anomaly Detection');
      console.log('');
      console.log('Commands:');
      console.log('  record        - Record a metric value');
      console.log('  simulate      - Simulate metrics for testing');
      console.log('  anomalies     - Show detected anomalies');
      console.log('  summary       - Show anomaly summary');
      console.log('  clear         - Clear anomaly history');
      console.log('');
      console.log('Examples:');
      console.log('  node anomaly-detection.js record responseTime 250');
      console.log('  node anomaly-detection.js simulate');
      console.log('  node anomaly-detection.js anomalies critical');
      console.log('  node anomaly-detection.js summary');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  AnomalyDetector
};
