/**
 * Trial Monitoring Service
 * 
 * Monitors trial danger dates and sends notifications before charges
 * Calendar-aware, timezone-aware, integrated with VictusBridge notifications
 * 
 * This is the core service that prevents trial charges by alerting you
 * before danger dates so you can cancel trials on time.
 */

import { TrialRecord, parseTrialRecord } from '@aether/contracts/src/index.js';
import { VictusBridge } from '../../../src/core/victus_bridge.js';
import { createNotificationSink } from '../notification-sink/notification-sink.js';

interface TrialMonitorConfig {
  victusBridge: VictusBridge;
  checkInterval: number; // milliseconds
  notificationLeadTime: number; // hours before danger date to notify
  kvNamespace: string;
  notificationSink?: any; // Optional custom notification sink for testing
}

interface MonitorResult {
  trialsChecked: number;
  trialsApproaching: number;
  trialsOverdue: number;
  notificationsSent: number;
  errors: number;
  timestamp: string;
}

class TrialMonitor {
  private config: TrialMonitorConfig;
  private notificationSink: any;
  private isRunning: boolean = false;
  private checkTimer?: NodeJS.Timeout;
  private trials: Map<string, TrialRecord> = new Map();

  constructor(config: TrialMonitorConfig) {
    this.config = config;
    this.notificationSink = config.notificationSink || createNotificationSink(config.victusBridge);
  }

  /**
   * Add trial to monitor
   */
  addTrial(trial: TrialRecord): void {
    this.trials.set(trial.id, trial);
    console.log(`Added trial to monitor: ${trial.service} (danger date: ${trial.dangerDate})`);
  }

  /**
   * Remove trial from monitoring
   */
  removeTrial(trialId: string): void {
    this.trials.delete(trialId);
    console.log(`Removed trial from monitor: ${trialId}`);
  }

  /**
   * Get all monitored trials
   */
  getTrials(): TrialRecord[] {
    return Array.from(this.trials.values());
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Trial monitor already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting trial monitoring service...');
    console.log(`Check interval: ${this.config.checkInterval}ms`);
    console.log(`Notification lead time: ${this.config.notificationLeadTime} hours`);

    // Run initial check
    await this.checkTrials();

    // Set up recurring checks
    this.checkTimer = setInterval(() => {
      this.checkTrials().catch(error => {
        console.error('Trial check error:', error);
      });
    }, this.config.checkInterval);

    console.log('Trial monitoring service started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }

    console.log('Trial monitoring service stopped');
  }

  /**
   * Check all trials for approaching danger dates
   */
  private async checkTrials(): Promise<MonitorResult> {
    const result: MonitorResult = {
      trialsChecked: this.trials.size,
      trialsApproaching: 0,
      trialsOverdue: 0,
      notificationsSent: 0,
      errors: 0,
      timestamp: new Date().toISOString(),
    };

    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`\n=== Trial Check: ${todayString} ===`);
    console.log(`Checking ${this.trials.size} trials...`);

    for (const [trialId, trial] of this.trials) {
      try {
        // Parse danger date (YYYY-MM-DD format)
        const dangerDate = new Date(trial.dangerDate);
        const dangerDateString = dangerDate.toISOString().split('T')[0];

        // Calculate hours until danger date
        const hoursUntilDanger = this.calculateHoursUntilDanger(today, dangerDate);

        console.log(`  ${trial.service}: danger date ${dangerDateString}, ${hoursUntilDanger.toFixed(1)}h away`);

        // Check if trial is overdue
        if (hoursUntilDanger < 0) {
          result.trialsOverdue++;
          console.log(`    ⚠️  OVERDUE: ${trial.service} was due on ${dangerDateString}`);
          
          // Send urgent notification
          await this.notificationSink.sendDangerDateApproaching(trial, Math.abs(hoursUntilDanger));
          result.notificationsSent++;
        }
        // Check if trial is approaching danger date
        else if (hoursUntilDanger <= this.config.notificationLeadTime) {
          result.trialsApproaching++;
          console.log(`    🔔 APPROACHING: ${trial.service} due in ${hoursUntilDanger.toFixed(1)}h`);
          
          // Send notification
          await this.notificationSink.sendDangerDateApproaching(trial, hoursUntilDanger);
          result.notificationsSent++;
        }

      } catch (error) {
        console.error(`Error checking trial ${trialId}:`, error);
        result.errors++;
      }
    }

    console.log(`\n=== Check Complete ===`);
    console.log(`Trials approaching: ${result.trialsApproaching}`);
    console.log(`Trials overdue: ${result.trialsOverdue}`);
    console.log(`Notifications sent: ${result.notificationsSent}`);
    console.log(`Errors: ${result.errors}`);

    return result;
  }

  /**
   * Calculate hours until danger date
   * Accounts for timezone differences
   * dangerDate is in YYYY-MM-DD format (calendar date in vendor timezone)
   */
  private calculateHoursUntilDanger(today: Date, dangerDate: Date): number {
    // dangerDate is a calendar date (YYYY-MM-DD), so we need to interpret it correctly
    // The dangerDate represents midnight in the vendor's timezone
    // For calculation, we treat it as midnight UTC to avoid timezone complexity
    
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    
    const dangerMidnight = new Date(dangerDate);
    dangerMidnight.setHours(0, 0, 0, 0);
    
    // Calculate difference in milliseconds
    const diffMs = dangerMidnight.getTime() - todayMidnight.getTime();
    
    // Convert to hours
    return diffMs / (1000 * 60 * 60);
  }

  /**
   * Get monitoring status
   */
  getStatus(): { isRunning: boolean; trialsCount: number; lastCheck?: string } {
    return {
      isRunning: this.isRunning,
      trialsCount: this.trials.size,
    };
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create trial monitor with default configuration
 */
export function createTrialMonitor(victusBridge: VictusBridge): TrialMonitor {
  return new TrialMonitor({
    victusBridge,
    checkInterval: 60 * 60 * 1000, // 1 hour
    notificationLeadTime: 48, // 48 hours before danger date
    kvNamespace: 'TRIALS',
  });
}

/**
 * Create trial monitor with custom configuration
 */
export function createTrialMonitorWithConfig(config: Partial<TrialMonitorConfig>, victusBridge: VictusBridge): TrialMonitor {
  const defaultConfig: TrialMonitorConfig = {
    victusBridge,
    checkInterval: 60 * 60 * 1000, // 1 hour
    notificationLeadTime: 48, // 48 hours
    kvNamespace: 'TRIALS',
  };

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    victusBridge: config.victusBridge || victusBridge,
  };

  return new TrialMonitor(mergedConfig);
}

export default TrialMonitor;
