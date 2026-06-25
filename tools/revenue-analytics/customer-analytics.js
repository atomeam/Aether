/**
 * Customer Analytics System
 * Tracks customer LTV, churn, cohort analysis
 */

const fs = require('fs');
const path = require('path');

class CustomerAnalytics {
  constructor() {
    this.customers = [];
    this.cohorts = [];
    this.ltvData = [];
    
    this.dataPath = path.resolve(__dirname, 'customer-data.json');
    this.cohortsPath = path.resolve(__dirname, 'cohorts.json');
    this.ltvPath = path.resolve(__dirname, 'ltv.json');
    
    this.loadCustomerData();
  }

  // Track customer
  async trackCustomer(customer) {
    console.log(`👤 Tracking customer: ${customer.name}`);
    
    const newCustomer = {
      id: this.generateCustomerId(),
      ...customer,
      acquiredAt: customer.acquiredAt || new Date().toISOString(),
      cohort: this.calculateCohort(customer.acquiredAt || new Date().toISOString()),
      status: customer.status || 'active',
      churnedAt: customer.churnedAt || null,
      ltv: 0,
      totalRevenue: 0,
      transactions: 0
    };
    
    this.customers.push(newCustomer);
    this.saveCustomerData();
    
    return newCustomer;
  }

  // Calculate cohort
  calculateCohort(date) {
    const dateObj = new Date(date);
    return dateObj.toISOString().substring(0, 7);
  }

  // Track customer revenue
  async trackCustomerRevenue(customerId, amount) {
    console.log(`💰 Tracking customer revenue: ${customerId} - $${amount}`);
    
    const customer = this.customers.find(c => c.id === customerId);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    customer.totalRevenue += parseFloat(amount);
    customer.transactions += 1;
    customer.ltv = customer.totalRevenue;
    
    this.saveCustomerData();
    
    return customer;
  }

  // Track customer churn
  async trackChurn(customerId, reason) {
    console.log(`📉 Tracking churn: ${customerId} - ${reason}`);
    
    const customer = this.customers.find(c => c.id === customerId);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    customer.status = 'churned';
    customer.churnedAt = new Date().toISOString();
    customer.churnReason = reason;
    
    this.saveCustomerData();
    
    return customer;
  }

  // Calculate LTV (Lifetime Value)
  calculateLTV(customerId) {
    const customer = this.customers.find(c => c.id === customerId);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Calculate customer lifetime in months
    const acquiredAt = new Date(customer.acquiredAt);
    const endedAt = customer.churnedAt ? new Date(customer.churnedAt) : new Date();
    const lifetimeMonths = Math.max(1, (endedAt - acquiredAt) / (30 * 24 * 60 * 60 * 1000));
    
    // Calculate average monthly revenue
    const averageMonthlyRevenue = customer.totalRevenue / lifetimeMonths;
    
    // Calculate LTV (using 12-month projection)
    const ltv = averageMonthlyRevenue * 12;
    
    return {
      customerId,
      ltv: ltv.toFixed(2),
      totalRevenue: customer.totalRevenue.toFixed(2),
      lifetimeMonths: lifetimeMonths.toFixed(1),
      averageMonthlyRevenue: averageMonthlyRevenue.toFixed(2),
      transactions: customer.transactions
    };
  }

  // Calculate average LTV
  calculateAverageLTV() {
    const activeCustomers = this.customers.filter(c => c.status === 'active');
    
    if (activeCustomers.length === 0) {
      return { averageLTV: 0, count: 0 };
    }
    
    const ltvSum = activeCustomers.reduce((sum, c) => {
      const ltv = this.calculateLTV(c.id);
      return sum + parseFloat(ltv.ltv);
    }, 0);
    
    return {
      averageLTV: (ltvSum / activeCustomers.length).toFixed(2),
      count: activeCustomers.length
    };
  }

  // Calculate churn rate
  calculateChurnRate(months = 12) {
    const churnData = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().substring(0, 7);
      
      const activeAtStart = this.customers.filter(c => 
        new Date(c.acquiredAt) <= date && (!c.churnedAt || new Date(c.churnedAt) > date)
      ).length;
      
      const churnedInMonth = this.customers.filter(c => 
        c.churnedAt && c.churnedAt.substring(0, 7) === monthStr
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

  // Generate cohort analysis
  generateCohortAnalysis() {
    const cohorts = {};
    
    // Group customers by cohort
    this.customers.forEach(customer => {
      if (!cohorts[customer.cohort]) {
        cohorts[customer.cohort] = {
          cohort: customer.cohort,
          customers: [],
          totalRevenue: 0,
          activeCustomers: 0,
          churnedCustomers: 0
        };
      }
      
      cohorts[customer.cohort].customers.push(customer);
      cohorts[customer.cohort].totalRevenue += customer.totalRevenue;
      
      if (customer.status === 'active') {
        cohorts[customer.cohort].activeCustomers++;
      } else {
        cohorts[customer.cohort].churnedCustomers++;
      }
    });
    
    // Calculate cohort metrics
    const cohortAnalysis = Object.values(cohorts).map(cohort => {
      const totalCustomers = cohort.customers.length;
      const churnRate = totalCustomers > 0 ? (cohort.churnedCustomers / totalCustomers * 100).toFixed(2) : 0;
      const averageRevenue = totalCustomers > 0 ? (cohort.totalRevenue / totalCustomers).toFixed(2) : 0;
      
      return {
        ...cohort,
        totalCustomers,
        churnRate,
        averageRevenue,
        retentionRate: (100 - parseFloat(churnRate)).toFixed(2)
      };
    });
    
    // Sort by cohort (newest first)
    cohortAnalysis.sort((a, b) => b.cohort.localeCompare(a.cohort));
    
    this.cohorts = cohortAnalysis;
    this.saveCustomerData();
    
    return cohortAnalysis;
  }

  // Calculate customer health score
  calculateCustomerHealthScore(customerId) {
    const customer = this.customers.find(c => c.id === customerId);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    let score = 100;
    
    // Deduct for churn risk factors
    if (customer.status === 'churned') {
      score = 0;
    } else {
      // Low revenue
      if (customer.totalRevenue < 100) score -= 20;
      
      // Low transaction count
      if (customer.transactions < 5) score -= 15;
      
      // Recent customer (less than 30 days)
      const daysSinceAcquisition = (new Date() - new Date(customer.acquiredAt)) / (24 * 60 * 60 * 1000);
      if (daysSinceAcquisition < 30) score -= 10;
      
      // High engagement (add back)
      if (customer.transactions > 20) score += 10;
      if (customer.totalRevenue > 500) score += 10;
    }
    
    return {
      customerId,
      score: Math.max(0, Math.min(100, score)),
      health: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
      factors: {
        status: customer.status,
        totalRevenue: customer.totalRevenue,
        transactions: customer.transactions
      }
    };
  }

  // Get at-risk customers
  getAtRiskCustomers() {
    const atRisk = [];
    
    this.customers.forEach(customer => {
      if (customer.status === 'active') {
        const health = this.calculateCustomerHealthScore(customer.id);
        
        if (health.score < 60) {
          atRisk.push({
            customer,
            healthScore: health.score,
            health: health.health
          });
        }
      }
    });
    
    return atRisk.sort((a, b) => a.healthScore - b.healthScore);
  }

  // Get customer summary
  getCustomerSummary() {
    const total = this.customers.length;
    const active = this.customers.filter(c => c.status === 'active').length;
    const churned = this.customers.filter(c => c.status === 'churned').length;
    const averageLTV = this.calculateAverageLTV();
    const churnRate = this.calculateChurnRate(1);
    const cohortAnalysis = this.generateCohortAnalysis();
    const atRisk = this.getAtRiskCustomers();
    
    return {
      total,
      active,
      churned,
      churnRate: churnRate[0]?.churnRate || 0,
      averageLTV: averageLTV.averageLTV,
      cohortAnalysis,
      atRiskCustomers: atRisk.length,
      totalRevenue: this.customers.reduce((sum, c) => sum + c.totalRevenue, 0).toFixed(2)
    };
  }

  // Generate customer ID
  generateCustomerId() {
    return `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load customer data
  loadCustomerData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.customers = JSON.parse(data);
    }
    
    if (fs.existsSync(this.cohortsPath)) {
      const data = fs.readFileSync(this.cohortsPath, 'utf8');
      this.cohorts = JSON.parse(data);
    }
    
    if (fs.existsSync(this.ltvPath)) {
      const data = fs.readFileSync(this.ltvPath, 'utf8');
      this.ltvData = JSON.parse(data);
    }
  }

  // Save customer data
  saveCustomerData() {
    if (this.customers.length > 10000) {
      this.customers = this.customers.slice(-10000);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.customers, null, 2));
    fs.writeFileSync(this.cohortsPath, JSON.stringify(this.cohorts, null, 2));
    fs.writeFileSync(this.ltvPath, JSON.stringify(this.ltvData, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const analytics = new CustomerAnalytics();

  switch (command) {
    case 'track':
      if (args[1]) {
        const customer = JSON.parse(args[1]);
        const result = await analytics.trackCustomer(customer);
        console.log('👤 Tracked Customer:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node customer-analytics.js track <customer-json>');
      }
      break;

    case 'ltv':
      if (args[1]) {
        const ltv = analytics.calculateLTV(args[1]);
        console.log('💰 LTV:');
        console.log(JSON.stringify(ltv, null, 2));
      } else {
        console.error('Usage: node customer-analytics.js ltv <customer-id>');
      }
      break;

    case 'churn':
      const churn = analytics.calculateChurnRate();
      console.log('📉 Churn Rate:');
      console.log(JSON.stringify(churn, null, 2));
      break;

    case 'cohorts':
      const cohorts = analytics.generateCohortAnalysis();
      console.log('📊 Cohort Analysis:');
      console.log(JSON.stringify(cohorts, null, 2));
      break;

    case 'summary':
      const summary = analytics.getCustomerSummary();
      console.log('📊 Customer Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    default:
      console.log('👤 Customer Analytics System');
      console.log('');
      console.log('Commands:');
      console.log('  track   - Track customer');
      console.log('  ltv     - Calculate LTV');
      console.log('  churn   - Calculate churn rate');
      console.log('  cohorts - Generate cohort analysis');
      console.log('  summary - Get customer summary');
      console.log('');
      console.log('Examples:');
      console.log('  node customer-analytics.js track \'{"name":"Test"}\'');
      console.log('  node customer-analytics.js ltv cust-123');
      console.log('  node customer-analytics.js churn');
      console.log('  node customer-analytics.js cohorts');
      console.log('  node customer-analytics.js summary');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  CustomerAnalytics
};
