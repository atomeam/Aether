/**
 * Automated Trial Monitoring Service
 * Checks trials periodically and sends notifications when approaching danger dates
 */

const fs = require('fs');
const path = require('path');

class TrialMonitor {
  constructor() {
    this.trialsFile = path.join(__dirname, 'trials.json');
    this.notificationLog = path.join(__dirname, 'notifications.log');
  }

  loadTrials() {
    if (!fs.existsSync(this.trialsFile)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(this.trialsFile, 'utf8'));
  }

  checkTrials() {
    const trials = this.loadTrials();
    const now = new Date();
    const results = {
      urgent: [],
      approaching: [],
      overdue: [],
      safe: []
    };

    trials.forEach(trial => {
      if (trial.status === 'expired' || trial.status === 'promotional' || trial.status === 'free_plan') {
        results.overdue.push(trial);
        return;
      }

      const dangerDate = new Date(trial.dangerDateTime);
      const hoursUntilDanger = (dangerDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilDanger < 0) {
        results.overdue.push(trial);
      } else if (hoursUntilDanger <= 72) { // 3 days
        results.urgent.push(trial);
      } else if (hoursUntilDanger <= 168) { // 7 days
        results.approaching.push(trial);
      } else {
        results.safe.push(trial);
      }
    });

    return results;
  }

  sendNotification(level, trials) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      trials: trials.map(t => ({
        service: t.service,
        dangerDate: t.dangerDate,
        savings: t.estimatedSavings,
        hoursUntil: this.getHoursUntil(t.dangerDateTime)
      }))
    };

    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${trials.length} trials\n` +
      JSON.stringify(logEntry, null, 2) + '\n\n';

    fs.appendFileSync(this.notificationLog, logMessage);

    // Console output for immediate notification
    console.log(`\n${'='.repeat(50)}`);
    console.log(`${level.toUpperCase()} NOTIFICATION`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log(`Trials: ${trials.length}`);
    console.log(`\nTrials needing attention:`);
    trials.forEach(trial => {
      const hours = this.getHoursUntil(trial.dangerDateTime);
      console.log(`  - ${trial.service}: ${trial.dangerDate} (${hours}h away) - $${trial.estimatedSavings}/month`);
    });
    console.log(`\nTotal savings at risk: $${trials.reduce((sum, t) => sum + t.estimatedSavings, 0)}/month`);
    console.log(`${'='.repeat(50)}\n`);
  }

  getHoursUntil(dangerDateTime) {
    const now = new Date();
    const dangerDate = new Date(dangerDateTime);
    return Math.round((dangerDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  }

  run() {
    console.log('=== Automated Trial Monitoring ===');
    console.log(`Time: ${new Date().toLocaleString()}\n`);

    const results = this.checkTrials();

    // Send notifications based on urgency
    if (results.urgent.length > 0) {
      this.sendNotification('urgent', results.urgent);
    }

    if (results.approaching.length > 0) {
      this.sendNotification('approaching', results.approaching);
    }

    if (results.overdue.length > 0) {
      this.sendNotification('overdue', results.overdue);
    }

    // Summary
    console.log(`\n=== Monitoring Summary ===`);
    console.log(`Total trials: ${this.loadTrials().length}`);
    console.log(`Urgent (≤3 days): ${results.urgent.length}`);
    console.log(`Approaching (≤7 days): ${results.approaching.length}`);
    console.log(`Overdue: ${results.overdue.length}`);
    console.log(`Safe: ${results.safe.length}`);
    console.log(`\nNotifications logged to: ${this.notificationLog}`);
  }
}

// Run monitoring
const monitor = new TrialMonitor();
monitor.run();
