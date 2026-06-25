/**
 * Operational Metrics Tracker
 * Tracks support costs, marketing spend, infrastructure costs, net profit
 */

const fs = require('fs');
const path = require('path');

class OperationalMetricsTracker {
  constructor() {
    this.costs = [];
    this.expenses = [];
    this.metrics = [];
    
    this.dataPath = path.resolve(__dirname, 'operational-data.json');
    this.expensesPath = path.resolve(__dirname, 'expenses.json');
    this.metricsPath = path.resolve(__dirname, 'metrics.json');
    
    this.loadOperationalData();
  }

  // Track cost
  async trackCost(category, amount, type, metadata = {}) {
    console.log(`💰 Tracking cost: ${category} - $${amount} (${type})`);
    
    const cost = {
      id: this.generateCostId(),
      category, // 'support', 'marketing', 'infrastructure', 'automation', 'personnel', 'other'
      amount: parseFloat(amount),
      type, // 'fixed', 'variable', 'one-time'
      metadata,
      timestamp: new Date().toISOString(),
      month: new Date().toISOString().substring(0, 7),
      year: new Date().getFullYear().toString()
    };
    
    this.costs.push(cost);
    this.saveOperationalData();
    
    return cost;
  }

  // Track expense
  async trackExpense(description, amount, category, metadata = {}) {
    console.log(`💸 Tracking expense: ${description} - $${amount}`);
    
    const expense = {
      id: this.generateExpenseId(),
      description,
      amount: parseFloat(amount),
      category,
      metadata,
      timestamp: new Date().toISOString(),
      month: new Date().toISOString().substring(0, 7)
    };
    
    this.expenses.push(expense);
    this.saveOperationalData();
    
    return expense;
  }

  // Calculate costs by category
  calculateCostsByCategory(month = null) {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    
    const categoryCosts = {};
    
    this.costs.filter(c => c.month === targetMonth).forEach(cost => {
      if (!categoryCosts[cost.category]) {
        categoryCosts[cost.category] = 0;
      }
      categoryCosts[cost.category] += cost.amount;
    });
    
    return Object.entries(categoryCosts).map(([category, amount]) => ({
      category,
      amount: amount.toFixed(2),
      percentage: this.calculatePercentage(amount, this.getTotalCost(targetMonth))
    })).sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
  }

  // Calculate total cost
  getTotalCost(month = null) {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    
    const monthlyCosts = this.costs.filter(c => c.month === targetMonth);
    const monthlyExpenses = this.expenses.filter(e => e.month === targetMonth);
    
    const totalCost = monthlyCosts.reduce((sum, c) => sum + c.amount, 0) +
                      monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    return totalCost;
  }

  // Calculate percentage
  calculatePercentage(value, total) {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(2);
  }

  // Calculate support costs
  calculateSupportCosts(months = 12) {
    const supportCosts = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const monthlySupportCosts = this.costs.filter(c => 
        c.category === 'support' && c.month === monthStr
      );
      
      const total = monthlySupportCosts.reduce((sum, c) => sum + c.amount, 0);
      
      supportCosts.push({
        month: monthStr,
        total: total.toFixed(2),
        transactions: monthlySupportCosts.length
      });
    }
    
    return supportCosts;
  }

  // Calculate marketing spend
  calculateMarketingSpend(months = 12) {
    const marketingSpend = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const monthlyMarketingCosts = this.costs.filter(c => 
        c.category === 'marketing' && c.month === monthStr
      );
      
      const total = monthlyMarketingCosts.reduce((sum, c) => sum + c.amount, 0);
      
      marketingSpend.push({
        month: monthStr,
        total: total.toFixed(2),
        transactions: monthlyMarketingCosts.length
      });
    }
    
    return marketingSpend;
  }

  // Calculate infrastructure costs
  calculateInfrastructureCosts(months = 12) {
    const infrastructureCosts = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const monthlyInfraCosts = this.costs.filter(c => 
        c.category === 'infrastructure' && c.month === monthStr
      );
      
      const total = monthlyInfraCosts.reduce((sum, c) => sum + c.amount, 0);
      
      infrastructureCosts.push({
        month: monthStr,
        total: total.toFixed(2),
        transactions: monthlyInfraCosts.length
      });
    }
    
    return infrastructureCosts;
  }

  // Calculate automation costs
  calculateAutomationCosts(months = 12) {
    const automationCosts = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const monthlyAutoCosts = this.costs.filter(c => 
        c.category === 'automation' && c.month === monthStr
      );
      
      const total = monthlyAutoCosts.reduce((sum, c) => sum + c.amount, 0);
      
      automationCosts.push({
        month: monthStr,
        total: total.toFixed(2),
        transactions: monthlyAutoCosts.length
      });
    }
    
    return automationCosts;
  }

  // Calculate net profit
  calculateNetProfit(revenue, month = null) {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    
    const totalCost = this.getTotalCost(targetMonth);
    const netProfit = revenue - totalCost;
    
    const profitMargin = revenue > 0 ? (netProfit / revenue * 100) : 0;
    
    return {
      revenue: revenue.toFixed(2),
      costs: totalCost.toFixed(2),
      netProfit: netProfit.toFixed(2),
      profitMargin: profitMargin.toFixed(2),
      month: targetMonth
    };
  }

  // Calculate burn rate
  calculateBurnRate(months = 6) {
    const burnRates = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const totalCost = this.getTotalCost(monthStr);
      
      burnRates.push({
        month: monthStr,
        burnRate: totalCost.toFixed(2)
      });
    }
    
    return burnRates;
  }

  // Calculate runway
  calculateRunway(cashBalance, monthlyBurn) {
    if (monthlyBurn <= 0) {
      return { runway: Infinity, months: 'infinite' };
    }
    
    const runway = cashBalance / monthlyBurn;
    
    return {
      runway: runway.toFixed(2),
      months: runway.toFixed(1),
      years: (runway / 12).toFixed(2)
    };
  }

  // Get operational summary
  getOperationalSummary(revenue) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const categoryCosts = this.calculateCostsByCategory(currentMonth);
    const supportCosts = this.calculateSupportCosts(6);
    const marketingSpend = this.calculateMarketingSpend(6);
    const infrastructureCosts = this.calculateInfrastructureCosts(6);
    const automationCosts = this.calculateAutomationCosts(6);
    const netProfit = this.calculateNetProfit(revenue, currentMonth);
    const burnRate = this.calculateBurnRate(6);
    
    return {
      categoryCosts,
      supportCosts,
      marketingSpend,
      infrastructureCosts,
      automationCosts,
      netProfit,
      burnRate,
      totalCosts: this.costs.length,
      totalExpenses: this.expenses.length
    };
  }

  // Generate cost ID
  generateCostId() {
    return `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate expense ID
  generateExpenseId() {
    return `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load operational data
  loadOperationalData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.costs = JSON.parse(data);
    }
    
    if (fs.existsSync(this.expensesPath)) {
      const data = fs.readFileSync(this.expensesPath, 'utf8');
      this.expenses = JSON.parse(data);
    }
    
    if (fs.existsSync(this.metricsPath)) {
      const data = fs.readFileSync(this.metricsPath, 'utf8');
      this.metrics = JSON.parse(data);
    }
  }

  // Save operational data
  saveOperationalData() {
    if (this.costs.length > 10000) {
      this.costs = this.costs.slice(-10000);
    }
    if (this.expenses.length > 10000) {
      this.expenses = this.expenses.slice(-10000);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.costs, null, 2));
    fs.writeFileSync(this.expensesPath, JSON.stringify(this.expenses, null, 2));
    fs.writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const tracker = new OperationalMetricsTracker();

  switch (command) {
    case 'track':
      if (args[1] && args[2] && args[3]) {
        const cost = await tracker.trackCost(args[1], args[2], args[3]);
        console.log('💰 Tracked Cost:');
        console.log(JSON.stringify(cost, null, 2));
      } else {
        console.error('Usage: node operational-tracker.js track <category> <amount> <type>');
      }
      break;

    case 'expense':
      if (args[1] && args[2] && args[3]) {
        const expense = await tracker.trackExpense(args[1], args[2], args[3]);
        console.log('💸 Tracked Expense:');
        console.log(JSON.stringify(expense, null, 2));
      } else {
        console.error('Usage: node operational-tracker.js expense <description> <amount> <category>');
      }
      break;

    case 'net-profit':
      if (args[1]) {
        const profit = tracker.calculateNetProfit(parseFloat(args[1]));
        console.log('💵 Net Profit:');
        console.log(JSON.stringify(profit, null, 2));
      } else {
        console.error('Usage: node operational-tracker.js net-profit <revenue>');
      }
      break;

    case 'summary':
      if (args[1]) {
        const summary = tracker.getOperationalSummary(parseFloat(args[1]));
        console.log('📊 Operational Summary:');
        console.log(JSON.stringify(summary, null, 2));
      } else {
        console.error('Usage: node operational-tracker.js summary <revenue>');
      }
      break;

    default:
      console.log('💰 Operational Metrics Tracker');
      console.log('');
      console.log('Commands:');
      console.log('  track      - Track cost');
      console.log('  expense    - Track expense');
      console.log('  net-profit - Calculate net profit');
      console.log('  summary    - Get operational summary');
      console.log('');
      console.log('Examples:');
      console.log('  node operational-tracker.js track support 500 fixed');
      console.log('  node operational-tracker.js expense "Server cost" 200 infrastructure');
      console.log('  node operational-tracker.js net-profit 10000');
      console.log('  node operational-tracker.js summary 10000');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  OperationalMetricsTracker
};
