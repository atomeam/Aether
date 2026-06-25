/**
 * Personalized Outreach Generator for Reconciliation
 * Drafts personalized outreach per lead
 */

const fs = require('fs');
const path = require('path');

class ReconciliationOutreach {
  constructor() {
    this.outreach = [];
    this.templates = [];
    this.dataPath = path.resolve(__dirname, 'outreach-data.json');
    this.templatesPath = path.resolve(__dirname, 'outreach-templates.json');
    this.loadOutreachData();
  }

  // Generate personalized outreach for lead
  async generateOutreach(lead) {
    console.log(`📧 Generating personalized outreach for: ${lead.name} from ${lead.company}`);
    
    const outreach = {
      id: this.generateOutreachId(),
      leadId: lead.id,
      leadName: lead.name,
      company: lead.company,
      role: lead.role,
      industry: lead.industry,
      painSignals: lead.painSignals,
      painLevel: lead.painLevel,
      timestamp: new Date().toISOString(),
      status: 'generated',
      
      // Personalized content
      subject: this.generateSubject(lead),
      body: this.generateBody(lead),
      cta: this.generateCTA(lead),
      personalization: this.generatePersonalization(lead),
      
      // Tracking
      sent: false,
      opened: false,
      clicked: false,
      responded: false
    };
    
    this.outreach.push(outreach);
    this.saveOutreachData();
    
    // Update lead status
    this.updateLeadOutreachGenerated(lead.id);
    
    return outreach;
  }

  // Generate subject line
  generateSubject(lead) {
    const templates = [
      `Reconciliation at ${lead.company}`,
      `Quick question about ${lead.company}'s financial close`,
      `${lead.name}, noticed something about ${lead.company}`,
      `Helping ${lead.company} with reconciliation`,
      `Reconciliation pain at ${lead.company}?`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Generate email body
  generateBody(lead) {
    const pain = this.getPrimaryPain(lead);
    const personalization = this.generatePersonalization(lead);
    
    return `
Hi ${lead.name},

I noticed ${personalization}. 

I've been following ${lead.company} and saw you mentioned ${pain}. This is a common challenge for ${lead.industry} companies at the ${lead.stage} stage.

We help founders automate reconciliation and reduce financial close time by 80%. Our customers typically save 20+ hours per month and eliminate reconciliation errors.

Would you be open to a 15-minute call to see if we can help ${lead.company}?

Best regards,
[Your Name]
Founder, [Your Company]
    `.trim();
  }

  // Generate CTA
  generateCTA(lead) {
    return {
      primary: 'Book a 15-minute call',
      secondary: 'Learn more',
      link: 'https://calendly.com/demo'
    };
  }

  // Generate personalization
  generatePersonalization(lead) {
    const personalizations = [
      `you're dealing with manual reconciliation`,
      `reconciliation is taking up valuable time at ${lead.company}`,
      `your team is struggling with spreadsheet-based reconciliation`,
      `you mentioned ${lead.painSignals[0] || 'reconciliation challenges'}`,
      `${lead.company} is growing and reconciliation is becoming complex`
    ];
    
    return personalizations[Math.floor(Math.random() * personalizations.length)];
  }

  // Get primary pain
  getPrimaryPain(lead) {
    return lead.painSignals[0] || 'reconciliation challenges';
  }

  // Generate outreach for all leads in queue
  async generateOutreachForQueue(leadsQueue) {
    console.log('📧 Generating outreach for all leads in queue...');
    
    const results = [];
    
    for (const lead of leadsQueue) {
      if (!lead.outreachGenerated) {
        const outreach = await this.generateOutreach(lead);
        results.push(outreach);
      }
    }
    
    return results;
  }

  // Send outreach
  async sendOutreach(outreachId) {
    console.log(`📤 Sending outreach: ${outreachId}`);
    
    const outreach = this.outreach.find(o => o.id === outreachId);
    
    if (!outreach) {
      throw new Error('Outreach not found');
    }
    
    outreach.sent = true;
    outreach.sentAt = new Date().toISOString();
    outreach.status = 'sent';
    
    this.saveOutreachData();
    
    // Update lead status
    this.updateLeadOutreachSent(outreach.leadId);
    
    return outreach;
  }

  // Track engagement
  async trackEngagement(outreachId, type) {
    console.log(`📊 Tracking engagement: ${outreachId} - ${type}`);
    
    const outreach = this.outreach.find(o => o.id === outreachId);
    
    if (!outreach) {
      throw new Error('Outreach not found');
    }
    
    switch (type) {
      case 'opened':
        outreach.opened = true;
        outreach.openedAt = new Date().toISOString();
        break;
      case 'clicked':
        outreach.clicked = true;
        outreach.clickedAt = new Date().toISOString();
        break;
      case 'responded':
        outreach.responded = true;
        outreach.respondedAt = new Date().toISOString();
        break;
    }
    
    this.saveOutreachData();
    
    if (type === 'responded') {
      this.updateLeadResponded(outreach.leadId);
    }
    
    return outreach;
  }

  // Update lead outreach generated
  updateLeadOutreachGenerated(leadId) {
    // This would update the lead in the qualifier system
    // For now, we'll just log it
    console.log(`✅ Updated lead ${leadId} as outreach generated`);
  }

  // Update lead outreach sent
  updateLeadOutreachSent(leadId) {
    console.log(`📤 Updated lead ${leadId} as outreach sent`);
  }

  // Update lead responded
  updateLeadResponded(leadId) {
    console.log(`💬 Updated lead ${leadId} as responded`);
  }

  // Generate outreach ID
  generateOutreachId() {
    return `outreach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load outreach data
  loadOutreachData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.outreach = JSON.parse(data);
    }
    
    if (fs.existsSync(this.templatesPath)) {
      const data = fs.readFileSync(this.templatesPath, 'utf8');
      this.templates = JSON.parse(data);
    }
  }

  // Save outreach data
  saveOutreachData() {
    if (this.outreach.length > 1000) {
      this.outreach = this.outreach.slice(-1000);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.outreach, null, 2));
  }

  // Get outreach statistics
  getStatistics() {
    const total = this.outreach.length;
    const sent = this.outreach.filter(o => o.sent).length;
    const opened = this.outreach.filter(o => o.opened).length;
    const clicked = this.outreach.filter(o => o.clicked).length;
    const responded = this.outreach.filter(o => o.responded).length;
    
    return {
      total,
      sent,
      opened,
      clicked,
      responded,
      openRate: sent > 0 ? (opened / sent * 100).toFixed(2) : 0,
      clickRate: opened > 0 ? (clicked / opened * 100).toFixed(2) : 0,
      responseRate: sent > 0 ? (responded / sent * 100).toFixed(2) : 0
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const outreach = new ReconciliationOutreach();

  switch (command) {
    case 'generate':
      if (args[1]) {
        const lead = JSON.parse(args[1]);
        const result = await outreach.generateOutreach(lead);
        console.log('📧 Generated Outreach:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node outreach.js generate <lead-json>');
      }
      break;

    case 'send':
      if (args[1]) {
        const result = await outreach.sendOutreach(args[1]);
        console.log('📤 Sent Outreach:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node outreach.js send <outreach-id>');
      }
      break;

    case 'track':
      if (args[1] && args[2]) {
        const result = await outreach.trackEngagement(args[1], args[2]);
        console.log('📊 Tracked Engagement:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node outreach.js track <outreach-id> <type>');
      }
      break;

    case 'stats':
      const stats = outreach.getStatistics();
      console.log('📊 Outreach Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('📧 Personalized Outreach Generator for Reconciliation');
      console.log('');
      console.log('Commands:');
      console.log('  generate - Generate personalized outreach');
      console.log('  send     - Send outreach');
      console.log('  track    - Track engagement');
      console.log('  stats    - Get outreach statistics');
      console.log('');
      console.log('Examples:');
      console.log('  node outreach.js generate \'{"name":"Test"}\'');
      console.log('  node outreach.js send outreach-123');
      console.log('  node outreach.js track outreach-123 opened');
      console.log('  node outreach.js stats');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  ReconciliationOutreach
};
