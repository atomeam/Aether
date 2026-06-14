/**
 * Lead Qualification and Deduplication System
 * Qualifies and deduplicates founders into the Leads Queue
 */

const fs = require('fs');
const path = require('path');

class LeadQualifier {
  constructor() {
    this.leadsQueue = [];
    this.qualified = [];
    this.disqualified = [];
    this.dataPath = path.resolve(__dirname, 'leads-queue.json');
    this.loadLeadsData();
  }

  // Qualify and deduplicate founders
  async qualifyFounders(founders) {
    console.log('✅ Qualifying and deduplicating founders...');
    
    const results = {
      qualified: [],
      disqualified: [],
      duplicates: []
    };
    
    for (const founder of founders) {
      // Check for duplicates
      const duplicate = this.checkDuplicate(founder);
      
      if (duplicate) {
        results.duplicates.push({
          founder,
          existing: duplicate,
          reason: 'Duplicate lead'
        });
        continue;
      }
      
      // Qualify lead
      const qualification = await this.qualifyLead(founder);
      
      if (qualification.qualified) {
        results.qualified.push({
          founder,
          qualification
        });
        
        // Add to leads queue
        this.addToLeadsQueue(founder, qualification);
      } else {
        results.disqualified.push({
          founder,
          qualification
        });
      }
    }
    
    this.qualified.push(...results.qualified);
    this.disqualified.push(...results.disqualified);
    this.saveLeadsData();
    
    return results;
  }

  // Check for duplicate
  checkDuplicate(founder) {
    const duplicate = this.leadsQueue.find(lead => 
      lead.name === founder.name && lead.company === founder.company
    );
    
    return duplicate || null;
  }

  // Qualify lead
  async qualifyLead(founder) {
    console.log(`✅ Qualifying lead: ${founder.name} from ${founder.company}`);
    
    const qualification = {
      painScore: founder.painScore,
      painLevel: founder.painLevel,
      
      // Qualification criteria
      budget: this.assessBudget(founder),
      timeline: this.assessTimeline(founder),
      authority: this.assessAuthority(founder),
      need: this.assessNeed(founder),
      fit: this.assessFit(founder),
      
      // Overall qualification
      score: 0,
      qualified: false,
      reason: ''
    };
    
    // Calculate qualification score
    qualification.score = (
      (qualification.budget ? 25 : 0) +
      (qualification.timeline ? 25 : 0) +
      (qualification.authority ? 25 : 0) +
      (qualification.need ? 15 : 0) +
      (qualification.fit ? 10 : 0)
    );
    
    qualification.qualified = qualification.score >= 70;
    qualification.reason = qualification.qualified 
      ? 'Meets qualification criteria' 
      : 'Does not meet qualification criteria';
    
    return qualification;
  }

  // Assess budget
  assessBudget(founder) {
    const fundingBudget = {
      'bootstrapped': false,
      'pre-seed': false,
      'seed': true,
      'series-a': true,
      'series-b': true,
      'growth': true
    };
    
    return fundingBudget[founder.funding] || false;
  }

  // Assess timeline
  assessTimeline(founder) {
    // Founders with high pain score have urgent timeline
    return founder.painScore >= 50;
  }

  // Assess authority
  assessAuthority(founder) {
    const authorityRoles = ['Founder', 'CEO', 'CTO', 'CFO', 'VP of Finance', 'Co-Founder', 'President'];
    return authorityRoles.some(role => founder.role.includes(role));
  }

  // Assess need
  assessNeed(founder) {
    // High pain score indicates strong need
    return founder.painScore >= 40;
  }

  // Assess fit
  assessFit(founder) {
    // Fintech companies are better fit
    const fitIndustries = ['fintech', 'payments', 'accounting', 'banking'];
    return fitIndustries.includes(founder.industry);
  }

  // Add to leads queue
  addToLeadsQueue(founder, qualification) {
    const lead = {
      id: this.generateLeadId(),
      founderId: founder.id,
      name: founder.name,
      company: founder.company,
      role: founder.role,
      industry: founder.industry,
      stage: founder.stage,
      teamSize: founder.teamSize,
      funding: founder.funding,
      location: founder.location,
      painSignals: founder.painSignals,
      painScore: founder.painScore,
      painLevel: founder.painLevel,
      qualification,
      status: 'qualified',
      queuedAt: new Date().toISOString(),
      outreachGenerated: false,
      outreachSent: false,
      responded: false
    };
    
    this.leadsQueue.push(lead);
    this.saveLeadsData();
    
    return lead;
  }

  // Get leads queue
  getLeadsQueue() {
    return this.leadsQueue;
  }

  // Get lead by ID
  getLeadById(id) {
    return this.leadsQueue.find(lead => lead.id === id);
  }

  // Update lead status
  updateLeadStatus(id, status) {
    const lead = this.leadsQueue.find(l => l.id === id);
    
    if (lead) {
      lead.status = status;
      lead.updatedAt = new Date().toISOString();
      this.saveLeadsData();
    }
    
    return lead;
  }

  // Generate lead ID
  generateLeadId() {
    return `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load leads data
  loadLeadsData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      this.leadsQueue = parsed.leadsQueue || [];
      this.qualified = parsed.qualified || [];
      this.disqualified = parsed.disqualified || [];
    }
  }

  // Save leads data
  saveLeadsData() {
    if (this.leadsQueue.length > 1000) {
      this.leadsQueue = this.leadsQueue.slice(-1000);
    }
    if (this.qualified.length > 1000) {
      this.qualified = this.qualified.slice(-1000);
    }
    if (this.disqualified.length > 1000) {
      this.disqualified = this.disqualified.slice(-1000);
    }
    
    fs.writeFileSync(this.dataPath, JSON.stringify({
      leadsQueue: this.leadsQueue,
      qualified: this.qualified,
      disqualified: this.disqualified
    }, null, 2));
  }

  // Get statistics
  getStatistics() {
    const total = this.leadsQueue.length;
    const outreachGenerated = this.leadsQueue.filter(l => l.outreachGenerated).length;
    const outreachSent = this.leadsQueue.filter(l => l.outreachSent).length;
    const responded = this.leadsQueue.filter(l => l.responded).length;
    
    return {
      total,
      outreachGenerated,
      outreachSent,
      responded,
      conversionRate: total > 0 ? (responded / total * 100).toFixed(2) : 0
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const qualifier = new LeadQualifier();

  switch (command) {
    case 'qualify':
      if (args[1]) {
        const founders = JSON.parse(args[1]);
        const results = await qualifier.qualifyFounders(founders);
        console.log('✅ Qualification Results:');
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.error('Usage: node qualifier.js qualify <founders-json>');
      }
      break;

    case 'queue':
      const queue = qualifier.getLeadsQueue();
      console.log('📋 Leads Queue:');
      console.log(JSON.stringify(queue, null, 2));
      break;

    case 'stats':
      const stats = qualifier.getStatistics();
      console.log('📊 Qualification Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('✅ Lead Qualification and Deduplication System');
      console.log('');
      console.log('Commands:');
      console.log('  qualify - Qualify and deduplicate founders');
      console.log('  queue   - Get leads queue');
      console.log('  stats   - Get qualification statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node qualifier.js qualify \'[{"name":"Test"}]\'');
      console.log('  node qualifier.js queue');
      console.log('  node qualifier.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  LeadQualifier
};
