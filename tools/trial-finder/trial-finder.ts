/**
 * Trial Finder
 * Discovers available trials and free tiers across SaaS services
 * Tracks expiration dates and automates trial signups
 * Integrates with cancellation orchestrator for trial rotation
 */

import * as fs from 'fs';
import * as path from 'path';

interface TrialOffer {
  service: string;
  category: string;
  trialType: 'free-tier' | 'trial' | 'credit';
  duration: string;
  durationDays: number;
  features: string[];
  limitations: string[];
  valueScore: number;
  signupUrl: string;
  requiresCreditCard: boolean;
  autoCancelRequired: boolean;
}

interface TrialRotation {
  currentService: string;
  startDate: string;
  endDate: string;
  nextService: string;
  rotationStrategy: 'immediate' | 'grace-period' | 'overlap';
}

class TrialFinder {
  private trials: Map<string, TrialOffer>;
  private activeRotation: TrialRotation | null = null;
  private trialSources: string[];
  private rotationFile: string;

  constructor() {
    this.trials = new Map();
    this.trialSources = [
      'SaaS directories',
      'Product Hunt',
      'AlternativeTo',
      'Service-specific landing pages',
      'Developer communities'
    ];
    this.rotationFile = 'trial-rotation.json';
    this.loadRotation();
  }

  /**
   * Load rotation state from file
   */
  private loadRotation(): void {
    try {
      if (fs.existsSync(this.rotationFile)) {
        const data = fs.readFileSync(this.rotationFile, 'utf-8');
        this.activeRotation = JSON.parse(data);
      }
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      this.activeRotation = null;
    }
  }

  /**
   * Save rotation state to file
   */
  private saveRotation(): void {
    try {
      if (this.activeRotation) {
        fs.writeFileSync(this.rotationFile, JSON.stringify(this.activeRotation, null, 2));
      } else {
        fs.unlinkSync(this.rotationFile);
      }
    } catch (error) {
      console.error('Failed to save rotation state:', error);
    }
  }

  /**
   * Add a trial offer to the database
   */
  addTrial(trial: TrialOffer): void {
    this.trials.set(trial.service, trial);
  }

  /**
   * Get trial by service name
   */
  getTrial(service: string): TrialOffer | null {
    return this.trials.get(service) || null;
  }

  /**
   * Get all trials
   */
  getAllTrials(): TrialOffer[] {
    return Array.from(this.trials.values());
  }

  /**
   * Get trials by category
   */
  getTrialsByCategory(category: string): TrialOffer[] {
    return this.getAllTrials().filter(t => t.category === category);
  }

  /**
   * Get trials by type
   */
  getTrialsByType(type: TrialOffer['trialType']): TrialOffer[] {
    return this.getAllTrials().filter(t => t.trialType === type);
  }

  /**
   * Get trials that don't require credit card
   */
  getNoCreditCardTrials(): TrialOffer[] {
    return this.getAllTrials().filter(t => !t.requiresCreditCard);
  }

  /**
   * Get trials sorted by value score
   */
  getTrialsByValue(): TrialOffer[] {
    return this.getAllTrials().sort((a, b) => b.valueScore - a.valueScore);
  }

  /**
   * Get trials expiring soon (within 7 days)
   */
  getExpiringTrials(days: number = 7): TrialOffer[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return this.getAllTrials().filter(t => {
      if (!this.activeRotation || this.activeRotation.currentService !== t.service) {
        return false;
      }
      const endDate = new Date(this.activeRotation.endDate);
      return endDate <= cutoff;
    });
  }

  /**
   * Set up trial rotation
   */
  setupRotation(currentService: string, nextService: string, strategy: TrialRotation['rotationStrategy']): void {
    const currentTrial = this.getTrial(currentService);
    if (!currentTrial) {
      throw new Error(`Current service ${currentService} not found in trial database`);
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (currentTrial.durationDays * 24 * 60 * 60 * 1000));

    this.activeRotation = {
      currentService,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      nextService,
      rotationStrategy: strategy
    };
    
    this.saveRotation();
  }

  /**
   * Get current rotation status
   */
  getRotationStatus(): TrialRotation | null {
    return this.activeRotation;
  }

  /**
   * Check if rotation is needed
   */
  needsRotation(): boolean {
    if (!this.activeRotation) {
      return true;
    }

    const now = new Date();
    const endDate = new Date(this.activeRotation.endDate);
    const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // Rotate if within 3 days of expiry
    return daysUntilExpiry <= 3;
  }

  /**
   * Get recommended next trial
   */
  getRecommendedNextTrial(): TrialOffer | null {
    const currentService = this.activeRotation?.currentService;
    const availableTrials = this.getAllTrials()
      .filter(t => t.service !== currentService)
      .filter(t => !t.requiresCreditCard)
      .sort((a, b) => b.valueScore - a.valueScore);

    return availableTrials[0] || null;
  }

  /**
   * Calculate trial value score
   */
  private calculateValueScore(trial: Partial<TrialOffer>): number {
    let score = 0;

    // Duration score (longer is better)
    score += trial.durationDays || 0;

    // Feature count score
    score += (trial.features?.length || 0) * 10;

    // No credit card bonus
    if (!trial.requiresCreditCard) {
      score += 50;
    }

    // Free tier bonus (permanent vs temporary)
    if (trial.trialType === 'free-tier') {
      score += 100;
    }

    return score;
  }

  /**
   * Generate trial report
   */
  generateReport(): string {
    const trials = this.getAllTrials();
    const noCreditCard = this.getNoCreditCardTrials();
    const byValue = this.getTrialsByValue();

    let report = '🎯 TRIAL FINDER REPORT\n';
    report += '='.repeat(50) + '\n\n';

    report += `Total Trials: ${trials.length}\n`;
    report += `No Credit Card Required: ${noCreditCard.length}\n`;
    report += `Free Tiers: ${this.getTrialsByType('free-tier').length}\n`;
    report += `Trials: ${this.getTrialsByType('trial').length}\n\n`;

    if (this.activeRotation) {
      report += 'Current Rotation:\n';
      report += `  Current: ${this.activeRotation.currentService}\n`;
      report += `  Start: ${this.activeRotation.startDate}\n`;
      report += `  End: ${this.activeRotation.endDate}\n`;
      report += `  Next: ${this.activeRotation.nextService}\n`;
      report += `  Strategy: ${this.activeRotation.rotationStrategy}\n\n`;
    }

    report += 'Top 10 Trials by Value:\n';
    byValue.slice(0, 10).forEach((trial, index) => {
      report += `${index + 1}. ${trial.service} (${trial.trialType})\n`;
      report += `   Duration: ${trial.duration}\n`;
      report += `   Value Score: ${trial.valueScore}\n`;
      report += `   Credit Card: ${trial.requiresCreditCard ? 'Required' : 'Not Required'}\n`;
      report += `   Features: ${trial.features.slice(0, 3).join(', ')}\n\n`;
    });

    return report;
  }

  /**
   * Initialize with sample trial data
   */
  initializeSampleData(): void {
    const sampleTrials: TrialOffer[] = [
      {
        service: 'CircleCI',
        category: 'CI/CD',
        trialType: 'trial',
        duration: '14 days',
        durationDays: 14,
        features: ['unlimited minutes', 'parallel jobs', 'advanced caching', 'Docker layer caching'],
        limitations: ['requires credit card', 'auto-renews to paid'],
        valueScore: 64,
        signupUrl: 'https://circleci.com/signup',
        requiresCreditCard: true,
        autoCancelRequired: true
      },
      {
        service: 'GitHub Actions',
        category: 'CI/CD',
        trialType: 'free-tier',
        duration: 'unlimited',
        durationDays: 365,
        features: ['2000 minutes/month', '500MB storage', 'public repos unlimited'],
        limitations: ['private repos limited', 'no advanced caching'],
        valueScore: 365,
        signupUrl: 'https://github.com/features/actions',
        requiresCreditCard: false,
        autoCancelRequired: false
      },
      {
        service: 'GitLab CI',
        category: 'CI/CD',
        trialType: 'free-tier',
        duration: 'unlimited',
        durationDays: 365,
        features: ['400 minutes/month', '10GB storage', 'unlimited private repos'],
        limitations: ['shared runners', 'limited cache'],
        valueScore: 365,
        signupUrl: 'https://gitlab.com',
        requiresCreditCard: false,
        autoCancelRequired: false
      },
      {
        service: 'Datadog',
        category: 'Monitoring',
        trialType: 'trial',
        duration: '14 days',
        durationDays: 14,
        features: ['unlimited hosts', 'full feature access', 'unlimited logs', 'APM'],
        limitations: ['requires credit card', 'auto-renews to paid'],
        valueScore: 64,
        signupUrl: 'https://www.datadoghq.com/',
        requiresCreditCard: true,
        autoCancelRequired: true
      },
      {
        service: 'New Relic',
        category: 'Monitoring',
        trialType: 'trial',
        duration: '30 days',
        durationDays: 30,
        features: ['full platform', 'unlimited data', 'premium support', 'APM'],
        limitations: ['requires credit card', 'auto-renews to paid'],
        valueScore: 80,
        signupUrl: 'https://newrelic.com/',
        requiresCreditCard: true,
        autoCancelRequired: true
      },
      {
        service: 'Sentry',
        category: 'Monitoring',
        trialType: 'free-tier',
        duration: 'unlimited',
        durationDays: 365,
        features: ['5k errors/month', '3-day retention', 'basic performance monitoring'],
        limitations: ['limited error volume', 'short retention'],
        valueScore: 365,
        signupUrl: 'https://sentry.io/',
        requiresCreditCard: false,
        autoCancelRequired: false
      },
      {
        service: 'MongoDB Atlas',
        category: 'Database',
        trialType: 'trial',
        duration: '30 days',
        durationDays: 30,
        features: ['M10 cluster', '512GB storage', 'dedicated support', 'backups'],
        limitations: ['requires credit card', 'auto-renews to paid'],
        valueScore: 80,
        signupUrl: 'https://www.mongodb.com/cloud/atlas',
        requiresCreditCard: true,
        autoCancelRequired: true
      },
      {
        service: 'Cloudflare Workers',
        category: 'Compute',
        trialType: 'free-tier',
        duration: 'unlimited',
        durationDays: 365,
        features: ['100k requests/day', '10ms CPU time', 'KV storage', 'D1 database'],
        limitations: ['CPU time limit', 'request limit'],
        valueScore: 365,
        signupUrl: 'https://workers.cloudflare.com/',
        requiresCreditCard: false,
        autoCancelRequired: false
      },
      {
        service: 'Vercel',
        category: 'Compute',
        trialType: 'free-tier',
        duration: 'unlimited',
        durationDays: 365,
        features: ['100GB bandwidth', '6GB builds/month', 'serverless functions', 'edge network'],
        limitations: ['build minute limit', 'bandwidth limit'],
        valueScore: 365,
        signupUrl: 'https://vercel.com/',
        requiresCreditCard: false,
        autoCancelRequired: false
      },
      {
        service: 'SendGrid',
        category: 'Email',
        trialType: 'trial',
        duration: '30 days',
        durationDays: 30,
        features: ['40k emails', 'dedicated IP', 'advanced analytics', 'marketing campaigns'],
        limitations: ['requires credit card', 'auto-renews to paid'],
        valueScore: 80,
        signupUrl: 'https://sendgrid.com/',
        requiresCreditCard: true,
        autoCancelRequired: true
      },
      {
        service: 'Mailgun',
        category: 'Email',
        trialType: 'free-tier',
        duration: 'unlimited',
        durationDays: 365,
        features: ['5000 emails/month', '1 sandbox domain', 'API access', 'tracking'],
        limitations: ['email volume limit', 'sandbox domain only'],
        valueScore: 365,
        signupUrl: 'https://www.mailgun.com/',
        requiresCreditCard: false,
        autoCancelRequired: false
      },
      {
        service: 'Postman',
        category: 'API',
        trialType: 'free-tier',
        duration: 'unlimited',
        durationDays: 365,
        features: ['unlimited collections', 'mock servers', 'API testing', 'documentation'],
        limitations: ['team collaboration limited', 'monitoring limited'],
        valueScore: 365,
        signupUrl: 'https://www.postman.com/',
        requiresCreditCard: false,
        autoCancelRequired: false
      }
    ];

    sampleTrials.forEach(trial => {
      this.addTrial(trial);
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const finder = new TrialFinder();
  finder.initializeSampleData();

  switch (command) {
    case 'report':
      console.log(finder.generateReport());
      break;
    
    case 'no-credit-card':
      const noCC = finder.getNoCreditCardTrials();
      console.log('Trials Without Credit Card:');
      noCC.forEach(trial => {
        console.log(`- ${trial.service} (${trial.trialType}): ${trial.duration}`);
      });
      break;
    
    case 'free-tiers':
      const freeTiers = finder.getTrialsByType('free-tier');
      console.log('Free Tiers (Permanent):');
      freeTiers.forEach(trial => {
        console.log(`- ${trial.service}: ${trial.features.slice(0, 3).join(', ')}`);
      });
      break;
    
    case 'category':
      const category = args[1];
      const catTrials = finder.getTrialsByCategory(category);
      console.log(`${category} Trials:`);
      catTrials.forEach(trial => {
        console.log(`- ${trial.service} (${trial.trialType}): ${trial.duration}`);
      });
      break;
    
    case 'rotate':
      const current = args[1];
      const next = args[2];
      if (current && next) {
        finder.setupRotation(current, next, 'grace-period');
        console.log(`Rotation set: ${current} → ${next}`);
      } else {
        console.log('Usage: trial-finder rotate <current> <next>');
      }
      break;
    
    case 'status':
      const status = finder.getRotationStatus();
      if (status) {
        console.log('Current Rotation Status:');
        console.log(`  Current: ${status.currentService}`);
        console.log(`  Start: ${status.startDate}`);
        console.log(`  End: ${status.endDate}`);
        console.log(`  Next: ${status.nextService}`);
        console.log(`  Strategy: ${status.rotationStrategy}`);
        console.log(`  Needs Rotation: ${finder.needsRotation() ? 'Yes' : 'No'}`);
      } else {
        console.log('No active rotation set');
      }
      break;
    
    case 'recommend':
      const recommended = finder.getRecommendedNextTrial();
      if (recommended) {
        console.log('Recommended Next Trial:');
        console.log(`  Service: ${recommended.service}`);
        console.log(`  Type: ${recommended.trialType}`);
        console.log(`  Duration: ${recommended.duration}`);
        console.log(`  Value Score: ${recommended.valueScore}`);
        console.log(`  Credit Card: ${recommended.requiresCreditCard ? 'Required' : 'Not Required'}`);
      } else {
        console.log('No recommendation available');
      }
      break;
    
    default:
      console.log('🎯 Trial Finder');
      console.log('');
      console.log('Commands:');
      console.log('  report           - Generate full trial report');
      console.log('  no-credit-card  - Show trials without credit card');
      console.log('  free-tiers      - Show permanent free tiers');
      console.log('  category <name> - Show trials by category');
      console.log('  rotate <cur> <next> - Set up trial rotation');
      console.log('  status          - Show current rotation status');
      console.log('  recommend       - Get recommended next trial');
      console.log('');
      console.log('Categories:');
      console.log('  - CI/CD');
      console.log('  - Monitoring');
      console.log('  - Database');
      console.log('  - Compute');
      console.log('  - Email');
      console.log('  - API');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { TrialFinder, TrialOffer, TrialRotation };
