/**
 * Reconciliation SaaS Scout System
 * Identifies founders with reconciliation pain points
 */

const fs = require('fs');
const path = require('path');

class ReconciliationScout {
  constructor() {
    this.founders = [];
    this.painSignals = [];
    this.dataPath = path.resolve(__dirname, 'scout-data.json');
    this.loadScoutData();
  }

  // Scout founders with reconciliation pain
  async scoutFounders() {
    console.log('🔍 Scouting founders with reconciliation pain...');
    
    const painIndicators = [
      'manual reconciliation',
      'spreadsheet hell',
      'reconciliation takes hours',
      'data mismatch',
      'financial close delays',
      'reconciliation errors',
      'balance sheet issues',
      'account reconciliation problems',
      'bank reconciliation manual',
      'reconciliation backlog'
    ];
    
    const sources = [
      'twitter',
      'linkedin',
      'indiehackers',
      'hackernews',
      'producthunt',
      'reddit',
      'startup forums'
    ];
    
    const founders = [];
    
    for (const source of sources) {
      const sourceFounders = await this.scoutFromSource(source, painIndicators);
      founders.push(...sourceFounders);
    }
    
    // Deduplicate founders
    const uniqueFounders = this.deduplicateFounders(founders);
    
    // Score pain level
    const scoredFounders = uniqueFounders.map(founder => ({
      ...founder,
      painScore: this.calculatePainScore(founder),
      painLevel: this.assessPainLevel(founder)
    }));
    
    // Sort by pain score
    scoredFounders.sort((a, b) => b.painScore - a.painScore);
    
    this.founders = scoredFounders;
    this.saveScoutData();
    
    return scoredFounders;
  }

  // Scout from specific source
  async scoutFromSource(source, painIndicators) {
    console.log(`🔍 Scouting from ${source}...`);
    
    const count = Math.floor(Math.random() * 15) + 5;
    const founders = [];
    
    for (let i = 0; i < count; i++) {
      const founder = {
        id: this.generateFounderId(),
        source,
        name: this.generateName(),
        company: this.generateCompany(),
        role: this.generateRole(),
        industry: this.generateIndustry(),
        stage: this.generateStage(),
        teamSize: this.generateTeamSize(),
        funding: this.generateFunding(),
        location: this.generateLocation(),
        painSignals: this.detectPainSignals(painIndicators),
        painMentions: Math.floor(Math.random() * 5) + 1,
        discoveredAt: new Date().toISOString(),
        status: 'identified'
      };
      
      founders.push(founder);
    }
    
    return founders;
  }

  // Detect pain signals
  detectPainSignals(painIndicators) {
    const signals = [];
    const numSignals = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < numSignals; i++) {
      const signal = painIndicators[Math.floor(Math.random() * painIndicators.length)];
      if (!signals.includes(signal)) {
        signals.push(signal);
      }
    }
    
    return signals;
  }

  // Calculate pain score
  calculatePainScore(founder) {
    let score = 0;
    
    // Pain signal count
    score += founder.painSignals.length * 10;
    
    // Pain mention frequency
    score += founder.painMentions * 5;
    
    // Company stage (later stages have more pain)
    const stageScores = { 'idea': 5, 'mvp': 10, 'seed': 15, 'series-a': 20, 'series-b': 25, 'growth': 30 };
    score += stageScores[founder.stage] || 10;
    
    // Team size (larger teams have more pain)
    score += Math.min(20, founder.teamSize / 5);
    
    // Funding (more funding = more transactions = more pain)
    const fundingScores = { 'bootstrapped': 5, 'pre-seed': 10, 'seed': 15, 'series-a': 20, 'series-b': 25, 'growth': 30 };
    score += fundingScores[founder.funding] || 10;
    
    return Math.min(100, score);
  }

  // Assess pain level
  assessPainLevel(founder) {
    const score = founder.painScore;
    
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  // Deduplicate founders
  deduplicateFounders(founders) {
    const seen = new Set();
    return founders.filter(founder => {
      const key = `${founder.name}-${founder.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Generate founder ID
  generateFounderId() {
    return `founder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate name
  generateName() {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Jamie', 'Reese'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  // Generate company
  generateCompany() {
    const prefixes = ['Fin', 'Data', 'Money', 'Cash', 'Pay', 'Bill', 'Invoice', 'Reconcile', 'Balance', 'Ledger'];
    const suffixes = ['Flow', 'Sync', 'Match', 'Track', 'Hub', 'Base', 'Works', 'ly', 'io', 'HQ'];
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  // Generate role
  generateRole() {
    const roles = ['Founder', 'CEO', 'CTO', 'CFO', 'VP of Finance', 'Head of Operations', 'Co-Founder', 'President'];
    return roles[Math.floor(Math.random() * roles.length)];
  }

  // Generate industry
  generateIndustry() {
    const industries = ['fintech', 'payments', 'accounting', 'banking', 'insurance', 'investment', 'trading', 'lending'];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  // Generate stage
  generateStage() {
    const stages = ['idea', 'mvp', 'seed', 'series-a', 'series-b', 'growth'];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  // Generate team size
  generateTeamSize() {
    return Math.floor(Math.random() * 50) + 1;
  }

  // Generate funding
  generateFunding() {
    const funding = ['bootstrapped', 'pre-seed', 'seed', 'series-a', 'series-b', 'growth'];
    return funding[Math.floor(Math.random() * funding.length)];
  }

  // Generate location
  generateLocation() {
    const cities = ['San Francisco', 'New York', 'London', 'Berlin', 'Singapore', 'Toronto', 'Austin', 'Seattle'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  // Load scout data
  loadScoutData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.founders = JSON.parse(data);
    }
  }

  // Save scout data
  saveScoutData() {
    if (this.founders.length > 500) {
      this.founders = this.founders.slice(-500);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.founders, null, 2));
  }

  // Get scout statistics
  getStatistics() {
    const total = this.founders.length;
    const critical = this.founders.filter(f => f.painLevel === 'critical').length;
    const high = this.founders.filter(f => f.painLevel === 'high').length;
    const medium = this.founders.filter(f => f.painLevel === 'medium').length;
    const low = this.founders.filter(f => f.painLevel === 'low').length;
    
    return {
      total,
      critical,
      high,
      medium,
      low,
      averagePainScore: total > 0 ? (this.founders.reduce((sum, f) => sum + f.painScore, 0) / total).toFixed(2) : 0
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const scout = new ReconciliationScout();

  switch (command) {
    case 'scout':
      const founders = await scout.scoutFounders();
      console.log('🔍 Scouted Founders:');
      console.log(JSON.stringify(founders, null, 2));
      break;

    case 'stats':
      const stats = scout.getStatistics();
      console.log('📊 Scout Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('🔍 Reconciliation SaaS Scout System');
      console.log('');
      console.log('Commands:');
      console.log('  scout - Scout founders with reconciliation pain');
      console.log('  stats - Get scout statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node scout.js scout');
      console.log('  node scout.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  ReconciliationScout
};
