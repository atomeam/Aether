/**
 * AI-Powered Forecasting Engine
 * Forecasts revenue, customers, and metrics using AI
 */

const fs = require('fs');
const path = require('path');

class AIForecastingEngine {
  constructor() {
    this.forecasts = [];
    this.models = [];
    this.historicalData = [];
    
    this.dataPath = path.resolve(__dirname, 'forecasts.json');
    this.modelsPath = path.resolve(__dirname, 'models.json');
    this.historicalPath = path.resolve(__dirname, 'historical.json');
    
    this.loadForecastingData();
  }

  // Generate revenue forecast
  async generateRevenueForecast(historicalRevenue, months = 12) {
    console.log('🔮 Generating AI revenue forecast...');
    
    const forecast = {
      id: this.generateForecastId(),
      type: 'revenue',
      months,
      timestamp: new Date().toISOString(),
      
      // AI analysis
      seasonality: this.analyzeSeasonality(historicalRevenue),
      trend: this.analyzeTrend(historicalRevenue),
      growthRate: this.calculateGrowthRate(historicalRevenue),
      volatility: this.calculateVolatility(historicalRevenue),
      
      // Forecast
      forecast: this.generateRevenueForecastData(historicalRevenue, months),
      
      // Confidence intervals
      confidence: this.calculateConfidenceIntervals(historicalRevenue, months),
      
      // AI recommendations
      recommendations: this.generateForecastRecommendations(historicalRevenue)
    };
    
    this.forecasts.push(forecast);
    this.saveForecastingData();
    
    return forecast;
  }

  // Analyze seasonality
  analyzeSeasonality(data) {
    // Simple seasonality analysis
    const monthlyData = this.groupByMonth(data);
    const averages = Object.values(monthlyData).map(month => month.reduce((sum, d) => sum + d, 0) / month.length);
    
    const seasonality = averages.map((avg, index) => ({
      month: index + 1,
      factor: avg / (averages.reduce((sum, a) => sum + a, 0) / averages.length)
    }));
    
    return seasonality;
  }

  // Group by month
  groupByMonth(data) {
    const grouped = {};
    
    data.forEach(d => {
      const month = new Date(d.timestamp).getMonth();
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(d.amount);
    });
    
    return grouped;
  }

  // Analyze trend
  analyzeTrend(data) {
    if (data.length < 2) {
      return { trend: 'insufficient_data', slope: 0 };
    }
    
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let slope = 0;
    for (let i = 1; i < sortedData.length; i++) {
      slope += (sortedData[i].amount - sortedData[i-1].amount);
    }
    slope /= (sortedData.length - 1);
    
    const trend = slope > 0 ? 'growing' : slope < 0 ? 'declining' : 'stable';
    
    return { trend, slope: slope.toFixed(2) };
  }

  // Calculate growth rate
  calculateGrowthRate(data) {
    if (data.length < 2) {
      return { monthOverMonth: 0, yearOverYear: 0 };
    }
    
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const first = sortedData[0].amount;
    const last = sortedData[sortedData.length - 1].amount;
    
    const months = (new Date(sortedData[sortedData.length - 1].timestamp) - new Date(sortedData[0].timestamp)) / (30 * 24 * 60 * 60 * 1000);
    
    const monthOverMonth = months > 0 ? ((last - first) / first / months * 100) : 0;
    const yearOverYear = monthOverMonth * 12;
    
    return {
      monthOverMonth: monthOverMonth.toFixed(2),
      yearOverYear: yearOverYear.toFixed(2)
    };
  }

  // Calculate volatility
  calculateVolatility(data) {
    if (data.length < 2) {
      return { volatility: 0, standardDeviation: 0 };
    }
    
    const amounts = data.map(d => d.amount);
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    const volatility = (standardDeviation / mean) * 100;
    
    return {
      volatility: volatility.toFixed(2),
      standardDeviation: standardDeviation.toFixed(2)
    };
  }

  // Generate revenue forecast data
  generateRevenueForecastData(historicalData, months) {
    const forecast = [];
    const lastAmount = historicalData[historicalData.length - 1].amount;
    const growthRate = this.calculateGrowthRate(historicalData);
    const seasonality = this.analyzeSeasonality(historicalData);
    const trend = this.analyzeTrend(historicalData);
    
    for (let i = 1; i <= months; i++) {
      const baseGrowth = lastAmount * Math.pow(1 + parseFloat(growthRate.monthOverMonth) / 100, i);
      const seasonalityFactor = seasonality.seasonality[i % 12]?.factor || 1;
      const trendAdjustment = trend.slope * i;
      
      const forecastAmount = baseGrowth * seasonalityFactor + trendAdjustment;
      
      forecast.push({
        month: i,
        amount: Math.max(0, forecastAmount).toFixed(2),
        confidence: this.calculateForecastConfidence(historicalData, i)
      });
    }
    
    return forecast;
  }

  // Calculate forecast confidence
  calculateForecastConfidence(historicalData, monthsAhead) {
    // Confidence decreases as we forecast further out
    const baseConfidence = 0.9;
    const decay = 0.05 * monthsAhead;
    
    return Math.max(0.5, baseConfidence - decay).toFixed(2);
  }

  // Calculate confidence intervals
  calculateConfidenceIntervals(historicalData, months) {
    const volatility = this.calculateVolatility(historicalData);
    const forecast = this.generateRevenueForecastData(historicalData, months);
    
    const intervals = forecast.map(f => {
      const stdDev = parseFloat(volatility.standardDeviation);
      const upper = parseFloat(f.amount) + (stdDev * 1.96);
      const lower = Math.max(0, parseFloat(f.amount) - (stdDev * 1.96));
      
      return {
        month: f.month,
        forecast: f.amount,
        upper: upper.toFixed(2),
        lower: lower.toFixed(2),
        confidence: f.confidence
      };
    });
    
    return intervals;
  }

  // Generate forecast recommendations
  generateForecastRecommendations(historicalData) {
    const trend = this.analyzeTrend(historicalData);
    const growthRate = this.calculateGrowthRate(historicalData);
    const volatility = this.calculateVolatility(historicalData);
    
    const recommendations = [];
    
    if (trend.trend === 'declining') {
      recommendations.push({
        priority: 'high',
        action: 'Investigate revenue decline',
        reason: 'Revenue trend is declining'
      });
    }
    
    if (parseFloat(growthRate.monthOverMonth) < 0) {
      recommendations.push({
        priority: 'high',
        action: 'Address negative growth',
        reason: 'Month-over-month growth is negative'
      });
    }
    
    if (parseFloat(volatility.volatility) > 20) {
      recommendations.push({
        priority: 'medium',
        action: 'Reduce revenue volatility',
        reason: 'Revenue volatility is high'
      });
    }
    
    if (parseFloat(growthRate.monthOverMonth) > 10) {
      recommendations.push({
        priority: 'low',
        action: 'Scale operations to maintain growth',
        reason: 'Strong growth trajectory'
      });
    }
    
    return recommendations;
  }

  // Generate customer forecast
  async generateCustomerForecast(historicalCustomers, months = 12) {
    console.log('🔮 Generating AI customer forecast...');
    
    const forecast = {
      id: this.generateForecastId(),
      type: 'customers',
      months,
      timestamp: new Date().toISOString(),
      
      // AI analysis
      growthRate: this.calculateCustomerGrowthRate(historicalCustomers),
      churnRate: this.calculateCustomerChurnRate(historicalCustomers),
      
      // Forecast
      forecast: this.generateCustomerForecastData(historicalCustomers, months),
      
      // Confidence
      confidence: this.calculateCustomerForecastConfidence(historicalCustomers, months)
    };
    
    this.forecasts.push(forecast);
    this.saveForecastingData();
    
    return forecast;
  }

  // Calculate customer growth rate
  calculateCustomerGrowthRate(data) {
    if (data.length < 2) {
      return { monthOverMonth: 0, yearOverYear: 0 };
    }
    
    const firstCount = data[0].count;
    const lastCount = data[data.length - 1].count;
    
    const months = data.length;
    const monthOverMonth = firstCount > 0 ? ((lastCount - firstCount) / firstCount / months * 100) : 0;
    const yearOverYear = monthOverMonth * 12;
    
    return {
      monthOverMonth: monthOverMonth.toFixed(2),
      yearOverYear: yearOverYear.toFixed(2)
    };
  }

  // Calculate customer churn rate
  calculateCustomerChurnRate(data) {
    const totalCustomers = data.reduce((sum, d) => sum + d.count, 0);
    const churnedCustomers = data.reduce((sum, d) => sum + d.churned, 0);
    
    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers * 100) : 0;
    
    return {
      churnRate: churnRate.toFixed(2),
      totalCustomers,
      churnedCustomers
    };
  }

  // Generate customer forecast data
  generateCustomerForecastData(historicalData, months) {
    const forecast = [];
    const lastCount = historicalData[historicalData.length - 1].count;
    const growthRate = this.calculateCustomerGrowthRate(historicalData);
    const churnRate = this.calculateCustomerChurnRate(historicalData);
    
    for (let i = 1; i <= months; i++) {
      const growth = lastCount * Math.pow(1 + parseFloat(growthRate.monthOverMonth) / 100, i);
      const churn = growth * (parseFloat(churnRate.churnRate) / 100);
      
      const forecastCount = Math.max(0, growth - churn);
      
      forecast.push({
        month: i,
        count: Math.round(forecastCount),
        added: Math.round(growth),
        churned: Math.round(churn)
      });
    }
    
    return forecast;
  }

  // Calculate customer forecast confidence
  calculateCustomerForecastConfidence(historicalData, monthsAhead) {
    const baseConfidence = 0.85;
    const decay = 0.03 * monthsAhead;
    
    return Math.max(0.6, baseConfidence - decay).toFixed(2);
  }

  // Generate metrics forecast
  async generateMetricsForecast(historicalMetrics, metrics, months = 12) {
    console.log('🔮 Generating AI metrics forecast...');
    
    const forecasts = {};
    
    for (const metric of metrics) {
      const metricData = historicalMetrics.filter(m => m.metric === metric);
      
      forecasts[metric] = {
        forecast: this.generateMetricForecastData(metricData, months),
        trend: this.analyzeTrend(metricData),
        growthRate: this.calculateGrowthRate(metricData)
      };
    }
    
    return {
      id: this.generateForecastId(),
      type: 'metrics',
      metrics,
      forecasts,
      months,
      timestamp: new Date().toISOString()
    };
  }

  // Generate metric forecast data
  generateMetricForecastData(data, months) {
    const forecast = [];
    const lastValue = data[data.length - 1].value;
    const growthRate = this.calculateGrowthRate(data);
    
    for (let i = 1; i <= months; i++) {
      const forecastValue = lastValue * Math.pow(1 + parseFloat(growthRate.monthOverMonth) / 100, i);
      
      forecast.push({
        month: i,
        value: forecastValue.toFixed(2)
      });
    }
    
    return forecast;
  }

  // Get forecast summary
  getForecastSummary() {
    const total = this.forecasts.length;
    const revenueForecasts = this.forecasts.filter(f => f.type === 'revenue');
    const customerForecasts = this.forecasts.filter(f => f.type === 'customers');
    const metricsForecasts = this.forecasts.filter(f => f.type === 'metrics');
    
    return {
      total,
      revenueForecasts: revenueForecasts.length,
      customerForecasts: customerForecasts.length,
      metricsForecasts: metricsForecasts.length
    };
  }

  // Generate forecast ID
  generateForecastId() {
    return `forecast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load forecasting data
  loadForecastingData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.forecasts = JSON.parse(data);
    }
    
    if (fs.existsSync(this.modelsPath)) {
      const data = fs.readFileSync(this.modelsPath, 'utf8');
      this.models = JSON.parse(data);
    }
    
    if (fs.existsSync(this.historicalPath)) {
      const data = fs.readFileSync(this.historicalPath, 'utf8');
      this.historicalData = JSON.parse(data);
    }
  }

  // Save forecasting data
  saveForecastingData() {
    if (this.forecasts.length > 100) {
      this.forecasts = this.forecasts.slice(-100);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify(this.forecasts, null, 2));
    fs.writeFileSync(this.modelsPath, JSON.stringify(this.models, null, 2));
    fs.writeFileSync(this.historicalPath, JSON.stringify(this.historicalData, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const forecaster = new AIForecastingEngine();

  switch (command) {
    case 'forecast-revenue':
      if (args[1]) {
        const historicalData = JSON.parse(args[1]);
        const forecast = await forecaster.generateRevenueForecast(historicalData, parseInt(args[2]) || 12);
        console.log('🔮 Revenue Forecast:');
        console.log(JSON.stringify(forecast, null, 2));
      } else {
        console.error('Usage: node ai-forecasting.js forecast-revenue <historical-data-json> [months]');
      }
      break;

    case 'forecast-customers':
      if (args[1]) {
        const historicalData = JSON.parse(args[1]);
        const forecast = await forecaster.generateCustomerForecast(historicalData, parseInt(args[2]) || 12);
        console.log('🔮 Customer Forecast:');
        console.log(JSON.stringify(forecast, null, 2));
      } else {
        console.error('Usage: node ai-forecasting.js forecast-customers <historical-data-json> [months]');
      }
      break;

    case 'summary':
      const summary = forecaster.getForecastSummary();
      console.log('📊 Forecast Summary:');
      console.log(JSON.stringify(summary, null, 2));
      break;

    default:
      console.log('🔮 AI-Powered Forecasting Engine');
      console.log('');
      console.log('Commands:');
      console.log('  forecast-revenue   - Generate revenue forecast');
      console.log('  forecast-customers - Generate customer forecast');
      console.log('  summary            - Get forecast summary');
      console.log('');
      console.log('Examples:');
      console.log('  node ai-forecasting.js forecast-revenue \'[{"amount":100}]\' 12');
      console.log('  node ai-forecasting.js forecast-customers \'[{"count":10}]\' 12');
      console.log('  node ai-forecasting.js summary');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  AIForecastingEngine
};
