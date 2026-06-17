/**
 * Quick Setup - Add sample trials programmatically
 * 
 * This script adds realistic trial data to get you started
 */

import { TrialRecord } from '@aether/contracts/src/index.js';
import * as fs from 'fs';

const TRIALS_FILE = 'trials.json';

/**
 * Sample trials to add
 */
const sampleTrials: TrialRecord[] = [
  {
    id: 'trial_circleci_' + Date.now(),
    service: 'CircleCI',
    status: 'active',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    dangerDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now (14 days total)
    dangerDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedSavings: 99,
    source: 'manual_entry',
    vendorTimezone: 'America/Los_Angeles',
    billingTime: '00:00',
    billingTimezone: 'America/Los_Angeles',
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: true,
      autoCancelRequired: true,
      features: ['unlimited minutes', 'parallel jobs', 'artifacts'],
      limitations: ['14 days'],
      lastSync: new Date().toISOString(),
      syncSource: 'put',
    },
  },
  {
    id: 'trial_datadog_' + Date.now(),
    service: 'Datadog',
    status: 'active',
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    dangerDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now (14 days total)
    dangerDateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedSavings: 199,
    source: 'manual_entry',
    vendorTimezone: 'America/New_York',
    billingTime: '00:00',
    billingTimezone: 'America/New_York',
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: true,
      autoCancelRequired: true,
      features: ['monitoring', 'logs', 'APM'],
      limitations: ['14 days'],
      lastSync: new Date().toISOString(),
      syncSource: 'put',
    },
  },
  {
    id: 'trial_vercel_' + Date.now(),
    service: 'Vercel',
    status: 'active',
    startDate: new Date().toISOString(), // Today
    dangerDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    dangerDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedSavings: 0,
    source: 'manual_entry',
    vendorTimezone: 'America/New_York',
    billingTime: '00:00',
    billingTimezone: 'America/New_York',
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: false,
      autoCancelRequired: false,
      features: ['hosting', 'edge functions', 'deployments'],
      limitations: ['hobby plan'],
      lastSync: new Date().toISOString(),
      syncSource: 'put',
    },
  },
];

/**
 * Load existing trials
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
 * Save trials
 */
function saveTrials(trials: TrialRecord[]): void {
  try {
    fs.writeFileSync(TRIALS_FILE, JSON.stringify(trials, null, 2));
    console.log('✅ Trials saved to', TRIALS_FILE);
  } catch (error) {
    console.error('Error saving trials:', error);
  }
}

/**
 * Add sample trials
 */
function addSampleTrials(): void {
  console.log('=== Adding Sample Trials ===\n');
  
  const existingTrials = loadTrials();
  const allTrials = [...existingTrials, ...sampleTrials];
  
  saveTrials(allTrials);
  
  console.log(`\n✅ Added ${sampleTrials.length} sample trials`);
  console.log(`Total trials: ${allTrials.length}\n`);
  
  console.log('Sample trials added:');
  sampleTrials.forEach(trial => {
    const daysUntilDanger = Math.floor((new Date(trial.dangerDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  - ${trial.service}: danger date ${trial.dangerDate} (${daysUntilDanger} days)`);
  });
  
  console.log('\nNext steps:');
  console.log('  npm run list    # View all trials');
  console.log('  npm run check   # Run trial check');
  console.log('  npm start       # Start monitoring');
}

// Run the setup
addSampleTrials();
