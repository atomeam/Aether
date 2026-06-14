/**
 * Market Research and Opportunity Scanner
 * Automatically identifies profitable micro-SaaS opportunities
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class MarketResearchScanner {
  constructor() {
    this.opportunities = [];
    this.sources = [
      'producthunt',
      'indiehackers',
      'hackernews',
      'reddit',
      'g2',
      'capterra'
    ];
    this.dataPath = path.resolve(__dirname, 'market-opportunities.json');
    this.loadOpportunities();
  }

  // Scan Product Hunt for trending products
  async scanProductHunt() {
    console.log('🔍 Scanning Product Hunt for opportunities...');
    
    const opportunities = [];
    
    // Simulate Product Hunt API calls (in production, use actual API)
    const trendingProducts = [
      { name: 'AI Resume Builder', description: 'AI-powered resume optimization', upvotes: 450, category: 'productivity' },
      { name: 'Social Media Scheduler', description: 'Automated social posting', upvotes: 320, category: 'marketing' },
      { name: 'Invoice Generator', description: 'Create professional invoices', upvotes: 280, category: 'finance' },
      { name: 'Meeting Notes AI', description: 'AI meeting transcription', upvotes: 520, category: 'productivity' },
      { name: 'Email Template Builder', description: 'Beautiful email templates', upvotes: 190, category: 'marketing' }
    ];

    trendingProducts.forEach(product => {
      const opportunity = this.analyzeProduct(product);
      if (opportunity.score > 50) {
        opportunities.push(opportunity);
      }
    });

    return opportunities;
  }

  // Scan Indie Hackers for successful products
  async scanIndieHackers() {
    console.log('🔍 Scanning Indie Hackers for opportunities...');
    
    const opportunities = [];
    
    const successfulProducts = [
      { name: 'Newsletter Platform', description: 'Email newsletter management', revenue: 5000, category: 'marketing' },
      { name: 'Time Tracking Tool', description: 'Employee time tracking', revenue: 3000, category: 'productivity' },
      { name: 'CRM for Freelancers', description: 'Simple CRM for solopreneurs', revenue: 2000, category: 'business' },
      { name: 'Project Management', description: 'Lightweight project management', revenue: 4000, category: 'productivity' },
      { name: 'Analytics Dashboard', description: 'Business analytics for small teams', revenue: 3500, category: 'analytics' }
    ];

    successfulProducts.forEach(product => {
      const opportunity = this.analyzeIndieProduct(product);
      if (opportunity.score > 50) {
        opportunities.push(opportunity);
      }
    });

    return opportunities;
  }

  // Scan Hacker News for discussions
  async scanHackerNews() {
    console.log('🔍 Scanning Hacker News for opportunities...');
    
    const opportunities = [];
    
    const trendingTopics = [
      { title: 'Looking for simple project management tool', comments: 120, category: 'productivity' },
      { title: 'Need better email marketing solution', comments: 85, category: 'marketing' },
      { title: 'Invoice software recommendations', comments: 65, category: 'finance' },
      { title: 'Best tools for remote teams', comments: 200, category: 'productivity' },
      { title: 'Simple CRM for small business', comments: 95, category: 'business' }
    ];

    trendingTopics.forEach(topic => {
      const opportunity = this.analyzeHNTopic(topic);
      if (opportunity.score > 50) {
        opportunities.push(opportunity);
      }
    });

    return opportunities;
  }

  // Analyze a product for opportunity potential
  analyzeProduct(product) {
    const score = this.calculateOpportunityScore(product);
    
    return {
      source: 'producthunt',
      name: product.name,
      description: product.description,
      category: product.category,
      upvotes: product.upvotes,
      score: score,
      potentialRevenue: this.estimateRevenue(score),
      competition: this.assessCompetition(product.category),
      difficulty: this.assessDifficulty(product.category),
      timestamp: new Date().toISOString()
    };
  }

  // Analyze indie product for opportunity
  analyzeIndieProduct(product) {
    const score = this.calculateIndieScore(product);
    
    return {
      source: 'indiehackers',
      name: product.name,
      description: product.description,
      category: product.category,
      monthlyRevenue: product.revenue,
      score: score,
      potentialRevenue: this.estimateRevenue(score),
      competition: this.assessCompetition(product.category),
      difficulty: this.assessDifficulty(product.category),
      timestamp: new Date().toISOString()
    };
  }

  // Analyze HN topic for opportunity
  analyzeHNTopic(topic) {
    const score = this.calculateHNScore(topic);
    
    const opportunityName = this.generateOpportunityName(topic.title);
    
    return {
      source: 'hackernews',
      name: opportunityName,
      description: topic.title,
      category: topic.category,
      comments: topic.comments,
      score: score,
      potentialRevenue: this.estimateRevenue(score),
      competition: this.assessCompetition(topic.category),
      difficulty: this.assessDifficulty(topic.category),
      timestamp: new Date().toISOString()
    };
  }

  // Calculate opportunity score (0-100)
  calculateOpportunityScore(product) {
    let score = 0;
    
    // Upvotes indicate interest
    score += Math.min(product.upvotes / 10, 50);
    
    // Category bonus
    const categoryBonus = {
      'productivity': 20,
      'marketing': 15,
      'finance': 25,
      'business': 20,
      'analytics': 15
    };
    score += categoryBonus[product.category] || 10;
    
    // Description complexity (simpler = easier to build)
    const wordCount = product.description.split(' ').length;
    if (wordCount < 5) score += 10;
    else if (wordCount < 10) score += 5;
    
    return Math.min(score, 100);
  }

  // Calculate indie product score
  calculateIndieScore(product) {
    let score = 0;
    
    // Revenue indicates market demand
    score += Math.min(product.revenue / 100, 40);
    
    // Category bonus
    const categoryBonus = {
      'productivity': 20,
      'marketing': 15,
      'business': 25,
      'analytics': 15
    };
    score += categoryBonus[product.category] || 10;
    
    // Simplicity bonus
    const wordCount = product.description.split(' ').length;
    if (wordCount < 5) score += 15;
    else if (wordCount < 10) score += 10;
    
    return Math.min(score, 100);
  }

  // Calculate HN topic score
  calculateHNScore(topic) {
    let score = 0;
    
    // Comments indicate interest
    score += Math.min(topic.comments / 2, 40);
    
    // Category bonus
    const categoryBonus = {
      'productivity': 25,
      'marketing': 20,
      'finance': 30,
      'business': 25,
      'analytics': 20
    };
    score += categoryBonus[topic.category] || 15;
    
    // "Looking for" indicates unmet need
    if (topic.title.toLowerCase().includes('looking for') || 
        topic.title.toLowerCase().includes('need') ||
        topic.title.toLowerCase().includes('recommend')) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }

  // Estimate potential revenue based on score
  estimateRevenue(score) {
    if (score > 80) return '$5,000-10,000/month';
    if (score > 60) return '$2,000-5,000/month';
    if (score > 40) return '$1,000-2,000/month';
    return '$500-1,000/month';
  }

  // Assess competition level
  assessCompetition(category) {
    const competitionLevels = {
      'productivity': 'high',
      'marketing': 'high',
      'finance': 'medium',
      'business': 'medium',
      'analytics': 'medium'
    };
    return competitionLevels[category] || 'high';
  }

  // Assess development difficulty
  assessDifficulty(category) {
    const difficultyLevels = {
      'productivity': 'medium',
      'marketing': 'low',
      'finance': 'medium',
      'business': 'medium',
      'analytics': 'high'
    };
    return difficultyLevels[category] || 'medium';
  }

  // Generate opportunity name from HN topic
  generateOpportunityName(title) {
    const keywords = title.toLowerCase().split(' ');
    const actionWords = ['looking', 'need', 'want', 'searching', 'seeking'];
    
    let startIndex = 0;
    for (let i = 0; i < keywords.length; i++) {
      if (actionWords.includes(keywords[i])) {
        startIndex = i + 1;
        break;
      }
    }
    
    const opportunityWords = keywords.slice(startIndex).slice(0, 4);
    return opportunityWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Run full market scan
  async runFullScan() {
    console.log('🚀 Starting full market research scan...\n');
    
    const startTime = Date.now();
    
    const productHuntOpportunities = await this.scanProductHunt();
    const indieHackersOpportunities = await this.scanIndieHackers();
    const hackerNewsOpportunities = await this.scanHackerNews();
    
    const allOpportunities = [
      ...productHuntOpportunities,
      ...indieHackersOpportunities,
      ...hackerNewsOpportunities
    ];
    
    // Deduplicate and sort by score
    const uniqueOpportunities = this.deduplicateOpportunities(allOpportunities);
    uniqueOpportunities.sort((a, b) => b.score - a.score);
    
    const scanDuration = Date.now() - startTime;
    
    this.opportunities = uniqueOpportunities;
    this.saveOpportunities();
    
    console.log(`\n✅ Scan complete in ${scanDuration}ms`);
    console.log(`📊 Found ${uniqueOpportunities.length} opportunities`);
    console.log(`🏆 Top opportunity: ${uniqueOpportunities[0]?.name} (score: ${uniqueOpportunities[0]?.score})`);
    
    return uniqueOpportunities;
  }

  // Remove duplicate opportunities
  deduplicateOpportunities(opportunities) {
    const seen = new Set();
    return opportunities.filter(opp => {
      const key = `${opp.name}-${opp.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Get top opportunities
  getTopOpportunities(count = 10) {
    return this.opportunities.slice(0, count);
  }

  // Get opportunities by category
  getOpportunitiesByCategory(category) {
    return this.opportunities.filter(opp => opp.category === category);
  }

  // Get opportunities by difficulty
  getOpportunitiesByDifficulty(difficulty) {
    return this.opportunities.filter(opp => opp.difficulty === difficulty);
  }

  // Load opportunities from file
  loadOpportunities() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.opportunities = JSON.parse(data);
    }
  }

  // Save opportunities to file
  saveOpportunities() {
    // Keep only last 500 opportunities
    if (this.opportunities.length > 500) {
      this.opportunities = this.opportunities.slice(-500);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.opportunities, null, 2));
  }

  // Generate market report
  generateMarketReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalOpportunities: this.opportunities.length,
      topOpportunities: this.getTopOpportunities(5),
      byCategory: {},
      byDifficulty: {},
      averageScore: 0,
      highValueOpportunities: 0
    };

    // Group by category
    this.opportunities.forEach(opp => {
      if (!report.byCategory[opp.category]) {
        report.byCategory[opp.category] = 0;
      }
      report.byCategory[opp.category]++;
    });

    // Group by difficulty
    this.opportunities.forEach(opp => {
      if (!report.byDifficulty[opp.difficulty]) {
        report.byDifficulty[opp.difficulty] = 0;
      }
      report.byDifficulty[opp.difficulty]++;
    });

    // Calculate average score
    const totalScore = this.opportunities.reduce((sum, opp) => sum + opp.score, 0);
    report.averageScore = this.opportunities.length > 0 ? (totalScore / this.opportunities.length).toFixed(2) : 0;

    // Count high value opportunities
    report.highValueOpportunities = this.opportunities.filter(opp => opp.score > 70).length;

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const scanner = new MarketResearchScanner();

  switch (command) {
    case 'scan':
      const opportunities = await scanner.runFullScan();
      console.log('\n📋 Top Opportunities:');
      console.log(JSON.stringify(scanner.getTopOpportunities(10), null, 2));
      break;

    case 'top':
      const count = parseInt(args[1]) || 10;
      const topOpps = scanner.getTopOpportunities(count);
      console.log(`🏆 Top ${count} Opportunities:`);
      console.log(JSON.stringify(topOpps, null, 2));
      break;

    case 'category':
      const category = args[1];
      if (category) {
        const catOpps = scanner.getOpportunitiesByCategory(category);
        console.log(`📂 ${category} Opportunities:`);
        console.log(JSON.stringify(catOpps, null, 2));
      } else {
        console.error('Usage: node market-research.js category <category-name>');
      }
      break;

    case 'difficulty':
      const difficulty = args[1];
      if (difficulty) {
        const diffOpps = scanner.getOpportunitiesByDifficulty(difficulty);
        console.log(`🎯 ${difficulty} Difficulty Opportunities:`);
        console.log(JSON.stringify(diffOpps, null, 2));
      } else {
        console.error('Usage: node market-research.js difficulty <level>');
      }
      break;

    case 'report':
      const report = scanner.generateMarketReport();
      console.log('📊 Market Research Report:');
      console.log(JSON.stringify(report, null, 2));
      break;

    default:
      console.log('🔍 Market Research and Opportunity Scanner');
      console.log('');
      console.log('Commands:');
      console.log('  scan       - Run full market research scan');
      console.log('  top        - Show top opportunities');
      console.log('  category   - Show opportunities by category');
      console.log('  difficulty - Show opportunities by difficulty');
      console.log('  report     - Generate market research report');
      console.log('');
      console.log('Examples:');
      console.log('  node market-research.js scan');
      console.log('  node market-research.js top 5');
      console.log('  node market-research.js category productivity');
      console.log('  node market-research.js difficulty low');
      console.log('  node market-research.js report');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  MarketResearchScanner
};
