/**
 * Revenue & Analytics Orchestrator
 * Coordinates all revenue and analytics systems
 */

const { RevenueTracker } = require('./revenue-tracker');
const { CustomerAnalytics } = require('./customer-analytics');
const { UnitEconomicsCalculator } = require('./unit-economics');
const { OperationalMetricsTracker } = require('./operational-tracker');
const { AutomationROIAnalyzer } = require('./automation-roi');
const { AIForecastingEngine } = require('./ai-forecasting');
const { RecommendationsEngine } = require('./recommendations');
const { UnifiedDashboardGenerator } = require('./dashboard');

class RevenueAnalyticsOrchestrator {
  constructor() {
    // Core systems
    this.revenueTracker = new RevenueTracker();
    this.customerAnalytics = new CustomerAnalytics();
    this.unitEconomics = new UnitEconomicsCalculator();
    this.operationalTracker = new OperationalMetricsTracker();
    this.automationROI = new AutomationROIAnalyzer();
    this.forecasting = new AIForecastingEngine();
    this.recommendations = new RecommendationsEngine();
    this.dashboard = new UnifiedDashboardGenerator();
    
    // Orchestrator state
    this.workflows = [];
    this.dataPath = __dirname + '/orchestrator-data.json';
    this.loadWorkflows();
  }

  // Run complete revenue analytics workflow
  async runCompleteWorkflow() {
    console.log('🚀 Running complete revenue analytics workflow...\n');
    
    const workflowId = this.generateWorkflowId();
    const startTime = Date.now();
    
    try {
      // Step 1: Get revenue data
      console.log('💰 Step 1: Getting revenue data...');
      const revenueData = this.revenueTracker.getRevenueSummary();
      console.log(`✅ MRR: $${revenueData.mrr.mrr}, ARR: $${revenueData.arr.arr}\n`);
      
      // Step 2: Get customer data
      console.log('👤 Step 2: Getting customer data...');
      const customerData = this.customerAnalytics.getCustomerSummary();
      console.log(`✅ Total customers: ${customerData.total}, Churn rate: ${customerData.churnRate}%\n`);
      
      // Step 3: Get unit economics
      console.log('💰 Step 3: Getting unit economics...');
      const unitEconomicsData = this.unitEconomics.getUnitEconomicsSummary();
      console.log(`✅ Overall CAC: $${unitEconomicsData.overallCAC.cac}\n`);
      
      // Step 4: Get operational metrics
      console.log('💸 Step 4: Getting operational metrics...');
      const operationalData = this.operationalTracker.getOperationalSummary(revenueData.mrr.mrr);
      console.log(`✅ Total costs: $${operationalData.totalCosts}\n`);
      
      // Step 5: Get automation ROI
      console.log('🤖 Step 5: Getting automation ROI...');
      const automationData = this.automationROI.getROISummary();
      console.log(`✅ Overall ROI: ${automationData.overallROI}%\n`);
      
      // Step 6: Generate forecasts
      console.log('🔮 Step 6: Generating AI forecasts...');
      const historicalRevenue = this.revenueTracker.revenue.map(r => ({
        timestamp: r.timestamp,
        amount: r.amount
      }));
      const revenueForecast = await this.forecasting.generateRevenueForecast(historicalRevenue, 12);
      console.log(`✅ Revenue forecast generated\n`);
      
      // Step 7: Generate recommendations
      console.log('💡 Step 7: Generating recommendations...');
      const recommendationsData = await this.recommendations.generateRecommendations({
        revenue: revenueData,
        customers: customerData,
        unitEconomics: unitEconomicsData,
        operations: operationalData,
        automation: automationData
      });
      console.log(`✅ ${recommendationsData.prioritizedActions.length} recommendations generated\n`);
      
      // Step 8: Generate unified dashboard
      console.log('📊 Step 8: Generating unified dashboard...');
      const dashboardData = await this.dashboard.generateDashboard({
        revenue: revenueData,
        customers: customerData,
        unitEconomics: unitEconomicsData,
        operations: operationalData,
        automation: automationData,
        forecasting: {
          revenue: revenueForecast,
          customers: null,
          metrics: null
        },
        recommendations: recommendationsData
      });
      console.log(`✅ Dashboard generated with ${dashboardData.alerts.length} alerts\n`);
      
      const workflowDuration = Date.now() - startTime;
      
      const workflow = {
        id: workflowId,
        timestamp: new Date().toISOString(),
        duration: workflowDuration,
        results: {
          mrr: revenueData.mrr.mrr,
          arr: revenueData.arr.arr,
          totalCustomers: customerData.total,
          churnRate: customerData.churnRate,
          averageLTV: customerData.averageLTV,
          cac: unitEconomicsData.overallCAC.cac,
          ltvcacRatio: unitEconomicsData.overallCAC.cac > 0 ? (customerData.averageLTV / unitEconomicsData.overallCAC.cac).toFixed(2) : 0,
          netProfit: operationalData.netProfit,
          automationROI: automationData.overallROI,
          recommendations: recommendationsData.prioritizedActions.length,
          alerts: dashboardData.alerts.length
        },
        status: 'completed'
      };
      
      this.workflows.push(workflow);
      this.saveWorkflows();
      
      console.log('🎉 Complete revenue analytics workflow finished!');
      console.log(`⏱️  Total time: ${workflowDuration}ms`);
      console.log(`💰 MRR: $${revenueData.mrr.mrr}`);
      console.log(`👥 Customers: ${customerData.total}`);
      console.log(`📉 Churn rate: ${customerData.churnRate}%`);
      console.log(`💵 LTV: $${customerData.averageLTV}`);
      console.log(`💸 CAC: $${unitEconomicsData.overallCAC.cac}`);
      console.log(`📊 LTV:CAC: ${workflow.results.ltvcacRatio}x`);
      console.log(`💵 Net profit: $${operationalData.netProfit}`);
      console.log(`🤖 Automation ROI: ${automationData.overallROI}%`);
      console.log(`💡 Recommendations: ${recommendationsData.prioritizedActions.length}`);
      console.log(`🚨 Alerts: ${dashboardData.alerts.length}`);
      
      return workflow;
    } catch (error) {
      console.error(`❌ Workflow failed: ${error.message}`);
      throw error;
    }
  }

  // Get unified analytics summary
  getUnifiedSummary() {
    const revenueData = this.revenueTracker.getRevenueSummary();
    const customerData = this.customerAnalytics.getCustomerSummary();
    const unitEconomicsData = this.unitEconomics.getUnitEconomicsSummary();
    const operationalData = this.operationalTracker.getOperationalSummary(revenueData.mrr.mrr);
    const automationData = this.automationROI.getROISummary();
    
    return {
      revenue: revenueData,
      customers: customerData,
      unitEconomics: unitEconomicsData,
      operations: operationalData,
      automation: automationData,
      totalWorkflows: this.workflows.length
    };
  }

  // Generate real-time dashboard
  async generateRealTimeDashboard() {
    const summary = this.getUnifiedSummary();
    
    const dashboard = await this.dashboard.generateDashboard({
      revenue: summary.revenue,
      customers: summary.customers,
      unitEconomics: summary.unitEconomics,
      operations: summary.operations,
      automation: summary.automation,
      forecasting: {},
      recommendations: { prioritizedActions: [] }
    });
    
    return dashboard;
  }

  // Generate workflow ID
  generateWorkflowId() {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load workflows
  loadWorkflows() {
    if (require('fs').existsSync(this.dataPath)) {
      const data = require('fs').readFileSync(this.dataPath, 'utf8');
      this.workflows = JSON.parse(data);
    }
  }

  // Save workflows
  saveWorkflows() {
    if (this.workflows.length > 50) {
      this.workflows = this.workflows.slice(-50);
    }
    require('fs').writeFileSync(this.dataPath, JSON.stringify(this.workflows, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const orchestrator = new RevenueAnalyticsOrchestrator();

  switch (command) {
    case 'run':
      const workflow = await orchestrator.runCompleteWorkflow();
      console.log('🚀 Complete Workflow:');
      console.log(JSON.stringify(workflow, null, 2));
      break;

    case 'summary':
      const summary = orchestrator.getUnifiedSummary();
      console.log('📊 Unified Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    case 'dashboard':
      const dashboard = await orchestrator.generateRealTimeDashboard();
      console.log('📊 Real-time Dashboard:');
      console.log(JSON.stringify(dashboard, null, 2));
      break;

    default:
      console.log('🚀 Revenue & Analytics Orchestrator');
      console.log('');
      console.log('Commands:');
      console.log('  run       - Run complete workflow');
      console.log('  summary   - Get unified summary');
      console.log('  dashboard - Generate real-time dashboard');
      console.log('');
      console.log('Examples:');
      console.log('  node orchestrator.js run');
      console.log('  node orchestrator.js summary');
      console.log('  node orchestrator.js dashboard');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  RevenueAnalyticsOrchestrator
};
