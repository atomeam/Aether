/**
 * Unit Economics Calculator
 * Calculates CAC, LTV, LTV:CAC ratio, payback period
 */

const fs = require('fs');
const path = require('path');

class UnitEconomicsCalculator {
  constructor() {
    this.acquisitionCosts = [];
    this.channelData = [];
    this.economics = [];
    
    this.dataPath = path.resolve(__dirname, 'unit-economics.json');
    this.channelsPath = path.resolve(__dirname, 'channels.json');
    this.loadEconomicsData();
  }

  // Track acquisition cost
  async trackAcquisitionCost(customerId, channel, cost, metadata = {}) {
    console.log(`💰 Tracking acquisition cost: ${customerId} - ${channel} - $${cost}`);
    
    const acquisition = {
      id: this.generateAcquisitionId(),
      customerId,
      channel,
      cost: parseFloat(cost),
      metadata,
      timestamp: new Date().toISOString(),
      month: new Date().toISOString().substring(0, 7)
    };
    
    this.acquisitionCosts.push(acquisition);
    this.saveEconomicsData();
    
    return acquisition;
  }

  // Calculate CAC (Customer Acquisition Cost)
  calculateCAC(channel = null, months = 12) {
    const targetChannel = channel;
    
    let relevantCosts = this.acquisitionCosts;
    
    if (targetChannel) {
      relevantCosts = this.acquisitionCosts.filter(a => a.channel === targetChannel);
    }
    
    // Calculate CAC over specified months
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);
    
    const recentCosts = relevantCosts.filter(a => new Date(a.timestamp) >= monthsAgo);
    
    if (recentCosts.length === 0) {
      return { cac: 0, customers: 0, totalCost: 0, channel: targetChannel || 'all' };
    }
    
    const totalCost = recentCosts.reduce((sum, a) => sum + a.cost, 0);
    const cac = totalCost / recentCosts.length;
    
    return {
      cac: cac.toFixed(2),
      customers: recentCosts.length,
      totalCost: totalCost.toFixed(2),
      channel: targetChannel || 'all',
      months
    };
  }

  // Calculate CAC by channel
  calculateCACByChannel(months = 12) {
    const channels = [...new Set(this.acquisitionCosts.map(a => a.channel))];
    
    return channels.map(channel => this.calculateCAC(channel, months));
  }

  // Calculate LTV:CAC ratio
  calculateLTVCACRatio(ltv, cac) {
    if (cac === 0) return { ratio: 0, assessment: 'undefined' };
    
    const ratio = ltv / cac;
    
    let assessment;
    if (ratio >= 3) {
      assessment = 'excellent';
    } else if (ratio >= 2) {
      assessment = 'good';
    } else if (ratio >= 1) {
      assessment = 'fair';
    } else {
      assessment = 'poor';
    }
    
    return {
      ratio: ratio.toFixed(2),
      assessment,
      ltv: ltv.toFixed(2),
      cac: cac.toFixed(2)
    };
  }

  // Calculate payback period
  calculatePaybackPeriod(cac, averageMonthlyRevenue) {
    if (averageMonthlyRevenue === 0) {
      return { paybackPeriod: Infinity, months: 'never' };
    }
    
    const paybackPeriod = cac / averageMonthlyRevenue;
    
    return {
      paybackPeriod: paybackPeriod.toFixed(2),
      months: paybackPeriod.toFixed(1),
      years: (paybackPeriod / 12).toFixed(2)
    };
  }

  // Calculate gross margin
  calculateGrossMargin(revenue, cogs) {
    if (revenue === 0) return { grossMargin: 0, grossProfit: 0 };
    
    const grossProfit = revenue - cogs;
    const grossMargin = (grossProfit / revenue) * 100;
    
    return {
      grossMargin: grossMargin.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      revenue: revenue.toFixed(2),
      cogs: cogs.toFixed(2)
    };
  }

  // Calculate unit economics summary
  calculateUnitEconomicsSummary(ltv, cac, averageMonthlyRevenue, revenue, cogs) {
    const ltvcacRatio = this.calculateLTVCACRatio(ltv, cac);
    const paybackPeriod = this.calculatePaybackPeriod(cac, averageMonthlyRevenue);
    const grossMargin = this.calculateGrossMargin(revenue, cogs);
    
    return {
      ltv: ltv.toFixed(2),
      cac: cac.toFixed(2),
      ltvcacRatio: ltvcacRatio.ratio,
      ltvcacAssessment: ltvcacRatio.assessment,
      paybackPeriod: paybackPeriod.months,
      paybackYears: paybackPeriod.years,
      grossMargin: grossMargin.grossMargin,
      grossProfit: grossMargin.grossProfit,
      averageMonthlyRevenue: averageMonthlyRevenue.toFixed(2),
      revenue: revenue.toFixed(2),
      cogs: cogs.toFixed(2)
    };
  }

  // Track channel performance
  async trackChannelPerformance(channel, metrics) {
    console.log(`📊 Tracking channel performance: ${channel}`);
    
    const performance = {
      channel,
      ...metrics,
      timestamp: new Date().toISOString(),
      month: new Date().toISOString().substring(0, 7)
    };
    
    this.channelData.push(performance);
    this.saveEconomicsData();
    
    return performance;
  }

  // Calculate channel ROI
  calculateChannelROI(channel, months = 12) {
    const channelCosts = this.acquisitionCosts.filter(a => a.channel === channel);
    const channelPerformance = this.channelData.filter(c => c.channel === channel);
    
    if (channelCosts.length === 0) {
      return { roi: 0, spend: 0, revenue: 0, channel };
    }
    
    const spend = channelCosts.reduce((sum, c) => sum + c.cost, 0);
    const revenue = channelPerformance.reduce((sum, p) => sum + (p.revenue || 0), 0);
    
    const roi = spend > 0 ? ((revenue - spend) / spend * 100) : 0;
    
    return {
      roi: roi.toFixed(2),
      spend: spend.toFixed(2),
      revenue: revenue.toFixed(2),
      profit: (revenue - spend).toFixed(2),
      channel,
      months
    };
  }

  // Get best performing channel
  getBestChannel() {
    const channels = [...new Set(this.acquisitionCosts.map(a => a.channel))];
    
    const channelROIs = channels.map(channel => this.calculateChannelROI(channel));
    
    channelROIs.sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi));
    
    return channelROIs[0] || null;
  }

  // Get unit economics summary
  getUnitEconomicsSummary() {
    const cac = this.calculateCAC();
    const cacByChannel = this.calculateCACByChannel();
    const bestChannel = this.getBestChannel();
    
    return {
      overallCAC: cac,
      cacByChannel,
      bestChannel,
      totalAcquisitions: this.acquisitionCosts.length,
      totalSpend: this.acquisitionCosts.reduce((sum, a) => sum + a.cost, 0).toFixed(2),
      trackedChannels: [...new Set(this.acquisitionCosts.map(a => a.channel))]
    };
  }

  // Generate acquisition ID
  generateAcquisitionId() {
    return `acq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load economics data
  loadEconomicsData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.economics = JSON.parse(data);
    }
    
    if (fs.existsSync(this.channelsPath)) {
      const data = fs.readFileSync(this.channelsPath, 'utf8');
      this.channelData = JSON.parse(data);
    }
  }

  // Save economics data
  saveEconomicsData() {
    if (this.acquisitionCosts.length > 10000) {
      this.acquisitionCosts = this.acquisitionCosts.slice(-10000);
    }
    if (this.channelData.length > 1000) {
      this.channelData = this.channelData.slice(-1000);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.acquisitionCosts, null, 2));
    fs.writeFileSync(this.channelsPath, JSON.stringify(this.channelData, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const calculator = new UnitEconomicsCalculator();

  switch (command) {
    case 'track':
      if (args[1] && args[2] && args[3]) {
        const cost = await calculator.trackAcquisitionCost(args[1], args[2], args[3]);
        console.log('💰 Tracked Acquisition Cost:');
        console.log(JSON.stringify(cost, null, 2));
      } else {
        console.error('Usage: node unit-economics.js track <customer-id> <channel> <cost>');
      }
      break;

    case 'cac':
      if (args[1]) {
        const cac = calculator.calculateCAC(args[1]);
        console.log('💰 CAC:');
        console.log(JSON.stringify(cac, null, 2));
      } else {
        const cac = calculator.calculateCAC();
        console.log('💰 CAC:');
        console.log(JSON.stringify(cac, null, 2));
      }
      break;

    case 'ltv-cac':
      if (args[1] && args[2]) {
        const ratio = calculator.calculateLTVCACRatio(parseFloat(args[1]), parseFloat(args[2]));
        console.log('📊 LTV:CAC Ratio:');
        console.log(JSON.stringify(ratio, null, 2));
      } else {
        console.error('Usage: node unit-economics.js ltv-cac <ltv> <cac>');
      }
      break;

    case 'payback':
      if (args[1] && args[2]) {
        const payback = calculator.calculatePaybackPeriod(parseFloat(args[1]), parseFloat(args[2]));
        console.log('⏱️  Payback Period:');
        console.log(JSON.stringify(payback, null, 2));
      } else {
        console.error('Usage: node unit-economics.js payback <cac> <monthly-revenue>');
      }
      break;

    case 'summary':
      const summary = calculator.getUnitEconomicsSummary();
      console.log('📊 Unit Economics Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    default:
      console.log('💰 Unit Economics Calculator');
      console.log('');
      console.log('Commands:');
      console.log('  track   - Track acquisition cost');
      console.log('  cac     - Calculate CAC');
      console.log('  ltv-cac - Calculate LTV:CAC ratio');
      console.log('  payback - Calculate payback period');
      console.log('  summary - Get unit economics summary');
      console.log('');
      console.log('Examples:');
      console.log('  node unit-economics.js track cust-123 ads 150');
      console.log('  node unit-economics.js cac');
      console.log('  node unit-economics.js cac ads');
      console.log('  node unit-economics.js ltv-cac 3000 150');
      console.log('  node unit-economics.js payback 150 50');
      console.log('  node unit-economics.js summary');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  UnitEconomicsCalculator
};
