/**
 * Quarantine - Holding State for Failed Validations
 *
 * Provides a holding state for proposals/outputs that fail validation.
 * Items in quarantine are inspectable but inert.
 * NOTE: fs and path not compatible with Workers
 * Quarantine logging needs to use KV/R2 in Workers environment
 *
 * @version 1.0.0
 */

// import * as fs from 'fs';
// import * as path from 'path';

// const LOG_DIR = './logs';
// const QUARANTINE_FILE = `${LOG_DIR}/quarantine.jsonl`;

// --- Types ---

export type QuarantineStatus = 'quarantine' | 'released' | 'expired';

export type FailedStage = 'preflight' | 'curator' | 'lessons' | 'canary' | 'runtime';

export interface QuarantinedItem {
  id: string;
  type: 'proposal' | 'output';
  failedStage: FailedStage;
  reason: string;
  quarantinedAt: number;
  releasedAt?: number;
  releasedBy?: string;
  status: QuarantineStatus;
  // Context for debugging
  context?: Record<string, unknown>;
}

// --- Storage ---

function loadQuarantine(): QuarantinedItem[] {
  // NOTE: fs not compatible with Workers
  // Quarantine logging needs to use KV/R2 in Workers environment
  return [];
}

function saveQuarantine(items: QuarantinedItem[]): void {
  // NOTE: fs not compatible with Workers
  // Quarantine logging needs to use KV/R2 in Workers environment
}

// --- Core Functions ---

/**
 * Quarantine a failed item
 * 
 * @param id - Unique identifier
 * @param type - Item type (proposal/output)
 * @param failedStage - Stage where it failed
 * @param reason - Human-readable reason
 * @param context - Optional context for debugging
 * @returns The quarantined item
 */
export function quarantineItem(
  id: string,
  type: 'proposal' | 'output',
  failedStage: FailedStage,
  reason: string,
  context?: Record<string, unknown>
): QuarantinedItem {
  const items = loadQuarantine();
  
  // Check if already quarantined
  const existing = items.find(i => i.id === id && i.status === 'quarantine');
  if (existing) {
    console.log(`[Quarantine] Item ${id} already in quarantine`);
    return existing;
  }
  
  const item: QuarantinedItem = {
    id,
    type,
    failedStage,
    reason,
    quarantinedAt: Date.now(),
    status: 'quarantine',
    context,
  };
  
  items.push(item);
  saveQuarantine(items);
  
  console.log(`[Quarantine] Item ${id} quarantined (failed at ${failedStage}: ${reason})`);
  
  return item;
}

/**
 * Get all quarantined items
 * 
 * @param includeExpired - Whether to include expired items
 * @returns Array of quarantined items
 */
export function getQuarantinedItems(includeExpired: boolean = false): QuarantinedItem[] {
  const items = loadQuarantine();
  
  if (includeExpired) {
    return items;
  }
  
  // Auto-expire old items (7 days)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const activeItems = items.map(item => {
    if (item.status === 'quarantine' && item.quarantinedAt < sevenDaysAgo) {
      item.status = 'expired';
    }
    return item;
  });
  
  saveQuarantine(activeItems);
  
  return activeItems.filter(i => i.status === 'quarantine');
}

/**
 * Get a specific quarantined item
 * 
 * @param id - Item ID
 * @returns The item or undefined
 */
export function getQuarantinedItem(id: string): QuarantinedItem | undefined {
  const items = loadQuarantine();
  return items.find(i => i.id === id);
}

/**
 * Release an item from quarantine (manual approval)
 * 
 * @param id - Item ID
 * @param releasedBy - Who is releasing it
 * @returns The released item or undefined
 */
export function releaseItem(id: string, releasedBy: string): QuarantinedItem | undefined {
  const items = loadQuarantine();
  const index = items.findIndex(i => i.id === id);
  
  if (index === -1) {
    console.log(`[Quarantine] Item ${id} not found`);
    return undefined;
  }
  
  const item = items[index];
  item.status = 'released';
  item.releasedAt = Date.now();
  item.releasedBy = releasedBy;
  
  items[index] = item;
  saveQuarantine(items);
  
  console.log(`[Quarantine] Item ${id} released by ${releasedBy}`);
  
  return item;
}

/**
 * Permanently delete an item from quarantine
 * 
 * @param id - Item ID
 */
export function deleteQuarantinedItem(id: string): void {
  const items = loadQuarantine();
  const filtered = items.filter(i => i.id !== id);
  saveQuarantine(filtered);
  
  console.log(`[Quarantine] Item ${id} deleted`);
}

/**
 * Clean up expired items
 * 
 * @returns Number of items cleaned up
 */
export function cleanupExpired(): number {
  const items = loadQuarantine();
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  const activeItems = items.filter(i => {
    if (i.status === 'quarantine' && i.quarantinedAt < sevenDaysAgo) {
      i.status = 'expired';
    }
    return i.status !== 'expired';
  });
  
  const cleaned = items.length - activeItems.length;
  if (cleaned > 0) {
    saveQuarantine(activeItems);
    console.log(`[Quarantine] Cleaned up ${cleaned} expired items`);
  }
  
  return cleaned;
}

// --- CLI Entry ---

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('\n🛑 Quarantine CLI');
  console.log('='.repeat(40));
  
  if (command === 'list') {
    const items = getQuarantinedItems();
    console.log(`\nQuarantined items (${items.length}):\n`);
    for (const item of items) {
      console.log(`  ${item.id}`);
      console.log(`    Type: ${item.type}`);
      console.log(`    Failed at: ${item.failedStage}`);
      console.log(`    Reason: ${item.reason}`);
      console.log(`    Quarantined: ${new Date(item.quarantinedAt).toISOString()}`);
      console.log();
    }
  } else if (command === 'get') {
    const id = args[1];
    if (!id) {
      console.log('Usage: get <id>');
      process.exit(1);
    }
    const item = getQuarantinedItem(id);
    if (item) {
      console.log(`\n${JSON.stringify(item, null, 2)}`);
    } else {
      console.log(`Item ${id} not found`);
    }
  } else if (command === 'release') {
    const id = args[1];
    const releasedBy = args[2] || 'manual';
    if (!id) {
      console.log('Usage: release <id> [releasedBy]');
      process.exit(1);
    }
    releaseItem(id, releasedBy);
  } else if (command === 'delete') {
    const id = args[1];
    if (!id) {
      console.log('Usage: delete <id>');
      process.exit(1);
    }
    deleteQuarantinedItem(id);
  } else if (command === 'cleanup') {
    cleanupExpired();
  } else if (command === 'quarantine') {
    const id = args[1];
    const type = args[2] as 'proposal' | 'output' || 'proposal';
    const failedStage = args[3] as FailedStage || 'curator';
    const reason = args.slice(4).join(' ') || 'Unknown';
    if (!id) {
      console.log('Usage: quarantine <id> <type> <failedStage> <reason>');
      process.exit(1);
    }
    quarantineItem(id, type, failedStage, reason);
  } else {
    console.log('\nCommands:');
    console.log('  list              - List quarantined items');
    console.log('  get <id>          - Get specific item');
    console.log('  release <id>      - Release item from quarantine');
    console.log('  delete <id>       - Delete item permanently');
    console.log('  cleanup           - Clean up expired items');
    console.log('  quarantine <id>  - Manually quarantine an item');
  }
}