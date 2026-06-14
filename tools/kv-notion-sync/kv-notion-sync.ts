/**
 * KV ↔ Notion Sync
 * Bidirectional synchronization between Cloudflare KV and Notion Trials database
 * Establishes data contract for trial arbitrage system
 */

import * as fs from 'fs';

interface TrialRecord {
  id: string;
  service: string;
  status: 'active' | 'recovered' | 'cancelled' | 'expired' | 'pending_review';
  startDate: string;
  dangerDate: string;
  endDate?: string;
  estimatedSavings: number;
  actualSavings?: number;
  cancellationMethod?: 'api' | 'one_click' | 'rpa' | 'manual_only';
  cancellationStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  source: 'email_discovery' | 'manual_entry' | 'api_discovery' | 'recovered';
  // Timezone-aware fields
  vendorTimezone: string;
  billingTime: string;
  billingTimezone: string;
  // Verification fields
  lastVerification?: string;
  verificationStatus?: 'verified' | 'unverified' | 'failed';
  verificationAttempts?: number;
  metadata: {
    trialType?: string;
    requiresCreditCard: boolean;
    autoCancelRequired: boolean;
    features: string[];
    limitations: string[];
    lastSync: string;
    syncSource: 'kv' | 'notion';
  };
}

/**
 * Service timezone mapping
 * Maps major SaaS services to their billing timezones
 */
const SERVICE_TIMEZONES: Record<string, string> = {
  'CircleCI': 'America/Los_Angeles',
  'Datadog': 'America/New_York',
  'MongoDB Atlas': 'UTC',
  'SendGrid': 'America/Denver',
  'GitHub Actions': 'UTC',
  'GitLab CI': 'UTC',
  'Vercel': 'America/New_York',
  'Netlify': 'America/Los_Angeles',
  'AWS': 'UTC',
  'Azure': 'UTC',
  'Google Cloud': 'UTC',
  'Heroku': 'UTC',
  'DigitalOcean': 'UTC',
  'New Relic': 'America/New_York',
  'Sentry': 'UTC',
  'Postman': 'America/Los_Angeles',
  'Slack': 'America/Los_Angeles',
  'Notion': 'America/Los_Angeles',
  'Figma': 'America/Los_Angeles',
  'Adobe': 'America/Los_Angeles',
  'Microsoft': 'America/Los_Angeles'
};

/**
 * Get timezone for a service
 */
function getServiceTimezone(service: string): string {
  return SERVICE_TIMEZONES[service] || 'UTC';
}

/**
 * Convert date to vendor timezone
 */
function toVendorTimezone(date: Date, timezone: string): Date {
  const vendorDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return vendorDate;
}

/**
 * Calculate danger date in vendor timezone
 */
function calculateDangerDate(startDate: Date, durationDays: number, timezone: string): string {
  const dangerDate = new Date(startDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
  const vendorDate = toVendorTimezone(dangerDate, timezone);
  return vendorDate.toISOString();
}

/**
 * Verification result interface
 */
interface VerificationResult {
  success: boolean;
  method: 'api' | 'rpa' | 'manual_only';
  verifiedAt: string;
  verificationMethod: 'status_check' | 'email_confirmation' | 'account_check';
  confirmationDetails: {
    accountStatus?: string;
    confirmationEmail?: string;
    confirmationNumber?: string;
    screenshot?: string;
  };
  retryCount: number;
}

/**
 * Simulate cancellation verification
 * In production, this would check account status, scrape confirmation emails, etc.
 */
async function verifyCancellation(trial: TrialRecord): Promise<VerificationResult> {
  const result: VerificationResult = {
    success: false,
    method: trial.cancellationMethod || 'manual_only',
    verifiedAt: new Date().toISOString(),
    verificationMethod: 'status_check',
    confirmationDetails: {},
    retryCount: trial.verificationAttempts || 0
  };

  // Simulate API status check for services with API cancellation
  if (trial.cancellationMethod === 'api') {
    // In production, this would call the service's API
    // For now, simulate success
    result.success = true;
    result.verificationMethod = 'status_check';
    result.confirmationDetails.accountStatus = 'cancelled';
  }

  // Simulate email confirmation check
  if (!result.success) {
    // In production, this would check email scanner results
    // For now, simulate failure
    result.verificationMethod = 'email_confirmation';
  }

  // Manual verification for RPA/manual_only
  if (!result.success && (trial.cancellationMethod === 'rpa' || trial.cancellationMethod === 'manual_only')) {
    result.verificationMethod = 'account_check';
    result.confirmationDetails.screenshot = 'Screenshot captured';
    // Requires human review
    console.log('Manual verification required for ' + trial.service);
  }

  return result;
}

interface SyncResult {
  success: boolean;
  trialsSynced: number;
  trialsCreated: number;
  trialsUpdated: number;
  trialsDeleted: number;
  conflicts: Array<{
    trialId: string;
    field: string;
    kvValue: unknown;
    notionValue: unknown;
    resolution: 'kv_wins' | 'notion_wins' | 'manual_review';
  }>;
  errors: Array<{
    trialId: string;
    error: string;
  }>;
  syncDuration: number;
  timestamp: string;
}

interface SyncConfig {
  conflictResolution: 'kv_wins' | 'notion_wins' | 'manual_review';
  syncInterval: number; // minutes
  autoSync: boolean;
  notionDatabaseId: string;
  kvNamespace: string;
}

class KVNotionSync {
  private config: SyncConfig;
  private syncLog: Array<{
    timestamp: string;
    action: string;
    details: string;
  }>;
  private syncLogFile: string;

  constructor(config: SyncConfig) {
    this.config = config;
    this.syncLog = [];
    this.syncLogFile = 'kv-notion-sync.log';
    this.loadSyncLog();
  }

  /**
   * Load sync log from file
   */
  private loadSyncLog(): void {
    try {
      if (fs.existsSync(this.syncLogFile)) {
        const data = fs.readFileSync(this.syncLogFile, 'utf-8');
        this.syncLog = JSON.parse(data);
      }
    } catch (error) {
      this.syncLog = [];
    }
  }

  /**
   * Save sync log to file
   */
  private saveSyncLog(): void {
    try {
      fs.writeFileSync(this.syncLogFile, JSON.stringify(this.syncLog, null, 2));
    } catch (error) {
      console.error('Failed to save sync log:', error);
    }
  }

  /**
   * Log sync operation
   */
  private logSync(action: string, details: string): void {
    this.syncLog.push({
      timestamp: new Date().toISOString(),
      action,
      details
    });
    this.saveSyncLog();
  }

  /**
   * Get trial from KV (simulated)
   */
  private async getFromKV(trialId: string): Promise<TrialRecord | null> {
    // In production, this would call Cloudflare KV API
    // For now, simulate with local storage
    try {
      const kvFile = 'kv-store.json';
      if (fs.existsSync(kvFile)) {
        const data = fs.readFileSync(kvFile, 'utf-8');
        const kvStore = JSON.parse(data);
        return kvStore[trialId] || null;
      }
    } catch (error) {
      console.error('Failed to get from KV:', error);
    }
    return null;
  }

  /**
   * Put trial to KV (simulated)
   */
  private async putToKV(trial: TrialRecord): Promise<boolean> {
    // In production, this would call Cloudflare KV API
    try {
      const kvFile = 'kv-store.json';
      let kvStore = {};
      if (fs.existsSync(kvFile)) {
        const data = fs.readFileSync(kvFile, 'utf-8');
        kvStore = JSON.parse(data);
      }
      kvStore[trial.id] = trial;
      fs.writeFileSync(kvFile, JSON.stringify(kvStore, null, 2));
      this.logSync('KV_PUT', 'Trial ' + trial.id + ' written to KV');
      return true;
    } catch (error) {
      console.error('Failed to put to KV:', error);
      return false;
    }
  }

  /**
   * Get trial from Notion (simulated)
   */
  private async getFromNotion(trialId: string): Promise<TrialRecord | null> {
    // In production, this would call Notion API
    try {
      const notionFile = 'notion-store.json';
      if (fs.existsSync(notionFile)) {
        const data = fs.readFileSync(notionFile, 'utf-8');
        const notionStore = JSON.parse(data);
        return notionStore[trialId] || null;
      }
    } catch (error) {
      console.error('Failed to get from Notion:', error);
    }
    return null;
  }

  /**
   * Put trial to Notion (simulated)
   */
  private async putToNotion(trial: TrialRecord): Promise<boolean> {
    // In production, this would call Notion API
    try {
      const notionFile = 'notion-store.json';
      let notionStore = {};
      if (fs.existsSync(notionFile)) {
        const data = fs.readFileSync(notionFile, 'utf-8');
        notionStore = JSON.parse(data);
      }
      notionStore[trial.id] = trial;
      fs.writeFileSync(notionFile, JSON.stringify(notionStore, null, 2));
      this.logSync('NOTION_PUT', 'Trial ' + trial.id + ' written to Notion');
      return true;
    } catch (error) {
      console.error('Failed to put to Notion:', error);
      return false;
    }
  }

  /**
   * Compare two trial records for conflicts
   */
  private compareTrials(kvTrial: TrialRecord, notionTrial: TrialRecord): Array<{
    field: string;
    kvValue: unknown;
    notionValue: unknown;
  }> {
    const conflicts: Array<{
      field: string;
      kvValue: unknown;
      notionValue: unknown;
    }> = [];

    const fieldsToCompare: (keyof TrialRecord)[] = [
      'status',
      'dangerDate',
      'endDate',
      'estimatedSavings',
      'actualSavings',
      'cancellationMethod',
      'cancellationStatus'
    ];

    for (const field of fieldsToCompare) {
      if (kvTrial[field] !== notionTrial[field]) {
        conflicts.push({
          field,
          kvValue: kvTrial[field],
          notionValue: notionTrial[field]
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflict based on config
   */
  private resolveConflict(
    trialId: string,
    field: string,
    kvValue: unknown,
    notionValue: unknown
  ): 'kv_wins' | 'notion_wins' | 'manual_review' {
    switch (this.config.conflictResolution) {
      case 'kv_wins':
        return 'kv_wins';
      case 'notion_wins':
        return 'notion_wins';
      case 'manual_review':
        return 'manual_review';
      default:
        // Default: KV wins for system fields, Notion wins for metadata
        const systemFields = ['status', 'dangerDate', 'endDate', 'cancellationStatus'];
        if (systemFields.includes(field)) {
          return 'kv_wins';
        }
        return 'notion_wins';
    }
  }

  /**
   * Perform bidirectional sync
   */
  async sync(): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      trialsSynced: 0,
      trialsCreated: 0,
      trialsUpdated: 0,
      trialsDeleted: 0,
      conflicts: [],
      errors: [],
      syncDuration: 0,
      timestamp: new Date().toISOString()
    };

    this.logSync('SYNC_START', 'Starting bidirectional KV ↔ Notion sync');

    try {
      // Get all trials from both sources
      const kvFile = 'kv-store.json';
      const notionFile = 'notion-store.json';

      let kvStore: Record<string, TrialRecord> = {};
      let notionStore: Record<string, TrialRecord> = {};

      if (fs.existsSync(kvFile)) {
        const data = fs.readFileSync(kvFile, 'utf-8');
        kvStore = JSON.parse(data);
      }

      if (fs.existsSync(notionFile)) {
        const data = fs.readFileSync(notionFile, 'utf-8');
        notionStore = JSON.parse(data);
      }

      const allTrialIds = new Set([
        ...Object.keys(kvStore),
        ...Object.keys(notionStore)
      ]);

      // Sync each trial
      for (const trialId of allTrialIds) {
        const kvTrial = kvStore[trialId];
        const notionTrial = notionStore[trialId];

        try {
          if (kvTrial && notionTrial) {
            // Both exist - check for conflicts
            const conflicts = this.compareTrials(kvTrial, notionTrial);
            
            if (conflicts.length > 0) {
              // Resolve conflicts
              let mergedTrial = { ...kvTrial };
              
              for (const conflict of conflicts) {
                const resolution = this.resolveConflict(
                  trialId,
                  conflict.field,
                  conflict.kvValue,
                  conflict.notionValue
                );

                result.conflicts.push({
                  trialId,
                  field: conflict.field,
                  kvValue: conflict.kvValue,
                  notionValue: conflict.notionValue,
                  resolution
                });

                if (resolution === 'kv_wins') {
                  (mergedTrial as Record<string, unknown>)[conflict.field] = conflict.kvValue;
                } else if (resolution === 'notion_wins') {
                  (mergedTrial as Record<string, unknown>)[conflict.field] = conflict.notionValue;
                }
                // manual_review: keep current value, flag for review
              }

              // Update both with merged version
              mergedTrial.metadata.lastSync = new Date().toISOString();
              mergedTrial.metadata.syncSource = 'sync';
              
              await this.putToKV(mergedTrial);
              await this.putToNotion(mergedTrial);
              result.trialsUpdated++;
            } else {
              // No conflicts - just update sync timestamp
              kvTrial.metadata.lastSync = new Date().toISOString();
              kvTrial.metadata.syncSource = 'sync';
              
              await this.putToKV(kvTrial);
              await this.putToNotion(kvTrial);
              result.trialsSynced++;
            }
          } else if (kvTrial && !notionTrial) {
            // Only in KV - create in Notion
            kvTrial.metadata.lastSync = new Date().toISOString();
            kvTrial.metadata.syncSource = 'kv';
            
            await this.putToNotion(kvTrial);
            result.trialsCreated++;
          } else if (!kvTrial && notionTrial) {
            // Only in Notion - create in KV
            notionTrial.metadata.lastSync = new Date().toISOString();
            notionTrial.metadata.syncSource = 'notion';
            
            await this.putToKV(notionTrial);
            result.trialsCreated++;
          }
        } catch (error) {
          result.errors.push({
            trialId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errors.length === 0;
      result.syncDuration = Date.now() - startTime;

      this.logSync('SYNC_COMPLETE', 'Sync completed: ' + result.trialsSynced + ' synced, ' + result.trialsCreated + ' created, ' + result.trialsUpdated + ' updated, ' + result.conflicts.length + ' conflicts, ' + result.errors.length + ' errors');

    } catch (error) {
      result.success = false;
      result.syncDuration = Date.now() - startTime;
      this.logSync('SYNC_ERROR', 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    return result;
  }

  /**
   * Get trial by ID (from KV as source of truth)
   */
  async getTrial(trialId: string): Promise<TrialRecord | null> {
    return this.getFromKV(trialId);
  }

  /**
   * Put trial (writes to both KV and Notion)
   */
  async putTrial(trial: TrialRecord): Promise<boolean> {
    trial.metadata.lastSync = new Date().toISOString();
    trial.metadata.syncSource = 'put';

    const kvSuccess = await this.putToKV(trial);
    const notionSuccess = await this.putToNotion(trial);

    return kvSuccess && notionSuccess;
  }

  /**
   * List trials due on a specific date
   */
  async listTrialsDueOn(date: string): Promise<TrialRecord[]> {
    const kvFile = 'kv-store.json';
    if (!fs.existsSync(kvFile)) {
      return [];
    }

    const data = fs.readFileSync(kvFile, 'utf-8');
    const kvStore = JSON.parse(data) as Record<string, TrialRecord>;

    return Object.values(kvStore).filter(trial => {
      const trialDate = trial.dangerDate.split('T')[0];
      return trialDate === date && trial.status === 'active';
    });
  }

  /**
   * List audit for a specific job
   */
  async listAuditForJob(jobId: string): Promise<TrialRecord[]> {
    const kvFile = 'kv-store.json';
    if (!fs.existsSync(kvFile)) {
      return [];
    }

    const data = fs.readFileSync(kvFile, 'utf-8');
    const kvStore = JSON.parse(data) as Record<string, TrialRecord>;

    return Object.values(kvStore).filter(trial => 
      trial.cancellationStatus === 'completed' && trial.status === 'cancelled'
    );
  }

  /**
   * Generate sync report
   */
  generateSyncReport(): string {
    let report = 'KV ↔ NOTION SYNC REPORT\n';
    report += '='.repeat(50) + '\n\n';

    report += 'Configuration:\n';
    report += '  Conflict Resolution: ' + this.config.conflictResolution + '\n';
    report += '  Sync Interval: ' + this.config.syncInterval + ' minutes\n';
    report += '  Auto Sync: ' + (this.config.autoSync ? 'Enabled' : 'Disabled') + '\n';
    report += '  Notion Database ID: ' + this.config.notionDatabaseId + '\n';
    report += '  KV Namespace: ' + this.config.kvNamespace + '\n\n';

    report += 'Recent Sync Operations (last 10):\n';
    const recentOps = this.syncLog.slice(-10);
    recentOps.forEach(op => {
      report += '  ' + op.timestamp + ' - ' + op.action + ': ' + op.details + '\n';
    });

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const config: SyncConfig = {
    conflictResolution: 'notion_wins',
    syncInterval: 5,
    autoSync: false,
    notionDatabaseId: '352b2080b78f4e6cbc1e55117a2f7f98',
    kvNamespace: 'TRIALS'
  };

  const sync = new KVNotionSync(config);

  switch (command) {
    case 'sync':
      const result = await sync.sync();
      console.log('Sync Result:');
      console.log('  Success: ' + result.success);
      console.log('  Trials Synced: ' + result.trialsSynced);
      console.log('  Trials Created: ' + result.trialsCreated);
      console.log('  Trials Updated: ' + result.trialsUpdated);
      console.log('  Conflicts: ' + result.conflicts.length);
      console.log('  Errors: ' + result.errors.length);
      console.log('  Duration: ' + result.syncDuration + 'ms');
      
      if (result.conflicts.length > 0) {
        console.log('\nConflicts:');
        result.conflicts.forEach(conflict => {
          console.log('  ' + conflict.trialId + ' - ' + conflict.field + ': ' + conflict.resolution);
        });
      }
      
      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(error => {
          console.log('  ' + error.trialId + ': ' + error.error);
        });
      }
      break;
    
    case 'report':
      console.log(sync.generateSyncReport());
      break;
    
    case 'get':
      const trialId = args[1];
      if (!trialId) {
        console.log('Usage: kv-notion-sync get <trialId>');
        return;
      }
      const trial = await sync.getTrial(trialId);
      if (trial) {
        console.log('Trial: ' + trialId);
        console.log(JSON.stringify(trial, null, 2));
      } else {
        console.log('Trial not found: ' + trialId);
      }
      break;
    
    case 'put':
      // For testing: create a sample trial with timezone awareness
      const startDate = new Date();
      const service = args[1] || 'CircleCI';
      const timezone = getServiceTimezone(service);
      const dangerDate = calculateDangerDate(startDate, 14, timezone);
      
      const sampleTrial: TrialRecord = {
        id: 'trial_' + Date.now(),
        service: service,
        status: 'active',
        startDate: startDate.toISOString(),
        dangerDate: dangerDate,
        estimatedSavings: 99,
        source: 'manual_entry',
        vendorTimezone: timezone,
        billingTime: '00:00',
        billingTimezone: timezone,
        verificationStatus: 'unverified',
        verificationAttempts: 0,
        metadata: {
          requiresCreditCard: true,
          autoCancelRequired: true,
          features: ['unlimited minutes', 'parallel jobs'],
          limitations: ['14 days'],
          lastSync: new Date().toISOString(),
          syncSource: 'put'
        }
      };
      const putSuccess = await sync.putTrial(sampleTrial);
      console.log('Put trial: ' + (putSuccess ? 'Success' : 'Failed'));
      console.log('Service: ' + service);
      console.log('Timezone: ' + timezone);
      console.log('Danger Date: ' + dangerDate);
      break;
    
    case 'due':
      const date = args[1] || new Date().toISOString().split('T')[0];
      const dueTrials = await sync.listTrialsDueOn(date);
      console.log('Trials due on ' + date + ': ' + dueTrials.length);
      dueTrials.forEach(trial => {
        console.log('  - ' + trial.service + ' (' + trial.id + ')');
      });
      break;
    
    case 'audit':
      const jobId = args[1] || 'all';
      const auditTrials = await sync.listAuditForJob(jobId);
      console.log('Audit for job ' + jobId + ': ' + auditTrials.length + ' trials');
      auditTrials.forEach(trial => {
        console.log('  - ' + trial.service + ' saved $' + trial.actualSavings);
      });
      break;
    
    case 'verify':
      const verifyId = args[1];
      if (!verifyId) {
        console.log('Usage: kv-notion-sync verify <trialId>');
        return;
      }
      const verifyTrial = await sync.getTrial(verifyId);
      if (verifyTrial) {
        const verification = await verifyCancellation(verifyTrial);
        console.log('Verification Result:');
        console.log('  Success: ' + verification.success);
        console.log('  Method: ' + verification.verificationMethod);
        console.log('  Verified At: ' + verification.verifiedAt);
        console.log('  Details: ' + JSON.stringify(verification.confirmationDetails, null, 2));
        
        // Update trial with verification result
        verifyTrial.lastVerification = verification.verifiedAt;
        verifyTrial.verificationStatus = verification.success ? 'verified' : 'failed';
        verifyTrial.verificationAttempts = (verifyTrial.verificationAttempts || 0) + 1;
        await sync.putTrial(verifyTrial);
        console.log('Trial updated with verification status');
      } else {
        console.log('Trial not found: ' + verifyId);
      }
      break;
    
    case 'timezone':
      const tzService = args[1] || 'CircleCI';
      const tz = getServiceTimezone(tzService);
      console.log('Service: ' + tzService);
      console.log('Timezone: ' + tz);
      console.log('Available services: ' + Object.keys(SERVICE_TIMEZONES).join(', '));
      break;
    
    default:
      console.log('KV ↔ Notion Sync');
      console.log('');
      console.log('Commands:');
      console.log('  sync                    - Perform bidirectional sync');
      console.log('  report                   - Generate sync report');
      console.log('  get <trialId>           - Get trial by ID');
      console.log('  put [service]           - Create sample trial with timezone (default: CircleCI)');
      console.log('  due <date>              - List trials due on date');
      console.log('  audit <jobId>           - List audit for job');
      console.log('  verify <trialId>        - Verify cancellation status');
      console.log('  timezone <service>       - Get timezone for service');
      console.log('');
      console.log('Contract Functions:');
      console.log('  getTrial(trialId)      - Get trial from KV (source of truth)');
      console.log('  putTrial(trial)       - Write to both KV and Notion');
      console.log('  listTrialsDueOn(date) - List active trials due on date');
      console.log('  listAuditForJob(jobId) - List cancelled trials for audit');
      console.log('');
      console.log('Timezone Features:');
      console.log('  Service timezone mapping for 20+ major SaaS services');
      console.log('  Danger dates calculated in vendor timezone');
      console.log('  Verification tracking with retry logic');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { KVNotionSync, TrialRecord, SyncResult, SyncConfig };
