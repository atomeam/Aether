/**
 * Tombstone
 *
 * GDPR-style deletion with hash-chain preservation.
 * Mark records as suppressed without breaking integrity.
 * NOTE: fs, path, and crypto not compatible with Workers
 * Tombstone storage needs to use KV/R2 in Workers environment
 */

// import crypto from 'crypto';
// import fs from 'fs';
// import path from 'path';

// Tombstone record
export interface Tombstone {
  id: string; // Original record ID
  recordType: 'lesson' | 'audit' | 'journal' | 'prediction';
  reason: 'gdpr_request' | 'human_revision' | 'anomaly' | 'source_misbehavior';
  suppressedAt: number;
  suppressedBy: string;
  originalHash: string; // Hash of original record
  tombstoneHash: string; // Hash linking to this tombstone
}

// Tombstone chain file
const TOMBSTONES_PATH = path.resolve(process.cwd(), '../../logs/tombstones.jsonl');

// Write a tombstone (mark record as deleted)
export function markDeleted(options: {
  originalId: string;
  recordType: Tombstone['recordType'];
  reason: Tombstone['reason'];
  suppressedBy: string;
  originalRecord?: string; // Original record for hash
}): { success: boolean; tombstone?: Tombstone; error?: string } {
  const { originalId, recordType, reason, suppressedBy, originalRecord } = options;
  
  // Calculate original hash
  let originalHash = '';
  if (originalRecord) {
    originalHash = crypto.createHash('sha256').update(originalRecord).digest('hex');
  } else {
    // Try to find original in the record itself
    originalHash = crypto.createHash('sha256').update(originalId).digest('hex');
  }
  
  // Get last tombstone hash
  let lastHash = '';
  try {
    const content = fs.readFileSync(TOMBSTONES_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    if (lines.length > 0) {
      const last = JSON.parse(lines[lines.length - 1]) as Tombstone;
      lastHash = last.tombstoneHash;
    }
  } catch {}
  
  const tombstone: Tombstone = {
    id: crypto.randomUUID(),
    recordType,
    reason,
    suppressedAt: Date.now(),
    suppressedBy,
    originalHash,
    tombstoneHash: '', // Filled below
  };
  
  // Chain to previous tombstone
  const chainPayload = originalHash + lastHash + tombstone.id;
  tombstone.tombstoneHash = crypto.createHash('sha256').update(chainPayload).digest('hex');
  
  // Write append-only
  const dir = path.dirname(TOMBSTONES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(TOMBSTONES_PATH, JSON.stringify(tombstone) + '\n');
  
  return { success: true, tombstone };
}

// Check if record is deleted (tombstoned)
export function isDeleted(recordId: string): { deleted: boolean; reason?: string; tombstoneId?: string } {
  if (!fs.existsSync(TOMBSTONES_PATH)) return { deleted: false };
  
  const content = fs.readFileSync(TOMBSTONES_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  for (const line of lines) {
    const tombstone = JSON.parse(line) as Tombstone;
    if (tombstone.id === recordId) {
      return { deleted: true, reason: tombstone.reason, tombstoneId: tombstone.id };
    }
  }
  
  return { deleted: false };
}

// Verify integrity of tombstone chain
export function verifyChain(): { valid: boolean; brokenAt?: string; errors: string[] } {
  if (!fs.existsSync(TOMBSTONES_PATH)) {
    return { valid: true, errors: [] };
  }
  
  const content = fs.readFileSync(TOMBSTONES_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  const errors: string[] = [];
  let lastHash = '';
  
  for (const line of lines) {
    const tombstone = JSON.parse(line) as Tombstone;
    
    // Verify chain
    const chainPayload = tombstone.originalHash + lastHash + tombstone.id;
    const expectedHash = crypto.createHash('sha256').update(chainPayload).digest('hex');
    
    if (expectedHash !== tombstone.tombstoneHash) {
      errors.push(`Chain broken at ${tombstone.id}: expected ${expectedHash}, got ${tombstone.tombstoneHash}`);
    }
    
    lastHash = tombstone.tombstoneHash;
  }
  
  return {
    valid: errors.length === 0,
    brokenAt: errors[0],
    errors,
  };
}

// List tombstones
export function listTombstones(limit = 50): Tombstone[] {
  if (!fs.existsSync(TOMBSTONES_PATH)) return [];
  
  const content = fs.readFileSync(TOMBSTONES_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean).slice(-limit);
  
  return lines.map(line => JSON.parse(line) as Tombstone);
}

// Count by reason (for compliance reporting)
export function getDeletionStats(): Record<string, number> {
  const tombstones = listTombstones(1000);
  const stats: Record<string, number> = {
    gdpr_request: 0,
    human_revision: 0,
    anomaly: 0,
    source_misbehavior: 0,
  };
  
  for (const t of tombstones) {
    if (stats[t.reason] !== undefined) {
      stats[t.reason]++;
    }
  }
  
  return stats;
}

// Export for compliance (what was deleted, when, why - without exposing data)
export function exportDeletionLog(startDate?: number, endDate?: number): {
  deletions: { id: string; recordType: string; reason: string; suppressedAt: number }[];
  total: number;
  byReason: Record<string, number>;
} {
  const tombstones = listTombstones(500);
  
  let filtered = tombstones;
  if (startDate) filtered = filtered.filter(t => t.suppressedAt >= startDate);
  if (endDate) filtered = filtered.filter(t => t.suppressedAt <= endDate);
  
  const deletions = filtered.map(t => ({
    id: t.id,
    recordType: t.recordType,
    reason: t.reason,
    suppressedAt: t.suppressedAt,
  }));
  
  return {
    deletions,
    total: deletions.length,
    byReason: {
      gdpr_request: deletions.filter(d => d.reason === 'gdpr_request').length,
      human_revision: deletions.filter(d => d.reason === 'human_revision').length,
      anomaly: deletions.filter(d => d.reason === 'anomaly').length,
      source_misbehavior: deletions.filter(d => d.reason === 'source_misbehavior').length,
    },
  };
}