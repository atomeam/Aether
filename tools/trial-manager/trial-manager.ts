/**
 * Trial Manager
 * Orchestrates the complete trial arbitrage cycle
 * Connects Trial Finder, AI Runbook Operator, and Cancellation Orchestrator
 * Automates: signup → automation → cancel → repeat
 */

import * as fs from 'fs';
import { TrialFinder, TrialOffer, TrialRotation } from '../trial-finder/trial-finder';
import { CancellationOrchestrator } from '../cancellation-orchestrator/orchestrator';
import { ArbitrageFinder, ArbitrageOpportunity } from '../arbitrage-finder/arbitrage-finder';

interface TrialCycle {
  currentTrial: TrialOffer;
  startDate: string;
  endDate: string;
  automationDeployed: boolean;
  cancellationScheduled: boolean;
  nextTrial: TrialOffer | null;
  status: 'active' | 'expiring' | 'expired' | 'transitioning';
}

interface AutomationConfig {
  runbookId: string;
  schedule: string;
  tasks: string[];
  parameters: Record<string, unknown>;
}

class TrialManager {
  private trialFinder: TrialFinder;
  private cancellationOrchestrator: CancellationOrchestrator;
  private arbitrageFinder: ArbitrageFinder;
  private currentCycle: TrialCycle | null = null;
  private automationConfigs: Map<string, AutomationConfig>;
  private cycleFile: string;

  constructor() {
    this.trialFinder = new TrialFinder();
    this.cancellationOrchestrator = new CancellationOrchestrator();
    this.arbitrageFinder = new ArbitrageFinder();
    this.automationConfigs = new Map();
    this.cycleFile = 'trial-cycle.json';
    this.loadCycle();
    this.loadAutomationConfigs();
    this.trialFinder.initializeSampleData();
    this.arbitrageFinder.initializeSampleData();
  }

  /**
   * Load automation configs from file
   */
  private loadAutomationConfigs(): void {
    try {
      if (fs.existsSync('automation-configs.json')) {
        const data = fs.readFileSync('automation-configs.json', 'utf-8');
        const configs = JSON.parse(data);
        this.automationConfigs = new Map(Object.entries(configs));
      }
    } catch (error) {
      this.automationConfigs = new Map();
    }
  }

  /**
   * Save automation configs to file
   */
  private saveAutomationConfigs(): void {
    try {
      const configs = Object.fromEntries(this.automationConfigs);
      fs.writeFileSync('automation-configs.json', JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('Failed to save automation configs:', error);
    }
  }

  /**
   * Load cycle state from file
   */
  private loadCycle(): void {
    try {
      if (fs.existsSync(this.cycleFile)) {
        const data = fs.readFileSync(this.cycleFile, 'utf-8');
        this.currentCycle = JSON.parse(data);
      }
    } catch (error) {
      this.currentCycle = null;
    }
  }

  /**
   * Save cycle state to file
   */
  private saveCycle(): void {
    try {
      if (this.currentCycle) {
        fs.writeFileSync(this.cycleFile, JSON.stringify(this.currentCycle, null, 2));
      } else {
        if (fs.existsSync(this.cycleFile)) {
          fs.unlinkSync(this.cycleFile);
        }
      }
    } catch (error) {
      console.error('Failed to save cycle state:', error);
    }
  }

  /**
   * Start a new trial cycle
   */
  async startTrialCycle(service: string): Promise<TrialCycle> {
    const trial = this.trialFinder.getTrial(service);
    if (!trial) {
      throw new Error('Trial not found: ' + service);
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (trial.durationDays * 24 * 60 * 60 * 1000));

    this.currentCycle = {
      currentTrial: trial,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      automationDeployed: false,
      cancellationScheduled: false,
      nextTrial: null,
      status: 'active'
    };

    this.saveCycle();
    console.log('Started trial cycle for ' + service + ' (ends ' + endDate.toISOString() + ')');

    // Deploy automation immediately
    await this.deployAutomation(service);

    // Schedule cancellation
    this.scheduleCancellation(service, endDate);

    return this.currentCycle;
  }

  /**
   * Deploy automation for current trial
   */
  private async deployAutomation(service: string): Promise<void> {
    console.log('Deploying automation for ' + service + '...');

    // Get arbitrage opportunity for this service
    const opportunities = this.arbitrageFinder.getAllOpportunities();
    const opportunity = opportunities.find(op => op.service === service);

    if (!opportunity) {
      console.log('No automation opportunity found for ' + service);
      return;
    }

    // Create automation config based on service category
    const config: AutomationConfig = {
      runbookId: service.toLowerCase() + '-automation',
      schedule: '0 */6 * * *',
      tasks: this.getTasksForCategory(opportunity.category),
      parameters: {
        service,
        category: opportunity.category,
        automationPotential: opportunity.automationPotential
      }
    };

    this.automationConfigs.set(service, config);
    this.saveAutomationConfigs();

    if (this.currentCycle) {
      this.currentCycle.automationDeployed = true;
      this.saveCycle();
    }

    console.log('Automation deployed for ' + service + ': ' + config.tasks.length + ' tasks');
  }

  /**
   * Get tasks for a service category
   */
  private getTasksForCategory(category: string): string[] {
    const taskMap: Record<string, string[]> = {
      'CI/CD': ['build-trigger', 'test-execution', 'deployment-pipeline', 'cache-cleanup'],
      'Monitoring': ['metric-collection', 'alert-routing', 'log-aggregation', 'health-check'],
      'Database': ['backup', 'index-optimization', 'query-analysis', 'scaling-check'],
      'Storage': ['file-upload', 'cdn-cache', 'lifecycle-policy', 'cleanup'],
      'API': ['api-test', 'documentation-update', 'rate-limit-check', 'endpoint-monitor'],
      'Email': ['email-campaign', 'bounce-handling', 'delivery-tracking', 'list-cleanup'],
      'Compute': ['function-trigger', 'scheduled-task', 'event-processing', 'resource-monitor'],
      'Project Management': ['task-assignment', 'status-update', 'report-generation', 'deadline-check']
    };

    return taskMap[category] || ['generic-automation'];
  }

  /**
   * Schedule cancellation for trial end
   */
  private scheduleCancellation(service: string, endDate: Date): void {
    console.log('Scheduling cancellation for ' + service + ' at ' + endDate.toISOString());

    if (this.currentCycle) {
      this.currentCycle.cancellationScheduled = true;
      this.saveCycle();
    }
  }

  /**
   * Check if cancellation is needed
   */
  async checkCancellationNeeded(): Promise<boolean> {
    if (!this.currentCycle) {
      return false;
    }

    const now = new Date();
    const endDate = new Date(this.currentCycle.endDate);
    const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysUntilExpiry <= 1 && !this.currentCycle.status.includes('expiring')) {
      this.currentCycle.status = 'expiring';
      this.saveCycle();
      return true;
    }

    return false;
  }

  /**
   * Execute cancellation
   */
  async executeCancellation(): Promise<void> {
    if (!this.currentCycle) {
      throw new Error('No active trial cycle');
    }

    const service = this.currentCycle.currentTrial.service;
    console.log('Executing cancellation for ' + service + '...');

    // Trigger cancellation orchestrator
    const sessionId = 'cancel_' + service + '_' + Date.now();
    const session = await this.cancellationOrchestrator.startCancellation(service, sessionId);

    console.log('Cancellation session started: ' + session.sessionId);

    // Execute cancellation
    const result = await this.cancellationOrchestrator.executeCancellation(sessionId);

    if (result.success) {
      console.log('Cancellation completed for ' + service);
      this.currentCycle.status = 'expired';
      this.saveCycle();
    } else {
      console.error('Cancellation failed for ' + service + ': ' + result.result.error);
    }
  }

  /**
   * Transition to next trial
   */
  async transitionToNextTrial(): Promise<void> {
    if (!this.currentCycle) {
      throw new Error('No active trial cycle');
    }

    console.log('Transitioning from ' + this.currentCycle.currentTrial.service + '...');

    // Get recommended next trial
    const nextTrial = this.trialFinder.getRecommendedNextTrial();
    if (!nextTrial) {
      throw new Error('No next trial available');
    }

    console.log('Next trial: ' + nextTrial.service);

    // Start new cycle
    await this.startTrialCycle(nextTrial.service);
  }

  /**
   * Check if transition is needed
   */
  needsTransition(): boolean {
    if (!this.currentCycle) {
      return true;
    }

    const now = new Date();
    const endDate = new Date(this.currentCycle.endDate);
    const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return daysUntilExpiry <= 0;
  }

  /**
   * Get current cycle status
   */
  getCycleStatus(): TrialCycle | null {
    return this.currentCycle;
  }

  /**
   * Get automation status
   */
  getAutomationStatus(service: string): AutomationConfig | null {
    // Try exact match first
    let config = this.automationConfigs.get(service);
    if (config) return config;
    
    // Try lowercase match
    config = this.automationConfigs.get(service.toLowerCase());
    if (config) return config;
    
    return null;
  }

  /**
   * Get all automation configs
   */
  getAllAutomationConfigs(): Map<string, AutomationConfig> {
    return this.automationConfigs;
  }

  /**
   * Run full cycle check
   */
  async runCycleCheck(): Promise<{
    action: string;
    result: string;
  }> {
    console.log('Running cycle check...');

    if (await this.checkCancellationNeeded()) {
      await this.executeCancellation();
      return {
        action: 'cancellation',
        result: 'Cancellation executed'
      };
    }

    if (this.needsTransition()) {
      await this.transitionToNextTrial();
      return {
        action: 'transition',
        result: 'Transitioned to next trial'
      };
    }

    return {
      action: 'none',
      result: 'Cycle is healthy, no action needed'
    };
  }

  /**
   * Generate cycle report
   */
  generateReport(): string {
    let report = 'TRIAL MANAGER REPORT\n';
    report += '='.repeat(50) + '\n\n';

    if (this.currentCycle) {
      const now = new Date();
      const endDate = new Date(this.currentCycle.endDate);
      const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      report += 'Current Cycle:\n';
      report += '  Service: ' + this.currentCycle.currentTrial.service + '\n';
      report += '  Type: ' + this.currentCycle.currentTrial.trialType + '\n';
      report += '  Start: ' + this.currentCycle.startDate + '\n';
      report += '  End: ' + this.currentCycle.endDate + '\n';
      report += '  Days Remaining: ' + daysRemaining + '\n';
      report += '  Status: ' + this.currentCycle.status + '\n';
      report += '  Automation Deployed: ' + (this.currentCycle.automationDeployed ? 'Yes' : 'No') + '\n';
      report += '  Cancellation Scheduled: ' + (this.currentCycle.cancellationScheduled ? 'Yes' : 'No') + '\n\n';

      if (this.currentCycle.nextTrial) {
        report += 'Next Trial:\n';
        report += '  Service: ' + this.currentCycle.nextTrial.service + '\n';
        report += '  Type: ' + this.currentCycle.nextTrial.trialType + '\n';
        report += '  Duration: ' + this.currentCycle.nextTrial.duration + '\n\n';
      }
    } else {
      report += 'No active cycle. Use "start <service>" to begin.\n\n';
    }

    report += 'Available Trials:\n';
    const trials = this.trialFinder.getTrialsByValue().slice(0, 5);
    trials.forEach((trial, index) => {
      report += (index + 1) + '. ' + trial.service + ' (' + trial.trialType + '): ' + trial.duration + '\n';
    });

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const manager = new TrialManager();

  switch (command) {
    case 'start':
      const service = args[1];
      if (!service) {
        console.log('Usage: trial-manager start <service>');
        return;
      }
      await manager.startTrialCycle(service);
      break;
    
    case 'status':
      const status = manager.getCycleStatus();
      if (status) {
        console.log('Current Cycle Status:');
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log('No active cycle');
      }
      break;
    
    case 'check':
      const result = await manager.runCycleCheck();
      console.log('Action: ' + result.action);
      console.log('Result: ' + result.result);
      break;
    
    case 'cancel':
      await manager.executeCancellation();
      break;
    
    case 'transition':
      await manager.transitionToNextTrial();
      break;
    
    case 'report':
      console.log(manager.generateReport());
      break;
    
    case 'automation':
      const svc = args[1];
      if (svc) {
        const automation = manager.getAutomationStatus(svc);
        if (automation) {
          console.log('Automation for ' + svc + ':');
          console.log(JSON.stringify(automation, null, 2));
        } else {
          console.log('No automation found for ' + svc);
        }
      } else {
        console.log('All Automation Configs:');
        const configs = manager.getAllAutomationConfigs();
        if (configs.size === 0) {
          console.log('No automation configs deployed');
        } else {
          configs.forEach((config, key) => {
            console.log('\n' + key + ':');
            console.log(JSON.stringify(config, null, 2));
          });
        }
      }
      break;
    
    default:
      console.log('Trial Manager');
      console.log('');
      console.log('Commands:');
      console.log('  start <service>  - Start trial cycle for service');
      console.log('  status           - Show current cycle status');
      console.log('  check            - Run cycle check (cancel/transition)');
      console.log('  cancel           - Execute cancellation immediately');
      console.log('  transition        - Transition to next trial');
      console.log('  report           - Generate full cycle report');
      console.log('  automation <svc> - Show automation config for service');
      console.log('');
      console.log('Cycle Flow:');
      console.log('  1. Start trial -> Deploy automation -> Schedule cancellation');
      console.log('  2. Monitor expiry -> Auto-cancel -> Transition to next trial');
      console.log('  3. Repeat cycle continuously');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { TrialManager, TrialCycle, AutomationConfig };
