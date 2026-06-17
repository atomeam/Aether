/**
 * Trial Monitor Runner
 * 
 * Simple CLI to run the trial monitoring service with your actual trials
 * 
 * Usage:
 *   node runner.js                    # Start monitoring
 *   node runner.js add                # Add a trial interactively
 *   node runner.js list               # List all trials
 *   node runner.js check              # Run one-time check
 *   node runner.js remove <id>       # Remove a trial
 */

import { TrialMonitor, createTrialMonitor } from './trial-monitor.js';
import { VictusBridge } from '../../../src/core/victus_bridge.js';
import { TrialRecord } from '@aether/contracts/src/index.js';
import * as fs from 'fs';
import * as readline from 'readline';

// Simple VictusBridge mock for now (will connect to real Victus later)
class SimpleVictusBridge {
  constructor(private url: string) {}
  
  async forwardCommand(command: any): Promise<any> {
    console.log('VictusBridge command:', command.operation);
    // For now, just log the command
    // In production, this would forward to actual Victus runtime
    return { success: true, data: command.args };
  }
}

const TRIALS_FILE = 'trials.json';

/**
 * Load trials from JSON file
 */
function loadTrials(): TrialRecord[] {
  if (!fs.existsSync(TRIALS_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(TRIALS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading trials:', error);
    return [];
  }
}

/**
 * Save trials to JSON file
 */
function saveTrials(trials: TrialRecord[]): void {
  try {
    fs.writeFileSync(TRIALS_FILE, JSON.stringify(trials, null, 2));
    console.log('Trials saved to', TRIALS_FILE);
  } catch (error) {
    console.error('Error saving trials:', error);
  }
}

/**
 * Add trial interactively
 */
async function addTrial(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise(resolve => rl.question(prompt, resolve));
  };

  try {
    console.log('\n=== Add New Trial ===\n');
    
    const service = await question('Service name (e.g., CircleCI): ');
    const durationDays = parseInt(await question('Trial duration in days (e.g., 14): '));
    const estimatedSavings = parseFloat(await question('Estimated savings (e.g., 99): '));
    const vendorTimezone = await question('Vendor timezone (e.g., America/New_York): ') || 'America/New_York';
    
    // Validate inputs
    if (!service || service.trim() === '') {
      console.log('❌ Invalid service name. Please enter a service name.');
      rl.close();
      return;
    }
    
    if (isNaN(durationDays) || durationDays <= 0) {
      console.log('❌ Invalid duration. Please enter a positive number.');
      rl.close();
      return;
    }
    
    if (isNaN(estimatedSavings) || estimatedSavings < 0) {
      console.log('❌ Invalid savings. Please enter a positive number.');
      rl.close();
      return;
    }
    
    // Calculate danger date
    const startDate = new Date();
    const dangerDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const dangerDateString = dangerDate.toISOString().split('T')[0];
    
    const trial: TrialRecord = {
      id: 'trial_' + Date.now(),
      service,
      status: 'active',
      startDate: startDate.toISOString(),
      dangerDate: dangerDateString,
      dangerDateTime: dangerDate.toISOString(),
      estimatedSavings,
      source: 'manual_entry',
      vendorTimezone,
      billingTime: '00:00',
      billingTimezone: vendorTimezone,
      verificationStatus: 'unverified',
      verificationAttempts: 0,
      metadata: {
        requiresCreditCard: true,
        autoCancelRequired: true,
        features: [],
        limitations: [`${durationDays} days`],
        lastSync: new Date().toISOString(),
        syncSource: 'put',
      },
    };

    const trials = loadTrials();
    trials.push(trial);
    saveTrials(trials);

    console.log('\n✅ Trial added successfully!');
    console.log(`  Service: ${service}`);
    console.log(`  Danger date: ${dangerDateString}`);
    console.log(`  Estimated savings: $${estimatedSavings}`);
    
  } catch (error) {
    console.error('Error adding trial:', error);
  } finally {
    rl.close();
  }
}

/**
 * List all trials
 */
function listTrials(): void {
  const trials = loadTrials();
  
  if (trials.length === 0) {
    console.log('No trials found. Add one with: node runner.js add');
    return;
  }

  console.log('\n=== Your Trials ===\n');
  
  trials.forEach((trial, index) => {
    const daysUntilDanger = Math.floor((new Date(trial.dangerDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`${index + 1}. ${trial.service}`);
    console.log(`   ID: ${trial.id}`);
    console.log(`   Status: ${trial.status}`);
    console.log(`   Danger date: ${trial.dangerDate} (${daysUntilDanger} days)`);
    console.log(`   Estimated savings: $${trial.estimatedSavings}`);
    console.log('');
  });
}

/**
 * Remove trial
 */
function removeTrial(trialId: string): void {
  const trials = loadTrials();
  const filtered = trials.filter(t => t.id !== trialId);
  
  if (filtered.length === trials.length) {
    console.log('Trial not found:', trialId);
    return;
  }
  
  saveTrials(filtered);
  console.log('✅ Trial removed:', trialId);
}

/**
 * Run one-time check
 */
async function runCheck(): Promise<void> {
  const trials = loadTrials();
  
  if (trials.length === 0) {
    console.log('No trials to check. Add trials with: node runner.js add');
    return;
  }

  console.log('Creating VictusBridge...');
  const victusBridge = new SimpleVictusBridge('http://localhost:8080') as any;
  
  console.log('Creating trial monitor...');
  const monitor = createTrialMonitor(victusBridge);
  
  // Add all trials
  trials.forEach(trial => monitor.addTrial(trial));
  
  console.log('Running trial check...\n');
  const result = await monitor.checkTrials();
  
  console.log('\n=== Check Results ===');
  console.log(`Trials checked: ${result.trialsChecked}`);
  console.log(`Trials approaching: ${result.trialsApproaching}`);
  console.log(`Trials overdue: ${result.trialsOverdue}`);
  console.log(`Notifications sent: ${result.notificationsSent}`);
  console.log(`Errors: ${result.errors}`);
}

/**
 * Start monitoring service
 */
async function startMonitoring(): Promise<void> {
  const trials = loadTrials();
  
  if (trials.length === 0) {
    console.log('No trials to monitor. Add trials with: node runner.js add');
    return;
  }

  console.log('Creating VictusBridge...');
  const victusBridge = new SimpleVictusBridge('http://localhost:8080') as any;
  
  console.log('Creating trial monitor...');
  const monitor = createTrialMonitor(victusBridge);
  
  // Add all trials
  trials.forEach(trial => monitor.addTrial(trial));
  
  console.log('Starting trial monitoring service...');
  console.log('Press Ctrl+C to stop\n');
  
  await monitor.start();
}

// Main CLI
const command = process.argv[2];

switch (command) {
  case 'add':
    addTrial();
    break;
  case 'list':
    listTrials();
    break;
  case 'remove':
    if (!process.argv[3]) {
      console.log('Usage: node runner.js remove <trial_id>');
    } else {
      removeTrial(process.argv[3]);
    }
    break;
  case 'check':
    runCheck();
    break;
  case undefined:
  case 'start':
    startMonitoring();
    break;
  default:
    console.log('Usage:');
    console.log('  node runner.js                    # Start monitoring');
    console.log('  node runner.js add                # Add a trial');
    console.log('  node runner.js list               # List all trials');
    console.log('  node runner.js check              # Run one-time check');
    console.log('  node runner.js remove <id>       # Remove a trial');
}
