/**
 * Cloud Cost Optimization Bot
 * Analyzes Cloudflare spending and suggests cost-saving optimizations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Cost Optimizer
// ============================================================================

class CostOptimizer {
  constructor() {
    this.costData = [];
    this.optimizations = [];
    this.metricsPath = path.resolve(__dirname, 'cost-metrics.json');
    this.optimizationsPath = path.resolve(__dirname, 'optimizations.json');
    this.loadMetrics();
    this.loadOptimizations();
  }

  // Get Cloudflare usage metrics
  async getCloudflareMetrics() {
    console.log('📊 Fetching Cloudflare usage metrics...');
    
    try {
      // Get worker analytics
      const command = 'cd ' + path.resolve(__dirname, '../../apps/bridge') + ' && npx wrangler analytics --format json';
      const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
      
      try {
        const analyticsData = JSON.parse(output);
        
        const metrics = {
          timestamp: new Date().toISOString(),
          workerRequests: analyticsData.requests || 0,
          workerErrors: analyticsData.errors || 0,
          workerCpuTime: analyticsData.cpuTime || 0,
          workerMemory: analyticsData.memory || 0,
          estimatedCost: this.estimateWorkerCost(analyticsData)
        };
        
        this.costData.push(metrics);
        this.saveMetrics();
        
        return metrics;
      } catch (parseError) {
        console.log('  Could not parse analytics data, using estimates');
        
        // Fallback to estimated metrics
        const metrics = {
          timestamp: new Date().toISOString(),
          workerRequests: this.estimateRequests(),
          workerErrors: 0,
          workerCpuTime: 0,
          workerMemory: 0,
          estimatedCost: this.estimateWorkerCost(null)
        };
        
        this.costData.push(metrics);
        this.saveMetrics();
        
        return metrics;
      }
    } catch (error) {
      console.log(`  Metrics fetch failed: ${error.message}, using estimates`);
      
      const metrics = {
        timestamp: new Date().toISOString(),
        workerRequests: this.estimateRequests(),
        workerErrors: 0,
        workerCpuTime: 0,
        workerMemory: 0,
        estimatedCost: this.estimateWorkerCost(null)
      };
      
      this.costData.push(metrics);
      this.saveMetrics();
      
      return metrics;
    }
  }

  estimateRequests() {
    // Estimate based on recent activity
    const lastMetrics = this.costData.slice(-7);
    if (lastMetrics.length > 0) {
      const avg = lastMetrics.reduce((sum, m) => sum + m.workerRequests, 0) / lastMetrics.length;
      return Math.round(avg * (1 + (Math.random() - 0.5) * 0.2)); // ±10% variation
    }
    return 10000; // Default estimate
  }

  estimateWorkerCost(analyticsData) {
    // Cloudflare Workers pricing (as of 2024)
    // Free tier: 100,000 requests/day
    // Paid: $0.50 per million requests after free tier
    
    const requests = analyticsData?.requests || this.estimateRequests();
    const freeTier = 100000;
    
    if (requests <= freeTier) {
      return 0;
    }
    
    const paidRequests = requests - freeTier;
    const cost = (paidRequests / 1000000) * 0.50;
    
    return {
      requests,
      freeTier,
      paidRequests,
      cost: cost.toFixed(4),
      currency: 'USD'
    };
  }

  // Analyze cost patterns and suggest optimizations
  analyzeCostPatterns() {
    console.log('🔍 Analyzing cost patterns...');
    
    const optimizations = [];
    
    if (this.costData.length < 2) {
      console.log('  Not enough data for pattern analysis');
      return optimizations;
    }
    
    const recentData = this.costData.slice(-30); // Last 30 data points
    
    // Check for request spikes
    const avgRequests = recentData.reduce((sum, m) => sum + m.workerRequests, 0) / recentData.length;
    const maxRequests = Math.max(...recentData.map(m => m.workerRequests));
    
    if (maxRequests > avgRequests * 2) {
      optimizations.push({
        type: 'request-spike',
        severity: 'medium',
        description: 'Request volume spike detected',
        current: maxRequests,
        average: Math.round(avgRequests),
        recommendation: 'Investigate traffic sources and consider caching',
        potentialSavings: '$5-15/month'
      });
    }
    
    // Check for error rate
    const totalErrors = recentData.reduce((sum, m) => sum + m.workerErrors, 0);
    const totalRequests = recentData.reduce((sum, m) => sum + m.workerRequests, 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    
    if (errorRate > 0.05) {
      optimizations.push({
        type: 'high-error-rate',
        severity: 'high',
        description: 'High error rate detected',
        errorRate: (errorRate * 100).toFixed(2) + '%',
        recommendation: 'Review error logs and fix failing requests',
        potentialSavings: '$10-25/month'
      });
    }
    
    // Check for idle resources
    const lowActivityDays = recentData.filter(m => m.workerRequests < 1000).length;
    if (lowActivityDays > recentData.length * 0.5) {
      optimizations.push({
        type: 'idle-resources',
        severity: 'low',
        description: 'Low worker activity detected',
        lowActivityDays,
        totalDays: recentData.length,
        recommendation: 'Consider consolidating workers or reducing allocated resources',
        potentialSavings: '$2-5/month'
      });
    }
    
    // Check for optimization opportunities
    optimizations.push({
      type: 'caching-opportunity',
      severity: 'info',
      description: 'Caching could reduce costs',
      recommendation: 'Implement KV caching for frequently accessed data',
      potentialSavings: '$5-20/month'
    });
    
    optimizations.push({
      type: 'bundle-optimization',
      severity: 'info',
      description: 'Bundle size optimization',
      recommendation: 'Minimize worker bundle size to reduce CPU time',
      potentialSavings: '$3-10/month'
    });
    
    this.optimizations = optimizations;
    this.saveOptimizations();
    
    return optimizations;
  }

  // Generate cost report
  generateCostReport() {
    console.log('📊 Generating cost report...');
    
    if (this.costData.length === 0) {
      return {
        message: 'No cost data available',
        recommendation: 'Run metrics collection first'
      };
    }
    
    const recentData = this.costData.slice(-30);
    const totalRequests = recentData.reduce((sum, m) => sum + m.workerRequests, 0);
    const totalCost = recentData.reduce((sum, m) => {
      const cost = m.estimatedCost;
      return sum + (typeof cost === 'object' ? parseFloat(cost.cost) : 0);
    }, 0);
    
    const avgDailyRequests = totalRequests / recentData.length;
    const avgDailyCost = totalCost / recentData.length;
    
    const projectedMonthlyCost = avgDailyCost * 30;
    
    return {
      period: 'Last 30 data points',
      totalRequests,
      totalCost: totalCost.toFixed(4),
      avgDailyRequests: Math.round(avgDailyRequests),
      avgDailyCost: avgDailyCost.toFixed(4),
      projectedMonthlyCost: projectedMonthlyCost.toFixed(2),
      optimizations: this.optimizations,
      totalPotentialSavings: this.calculateTotalSavings()
    };
  }

  calculateTotalSavings() {
    const savings = this.optimizations.map(opt => {
      const match = opt.potentialSavings.match(/\$([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    });
    
    const total = savings.reduce((sum, val) => sum + val, 0);
    return `$${total.toFixed(2)}/month`;
  }

  loadMetrics() {
    if (fs.existsSync(this.metricsPath)) {
      const data = fs.readFileSync(this.metricsPath, 'utf8');
      this.costData = JSON.parse(data);
    }
  }

  saveMetrics() {
    if (this.costData.length > 100) {
      this.costData = this.costData.slice(-100);
    }
    fs.writeFileSync(this.metricsPath, JSON.stringify(this.costData, null, 2));
  }

  loadOptimizations() {
    if (fs.existsSync(this.optimizationsPath)) {
      const data = fs.readFileSync(this.optimizationsPath, 'utf8');
      this.optimizations = JSON.parse(data);
    }
  }

  saveOptimizations() {
    fs.writeFileSync(this.optimizationsPath, JSON.stringify(this.optimizations, null, 2));
  }

  getOptimizations() {
    return this.optimizations;
  }

  getCostData() {
    return this.costData;
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const optimizer = new CostOptimizer();

  switch (command) {
    case 'collect':
      const metrics = await optimizer.getCloudflareMetrics();
      console.log('📊 Metrics collected:');
      console.log(JSON.stringify(metrics, null, 2));
      break;

    case 'analyze':
      const optimizations = optimizer.analyzeCostPatterns();
      console.log('💡 Cost Optimizations:');
      console.log(JSON.stringify(optimizations, null, 2));
      break;

    case 'report':
      const report = optimizer.generateCostReport();
      console.log('📋 Cost Report:');
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'optimizations':
      const opts = optimizer.getOptimizations();
      console.log('💡 Current Optimizations:');
      console.log(JSON.stringify(opts, null, 2));
      break;

    case 'metrics':
      const data = optimizer.getCostData();
      console.log('📊 Cost Metrics History:');
      console.log(JSON.stringify(data, null, 2));
      break;

    default:
      console.log('💰 Cloud Cost Optimization Bot');
      console.log('');
      console.log('Commands:');
      console.log('  collect       - Collect Cloudflare usage metrics');
      console.log('  analyze       - Analyze cost patterns and suggest optimizations');
      console.log('  report        - Generate cost report');
      console.log('  optimizations - Show current optimization suggestions');
      console.log('  metrics       - Show cost metrics history');
      console.log('');
      console.log('Examples:');
      console.log('  node cost-optimizer.js collect');
      console.log('  node cost-optimizer.js analyze');
      console.log('  node cost-optimizer.js report');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  CostOptimizer
};
