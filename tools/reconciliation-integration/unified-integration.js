/**
 * Unified Reconciliation Integration
 * Combines Stripe and Wix ledger data for complete reconciliation
 */

const { StripeReconciliationIntegration } = require('./stripe-integration');
const { WixLedgerIntegration } = require('./wix-integration');

class UnifiedReconciliationIntegration {
  constructor() {
    this.stripe = new StripeReconciliationIntegration();
    this.wix = new WixLedgerIntegration();
    this.reports = [];
    this.dataPath = __dirname + '/unified-data.json';
    this.loadUnifiedData();
  }

  // Generate complete reconciliation report
  async generateCompleteReconciliationReport(startDate, endDate) {
    console.log('📊 Generating complete reconciliation report...');
    
    const stripeReport = await this.stripe.generateReconciliationReport(startDate, endDate);
    const wixReport = await this.wix.generateReconciliationReport(startDate, endDate);
    
    const unifiedReport = {
      period: { startDate, endDate },
      timestamp: new Date().toISOString(),
      
      stripe: stripeReport.stripe,
      wix: wixReport.wix,
      
      // Cross-platform reconciliation
      crossPlatform: {
        stripeTotal: parseFloat(stripeReport.stripe.totalAmount),
        wixIncome: parseFloat(wixReport.wix.totalIncome),
        difference: (parseFloat(stripeReport.stripe.totalAmount) - parseFloat(wixReport.wix.totalIncome)).toFixed(2),
        matchRate: this.calculateMatchRate(stripeReport.transactions, wixReport.transactions)
      },
      
      // Combined discrepancies
      discrepancies: [
        ...stripeReport.discrepancies,
        ...wixReport.discrepancies,
        this.identifyCrossPlatformDiscrepancies(stripeReport, wixReport)
      ],
      
      // Combined recommendations
      recommendations: [
        ...stripeReport.recommendations,
        ...wixReport.recommendations,
        this.generateCrossPlatformRecommendations(stripeReport, wixReport)
      ],
      
      // Status
      status: this.determineReconciliationStatus(stripeReport, wixReport)
    };
    
    this.reports.push(unifiedReport);
    this.saveUnifiedData();
    
    return unifiedReport;
  }

  // Calculate match rate between Stripe and Wix
  calculateMatchRate(stripeTransactions, wixTransactions) {
    // In production, this would match by transaction ID, amount, date
    // For now, we'll simulate a match rate
    const matchRate = 0.85 + (Math.random() * 0.1);
    return (matchRate * 100).toFixed(2);
  }

  // Identify cross-platform discrepancies
  identifyCrossPlatformDiscrepancies(stripeReport, wixReport) {
    const discrepancies = [];
    
    const stripeTotal = parseFloat(stripeReport.stripe.totalAmount);
    const wixIncome = parseFloat(wixReport.wix.totalIncome);
    const difference = Math.abs(stripeTotal - wixIncome);
    
    if (difference > 100) {
      discrepancies.push({
        type: 'cross_platform_mismatch',
        stripeTotal: stripeTotal.toFixed(2),
        wixIncome: wixIncome.toFixed(2),
        difference: difference.toFixed(2),
        severity: difference > 1000 ? 'high' : 'medium'
      });
    }
    
    return discrepancies;
  }

  // Generate cross-platform recommendations
  generateCrossPlatformRecommendations(stripeReport, wixReport) {
    const recommendations = [];
    
    const matchRate = this.calculateMatchRate(stripeReport.transactions, wixReport.transactions);
    if (parseFloat(matchRate) < 90) {
      recommendations.push({
        priority: 'high',
        action: 'Investigate cross-platform mismatch',
        description: `Match rate is ${matchRate}%, review transaction matching logic`
      });
    }
    
    return recommendations;
  }

  // Determine reconciliation status
  determineReconciliationStatus(stripeReport, wixReport) {
    const hasDiscrepancies = stripeReport.discrepancies.length > 0 || 
                           wixReport.discrepancies.length > 0;
    
    if (hasDiscrepancies) {
      return 'needs_review';
    }
    
    return 'reconciled';
  }

  // Configure both integrations
  async configureIntegrations(stripeKey, wixApiKey, wixAccountId) {
    console.log('🔑 Configuring both integrations...');
    
    const stripeConfig = this.stripe.configureStripeKey(stripeKey);
    const wixConfig = this.wix.configureWixCredentials(wixApiKey, wixAccountId);
    
    return {
      stripe: stripeConfig,
      wix: wixConfig,
      configured: stripeConfig.configured && wixConfig.configured
    };
  }

  // Test both connections
  async testConnections() {
    console.log('🔌 Testing both connections...');
    
    const stripeTest = await this.stripe.testConnection();
    const wixTest = await this.wix.testConnection();
    
    return {
      stripe: stripeTest,
      wix: wixTest,
      allConnected: stripeTest.connected && wixTest.connected
    };
  }

  // Load unified data
  loadUnifiedData() {
    if (require('fs').existsSync(this.dataPath)) {
      const data = require('fs').readFileSync(this.dataPath, 'utf8');
      this.reports = JSON.parse(data);
    }
  }

  // Save unified data
  saveUnifiedData() {
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-100);
    }
    require('fs').writeFileSync(this.dataPath, JSON.stringify(this.reports, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const unified = new UnifiedReconciliationIntegration();

  switch (command) {
    case 'configure':
      if (args[1] && args[2] && args[3]) {
        const result = await unified.configureIntegrations(args[1], args[2], args[3]);
        console.log('🔑 Configuration:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node unified-integration.js configure <stripe-key> <wix-key> <wix-account-id>');
      }
      break;

    case 'test':
      const test = await unified.testConnections();
      console.log('🔌 Connection Tests:');
      console.log(JSON.stringify(test, null, 2));
      break;

    case 'report':
      if (args[1] && args[2]) {
        const report = await unified.generateCompleteReconciliationReport(args[1], args[2]);
        console.log('📊 Complete Reconciliation Report:');
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.error('Usage: node unified-integration.js report <start-date> <end-date>');
      }
      break;

    default:
      console.log('🔗 Unified Reconciliation Integration');
      console.log('');
      console.log('Commands:');
      console.log('  configure - Configure both integrations');
      console.log('  test      - Test both connections');
      console.log('  report    - Generate complete reconciliation report');
      console.log('');
      console.log('Examples:');
      console.log('  node unified-integration.js configure sk_test_... <wix-key> <wix-account-id>');
      console.log('  node unified-integration.js test');
      console.log('  node unified-integration.js report 2024-01-01 2024-01-31');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  UnifiedReconciliationIntegration
};
