/**
 * Actionable Recommendations Engine
 * Generates actionable insights and recommendations
 */

const fs = require('fs');
const path = require('path');

class RecommendationsEngine {
  constructor() {
    this.recommendations = [];
    this.insights = [];
    this.actions = [];
    
    this.dataPath = path.resolve(__dirname, 'recommendations.json');
    this.insightsPath = path.resolve(__dirname, 'insights.json');
    this.actionsPath = path.resolve(__dirname, 'actions.json');
    
    this.loadRecommendationsData();
  }

  // Generate recommendations from all data
  async generateRecommendations(data) {
    console.log('💡 Generating actionable recommendations...');
    
    const recommendations = {
      id: this.generateRecommendationId(),
      timestamp: new Date().toISOString(),
      
      // Revenue recommendations
      revenue: this.generateRevenueRecommendations(data.revenue),
      
      // Customer recommendations
      customers: this.generateCustomerRecommendations(data.customers),
      
      // Unit economics recommendations
      unitEconomics: this.generateUnitEconomicsRecommendations(data.unitEconomics),
      
      // Operational recommendations
      operations: this.generateOperationalRecommendations(data.operations),
      
      // Automation recommendations
      automation: this.generateAutomationRecommendations(data.automation),
      
      // Prioritized actions
      prioritizedActions: this.prioritizeActions(data)
    };
    
    this.recommendations.push(recommendations);
    this.saveRecommendationsData();
    
    return recommendations;
  }

  // Generate revenue recommendations
  generateRevenueRecommendations(revenueData) {
    const recommendations = [];
    
    if (revenueData.mrr && parseFloat(revenueData.mrr) < 1000) {
      recommendations.push({
        priority: 'high',
        action: 'Increase MRR through upselling and cross-selling',
        impact: 'Increase MRR by 20-30%',
        effort: 'medium',
        timeframe: '1-2 months'
      });
    }
    
    if (revenueData.trends) {
      const latestTrend = revenueData.trends[revenueData.trends.length - 1];
      
      if (parseFloat(latestTrend.growth) < 0) {
        recommendations.push({
          priority: 'critical',
          action: 'Investigate revenue decline immediately',
          impact: 'Stop revenue decline',
          effort: 'high',
          timeframe: 'immediate'
        });
      }
      
      if (parseFloat(latestTrend.growth) > 20) {
        recommendations.push({
          priority: 'medium',
          action: 'Scale infrastructure to support growth',
          impact: 'Maintain growth trajectory',
          effort: 'high',
          timeframe: '1-2 months'
        });
      }
    }
    
    if (revenueData.productRevenue) {
      const lowPerforming = revenueData.productRevenue.filter(p => parseFloat(p.percentage) < 10);
      
      if (lowPerforming.length > 0) {
        recommendations.push({
          priority: 'medium',
          action: 'Review and improve underperforming products',
          impact: 'Increase revenue by 10-15%',
          effort: 'medium',
          timeframe: '1 month'
        });
      }
    }
    
    return recommendations;
  }

  // Generate customer recommendations
  generateCustomerRecommendations(customerData) {
    const recommendations = [];
    
    if (customerData.churnRate && parseFloat(customerData.churnRate) > 5) {
      recommendations.push({
        priority: 'high',
        action: 'Implement customer retention strategies',
        impact: 'Reduce churn by 30-50%',
        effort: 'high',
        timeframe: '2-3 months'
      });
    }
    
    if (customerData.atRiskCustomers && customerData.atRiskCustomers.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Reach out to at-risk customers immediately',
        impact: 'Prevent churn, save revenue',
        effort: 'low',
        timeframe: '1-2 weeks'
      });
    }
    
    if (customerData.averageLTV && parseFloat(customerData.averageLTV) < 500) {
      recommendations.push({
        priority: 'medium',
        action: 'Increase average LTV through pricing optimization',
        impact: 'Increase LTV by 20-30%',
        effort: 'medium',
        timeframe: '1-2 months'
      });
    }
    
    if (customerData.cohortAnalysis) {
      const worstCohort = customerData.cohortAnalysis[customerData.cohortAnalysis.length - 1];
      
      if (parseFloat(worstCohort.churnRate) > 10) {
        recommendations.push({
          priority: 'high',
          action: 'Investigate and fix issues with worst-performing cohort',
          impact: 'Improve retention for new customers',
          effort: 'high',
          timeframe: '1-2 months'
        });
      }
    }
    
    return recommendations;
  }

  // Generate unit economics recommendations
  generateUnitEconomicsRecommendations(unitEconomicsData) {
    const recommendations = [];
    
    if (unitEconomicsData.overallCAC && unitEconomicsData.ltv) {
      const ltvcacRatio = unitEconomicsData.ltv / unitEconomicsData.overallCAC;
      
      if (ltvcacRatio < 1) {
        recommendations.push({
          priority: 'critical',
          action: 'Reduce CAC or increase LTV immediately',
          impact: 'Achieve positive unit economics',
          effort: 'high',
          timeframe: 'immediate'
        });
      } else if (ltvcacRatio < 2) {
        recommendations.push({
          priority: 'high',
          action: 'Improve LTV:CAC ratio to > 3',
          impact: 'Achieve healthy unit economics',
          effort: 'medium',
          timeframe: '1-2 months'
        });
      }
    }
    
    if (unitEconomicsData.paybackPeriod && parseFloat(unitEconomicsData.paybackPeriod) > 12) {
      recommendations.push({
        priority: 'high',
        action: 'Reduce payback period to under 12 months',
        impact: 'Improve cash flow',
        effort: 'medium',
        timeframe: '1-2 months'
      });
    }
    
    if (unitEconomicsData.bestChannel) {
      recommendations.push({
        priority: 'medium',
        action: `Allocate more budget to best performing channel: ${unitEconomicsData.bestChannel.channel}`,
        impact: 'Improve ROI by 20-30%',
        effort: 'low',
        timeframe: 'immediate'
      });
    }
    
    if (unitEconomicsData.cacByChannel) {
      const worstChannel = unitEconomicsData.cacByChannel[unitEconomicsData.cacByChannel.length - 1];
      
      if (parseFloat(worstChannel.cac) > parseFloat(unitEconomicsData.overallCAC) * 1.5) {
        recommendations.push({
          priority: 'medium',
          action: `Optimize or pause worst performing channel: ${worstChannel.channel}`,
          impact: 'Reduce CAC by 15-25%',
          effort: 'low',
          timeframe: '1 month'
        });
      }
    }
    
    return recommendations;
  }

  // Generate operational recommendations
  generateOperationalRecommendations(operationalData) {
    const recommendations = [];
    
    if (operationalData.netProfit && parseFloat(operationalData.netProfit.profitMargin) < 10) {
      recommendations.push({
        priority: 'high',
        action: 'Reduce costs or increase pricing to improve profit margin',
        impact: 'Achieve 20%+ profit margin',
        effort: 'high',
        timeframe: '1-2 months'
      });
    }
    
    if (operationalData.categoryCosts) {
      const highestCost = operationalData.categoryCosts[0];
      
      if (parseFloat(highestCost.percentage) > 50) {
        recommendations.push({
          priority: 'medium',
          action: `Optimize highest cost category: ${highestCost.category}`,
          impact: 'Reduce costs by 15-25%',
          effort: 'medium',
          timeframe: '1 month'
        });
      }
    }
    
    if (operationalData.burnRate) {
      const latestBurn = operationalData.burnRate[operationalData.burnRate.length - 1];
      
      if (parseFloat(latestBurn.burnRate) > 10000) {
        recommendations.push({
          priority: 'high',
          action: 'Reduce burn rate to extend runway',
          impact: 'Extend runway by 3-6 months',
          effort: 'high',
          timeframe: '1-2 months'
        });
      }
    }
    
    return recommendations;
  }

  // Generate automation recommendations
  generateAutomationRecommendations(automationData) {
    const recommendations = [];
    
    if (automationData.overallROI && parseFloat(automationData.overallROI) < 0) {
      recommendations.push({
        priority: 'critical',
        action: 'Review and optimize underperforming automation systems',
        impact: 'Achieve positive ROI',
        effort: 'high',
        timeframe: '1-2 months'
      });
    }
    
    if (automationData.systems) {
      const worstSystem = automationData.systems[automationData.systems.length - 1];
      
      if (parseFloat(worstSystem.roi) < 0) {
        recommendations.push({
          priority: 'high',
          action: `Fix or decommission underperforming system: ${worstSystem.system}`,
          impact: 'Improve overall ROI',
          effort: 'medium',
          timeframe: '1 month'
        });
      }
    }
    
    if (automationData.timeSaved && parseFloat(automationData.timeSaved.totalHours) < 100) {
      recommendations.push({
        priority: 'low',
        action: 'Expand automation to save more time',
        impact: 'Save 50-100 more hours/month',
        effort: 'medium',
        timeframe: '2-3 months'
      });
    }
    
    return recommendations;
  }

  // Prioritize actions
  prioritizeActions(data) {
    const allActions = [
      ...this.generateRevenueRecommendations(data.revenue),
      ...this.generateCustomerRecommendations(data.customers),
      ...this.generateUnitEconomicsRecommendations(data.unitEconomics),
      ...this.generateOperationalRecommendations(data.operations),
      ...this.generateAutomationRecommendations(data.automation)
    ];
    
    // Sort by priority
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    
    allActions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Take top 10
    return allActions.slice(0, 10);
  }

  // Generate insight
  async generateInsight(type, data) {
    console.log(`💡 Generating insight: ${type}`);
    
    const insight = {
      id: this.generateInsightId(),
      type,
      data,
      timestamp: new Date().toISOString(),
      
      // AI analysis
      summary: this.generateInsightSummary(type, data),
      impact: this.assessInsightImpact(type, data),
      confidence: this.calculateInsightConfidence(type, data)
    };
    
    this.insights.push(insight);
    this.saveRecommendationsData();
    
    return insight;
  }

  // Generate insight summary
  generateInsightSummary(type, data) {
    const summaries = {
      'revenue': `Revenue trend is ${data.trend ? data.trend.trend : 'stable'} with ${data.growthRate ? data.growthRate.monthOverMonth : 0}% month-over-month growth`,
      'customers': `Customer churn rate is ${data.churnRate || 'N/A'} with ${data.atRiskCustomers?.length || 0} at-risk customers`,
      'unit-economics': `LTV:CAC ratio is ${data.ltvcacRatio || 'N/A'} with ${data.paybackPeriod || 'N/A'} month payback period`,
      'operations': `Profit margin is ${data.netProfit?.profitMargin || 'N/A'}% with ${data.burnRate?.[0]?.burnRate || 'N/A'} monthly burn`,
      'automation': `Overall automation ROI is ${data.overallROI || 'N/A'}% with ${data.timeSaved?.totalHours || 'N/A'} hours saved`
    };
    
    return summaries[type] || 'Insight generated';
  }

  // Assess insight impact
  assessInsightImpact(type, data) {
    const impacts = {
      'revenue': data.growthRate ? Math.abs(parseFloat(data.growthRate.monthOverMonth)) : 0,
      'customers': data.churnRate ? parseFloat(data.churnRate) : 0,
      'unit-economics': data.ltvcacRatio ? parseFloat(data.ltvcacRatio) : 0,
      'operations': data.netProfit ? parseFloat(data.netProfit.profitMargin) : 0,
      'automation': data.overallROI ? parseFloat(data.overallROI) : 0
    };
    
    const impact = impacts[type] || 0;
    
    return {
      score: impact.toFixed(2),
      level: impact > 70 ? 'high' : impact > 40 ? 'medium' : 'low'
    };
  }

  // Calculate insight confidence
  calculateInsightConfidence(type, data) {
    const dataPoints = Object.keys(data).length;
    const baseConfidence = Math.min(0.9, dataPoints / 10);
    
    return (baseConfidence * 100).toFixed(2);
  }

  // Track action completion
  async trackAction(actionId, result) {
    console.log(`✅ Tracking action completion: ${actionId}`);
    
    const action = {
      id: actionId,
      result,
      completedAt: new Date().toISOString()
    };
    
    this.actions.push(action);
    this.saveRecommendationsData();
    
    return action;
  }

  // Get recommendations summary
  getRecommendationsSummary() {
    const total = this.recommendations.length;
    const critical = this.recommendations.reduce((sum, r) => {
      const count = r.revenue?.filter(a => a.priority === 'critical').length || 0 +
                     r.customers?.filter(a => a.priority === 'critical').length || 0 +
                     r.unitEconomics?.filter(a => a.priority === 'critical').length || 0 +
                     r.operations?.filter(a => a.priority === 'critical').length || 0 +
                     r.automation?.filter(a => a.priority === 'critical').length || 0;
      return sum + count;
    }, 0);
    
    const high = this.recommendations.reduce((sum, r) => {
      const count = r.revenue?.filter(a => a.priority === 'high').length || 0 +
                     r.customers?.filter(a => a.priority === 'high').length || 0 +
                     r.unitEconomics?.filter(a => a.priority === 'high').length || 0 +
                     r.operations?.filter(a => a.priority === 'high').length || 0 +
                     r.automation?.filter(a => a.priority === 'high').length || 0;
      return sum + count;
    }, 0);
    
    return {
      total,
      critical,
      high,
      insights: this.insights.length,
      actionsCompleted: this.actions.length
    };
  }

  // Generate recommendation ID
  generateRecommendationId() {
    return `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate insight ID
  generateInsightId() {
    return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load recommendations data
  loadRecommendationsData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.recommendations = JSON.parse(data);
    }
    
    if (fs.existsSync(this.insightsPath)) {
      const data = fs.readFileSync(this.insightsPath, 'utf8');
      this.insights = JSON.parse(data);
    }
    
    if (fs.existsSync(this.actionsPath)) {
      const data = fs.readFileSync(this.actionsPath, 'utf8');
      this.actions = JSON.parse(data);
    }
  }

  // Save recommendations data
  saveRecommendationsData() {
    if (this.recommendations.length > 100) {
      this.recommendations = this.recommendations.slice(-100);
    }
    if (this.insights.length > 500) {
      this.insights = this.insights.slice(-500);
    }
    if (this.actions.length > 1000) {
      this.actions = this.actions.slice(-1000);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.recommendations, null, 2));
    fs.writeFileSync(this.insightsPath, JSON.stringify(this.insights, null, 2));
    fs.writeFileSync(this.actionsPath, JSON.stringify(this.actions, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const engine = new RecommendationsEngine();

  switch (command) {
    case 'generate':
      if (args[1]) {
        const data = JSON.parse(args[1]);
        const recommendations = await engine.generateRecommendations(data);
        console.log('💡 Generated Recommendations:');
        console.log(JSON.stringify(recommendations, null, 2));
      } else {
        console.error('Usage: node recommendations.js generate <data-json>');
      }
      break;

    case 'insight':
      if (args[1] && args[2]) {
        const insight = await engine.generateInsight(args[1], JSON.parse(args[2]));
        console.log('💡 Generated Insight:');
        console.log(JSON.stringify(insight, null, 2));
      } else {
        console.error('Usage: node recommendations.js insight <type> <data-json>');
      }
      break;

    case 'summary':
      const summary = engine.getRecommendationsSummary();
      console.log('📊 Recommendations Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    default:
      console.log('💡 Actionable Recommendations Engine');
      console.log('');
      console.log('Commands:');
      console.log('  generate - Generate recommendations');
      console.log('  insight  - Generate insight');
      console.log('  summary  - Get recommendations summary');
      console.log('');
      console.log('Examples:');
      console.log('  node recommendations.js generate \'{"revenue":{}}\'');
      console.log('  node recommendations.js insight revenue \'{"mrr":1000}\'');
      console.log('  node recommendations.js summary');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  RecommendationsEngine
};
