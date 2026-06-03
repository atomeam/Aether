/**
 * Canary - Low-Stakes Surface for Alpha Testing
 *
 * Provides sandbox surfaces where Alpha applies before broader rollout.
 * The canary acts as an early warning system.
 * NOTE: fs and path not compatible with Workers
 * Canary logging needs to use KV/R2 in Workers environment
 *
 * @version 1.0.0
 */

// import * as fs from 'fs';
// import * as path from 'path';

// const LOG_DIR = './logs';
// const CANARY_LOG = `${LOG_DIR}/canary.jsonl`;
// const DOCS_DIR = './docs/sandbox';

// --- Configuration ---

export interface CanaryConfig {
  enabled: boolean;
  tieredDelay: {
    low: number;      // 1h for low risk (≤2 files)
    medium: number; // 4h for medium (3 files)
    high: number;    // 24h for high (>3 files or DB)
  };
  alertOnFailure: boolean;
}

export const DEFAULT_CANARY_CONFIG: CanaryConfig = {
  enabled: true,
  tieredDelay: {
    low: 60 * 60 * 1000,       // 1 hour
    medium: 4 * 60 * 60 * 1000, // 4 hours
    high: 24 * 60 * 60 * 1000,  // 24 hours
  },
  alertOnFailure: true,
};

// --- Types ---

export type CanaryStatus = 'pending' | 'promoted' | 'alert' | 'expired';

export interface CanaryRun {
  id: string;
  cycleId: string;
  surfaces: string[];  // Files modified in canary
  status: CanaryStatus;
  createdAt: number;
  promotedAt?: number;
  alertAt?: number;
  alertReason?: string;
}

// --- Storage ---

function loadCanaryRuns(): CanaryRun[] {
  // NOTE: fs not compatible with Workers
  // Canary logging needs to use KV/R2 in Workers environment
  return [];
}

function saveCanaryRuns(runs: CanaryRun[]): void {
  // NOTE: fs not compatible with Workers
  // Canary logging needs to use KV/R2 in Workers environment
}

// --- Core Functions ---

/**
 * Initialize canary environment (create sandbox docs if needed)
 */
export function initCanary(): void {
  // NOTE: fs not compatible with Workers
  // Canary logging needs to use KV/R2 in Workers environment
  console.log('[Canary] Canary initialization not available in Workers environment');
}

/**
 * Start a canary run
 * 
 * @param cycleId - The cycle ID that triggered this canary
 * @param surfaces - Surfaces to test in canary
 * @returns The canary run
 */
export function startCanaryRun(
  cycleId: string,
  surfaces: string[]
): CanaryRun {
  const runs = loadCanaryRuns();
  
  const run: CanaryRun = {
    id: `canary_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    cycleId,
    surfaces,
    status: 'pending',
    createdAt: Date.now(),
  };
  
  runs.push(run);
  saveCanaryRuns(runs);
  
  console.log(`[Canary] Started canary run ${run.id} for cycle ${cycleId}`);
  
  return run;
}

/**
 * Check if canary should promote (called after delay)
 * 
 * @param runId - The canary run ID
 * @param fileCount - Number of files to determine tier
 * @returns Whether to promote to production
 */
export function checkCanaryPromotion(runId: string, fileCount: number = 1): boolean {
  const runs = loadCanaryRuns();
  const run = runs.find(r => r.id === runId);
  
  if (!run) {
    console.log(`[Canary] Run ${runId} not found`);
    return false;
  }
  
  if (run.status !== 'pending') {
    console.log(`[Canary] Run ${runId} already processed (status: ${run.status})`);
    return run.status === 'promoted';
  }
  
  const config = DEFAULT_CANARY_CONFIG;
  
  // Tiered delay based on file count
  let delay: number;
  if (fileCount <= 2) {
    delay = config.tieredDelay.low;
  } else if (fileCount === 3) {
    delay = config.tieredDelay.medium;
  } else {
    delay = config.tieredDelay.high;
  }
  
  const elapsed = Date.now() - run.createdAt;
  
  // Auto-promote after tiered delay
  if (elapsed >= delay) {
    run.status = 'promoted';
    run.promotedAt = Date.now();
    saveCanaryRuns(runs);
    
    console.log(`[Canary] Run ${runId} promoted to production after ${delay / 3600000}h`);
    return true;
  }
  
  console.log(`[Canary] Run ${runId} pending (${Math.round((delay - elapsed) / 1000 / 60)}min remaining)`);
  return false;
}

/**
 * Trigger canary alert
 * 
 * @param runId - The canary run ID
 * @param reason - Why it failed
 */
export function triggerCanaryAlert(runId: string, reason: string): void {
  const runs = loadCanaryRuns();
  const run = runs.find(r => r.id === runId);
  
  if (!run) {
    console.log(`[Canary] Run ${runId} not found`);
    return;
  }
  
  run.status = 'alert';
  run.alertAt = Date.now();
  run.alertReason = reason;
  saveCanaryRuns(runs);
  
  console.log(`[Canary] ⚠️ ALERT for run ${runId}: ${reason}`);
}

/**
 * Get pending canary runs
 * 
 * @returns Array of pending runs
 */
export function getPendingCanaryRuns(): CanaryRun[] {
  const runs = loadCanaryRuns();
  return runs.filter(r => r.status === 'pending');
}

/**
 * Get canary status for a cycle
 * 
 * @param cycleId - The cycle ID
 * @returns The canary run or undefined
 */
export function getCanaryStatus(cycleId: string): CanaryRun | undefined {
  const runs = loadCanaryRuns();
  return runs.find(r => r.cycleId === cycleId);
}

// --- CLI Entry ---

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('\n🐦 Canary CLI');
  console.log('='.repeat(40));
  
  if (command === 'init') {
    initCanary();
  } else if (command === 'start') {
    const cycleId = args[1] || 'test_cycle';
    const surfaces = args.slice(2) || ['test.txt'];
    startCanaryRun(cycleId, surfaces);
  } else if (command === 'check') {
    const runId = args[1];
    if (!runId) {
      console.log('Usage: check <runId>');
      process.exit(1);
    }
    const shouldPromote = checkCanaryPromotion(runId);
    console.log(`\nShould promote: ${shouldPromote}`);
  } else if (command === 'alert') {
    const runId = args[1];
    const reason = args.slice(2).join(' ') || 'Unknown failure';
    if (!runId) {
      console.log('Usage: alert <runId> <reason>');
      process.exit(1);
    }
    triggerCanaryAlert(runId, reason);
  } else if (command === 'pending') {
    const runs = getPendingCanaryRuns();
    console.log(`\nPending runs (${runs.length}):`);
    for (const run of runs) {
      console.log(`  ${run.id} - cycle ${run.cycleId}`);
    }
  } else if (command === 'status') {
    const cycleId = args[1];
    if (!cycleId) {
      console.log('Usage: status <cycleId>');
      process.exit(1);
    }
    const run = getCanaryStatus(cycleId);
    if (run) {
      console.log(`\n${JSON.stringify(run, null, 2)}`);
    } else {
      console.log(`No canary run for cycle ${cycleId}`);
    }
  } else {
    console.log('\nCommands:');
    console.log('  init               - Initialize canary environment');
    console.log('  start <cycleId>   - Start new canary run');
    console.log('  check <runId>     - Check promotion status');
    console.log('  alert <runId>      - Trigger alert');
    console.log('  pending            - List pending runs');
    console.log('  status <cycleId>   - Get status for cycle');
  }
}