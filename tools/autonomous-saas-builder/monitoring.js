/**
 * Performance Monitoring System
* Monitors deployed applications and generates insights
*/

const fs = require('fs');
const path = require('path');

class PerformanceMonitoring {
  constructor() {
    this.metrics = [];
    this.dataPath = path.resolve(__dirname, 'performance-metrics.json');
    this.loadMetrics();
  }

  // Collect performance metrics for deployed application
  async collectMetrics(deploymentId) {
    console.log(`📊 Collecting metrics for: ${deploymentId}`);
    
    const metrics = {
      deploymentId,
      timestamp: new Date().toISOString(),
      
      // Web vitals
      webVitals: {
        lcp: this.simulateMetric(1000, 3000), // Largest Contentful Paint
        fid: this.simulateMetric(50, 200),    // First Input Delay
        cls: this.simulateMetric(0, 0.1),    // Cumulative Layout Shift
        fcp: this.simulateMetric(800, 2000),  // First Contentful Paint
        ttfb: this.simulateMetric(100, 500)  // Time to First Byte
      },
      
      // User metrics
      userMetrics: {
        pageViews: this.simulateMetric(100, 10000),
        uniqueVisitors: this.simulateMetric(50, 5000),
        bounceRate: this.simulateMetric(20, 70),
        avgSessionDuration: this.simulateMetric(30, 300),
        conversionRate: this.simulateMetric(1, 10)
      },
      
      // Performance metrics
      performanceMetrics: {
        uptime: this.simulateMetric(95, 100),
        responseTime: this.simulateMetric(100, 1000),
        errorRate: this.simulateMetric(0, 5),
        throughput: this.simulateMetric(10, 1000)
      },
      
      // Business metrics
      businessMetrics: {
        mrr: this.simulateMetric(0, 10000),
        arr: this.simulateMetric(0, 100000),
        churnRate: this.simulateMetric(1, 10),
        ltv: this.simulateMetric(50, 500),
        cac: this.simulateMetric(20, 200)
      }
    };
    
    this.metrics.push(metrics);
    this.saveMetrics();
    
    return metrics;
  }

  // Simulate metric value (in production, use real analytics)
  simulateMetric(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  // Generate performance report
  generatePerformanceReport(deploymentId) {
    const deploymentMetrics = this.metrics.filter(m => m.deploymentId === deploymentId);
    
    if (deploymentMetrics.length === 0) {
      return { error: 'No metrics found for deployment' };
    }
    
    const latest = deploymentMetrics[deploymentMetrics.length - 1];
    const previous = deploymentMetrics[deploymentMetrics.length - 2] || latest;
    
    const report = {
      deploymentId,
      timestamp: new Date().toISOString(),
      current: latest,
      trends: this.calculateTrends(previous, latest),
      health: this.assessHealth(latest),
      recommendations: this.generateRecommendations(latest)
    };
    
    return report;
  }

  // Calculate trends between two metric sets
  calculateTrends(previous, current) {
    return {
      pageViews: this.calculateTrend(previous.userMetrics.pageViews, current.userMetrics.pageViews),
      conversionRate: this.calculateTrend(previous.userMetrics.conversionRate, current.userMetrics.conversionRate),
      bounceRate: this.calculateTrend(previous.userMetrics.bounceRate, current.userMetrics.bounceRate),
      mrr: this.calculateTrend(previous.businessMetrics.mrr, current.businessMetrics.mrr),
      uptime: this.calculateTrend(previous.performanceMetrics.uptime, current.performanceMetrics.uptime)
    };
  }

  // Calculate trend percentage
  calculateTrend(previous, current) {
    if (previous === 0) return 'N/A';
    const change = ((current - previous) / previous) * 100;
    return {
      change: change.toFixed(2),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }

  // Assess overall health
  assessHealth(metrics) {
    const healthScore = this.calculateHealthScore(metrics);
    
    let status = 'healthy';
    if (healthScore < 50) status = 'critical';
    else if (healthScore < 70) status = 'warning';
    
    return {
      score: healthScore,
      status,
      issues: this.identifyIssues(metrics)
    };
  }

  // Calculate health score (0-100)
  calculateHealthScore(metrics) {
    let score = 100;
    
    // Deduct for poor web vitals
    if (metrics.webVitals.lcp > 2500) score -= 10;
    if (metrics.webVitals.fid > 100) score -= 10;
    if (metrics.webVitals.cls > 0.1) score -= 10;
    
    // Deduct for poor user metrics
    if (metrics.userMetrics.bounceRate > 60) score -= 10;
    if (metrics.userMetrics.conversionRate < 2) score -= 10;
    
    // Deduct for poor performance
    if (metrics.performanceMetrics.uptime < 99) score -= 15;
    if (metrics.performanceMetrics.errorRate > 1) score -= 10;
    
    // Deduct for poor business metrics
    if (metrics.businessMetrics.churnRate > 5) score -= 10;
    
    return Math.max(0, score);
  }

  // Identify performance issues
  identifyIssues(metrics) {
    const issues = [];
    
    if (metrics.webVitals.lcp > 2500) {
      issues.push({
        severity: 'high',
        type: 'performance',
        message: 'LCP is slow (>2.5s)',
        recommendation: 'Optimize images and reduce JavaScript bundle size'
      });
    }
    
    if (metrics.performanceMetrics.uptime < 99) {
      issues.push({
        severity: 'critical',
        type: 'reliability',
        message: 'Uptime is below 99%',
        recommendation: 'Investigate server errors and implement failover'
      });
    }
    
    if (metrics.userMetrics.conversionRate < 2) {
      issues.push({
        severity: 'medium',
        type: 'conversion',
        message: 'Conversion rate is low (<2%)',
        recommendation: 'Improve onboarding and value proposition'
      });
    }
    
    if (metrics.businessMetrics.churnRate > 5) {
      issues.push({
        severity: 'high',
        type: 'retention',
        message: 'Churn rate is high (>5%)',
        recommendation: 'Improve product features and customer support'
      });
    }
    
    return issues;
  }

  // Generate optimization recommendations
  generateRecommendations(metrics) {
    const recommendations = [];
    
    // Performance recommendations
    if (metrics.webVitals.lcp > 2500) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        action: 'Optimize images and reduce bundle size',
        expectedImpact: 'Improve LCP by 30-50%'
      });
    }
    
    // Conversion recommendations
    if (metrics.userMetrics.conversionRate < 2) {
      recommendations.push({
        priority: 'high',
        category: 'conversion',
        action: 'Simplify onboarding flow',
        expectedImpact: 'Increase conversion by 20-40%'
      });
    }
    
    // Retention recommendations
    if (metrics.businessMetrics.churnRate > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'retention',
        action: 'Implement user onboarding emails',
        expectedImpact: 'Reduce churn by 15-25%'
      });
    }
    
    // Revenue recommendations
    if (metrics.businessMetrics.mrr < 1000) {
      recommendations.push({
        priority: 'medium',
        category: 'revenue',
        action: 'Add premium features or raise prices',
        expectedImpact: 'Increase MRR by 20-30%'
      });
    }
    
    return recommendations;
  }

  // Load metrics
  loadMetrics() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.metrics = JSON.parse(data);
    }
  }

  // Save metrics
  saveMetrics() {
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-500);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.metrics, null, 2));
  }

  // Get metrics
  getMetrics() {
    return this.metrics;
  }

  // Get metrics by deployment
  getMetricsByDeployment(deploymentId) {
    return this.metrics.filter(m => m.deploymentId === deploymentId);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const monitoring = new PerformanceMonitoring();

  switch (command) {
    case 'collect':
      if (args[1]) {
        const metrics = await monitoring.collectMetrics(args[1]);
        console.log('📊 Collected Metrics:');
        console.log(JSON.stringify(metrics, null, 2));
      } else {
        console.error('Usage: node monitoring.js collect <deployment-id>');
      }
      break;

    case 'report':
      if (args[1]) {
        const report = monitoring.generatePerformanceReport(args[1]);
        console.log('📋 Performance Report:');
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.error('Usage: node monitoring.js report <deployment-id>');
      }
      break;

    case 'list':
      const metrics = monitoring.getMetrics();
      console.log('📊 All Metrics:');
      console.log(JSON.stringify(metrics, null, 2));
      break;

    default:
      console.log('📊 Performance Monitoring System');
      console.log('');
      console.log('Commands:');
      console.log('  collect - Collect performance metrics');
      console.log('  report  - Generate performance report');
      console.log('  list    - List all metrics');
      console.log('');
      console.log('Examples:');
      console.log('  node monitoring.js collect deploy-123');
      console.log('  node monitoring.js report deploy-123');
      console.log('  node monitoring.js list');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  PerformanceMonitoring
};
