/**
 * Add all 27 trials from comprehensive email scan
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trials = [
  // Active & Pending Setup
  {
    service: 'Kintone',
    startDate: '2026-05-20',
    durationDays: 30,
    estimatedSavings: 49,
    vendorTimezone: 'America/New_York',
    status: 'active'
  },
  {
    service: 'Kraken+',
    startDate: '2026-05-21',
    durationDays: 30,
    estimatedSavings: 79,
    vendorTimezone: 'America/New_York',
    status: 'active'
  },
  {
    service: 'GoHighLevel',
    startDate: '2026-06-10',
    durationDays: 14,
    estimatedSavings: 97,
    vendorTimezone: 'America/New_York',
    status: 'pending_setup'
  },
  {
    service: 'Pipedrive',
    startDate: '2026-05-10',
    durationDays: 14,
    estimatedSavings: 69,
    vendorTimezone: 'America/New_York',
    status: 'pending_setup'
  },
  
  // Expired Recently (May - June 2026)
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
    service: 'Yapp',
    startDate: '2026-05-03',
    durationDays: 30,
    estimatedSavings: 29,
    vendorTimezone: 'America/New_York',
    status: 'expired'
  },
  {
    service: 'GitHub Enterprise',
    startDate: '2026-05-15',
    durationDays: 14,
    estimatedSavings: 299,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Slack Pro',
    startDate: '2026-05-14',
    durationDays: 14,
    estimatedSavings: 79,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Lindy.ai',
    startDate: '2026-05-13',
    durationDays: 14,
    estimatedSavings: 49,
    vendorTimezone: 'America/New_York',
    status: 'expired'
  },
  {
    service: 'Loom Business + AI',
    startDate: '2026-05-11',
    durationDays: 14,
    estimatedSavings: 149,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Intercom Advanced',
    startDate: '2026-05-11',
    durationDays: 14,
    estimatedSavings: 199,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Sentry Business',
    startDate: '2026-05-10',
    durationDays: 14,
    estimatedSavings: 89,
    vendorTimezone: 'America/New_York',
    status: 'expired'
  },
  {
    service: 'Meta Horizon+',
    startDate: '2026-02-21',
    durationDays: 90,
    estimatedSavings: 49,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'CodeRabbit Pro Plus',
    startDate: '2026-05-06',
    durationDays: 14,
    estimatedSavings: 39,
    vendorTimezone: 'America/New_York',
    status: 'expired'
  },
  {
    service: 'Notion Business',
    startDate: '2026-04-18',
    durationDays: 30,
    estimatedSavings: 89,
    vendorTimezone: 'America/Los_Angeles',
    status: 'expired'
  },
  {
    service: 'Calendly',
    startDate: '2026-04-29',
    durationDays: 14,
    estimatedSavings: 49,
    vendorTimezone: 'America/New_York',
    status: 'expired'
  },
  
  // Expired a While Ago (2020 - 2025)
  {
    service: 'GigaHash',
    startDate: '2025-02-14',
    durationDays: 3,
    estimatedSavings: 9,
    vendorTimezone: 'America/New_York',
    status: 'expired'
  },
  {
    service: 'TheGamerzStore.com',
    startDate: '2021-07-01',
    durationDays: 3,
    estimatedSavings: 5,
    vendorTimezone: 'America/New_York',
    status: 'expired'
  },
  {
    service: 'Walmart Grocery',
    startDate: '2020-05-01',
    durationDays: 15,
    estimatedSavings: 25,
    vendorTimezone: 'America/Chicago',
    status: 'expired'
  },
  
  // Promotional Offers
  {
    service: 'Spotify Premium',
    startDate: '2026-06-14',
    durationDays: 60,
    estimatedSavings: 20,
    vendorTimezone: 'America/New_York',
    status: 'promotional'
  },
  {
    service: 'SAP.com',
    startDate: '2026-06-14',
    durationDays: 30,
    estimatedSavings: 199,
    vendorTimezone: 'America/New_York',
    status: 'promotional'
  },
  {
    service: 'GitLab',
    startDate: '2026-06-14',
    durationDays: 30,
    estimatedSavings: 149,
    vendorTimezone: 'America/Los_Angeles',
    status: 'promotional'
  },
  {
    service: 'Seeking Alpha',
    startDate: '2026-06-14',
    durationDays: 7,
    estimatedSavings: 0,
    vendorTimezone: 'America/New_York',
    status: 'promotional'
  },
  {
    service: 'Taskade',
    startDate: '2026-06-14',
    durationDays: 0,
    estimatedSavings: 49,
    vendorTimezone: 'America/New_York',
    status: 'free_plan'
  }
];

console.log('=== Adding All 27 Trials from Comprehensive Email Scan ===\n');

const trialsFile = path.join(__dirname, 'trials.json');
let existingTrials = [];
if (fs.existsSync(trialsFile)) {
  existingTrials = JSON.parse(fs.readFileSync(trialsFile, 'utf8'));
}

trials.forEach((trial, index) => {
  const startDate = new Date(trial.startDate);
  const dangerDate = new Date(startDate.getTime() + trial.durationDays * 24 * 60 * 60 * 1000);
  const dangerDateString = dangerDate.toISOString().split('T')[0];
  
  const trialRecord = {
    id: `trial_${trial.service.toLowerCase().replace(/\s+/g, '_').replace(/\+/g, 'plus')}_${Date.now()}_${index}`,
    service: trial.service,
    status: trial.status,
    startDate: startDate.toISOString(),
    dangerDate: dangerDateString,
    dangerDateTime: dangerDate.toISOString(),
    estimatedSavings: trial.estimatedSavings,
    source: 'comprehensive_email_scan',
    vendorTimezone: trial.vendorTimezone,
    billingTime: '00:00',
    billingTimezone: trial.vendorTimezone,
    verificationStatus: 'unverified',
    verificationAttempts: 0,
    metadata: {
      requiresCreditCard: trial.status !== 'promotional' && trial.status !== 'free_plan',
      autoCancelRequired: trial.status === 'active',
      features: [],
      limitations: [`${trial.durationDays} days`],
      lastSync: new Date().toISOString(),
      syncSource: 'comprehensive_scan'
    }
  };
  
  console.log(`${index + 1}. ${trial.service}`);
  console.log(`   Status: ${trial.status}`);
  console.log(`   Danger Date: ${dangerDateString}`);
  console.log(`   Savings: $${trial.estimatedSavings}`);
  console.log(`   ID: ${trialRecord.id}`);
  console.log('');
  
  existingTrials.push(trialRecord);
});

fs.writeFileSync(trialsFile, JSON.stringify(existingTrials, null, 2));

console.log(`✅ Added ${trials.length} trials to trials.json`);
console.log(`📁 Total trials in system: ${existingTrials.length}`);
console.log(`📁 File: ${trialsFile}`);
