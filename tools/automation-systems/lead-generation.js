/**
 * Autonomous Lead Generation System
 * Generates and qualifies leads automatically
 */

const fs = require('fs');
const path = require('path');

class LeadGenerationSystem {
  constructor() {
    this.leads = [];
    this.campaigns = [];
    this.outreach = [];
    
    this.dataPath = path.resolve(__dirname, 'lead-data.json');
    this.campaignsPath = path.resolve(__dirname, 'campaigns.json');
    this.outreachPath = path.resolve(__dirname, 'outreach.json');
    
    this.loadData();
  }

  // Identify potential leads
  async identifyLeads(targetProfile) {
    console.log('🎯 Identifying potential leads...');
    
    const leads = [];
    
    // Simulate lead identification from various sources
    const sources = [
      'linkedin',
      'twitter',
      'industry forums',
      'company websites',
      'event attendees'
    ];
    
    for (const source of sources) {
      const sourceLeads = await this.identifyLeadsFromSource(source, targetProfile);
      leads.push(...sourceLeads);
    }
    
    // Deduplicate leads
    const uniqueLeads = this.deduplicateLeads(leads);
    
    // Score leads
    const scoredLeads = uniqueLeads.map(lead => ({
      ...lead,
      score: this.calculateLeadScore(lead, targetProfile)
    }));
    
    // Sort by score
    scoredLeads.sort((a, b) => b.score - a.score);
    
    this.leads = scoredLeads;
    this.saveData();
    
    return scoredLeads;
  }

  // Identify leads from specific source
  async identifyLeadsFromSource(source, targetProfile) {
    console.log(`🔍 Identifying leads from ${source}...`);
    
    const count = Math.floor(Math.random() * 20) + 10;
    const leads = [];
    
    for (let i = 0; i < count; i++) {
      leads.push({
        id: this.generateLeadId(),
        source,
        name: this.generateName(),
        company: this.generateCompany(),
        title: this.generateTitle(),
        email: this.generateEmail(),
        industry: targetProfile.industry || 'technology',
        size: this.generateCompanySize(),
        location: this.generateLocation(),
        discoveredAt: new Date().toISOString(),
        status: 'identified'
      });
    }
    
    return leads;
  }

  // Calculate lead score
  calculateLeadScore(lead, targetProfile) {
    let score = 50; // Base score
    
    // Industry match
    if (lead.industry === targetProfile.industry) score += 20;
    
    // Company size match
    if (this.sizeMatch(lead.size, targetProfile.size)) score += 15;
    
    // Title match
    if (this.titleMatch(lead.title, targetProfile.titles)) score += 15;
    
    // Source quality
    const sourceQuality = { 'linkedin': 20, 'event attendees': 15, 'industry forums': 10, 'twitter': 5, 'company websites': 10 };
    score += sourceQuality[lead.source] || 5;
    
    return Math.min(100, score);
  }

  // Check size match
  sizeMatch(leadSize, targetSize) {
    const sizeMap = { 'startup': 1, 'small': 2, 'medium': 3, 'large': 4, 'enterprise': 5 };
    const leadSizeNum = sizeMap[leadSize] || 3;
    const targetSizeNum = sizeMap[targetSize] || 3;
    
    return Math.abs(leadSizeNum - targetSizeNum) <= 1;
  }

  // Check title match
  titleMatch(leadTitle, targetTitles) {
    return targetTitles.some(title => leadTitle.toLowerCase().includes(title.toLowerCase()));
  }

  // Generate personalized outreach
  async generateOutreach(lead, campaign) {
    console.log(`📧 Generating outreach for: ${lead.name}`);
    
    const outreach = {
      id: this.generateOutreachId(),
      leadId: lead.id,
      campaignId: campaign.id,
      timestamp: new Date().toISOString(),
      status: 'generated',
      
      // Personalization
      subject: this.generateSubject(lead, campaign),
      body: this.generateBody(lead, campaign),
      cta: this.generateCTA(lead, campaign),
      
      // Tracking
      sent: false,
      opened: false,
      clicked: false,
      responded: false
    };
    
    this.outreach.push(outreach);
    this.saveOutreach();
    
    return outreach;
  }

  // Generate subject line
  generateSubject(lead, campaign) {
    const templates = [
      `${lead.company} + ${campaign.valueProposition}`,
      `Quick question about ${lead.company}'s ${campaign.topic}`,
      `${campaign.valueProposition} for ${lead.company}`,
      `Thought of you: ${campaign.topic}`,
      `${lead.name}, ${campaign.personalization}`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Generate email body
  generateBody(lead, campaign) {
    return `
Hi ${lead.name},

I noticed that ${lead.company} is doing great work in ${lead.industry}. I'm reaching out because I thought our ${campaign.solution} could help you ${campaign.benefit}.

${campaign.personalization}

Would you be open to a quick 15-minute call to discuss how we might be able to help ${lead.company}?

Best regards,
${campaign.sender}
    `.trim();
  }

  // Generate CTA
  generateCTA(lead, campaign) {
    return {
      primary: 'Book a 15-minute call',
      secondary: 'Learn more',
      link: campaign.calendarLink
    };
  }

  // Qualify lead
  async qualifyLead(leadId) {
    console.log(`✅ Qualifying lead: ${leadId}`);
    
    const lead = this.leads.find(l => l.id === leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    const qualification = {
      budget: this.assessBudget(lead),
      timeline: this.assessTimeline(lead),
      authority: this.assessAuthority(lead),
      need: this.assessNeed(lead),
      fit: this.assessFit(lead),
      score: 0,
      qualified: false
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
    
    lead.qualification = qualification;
    lead.status = qualification.qualified ? 'qualified' : 'disqualified';
    
    this.saveData();
    
    return qualification;
  }

  // Assess budget
  assessBudget(lead) {
    const sizeBudget = {
      'startup': false,
      'small': true,
      'medium': true,
      'large': true,
      'enterprise': true
    };
    
    return sizeBudget[lead.size] || false;
  }

  // Assess timeline
  assessTimeline(lead) {
    // Random assessment
    return Math.random() > 0.3;
  }

  // Assess authority
  assessAuthority(lead) {
    const authorityTitles = ['CEO', 'CTO', 'VP', 'Director', 'Manager'];
    return authorityTitles.some(title => lead.title.includes(title));
  }

  // Assess need
  assessNeed(lead) {
    return Math.random() > 0.4;
  }

  // Assess fit
  assessFit(lead) {
    return Math.random() > 0.3;
  }

  // Nurture lead sequence
  async nurtureLead(leadId, sequence) {
    console.log(`📈 Nurturing lead: ${leadId}`);
    
    const lead = this.leads.find(l => l.id === leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    const nurtureSequence = {
      leadId,
      sequence,
      timestamp: new Date().toISOString(),
      steps: []
    };
    
    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      nurtureSequence.steps.push({
        step: i + 1,
        type: step.type,
        content: step.content,
        scheduledAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        sent: false,
        opened: false,
        clicked: false
      });
    }
    
    lead.nurtureSequence = nurtureSequence;
    lead.status = 'nurturing';
    
    this.saveData();
    
    return nurtureSequence;
  }

  // Schedule demo
  async scheduleDemo(leadId) {
    console.log(`📅 Scheduling demo for: ${leadId}`);
    
    const lead = this.leads.find(l => l.id === leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    const demo = {
      leadId,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 15,
      status: 'scheduled',
      attended: false
    };
    
    lead.demo = demo;
    lead.status = 'demo-scheduled';
    
    this.saveData();
    
    return demo;
  }

  // Track conversion
  async trackConversion(leadId, stage) {
    console.log(`📊 Tracking conversion for: ${leadId} - ${stage}`);
    
    const lead = this.leads.find(l => l.id === leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    const conversion = {
      leadId,
      stage,
      timestamp: new Date().toISOString(),
      value: this.getStageValue(stage)
    };
    
    if (!lead.conversions) {
      lead.conversions = [];
    }
    
    lead.conversions.push(conversion);
    lead.status = stage;
    
    if (stage === 'customer') {
      lead.customer = true;
      lead.customerAt = new Date().toISOString();
    }
    
    this.saveData();
    
    return conversion;
  }

  // Get stage value
  getStageValue(stage) {
    const values = {
      'identified': 0,
      'contacted': 10,
      'qualified': 50,
      'demo-scheduled': 100,
      'demo-completed': 200,
      'proposal': 500,
      'negotiation': 1000,
      'customer': 5000
    };
    
    return values[stage] || 0;
  }

  // Generate lead ID
  generateLeadId() {
    return `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate name
  generateName() {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  // Generate company
  generateCompany() {
    const prefixes = ['Tech', 'Digital', 'Cloud', 'Smart', 'Innovative', 'Global', 'Prime', 'Apex'];
    const suffixes = ['Solutions', 'Systems', 'Technologies', 'Labs', 'Works', 'Co', 'Inc', 'Corp'];
    
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  }

  // Generate title
  generateTitle() {
    const titles = ['CEO', 'CTO', 'VP of Engineering', 'Director of Marketing', 'Manager', 'Founder', 'President', 'Head of Sales'];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  // Generate email
  generateEmail() {
    const domains = ['gmail.com', 'outlook.com', 'company.com', 'tech.co'];
    const names = ['john', 'jane', 'mike', 'sarah', 'david', 'emily'];
    
    return `${names[Math.floor(Math.random() * names.length)]}@${domains[Math.floor(Math.random() * domains.length)]}`;
  }

  // Generate company size
  generateCompanySize() {
    const sizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  // Generate location
  generateLocation() {
    const cities = ['San Francisco', 'New York', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Singapore'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  // Generate outreach ID
  generateOutreachId() {
    return `outreach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load data
  loadData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.leads = JSON.parse(data);
    }
    
    if (fs.existsSync(this.campaignsPath)) {
      const data = fs.readFileSync(this.campaignsPath, 'utf8');
      this.campaigns = JSON.parse(data);
    }
    
    if (fs.existsSync(this.outreachPath)) {
      const data = fs.readFileSync(this.outreachPath, 'utf8');
      this.outreach = JSON.parse(data);
    }
  }

  // Save data
  saveData() {
    if (this.leads.length > 1000) {
      this.leads = this.leads.slice(-1000);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.leads, null, 2));
  }

  // Save campaigns
  saveCampaigns() {
    if (this.campaigns.length > 100) {
      this.campaigns = this.campaigns.slice(-100);
    }
    fs.writeFileSync(this.campaignsPath, JSON.stringify(this.campaigns, null, 2));
  }

  // Save outreach
  saveOutreach() {
    if (this.outreach.length > 1000) {
      this.outreach = this.outreach.slice(-1000);
    }
    fs.writeFileSync(this.outreachPath, JSON.stringify(this.outreach, null, 2));
  }

  // Deduplicate leads
  deduplicateLeads(leads) {
    const seen = new Set();
    return leads.filter(lead => {
      const key = `${lead.email}-${lead.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Get lead statistics
  getStatistics() {
    const total = this.leads.length;
    const qualified = this.leads.filter(l => l.status === 'qualified').length;
    const customers = this.leads.filter(l => l.customer).length;
    const totalValue = this.leads.reduce((sum, l) => {
      if (l.conversions) {
        const lastConversion = l.conversions[l.conversions.length - 1];
        return sum + lastConversion.value;
      }
      return sum;
    }, 0);
    
    return {
      total,
      qualified,
      customers,
      conversionRate: total > 0 ? (customers / total * 100).toFixed(2) : 0,
      totalValue,
      averageLeadScore: total > 0 ? (this.leads.reduce((sum, l) => sum + l.score, 0) / total).toFixed(2) : 0
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const leadGen = new LeadGenerationSystem();

  switch (command) {
    case 'identify':
      if (args[1]) {
        const targetProfile = JSON.parse(args[1]);
        const leads = await leadGen.identifyLeads(targetProfile);
        console.log('🎯 Identified Leads:');
        console.log(JSON.stringify(leads, null, 2));
      } else {
        console.error('Usage: node lead-generation.js identify <target-profile-json>');
      }
      break;

    case 'qualify':
      if (args[1]) {
        const qualification = await leadGen.qualifyLead(args[1]);
        console.log('✅ Lead Qualification:');
        console.log(JSON.stringify(qualification, null, 2));
      } else {
        console.error('Usage: node lead-generation.js qualify <lead-id>');
      }
      break;

    case 'outreach':
      if (args[1] && args[2]) {
        const lead = leadGen.leads.find(l => l.id === args[1]);
        const campaign = JSON.parse(args[2]);
        const outreach = await leadGen.generateOutreach(lead, campaign);
        console.log('📧 Generated Outreach:');
        console.log(JSON.stringify(outreach, null, 2));
      } else {
        console.error('Usage: node lead-generation.js outreach <lead-id> <campaign-json>');
      }
      break;

    case 'stats':
      const stats = leadGen.getStatistics();
      console.log('📊 Lead Generation Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('🎯 Autonomous Lead Generation System');
      console.log('');
      console.log('Commands:');
      console.log('  identify  - Identify potential leads');
      console.log('  qualify  - Qualify lead');
      console.log('  outreach  - Generate personalized outreach');
      console.log('  stats     - Get lead statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node lead-generation.js identify \'{"industry":"tech"}\'');
      console.log('  node lead-generation.js qualify lead-123');
      console.log('  node lead-generation.js outreach lead-123 \'{"name":"Campaign"}\'');
      console.log('  node lead-generation.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  LeadGenerationSystem
};
