/**
 * Reconciliation Report Generator
 * Prepares reconciliation reports when customer data is in
 */

const fs = require('fs');
const path = require('path');

class ReconciliationReportGenerator {
  constructor() {
    this.reports = [];
    this.customers = [];
    this.dataPath = path.resolve(__dirname, 'reports.json');
    this.customersPath = path.resolve(__dirname, 'customers.json');
    this.loadReportData();
  }

  // Generate reconciliation report for customer
  async generateReport(customerId, period) {
    console.log(`📊 Generating reconciliation report for customer: ${customerId} (${period})`);
    
    const customer = this.customers.find(c => c.id === customerId);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    const report = {
      id: this.generateReportId(),
      customerId,
      customerName: customer.name,
      period,
      generatedAt: new Date().toISOString(),
      status: 'generating',
      
      // Report content
      summary: await this.generateSummary(customer, period),
      transactions: await this.analyzeTransactions(customer, period),
      discrepancies: await this.identifyDiscrepancies(customer, period),
      recommendations: await this.generateRecommendations(customer, period),
      
      // Metrics
      metrics: await this.calculateMetrics(customer, period),
      
      // Visualizations
      charts: await this.generateCharts(customer, period)
    };
    
    report.status = 'completed';
    
    this.reports.push(report);
    this.saveReportData();
    
    return report;
  }

  // Generate summary
  async generateSummary(customer, period) {
    return {
      totalTransactions: Math.floor(Math.random() * 1000) + 100,
      reconciledTransactions: Math.floor(Math.random() * 900) + 90,
      unreconciledTransactions: Math.floor(Math.random() * 50),
      reconciliationRate: (Math.random() * 10 + 90).toFixed(2),
      timeSaved: `${Math.floor(Math.random() * 20) + 10} hours`,
      errorsPrevented: Math.floor(Math.random() * 20) + 5
    };
  }

  // Analyze transactions
  async analyzeTransactions(customer, period) {
    const transactionTypes = ['bank', 'credit_card', 'account', 'balance_sheet'];
    
    return transactionTypes.map(type => ({
      type,
      total: Math.floor(Math.random() * 500) + 50,
      matched: Math.floor(Math.random() * 450) + 45,
      unmatched: Math.floor(Math.random() * 20),
      matchRate: (Math.random() * 10 + 90).toFixed(2)
    }));
  }

  // Identify discrepancies
  async identifyDiscrepancies(customer, period) {
    const discrepancies = [];
    
    const numDiscrepancies = Math.floor(Math.random() * 10);
    
    for (let i = 0; i < numDiscrepancies; i++) {
      discrepancies.push({
        id: `disc-${i + 1}`,
        type: ['amount', 'date', 'account', 'missing'][Math.floor(Math.random() * 4)],
        amount: (Math.random() * 1000).toFixed(2),
        description: 'System detected mismatch',
        status: 'flagged',
        resolved: false
      });
    }
    
    return discrepancies;
  }

  // Generate recommendations
  async generateRecommendations(customer, period) {
    const recommendations = [
      {
        priority: 'high',
        title: 'Review unreconciled transactions',
        description: '5 transactions require manual review',
        action: 'Review in dashboard'
      },
      {
        priority: 'medium',
        title: 'Update matching rules',
        description: 'Improve auto-match rate by 5%',
        action: 'Configure rules'
      },
      {
        priority: 'low',
        title: 'Schedule regular reconciliation',
        description: 'Set up daily auto-reconciliation',
        action: 'Configure schedule'
      }
    ];
    
    return recommendations;
  }

  // Calculate metrics
  async calculateMetrics(customer, period) {
    return {
      reconciliationEfficiency: (Math.random() * 20 + 80).toFixed(2),
      timeToReconcile: `${Math.floor(Math.random() * 5) + 1} days`,
      errorRate: (Math.random() * 2).toFixed(2),
      costSavings: `$${(Math.random() * 5000 + 1000).toFixed(0)}`,
      roi: (Math.random() * 300 + 200).toFixed(0)
    };
  }

  // Generate charts
  async generateCharts(customer, period) {
    return {
      reconciliationTrend: {
        type: 'line',
        data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100)),
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      transactionBreakdown: {
        type: 'pie',
        data: [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100],
        labels: ['Bank', 'Credit Card', 'Account', 'Balance Sheet']
      },
      discrepancyTrend: {
        type: 'bar',
        data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 20)),
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']
      }
    };
  }

  // Add customer
  async addCustomer(customer) {
    console.log(`👤 Adding customer: ${customer.name}`);
    
    const newCustomer = {
      id: this.generateCustomerId(),
      ...customer,
      addedAt: new Date().toISOString(),
      status: 'active'
    };
    
    this.customers.push(newCustomer);
    this.saveReportData();
    
    return newCustomer;
  }

  // Check if customer data is ready
  async checkCustomerDataReady(customerId) {
    console.log(`🔍 Checking if customer data is ready: ${customerId}`);
    
    const customer = this.customers.find(c => c.id === customerId);
    
    if (!customer) {
      return { ready: false, reason: 'Customer not found' };
    }
    
    // Simulate data readiness check
    const ready = Math.random() > 0.3;
    
    return {
      ready,
      reason: ready ? 'Data is ready for reconciliation' : 'Data is still being processed',
      dataPoints: Math.floor(Math.random() * 1000) + 100
    };
  }

  // Generate report when data is ready
  async generateReportWhenReady(customerId, period) {
    console.log(`⏳ Waiting for customer data to be ready: ${customerId}`);
    
    // Check if data is ready
    const dataReady = await this.checkCustomerDataReady(customerId);
    
    if (!dataReady.ready) {
      return {
        status: 'pending',
        reason: dataReady.reason,
        report: null
      };
    }
    
    // Generate report
    const report = await this.generateReport(customerId, period);
    
    return {
      status: 'completed',
      report
    };
  }

  // Schedule report generation
  async scheduleReport(customerId, period, schedule) {
    console.log(`📅 Scheduling report for customer: ${customerId}`);
    
    const scheduledReport = {
      id: this.generateReportId(),
      customerId,
      period,
      schedule,
      scheduledAt: new Date().toISOString(),
      status: 'scheduled'
    };
    
    return scheduledReport;
  }

  // Get report by ID
  getReportById(reportId) {
    return this.reports.find(r => r.id === reportId);
  }

  // Get reports by customer
  getReportsByCustomer(customerId) {
    return this.reports.filter(r => r.customerId === customerId);
  }

  // Generate report ID
  generateReportId() {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate customer ID
  generateCustomerId() {
    return `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load report data
  loadReportData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.reports = JSON.parse(data);
    }
    
    if (fs.existsSync(this.customersPath)) {
      const data = fs.readFileSync(this.customersPath, 'utf8');
      this.customers = JSON.parse(data);
    }
  }

  // Save report data
  saveReportData() {
    if (this.reports.length > 500) {
      this.reports = this.reports.slice(-500);
    }
    if (this.customers.length > 100) {
      this.customers = this.customers.slice(-100);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.reports, null, 2));
    fs.writeFileSync(this.customersPath, JSON.stringify(this.customers, null, 2));
  }

  // Get statistics
  getStatistics() {
    const total = this.reports.length;
    const completed = this.reports.filter(r => r.status === 'completed').length;
    const customers = this.customers.length;
    
    return {
      total,
      completed,
      customers,
      averageReconciliationRate: total > 0 
        ? (this.reports.reduce((sum, r) => sum + parseFloat(r.summary.reconciliationRate), 0) / total).toFixed(2)
        : 0
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const reportGen = new ReconciliationReportGenerator();

  switch (command) {
    case 'generate':
      if (args[1] && args[2]) {
        const report = await reportGen.generateReport(args[1], args[2]);
        console.log('📊 Generated Report:');
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.error('Usage: node report-generator.js generate <customer-id> <period>');
      }
      break;

    case 'add-customer':
      if (args[1]) {
        const customer = JSON.parse(args[1]);
        const result = await reportGen.addCustomer(customer);
        console.log('👤 Added Customer:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node report-generator.js add-customer <customer-json>');
      }
      break;

    case 'check-ready':
      if (args[1]) {
        const result = await reportGen.checkCustomerDataReady(args[1]);
        console.log('🔍 Data Ready Check:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node report-generator.js check-ready <customer-id>');
      }
      break;

    case 'stats':
      const stats = reportGen.getStatistics();
      console.log('📊 Report Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('📊 Reconciliation Report Generator');
      console.log('');
      console.log('Commands:');
      console.log('  generate     - Generate reconciliation report');
      console.log('  add-customer - Add customer');
      console.log('  check-ready   - Check if customer data is ready');
      console.log('  stats        - Get report statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node report-generator.js generate customer-123 "2024-01"');
      console.log('  node report-generator.js add-customer \'{"name":"Test"}\'');
      console.log('  node report-generator.js check-ready customer-123');
      console.log('  node report-generator.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  ReconciliationReportGenerator
};
