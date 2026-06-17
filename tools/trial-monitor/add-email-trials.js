/**
 * Add trials from the email scan results
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trials = [
  // Active & Pending Trials
  {
    service: 'Kintone',
    startDate: '2026-05-20',
    durationDays: 30,
    estimatedSavings: 49,
    vendorTimezone: 'America/New_York'
  },
  {
    service: 'Kraken+',
    startDate: '2026-05-21',
    durationDays: 30,
    estimatedSavings: 79,
    vendorTimezone: 'America/New_York'
  },
  {
    service: 'GoHighLevel',
    startDate: '2026-06-06',
    durationDays: 14,
    estimatedSavings: 97,
    vendorTimezone: 'America/New_York'
  },
  {
    service: 'Pipedrive',
    startDate: '2026-06-06',
    durationDays: 14,
    estimatedSavings: 69,
    vendorTimezone: 'America/New_York'
  },
  // Recently Expired (for reference)
  {
    service: 'monday.com',
    startDate: '2026-05-13',
    durationDays: 30,
    estimatedSavings: 49,
    vendorTimezone: 'America/New_York',
    status: 'expired'
  },
  {
    service: 'Canva Business',
    startDate: '2026-05-11',
    durationDays: 30,
    estimatedSavings: 119,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Atlassian Service Collection Premium',
    startDate: '2026-05-11',
    durationDays: 30,
    estimatedSavings: 149,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Atlassian Jira Premium',
    startDate: '2026-05-11',
    durationDays: 30,
    estimatedSavings: 99,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Slack Pro',
    startDate: '2026-05-15',
    durationDays: 14,
    estimatedSavings: 79,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Notion Business',
    startDate: '2026-04-18',
    durationDays: 30,
    estimatedSavings: 89,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  }
];

console.log('=== Adding Trials from Email Scan ===\n');

trials.forEach((trial, index) => {
  const startDate = new Date(trial.startDate);
  const dangerDate = new Date(startDate.getTime() + trial.durationDays * 24 * 60 * 60 * 1000);
  const dangerDateString = dangerDate.toISOString().split('T')[0];
  
  const trialRecord = {
    id: `trial_${trial.service.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
    service: trial.service,
    status: trial.status || 'active',
    startDate: startDate.toISOString(),
    dangerDate: dangerDateString,
    dangerDateTime: dangerDate.toISOString(),
    estimatedSavings: trial.estimatedSavings,
    source: 'email_scan',
    vendorTimezone: trial.vendorTimezone,
    billingTime: '00:00',
    billingTimezone: trial.vendorTimezone,
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: true,
      autoCancelRequired: true,
      features: [],
      limitations: [`${trial.durationDays} days`],
      lastSync: new Date().toISOString(),
      syncSource: 'email_scan'
    }
  };
  
  console.log(`${index + 1}. ${trial.service}`);
  console.log(`   Status: ${trial.status || 'active'}`);
  console.log(`   Danger Date: ${dangerDateString}`);
  console.log(`   Savings: $${trial.estimatedSavings}`);
  console.log(`   ID: ${trialRecord.id}`);
  console.log('');
  
  // Save to trials.json
  const trialsFile = path.join(__dirname, 'trials.json');
  let existingTrials = [];
  if (fs.existsSync(trialsFile)) {
    existingTrials = JSON.parse(fs.readFileSync(trialsFile, 'utf8'));
  }
  existingTrials.push(trialRecord);
  fs.writeFileSync(trialsFile, JSON.stringify(existingTrials, null, 2));
});

console.log(`✅ Added ${trials.length} trials to trials.json`);
console.log(`📁 File: ${path.join(__dirname, 'trials.json')}`);
