/**
 * Unified Dashboard Generator
 * Generates real-time dashboard with all metrics
 */

const fs = require('fs');
const path = require('path');

class UnifiedDashboardGenerator {
  constructor() {
    this.dashboardData = [];
    this.dataPath = path.resolve(__dirname, 'dashboard-data.json');
    this.loadDashboardData();
  }

  // Generate unified dashboard
  async generateDashboard(data) {
    console.log('📊 Generating unified dashboard...');
    
    const dashboard = {
      id: this.generateDashboardId(),
      timestamp: new Date().toISOString(),
      
      // Revenue metrics
      revenue: {
        mrr: data.revenue?.mrr || 0,
        arr: data.revenue?.arr || 0,
        revenueByProduct: data.revenue?.productRevenue || [],
        trends: data.revenue?.trends || [],
        nrr: data.revenue?.nrr || []
      },
      
      // Customer metrics
      customers: {
        total: data.customers?.total || 0,
        active: data.customers?.active || 0,
        churned: data.customers?.churned || 0,
        churnRate: data.customers?.churnRate || 0,
        averageLTV: data.customers?.averageLTV || 0,
        cohortAnalysis: data.customers?.cohortAnalysis || [],
        atRiskCustomers: data.customers?.atRiskCustomers || []
      },
      
      // Unit economics
      unitEconomics: {
        cac: data.unitEconomics?.overallCAC?.cac || 0,
        ltv: data.unitEconomics?.ltv || 0,
        ltvcacRatio: data.unitEconomics?.ltvcacRatio || 0,
        paybackPeriod: data.unitEconomics?.paybackPeriod || 0,
        grossMargin: data.unitEconomics?.grossMargin || 0,
        cacByChannel: data.unitEconomics?.cacByChannel || [],
        bestChannel: data.unitEconomics?.bestChannel || null
      },
      
      // Operational metrics
      operations: {
        totalCosts: data.operations?.totalCost || 0,
        categoryCosts: data.operations?.categoryCosts || [],
        netProfit: data.operations?.netProfit?.netProfit || 0,
        profitMargin: data.operations?.netProfit?.profitMargin || 0,
        burnRate: data.operations?.burnRate || [],
        runway: data.operations?.runway || null
      },
      
      // Automation ROI
      automation: {
        overallROI: data.automation?.overallROI || 0,
        totalCost: data.automation?.totalCost || 0,
        totalBenefit: data.automation?.totalBenefit || 0,
        timeSaved: data.automation?.timeSaved?.totalHours || 0,
        revenueGenerated: data.automation?.revenue?.total || 0,
        costSaved: data.automation?.costSavings?.total || 0,
        systems: data.automation?.systems || []
      },
      
      // Forecasting
      forecasting: {
        revenueForecast: data.forecasting?.revenue?.forecast || [],
        customerForecast: data.forecasting?.customers?.forecast || [],
        metricsForecast: data.forecasting?.metrics || []
      },
      
      // Recommendations
      recommendations: data.recommendations?.prioritizedActions || [],
      
      // Real-time alerts
      alerts: this.generateAlerts(data)
    };
    
    this.dashboardData.push(dashboard);
    this.saveDashboardData();
    
    return dashboard;
  }

  // Generate alerts
  generateAlerts(data) {
    const alerts = [];
    
    // Revenue alerts
    if (data.revenue?.trends) {
      const latestTrend = data.revenue.trends[data.revenue.trends.length - 1];
      
      if (parseFloat(latestTrend.growth) < -10) {
        alerts.push({
          type: 'critical',
          category: 'revenue',
          message: `Revenue declining by ${latestTrend.growth}%`,
          action: 'Investigate immediately'
        });
      }
    }
    
    // Customer alerts
    if (data.customers?.churnRate && parseFloat(data.customers.churnRate) > 10) {
      alerts.push({
        type: 'high',
        category: 'customers',
        message: `Churn rate is ${data.customers.churnRate}%`,
        action: 'Implement retention strategies'
      });
    }
    
    if (data.customers?.atRiskCustomers && data.customers.atRiskCustomers.length > 5) {
      alerts.push({
        type: 'high',
        category: 'customers',
        message: `${data.customers.atRiskCustomers.length} at-risk customers`,
        action: 'Reach out to at-risk customers'
      });
    }
    
    // Unit economics alerts
    if (data.unitEconomics?.ltvcacRatio && data.unitEconomics.ltvcacRatio < 1) {
      alerts.push({
        type: 'critical',
        category: 'unit-economics',
        message: `LTV:CAC ratio is ${data.unitEconomics.ltvcacRatio}`,
        action: 'Fix unit economics immediately'
      });
    }
    
    // Operational alerts
    if (data.operations?.netProfit?.profitMargin && parseFloat(data.operations.netProfit.profitMargin) < 0) {
      alerts.push({
        type: 'critical',
        category: 'operations',
        message: 'Profit margin is negative',
        action: 'Reduce costs or increase pricing'
      });
    }
    
    // Automation alerts
    if (data.automation?.overallROI && parseFloat(data.automation.overallROI) < 0) {
      alerts.push({
        type: 'high',
        category: 'automation',
        message: 'Automation ROI is negative',
        action: 'Review automation systems'
      });
    }
    
    return alerts;
  }

  // Generate dashboard HTML
  generateDashboardHTML(dashboard) {
    const d = dashboard;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Unified Revenue & Analytics Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .dashboard { max-width: 1400px; margin: 0 auto; }
    .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header h1 { color: #333; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h3 { color: #333; margin-bottom: 15px; font-size: 16px; }
    .metric { font-size: 32px; font-weight: bold; color: #333; margin-bottom: 5px; }
    .metric-label { color: #666; font-size: 14px; }
    .metric-change { font-size: 14px; }
    .metric-change.positive { color: #10b981; }
    .metric-change.negative { color: #ef4444; }
    .chart { height: 200px; background: #f9f9f9; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table th, .table td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    .table th { color: #666; font-weight: 600; font-size: 12px; }
    .table td { color: #333; font-size: 14px; }
    .alert { padding: 10px; border-radius: 4px; margin-bottom: 10px; font-size: 14px; }
    .alert.critical { background: #fee2e2; color: #dc2626; border-left: 4px solid #dc2626; }
    .alert.high { background: #fef3c7; color: #d97706; border-left: 4px solid #d97706; }
    .alert.medium { background: #eff6ff; color: #2563eb; border-left: 4px solid #2563eb; }
    .alert.low { background: #f3f4f6; color: #4b5563; border-left: 4px solid #4b5563; }
    .recommendation { padding: 10px; border-radius: 4px; margin-bottom: 10px; font-size: 14px; }
    .recommendation.critical { background: #fee2e2; color: #dc2626; }
    .recommendation.high { background: #fef3c7; color: #d97706; }
    .recommendation.medium { background: #eff6ff; color: #2563eb; }
    .recommendation.low { background: #f3f4f6; color: #4b5563; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge.critical { background: #dc2626; color: white; }
    .badge.high { background: #d97706; color: white; }
    .badge.medium { background: #2563eb; color: white; }
    .badge.low { background: #4b5563; color: white; }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>Unified Revenue & Analytics Dashboard</h1>
      <p>Last updated: ${d.timestamp}</p>
    </div>
    
    ${d.alerts.length > 0 ? `
    <div class="card">
      <h3>🚨 Alerts</h3>
      ${d.alerts.map(alert => `
        <div class="alert ${alert.type}">
          <strong>${alert.category}:</strong> ${alert.message} - ${alert.action}
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div class="grid">
      <div class="card">
        <h3>💰 MRR</h3>
        <div class="metric">$${d.revenue.mrr}</div>
        <div class="metric-label">Monthly Recurring Revenue</div>
      </div>
      
      <div class="card">
        <h3>📈 ARR</h3>
        <div class="metric">$${d.revenue.arr}</div>
        <div class="metric-label">Annual Recurring Revenue</div>
      </div>
      
      <div class="card">
        <h3>👥 Customers</h3>
        <div class="metric">${d.customers.total}</div>
        <div class="metric-label">Total Customers</div>
      </div>
      
      <div class="card">
        <h3>📉 Churn Rate</h3>
        <div class="metric">${d.customers.churnRate}%</div>
        <div class="metric-label">Monthly Churn</div>
      </div>
      
      <div class="card">
        <h3>💵 LTV</h3>
        <div class="metric">$${d.customers.averageLTV}</div>
        <div class="metric-label">Lifetime Value</div>
      </div>
      
      <div class="card">
        <h3>💸 CAC</h3>
        <div class="metric">$${d.unitEconomics.cac}</div>
        <div class="metric-label">Customer Acquisition Cost</div>
      </div>
      
      <div class="card">
        <h3>📊 LTV:CAC</h3>
        <div class="metric">${d.unitEconomics.ltvcacRatio}x</div>
        <div class="metric-label">Unit Economics Ratio</div>
      </div>
      
      <div class="card">
        <h3>⏱️  Payback Period</h3>
        <div class="metric">${d.unitEconomics.paybackPeriod} months</div>
        <div class="metric-label">Time to recover CAC</div>
      </div>
      
      <div class="card">
        <h3>💵 Net Profit</h3>
        <div class="metric">$${d.operations.netProfit}</div>
        <div class="metric-label">Monthly Net Profit</div>
      </div>
      
      <div class="card">
        <h3>📊 Profit Margin</h3>
        <div class="metric">${d.operations.profitMargin}%</div>
        <div class="metric-label">Net Profit Margin</div>
      </div>
      
      <div class="card">
        <h3>🤖 Automation ROI</h3>
        <div class="metric">${d.automation.overallROI}%</div>
        <div class="metric-label">Automation Return on Investment</div>
      </div>
    </div>
    
    <div class="grid">
      <div class="card" style="grid-column: span 2;">
        <h3>📈 Revenue Trend</h3>
        <div class="chart">Revenue trend chart (last 6 months)</div>
      </div>
      
      <div class="card">
        <h3>📊 Revenue by Product</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Revenue</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${d.revenue.revenueByProduct.slice(0, 5).map(p => `
              <tr>
                <td>${p.productId}</td>
                <td>$${p.revenue}</td>
                <td>${p.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="grid">
      <div class="card" style="grid-column: span 2;">
        <h3>💡 Recommendations</h3>
        ${d.recommendations.slice(0, 5).map(rec => `
          <div class="recommendation ${rec.priority}">
            <span class="badge ${rec.priority}">${rec.priority}</span>
            <strong>${rec.action}</strong> - ${rec.impact} (${rec.timeframe})
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <h3>📊 Unit Economics</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Gross Margin</td><td>${d.unitEconomics.grossMargin}%</td></tr>
            <tr><td>Best Channel</td><td>${d.unitEconomics.bestChannel?.channel || 'N/A'}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="grid">
      <div class="card" style="grid-column: span 2;">
        <h3>📊 Forecast</h3>
        <div class="chart">Revenue forecast chart (next 12 months)</div>
      </div>
      
      <div class="card">
        <h3>🤖 Automation Impact</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Time Saved</td><td>${d.automation.timeSaved} hours</td></tr>
            <tr><td>Revenue Generated</td><td>$${d.automation.revenueGenerated}</td></tr>
            <tr><td>Cost Saved</td><td>$${d.automation.costSaved}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  // Get dashboard data
  getDashboardData() {
    return this.dashboardData;
  }

  // Get latest dashboard
  getLatestDashboard() {
    return this.dashboardData[this.dashboardData.length - 1] || null;
  }

  // Generate dashboard ID
  generateDashboardId() {
    return `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load dashboard data
  loadDashboardData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.dashboardData = JSON.parse(data);
    }
  }

  // Save dashboard data
  saveDashboardData() {
    if (this.dashboardData.length > 100) {
      this.dashboardData = this.dashboardData.slice(-100);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.dashboardData, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const dashboard = new UnifiedDashboardGenerator();

  switch (command) {
    case 'generate':
      if (args[1]) {
        const data = JSON.parse(args[1]);
        const result = await dashboard.generateDashboard(data);
        console.log('📊 Generated Dashboard:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node dashboard.js generate <data-json>');
      }
      break;

    case 'html':
      const latest = dashboard.getLatestDashboard();
      if (latest) {
        const html = dashboard.generateDashboardHTML(latest);
        console.log('🌐 Dashboard HTML:');
        console.log(html);
      } else {
        console.error('No dashboard data available. Generate a dashboard first.');
      }
      break;

    case 'data':
      const data = dashboard.getDashboardData();
      console.log('📊 Dashboard Data:');
      console.log(JSON.stringify(data, null, 2));
      break;

    default:
      console.log('📊 Unified Dashboard Generator');
      console.log('');
      console.log('Commands:');
      console.log('  generate - Generate unified dashboard');
      console.log('  html     - Generate dashboard HTML');
      console.log('  data     - Get dashboard data');
      console.log('');
      console.log('Examples:');
      console.log('  node dashboard.js generate \'{"revenue":{}}\'');
      console.log('  node dashboard.js html');
      console.log('  node dashboard.js data');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  UnifiedDashboardGenerator
};
