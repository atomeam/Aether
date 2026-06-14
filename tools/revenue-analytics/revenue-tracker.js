/**
 * Revenue Tracking System
 * Tracks revenue across all SaaS products in real-time
 */

const fs = require('fs');
const path = require('path');

class RevenueTracker {
  constructor() {
    this.revenue = [];
    this.products = [];
    this.subscriptions = [];
    this.transactions = [];
    
    this.dataPath = path.resolve(__dirname, 'revenue-data.json');
    this.productsPath = path.resolve(__dirname, 'products.json');
    this.subscriptionsPath = path.resolve(__dirname, 'subscriptions.json');
    this.transactionsPath = path.resolve(__dirname, 'transactions.json');
    
    this.loadRevenueData();
  }

  // Track revenue for product
  async trackRevenue(productId, amount, type, metadata = {}) {
    console.log(`💰 Tracking revenue: $${amount} for product ${productId} (${type})`);
    
    const revenue = {
      id: this.generateRevenueId(),
      productId,
      amount: parseFloat(amount),
      type, // 'subscription', 'one-time', 'usage-based', 'upgrade', 'downgrade'
      metadata,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      month: new Date().toISOString().substring(0, 7),
      year: new Date().getFullYear().toString()
    };
    
    this.revenue.push(revenue);
    this.saveRevenueData();
    
    return revenue;
  }

  // Calculate MRR (Monthly Recurring Revenue)
  calculateMRR(date = null) {
    const targetDate = date || new Date().toISOString().substring(0, 7);
    
    const monthlyRevenue = this.revenue.filter(r => 
      r.month === targetDate && r.type === 'subscription'
    );
    
    const mrr = monthlyRevenue.reduce((sum, r) => sum + r.amount, 0);
    
    return {
      mrr: mrr.toFixed(2),
      date: targetDate,
      transactions: monthlyRevenue.length
    };
  }

  // Calculate ARR (Annual Recurring Revenue)
  calculateARR(date = null) {
    const mrr = this.calculateMRR(date);
    const arr = (parseFloat(mrr.mrr) * 12).toFixed(2);
    
    return {
      arr,
      mrr: mrr.mrr,
      date: mrr.date
    };
  }

  // Calculate revenue by product
  calculateRevenueByProduct(date = null) {
    const targetDate = date || new Date().toISOString().substring(0, 7);
    
    const productRevenue = {};
    
    this.revenue.filter(r => r.month === targetDate).forEach(r => {
      if (!productRevenue[r.productId]) {
        productRevenue[r.productId] = 0;
      }
      productRevenue[r.productId] += r.amount;
    });
    
    return Object.entries(productRevenue).map(([productId, amount]) => ({
      productId,
      revenue: amount.toFixed(2),
      percentage: this.calculatePercentage(amount, this.calculateMRR(targetDate).mrr)
    })).sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));
  }

  // Calculate percentage
  calculatePercentage(value, total) {
    if (parseFloat(total) === 0) return 0;
    return ((value / total) * 100).toFixed(2);
  }

  // Calculate revenue trends
  calculateRevenueTrends(months = 12) {
    const trends = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const mrr = this.calculateMRR(monthStr);
      
      trends.push({
        month: monthStr,
        mrr: mrr.mrr,
        growth: i > 0 ? this.calculateGrowth(trends[trends.length - 1].mrr, mrr.mrr) : 0
      });
    }
    
    return trends;
  }

  // Calculate growth
  calculateGrowth(previous, current) {
    if (parseFloat(previous) === 0) return 0;
    return (((parseFloat(current) - parseFloat(previous)) / parseFloat(previous)) * 100).toFixed(2);
  }

  // Track subscription
  async trackSubscription(subscription) {
    console.log(`📊 Tracking subscription: ${subscription.customerId} - ${subscription.planId}`);
    
    const sub = {
      id: this.generateSubscriptionId(),
      customerId: subscription.customerId,
      productId: subscription.productId,
      planId: subscription.planId,
      amount: parseFloat(subscription.amount),
      interval: subscription.interval || 'monthly',
      status: subscription.status || 'active',
      startedAt: subscription.startedAt || new Date().toISOString(),
      cancelledAt: subscription.cancelledAt || null,
      churnedAt: subscription.churnedAt || null,
      metadata: subscription.metadata || {}
    };
    
    this.subscriptions.push(sub);
    this.saveRevenueData();
    
    // Track initial revenue
    if (sub.status === 'active') {
      await this.trackRevenue(sub.productId, sub.amount, 'subscription', {
        subscriptionId: sub.id,
        customerId: sub.customerId
      });
    }
    
    return sub;
  }

  // Track transaction
  async trackTransaction(transaction) {
    console.log(`💳 Tracking transaction: ${transaction.customerId} - $${transaction.amount}`);
    
    const txn = {
      id: this.generateTransactionId(),
      customerId: transaction.customerId,
      productId: transaction.productId,
      amount: parseFloat(transaction.amount),
      type: transaction.type || 'payment',
      status: transaction.status || 'completed',
      timestamp: new Date().toISOString(),
      metadata: transaction.metadata || {}
    };
    
    this.transactions.push(txn);
    this.saveRevenueData();
    
    // Track revenue
    if (txn.status === 'completed') {
      await this.trackRevenue(txn.productId, txn.amount, txn.type, {
        transactionId: txn.id,
        customerId: txn.customerId
      });
    }
    
    return txn;
  }

  // Calculate churn
  calculateChurn(months = 12) {
    const churnData = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const activeAtStart = this.subscriptions.filter(s => 
        new Date(s.startedAt) <= date && (!s.cancelledAt || new Date(s.cancelledAt) > date)
      ).length;
      
      const churnedInMonth = this.subscriptions.filter(s => 
        s.churnedAt && s.churnedAt.substring(0, 7) === monthStr
      ).length;
      
      const churnRate = activeAtStart > 0 ? (churnedInMonth / activeAtStart * 100).toFixed(2) : 0;
      
      churnData.push({
        month: monthStr,
        activeAtStart,
        churnedInMonth,
        churnRate
      });
    }
    
    return churnData;
  }

  // Calculate net revenue retention
  calculateNRR(months = 12) {
    const nrrData = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const mrr = this.calculateMRR(monthStr);
      
      // Calculate expansion revenue
      const expansion = this.revenue.filter(r => 
        r.month === monthStr && r.type === 'upgrade'
      ).reduce((sum, r) => sum + r.amount, 0);
      
      // Calculate contraction revenue
      const contraction = this.revenue.filter(r => 
        r.month === monthStr && r.type === 'downgrade'
      ).reduce((sum, r) => sum + r.amount, 0);
      
      // Calculate churn revenue
      const churn = this.subscriptions.filter(s => 
        s.churnedAt && s.churnedAt.substring(0, 7) === monthStr
      ).reduce((sum, s) => sum + s.amount, 0);
      
      const startingMRR = parseFloat(mrr.mrr) + parseFloat(churn.toString()) - parseFloat(expansion.toString()) + parseFloat(contraction.toString());
      const endingMRR = parseFloat(mrr.mrr);
      
      const nrr = startingMRR > 0 ? ((endingMRR / startingMRR) * 100).toFixed(2) : 100;
      
      nrrData.push({
        month: monthStr,
        startingMRR: startingMRR.toFixed(2),
        endingMRR: endingMRR.toFixed(2),
        expansion: expansion.toFixed(2),
        contraction: contraction.toFixed(2),
        churn: churn.toFixed(2),
        nrr
      });
    }
    
    return nrrData;
  }

  // Add product
  async addProduct(product) {
    console.log(`📦 Adding product: ${product.name}`);
    
    const newProduct = {
      id: this.generateProductId(),
      ...product,
      addedAt: new Date().toISOString(),
      status: 'active'
    };
    
    this.products.push(newProduct);
    this.saveRevenueData();
    
    return newProduct;
  }

  // Get revenue summary
  getRevenueSummary() {
    const mrr = this.calculateMRR();
    const arr = this.calculateARR();
    const productRevenue = this.calculateRevenueByProduct();
    const trends = this.calculateRevenueTrends(6);
    const churn = this.calculateChurn(6);
    const nrr = this.calculateNRR(6);
    
    return {
      mrr,
      arr,
      productRevenue,
      trends,
      churn,
      nrr,
      totalRevenue: this.revenue.reduce((sum, r) => sum + r.amount, 0).toFixed(2),
      totalTransactions: this.revenue.length,
      totalSubscriptions: this.subscriptions.length,
      totalProducts: this.products.length
    };
  }

  // Generate revenue ID
  generateRevenueId() {
    return `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate subscription ID
  generateSubscriptionId() {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate transaction ID
  generateTransactionId() {
    return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate product ID
  generateProductId() {
    return `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load revenue data
  loadRevenueData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.revenue = JSON.parse(data);
    }
    
    if (fs.existsSync(this.productsPath)) {
      const data = fs.readFileSync(this.productsPath, 'utf8');
      this.products = JSON.parse(data);
    }
    
    if (fs.existsSync(this.subscriptionsPath)) {
      const data = fs.readFileSync(this.subscriptionsPath, 'utf8');
      this.subscriptions = JSON.parse(data);
    }
    
    if (fs.existsSync(this.transactionsPath)) {
      const data = fs.readFileSync(this.transactionsPath, 'utf8');
      this.transactions = JSON.parse(data);
    }
  }

  // Save revenue data
  saveRevenueData() {
    if (this.revenue.length > 10000) {
      this.revenue = this.revenue.slice(-10000);
    }
    if (this.subscriptions.length > 5000) {
      this.subscriptions = this.subscriptions.slice(-5000);
    }
    if (this.transactions.length > 10000) {
      this.transactions = this.transactions.slice(-10000);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.revenue, null, 2));
    fs.writeFileSync(this.productsPath, JSON.stringify(this.products, null, 2));
    fs.writeFileSync(this.subscriptionsPath, JSON.stringify(this.subscriptions, null, 2));
    fs.writeFileSync(this.transactionsPath, JSON.stringify(this.transactions, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const tracker = new RevenueTracker();

  switch (command) {
    case 'track':
      if (args[1] && args[2] && args[3]) {
        const revenue = await tracker.trackRevenue(args[1], args[2], args[3]);
        console.log('💰 Tracked Revenue:');
        console.log(JSON.stringify(revenue, null, 2));
      } else {
        console.error('Usage: node revenue-tracker.js track <product-id> <amount> <type>');
      }
      break;

    case 'mrr':
      const mrr = tracker.calculateMRR();
      console.log('📊 MRR:');
      console.log(JSON.stringify(mrr, null, 2));
      break;

    case 'arr':
      const arr = tracker.calculateARR();
      console.log('📊 ARR:');
      console.log(JSON.stringify(arr, null, 2));
      break;

    case 'summary':
      const summary = tracker.getRevenueSummary();
      console.log('📊 Revenue Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    default:
      console.log('💰 Revenue Tracking System');
      console.log('');
      console.log('Commands:');
      console.log('  track    - Track revenue');
      console.log('  mrr      - Calculate MRR');
      console.log('  arr      - Calculate ARR');
      console.log('  summary  - Get revenue summary');
      console.log('');
      console.log('Examples:');
      console.log('  node revenue-tracker.js track prod-123 299 subscription');
      console.log('  node revenue-tracker.js mrr');
      console.log('  node revenue-tracker.js arr');
      console.log('  node revenue-tracker.js summary');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  RevenueTracker
};
