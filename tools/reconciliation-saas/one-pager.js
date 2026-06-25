/**
 * One-Pager Maintenance System
 * Keeps the reconciliation offer one-pager current
 */

const fs = require('fs');
const path = require('path');

class OnePagerMaintenance {
  constructor() {
    this.onePager = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      content: this.getDefaultOnePager()
    };
    
    this.updates = [];
    this.dataPath = path.resolve(__dirname, 'one-pager.json');
    this.updatesPath = path.resolve(__dirname, 'one-pager-updates.json');
    this.loadOnePagerData();
  }

  // Get default one-pager content
  getDefaultOnePager() {
    return {
      headline: 'Automate Reconciliation. Close Faster.',
      subheadline: 'Reduce financial close time by 80% with AI-powered reconciliation automation',
      
      problem: {
        title: 'The Problem',
        points: [
          'Manual reconciliation takes 20+ hours per month',
          'Spreadsheet errors lead to financial discrepancies',
          'Financial close delays impact business decisions',
          'Team spends more time reconciling than analyzing'
        ]
      },
      
      solution: {
        title: 'Our Solution',
        points: [
          'AI-powered automated reconciliation',
          'Real-time data matching and validation',
          'Exception handling and workflow automation',
          'Audit-ready reports and documentation'
        ]
      },
      
      benefits: {
        title: 'Benefits',
        points: [
          'Save 20+ hours per month',
          'Reduce reconciliation errors by 95%',
          'Close financials 3x faster',
          'Improve cash flow visibility'
        ]
      },
      
      features: {
        title: 'Key Features',
        points: [
          'Bank reconciliation automation',
          'Credit card matching',
          'Account reconciliation',
          'Balance sheet verification',
          'Custom rule engine',
          'API integrations'
        ]
      },
      
      pricing: {
        title: 'Pricing',
        plans: [
          {
            name: 'Starter',
            price: '$299/month',
            features: ['Up to 100 transactions/month', 'Bank reconciliation', 'Email support']
          },
          {
            name: 'Growth',
            price: '$799/month',
            features: ['Up to 1,000 transactions/month', 'All reconciliation types', 'Priority support', 'API access']
          },
          {
            name: 'Enterprise',
            price: 'Custom',
            features: ['Unlimited transactions', 'Custom integrations', 'Dedicated support', 'SLA']
          }
        ]
      },
      
      socialProof: {
        title: 'Trusted by',
        companies: ['Company A', 'Company B', 'Company C'],
        testimonials: [
          {
            quote: 'Reduced our close time from 5 days to 1 day',
            author: 'CFO, Company A'
          },
          {
            quote: 'Eliminated reconciliation errors completely',
            author: 'Founder, Company B'
          }
        ]
      },
      
      cta: {
        primary: 'Book a Demo',
        secondary: 'Learn More',
        link: 'https://calendly.com/demo'
      }
    };
  }

  // Update one-pager section
  async updateSection(section, content) {
    console.log(`📝 Updating one-pager section: ${section}`);
    
    const oldContent = this.onePager.content[section];
    
    this.onePager.content[section] = content;
    this.onePager.version = this.incrementVersion(this.onePager.version);
    this.onePager.lastUpdated = new Date().toISOString();
    
    const update = {
      section,
      oldContent,
      newContent: content,
      version: this.onePager.version,
      timestamp: new Date().toISOString()
    };
    
    this.updates.push(update);
    this.saveOnePagerData();
    
    return update;
  }

  // Update pricing
  async updatePricing(pricing) {
    console.log('💰 Updating pricing...');
    
    return await this.updateSection('pricing', pricing);
  }

  // Update features
  async updateFeatures(features) {
    console.log('✨ Updating features...');
    
    return await this.updateSection('features', features);
  }

  // Update testimonials
  async updateTestimonials(testimonials) {
    console.log('💬 Updating testimonials...');
    
    return await this.updateSection('socialProof', { ...this.onePager.content.socialProof, testimonials });
  }

  // Update CTA
  async updateCTA(cta) {
    console.log('🎯 Updating CTA...');
    
    return await this.updateSection('cta', cta);
  }

  // Refresh one-pager with latest data
  async refreshOnePager() {
    console.log('🔄 Refreshing one-pager with latest data...');
    
    // Get latest customer data
    const latestCustomers = await this.getLatestCustomers();
    
    // Get latest testimonials
    const latestTestimonials = await this.getLatestTestimonials();
    
    // Update social proof
    await this.updateSection('socialProof', {
      ...this.onePager.content.socialProof,
      companies: latestCustomers,
      testimonials: latestTestimonials
    });
    
    // Update version
    this.onePager.version = this.incrementVersion(this.onePager.version);
    this.onePager.lastUpdated = new Date().toISOString();
    
    this.saveOnePagerData();
    
    return this.onePager;
  }

  // Get latest customers
  async getLatestCustomers() {
    // In production, would fetch from database
    return ['Company A', 'Company B', 'Company C', 'Company D', 'Company E'];
  }

  // Get latest testimonials
  async getLatestTestimonials() {
    // In production, would fetch from database
    return [
      {
        quote: 'Reduced our close time from 5 days to 1 day',
        author: 'CFO, Company A'
      },
      {
        quote: 'Eliminated reconciliation errors completely',
        author: 'Founder, Company B'
      },
      {
        quote: 'Best investment we made this year',
        author: 'VP Finance, Company C'
      }
    ];
  }

  // Increment version
  incrementVersion(version) {
    const parts = version.split('.');
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    const patch = parseInt(parts[2]);
    
    return `${major}.${minor}.${patch + 1}`;
  }

  // Get one-pager
  getOnePager() {
    return this.onePager;
  }

  // Get update history
  getUpdateHistory() {
    return this.updates;
  }

  // Load one-pager data
  loadOnePagerData() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.onePager = JSON.parse(data);
    }
    
    if (fs.existsSync(this.updatesPath)) {
      const data = fs.readFileSync(this.updatesPath, 'utf8');
      this.updates = JSON.parse(data);
    }
  }

  // Save one-pager data
  saveOnePagerData() {
    fs.writeFileSync(this.dataPath, JSON.stringify(this.onePager, null, 2));
    
    if (this.updates.length > 100) {
      this.updates = this.updates.slice(-100);
    }
    fs.writeFileSync(this.updatesPath, JSON.stringify(this.updates, null, 2));
  }

  // Generate one-pager HTML
  generateHTML() {
    const content = this.onePager.content;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${content.headline}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    .cta { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>${content.headline}</h1>
  <p>${content.subheadline}</p>
  
  <h2>${content.problem.title}</h2>
  <ul>
    ${content.problem.points.map(p => `<li>${p}</li>`).join('')}
  </ul>
  
  <h2>${content.solution.title}</h2>
  <ul>
    ${content.solution.points.map(p => `<li>${p}</li>`).join('')}
  </ul>
  
  <h2>${content.benefits.title}</h2>
  <ul>
    ${content.benefits.points.map(p => `<li>${p}</li>`).join('')}
  </ul>
  
  <h2>${content.features.title}</h2>
  <ul>
    ${content.features.points.map(p => `<li>${p}</li>`).join('')}
  </ul>
  
  <h2>${content.pricing.title}</h2>
  ${content.pricing.plans.map(plan => `
    <div>
      <h3>${plan.name} - ${plan.price}</h3>
      <ul>
        ${plan.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
  `).join('')}
  
  <h2>${content.socialProof.title}</h2>
  <p>${content.socialProof.companies.join(', ')}</p>
  ${content.socialProof.testimonials.map(t => `
    <blockquote>
      "${t.quote}" - ${t.author}
    </blockquote>
  `).join('')}
  
  <a href="${content.cta.link}" class="cta">${content.cta.primary}</a>
</body>
</html>
    `.trim();
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const onePager = new OnePagerMaintenance();

  switch (command) {
    case 'get':
      const pager = onePager.getOnePager();
      console.log('📄 One-Pager:');
      console.log(JSON.stringify(pager, null, 2));
      break;

    case 'update':
      if (args[1] && args[2]) {
        const content = JSON.parse(args[2]);
        const result = await onePager.updateSection(args[1], content);
        console.log('📝 Updated Section:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error('Usage: node one-pager.js update <section> <content-json>');
      }
      break;

    case 'refresh':
      const refreshed = await onePager.refreshOnePager();
      console.log('🔄 Refreshed One-Pager:');
      console.log(JSON.stringify(refreshed, null, 2));
      break;

    case 'html':
      const html = onePager.generateHTML();
      console.log('🌐 One-Pager HTML:');
      console.log(html);
      break;

    case 'history':
      const history = onePager.getUpdateHistory();
      console.log('📜 Update History:');
      console.log(JSON.stringify(history, null, 2));
      break;

    default:
      console.log('📄 One-Pager Maintenance System');
      console.log('');
      console.log('Commands:');
      console.log('  get     - Get current one-pager');
      console.log('  update  - Update one-pager section');
      console.log('  refresh - Refresh one-pager with latest data');
      console.log('  html    - Generate one-pager HTML');
      console.log('  history - Get update history');
      console.log('');
      console.log('Examples:');
      console.log('  node one-pager.js get');
      console.log('  node one-pager.js update pricing \'{"plans":[]}\'');
      console.log('  node one-pager.js refresh');
      console.log('  node one-pager.js html');
      console.log('  node one-pager.js history');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  OnePagerMaintenance
};
