/**
 * Sprint Page Content Cleaner
 * Removes outdated content from Sprint pages (email warm-up tables, etc.)
 */

const fs = require('fs');
const path = require('path');

class SprintPageContentCleaner {
  constructor() {
    this.cleaningRules = [
      {
        name: 'Email Warm-up Tables',
        pattern: /Week \d+: \d+ emails/gi,
        description: 'Removes email warm-up tables',
        severity: 'high'
      },
      {
        name: 'Email Infrastructure Tasks',
        pattern: /(domain registration|SPF|DKIM|DMARC|sending service)/gi,
        description: 'Removes email infrastructure setup tasks',
        severity: 'high'
      },
      {
        name: 'Outdated Chore Lists',
        pattern: /(chore|setup|configure|install)/gi,
        description: 'Removes chore lists and setup tasks',
        severity: 'medium'
      },
      {
        name: 'Email Warm-up References',
        pattern: /(warm.?up|warmup|email warm)/gi,
        description: 'Removes email warm-up references',
        severity: 'medium'
      }
    ];
    
    this.cleaningHistory = [];
    this.dataPath = path.resolve(__dirname, 'cleaning-history.json');
    this.loadCleaningHistory();
  }

  // Clean Sprint page content
  async cleanSprintPage(content) {
    console.log('🧹 Cleaning Sprint page content...');
    
    let cleanedContent = content;
    const removedItems = [];
    
    for (const rule of this.cleaningRules) {
      const matches = cleanedContent.match(rule.pattern);
      
      if (matches && matches.length > 0) {
        console.log(`🧹 Found ${matches.length} instances of: ${rule.name}`);
        
        removedItems.push({
          rule: rule.name,
          count: matches.length,
          severity: rule.severity,
          samples: matches.slice(0, 3)
        });
        
        // Remove the matched content
        cleanedContent = cleanedContent.replace(rule.pattern, '');
      }
    }
    
    // Clean up extra whitespace
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleanedContent = cleanedContent.trim();
    
    const cleaningRecord = {
      id: this.generateCleaningId(),
      timestamp: new Date().toISOString(),
      removedItems,
      originalLength: content.length,
      cleanedLength: cleanedContent.length,
      reduction: ((content.length - cleanedContent.length) / content.length * 100).toFixed(2)
    };
    
    this.cleaningHistory.push(cleaningRecord);
    this.saveCleaningHistory();
    
    return {
      cleanedContent,
      cleaningRecord
    };
  }

  // Clean specific content type
  async cleanContentType(content, contentType) {
    console.log(`🧹 Cleaning ${contentType} content...`);
    
    let cleanedContent = content;
    
    switch (contentType) {
      case 'email-warmup':
        cleanedContent = this.cleanEmailWarmup(content);
        break;
      case 'email-infra':
        cleanedContent = this.cleanEmailInfra(content);
        break;
      case 'chores':
        cleanedContent = this.cleanChores(content);
        break;
      default:
        cleanedContent = await this.cleanSprintPage(content);
    }
    
    return cleanedContent;
  }

  // Clean email warm-up content
  cleanEmailWarmup(content) {
    const patterns = [
      /Week \d+: \d+ emails/gi,
      /warm.?up|warmup/gi,
      /email warm/gi,
      /sending schedule/gi,
      /warmup schedule/gi
    ];
    
    let cleaned = content;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    return cleaned.trim();
  }

  // Clean email infrastructure content
  cleanEmailInfra(content) {
    const patterns = [
      /domain registration/gi,
      /SPF|DKIM|DMARC/gi,
      /sending service/gi,
      /email provider/gi,
      /SMTP server/gi
    ];
    
    let cleaned = content;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    return cleaned.trim();
  }

  // Clean chore content
  cleanChores(content) {
    const patterns = [
      /chore/gi,
      /setup/gi,
      /configure/gi,
      /install/gi,
      /initial setup/gi
    ];
    
    let cleaned = content;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    return cleaned.trim();
  }

  // Add custom cleaning rule
  addCleaningRule(name, pattern, description, severity = 'medium') {
    console.log(`➕ Adding cleaning rule: ${name}`);
    
    this.cleaningRules.push({
      name,
      pattern: new RegExp(pattern, 'gi'),
      description,
      severity
    });
  }

  // Get cleaning statistics
  getCleaningStatistics() {
    const total = this.cleaningHistory.length;
    const totalRemoved = this.cleaningHistory.reduce((sum, record) => 
      sum + record.removedItems.reduce((sum, item) => sum + item.count, 0), 0
    );
    const averageReduction = total > 0 
      ? (this.cleaningHistory.reduce((sum, record) => sum + parseFloat(record.reduction), 0) / total).toFixed(2)
      : 0;
    
    return {
      total,
      totalRemoved,
      averageReduction,
      rules: this.cleaningRules.length
    };
  }

  // Generate cleaning ID
  generateCleaningId() {
    return `clean-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load cleaning history
  loadCleaningHistory() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.cleaningHistory = JSON.parse(data);
    }
  }

  // Save cleaning history
  saveCleaningHistory() {
    if (this.cleaningHistory.length > 100) {
      this.cleaningHistory = this.cleaningHistory.slice(-100);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.cleaningHistory, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const cleaner = new SprintPageContentCleaner();

  switch (command) {
    case 'clean':
      if (args[1]) {
        const content = fs.readFileSync(args[1], 'utf8');
        const result = await cleaner.cleanSprintPage(content);
        console.log('🧹 Cleaned Content:');
        console.log(result.cleanedContent);
        console.log('\n📊 Cleaning Record:');
        console.log(JSON.stringify(result.cleaningRecord, null, 2));
      } else {
        console.error('Usage: node content-cleaner.js clean <file-path>');
      }
      break;

    case 'clean-type':
      if (args[1] && args[2]) {
        const content = fs.readFileSync(args[1], 'utf8');
        const cleaned = await cleaner.cleanContentType(content, args[2]);
        console.log('🧹 Cleaned Content:');
        console.log(cleaned);
      } else {
        console.error('Usage: node content-cleaner.js clean-type <file-path> <type>');
      }
      break;

    case 'stats':
      const stats = cleaner.getCleaningStatistics();
      console.log('📊 Cleaning Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;

    case 'add-rule':
      if (args[1] && args[2] && args[3]) {
        cleaner.addCleaningRule(args[1], args[2], args[3], args[4] || 'medium');
        console.log('➕ Rule added successfully');
      } else {
        console.error('Usage: node content-cleaner.js add-rule <name> <pattern> <description> [severity]');
      }
      break;

    default:
      console.log('🧹 Sprint Page Content Cleaner');
      console.log('');
      console.log('Commands:');
      console.log('  clean      - Clean Sprint page content');
      console.log('  clean-type - Clean specific content type');
      console.log('  stats      - Get cleaning statistics');
      console.log('  add-rule   - Add custom cleaning rule');
      console.log('');
      console.log('Examples:');
      console.log('  node content-cleaner.js clean sprint-page.md');
      console.log('  node content-cleaner.js clean-type sprint-page.md email-warmup');
      console.log('  node content-cleaner.js stats');
      console.log('  node content-cleaner.js add-rule "Custom Rule" "pattern" "description"');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  SprintPageContentCleaner
};
