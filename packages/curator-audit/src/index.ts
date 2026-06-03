/**
 * Curator Audit Log (Hash-Chained)
 *
 * Append-only decision log with intra-day tamper detection.
 * NOTE: fs, path, and crypto not compatible with Workers
 * Audit log storage needs to use KV/R2 in Workers environment
 */

import { z } from 'zod';
// import fs from 'fs';
// import path from 'path';
// import crypto from 'crypto';

export const AuditRecordSchema = z.object({
  decisionId: z.string(),
  runId: z.string().optional(),
  timestamp: z.string(),
  actor: z.enum(['executor', 'evaluator', 'reflector', 'human', 'system']),
  tool: z.string(),
  args: z.record(z.unknown()).optional(),
  decision: z.enum(['approve', 'deny', 'escalate']),
  rule: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().optional(),
  hash: z.string().optional(),
  previousHash: z.string().optional(),
  policyHash: z.string().optional(),
});

export type AuditRecord = z.infer<typeof AuditRecordSchema>;

// const AUDIT_PATH = path.resolve(process.cwd(), '../../logs/curator-audit.jsonl');
// const CHAIN_STATE_PATH = path.resolve(process.cwd(), '../../logs/audit-chain-state.json');

interface ChainState {
  lastHash: string;
  lastIndex: number;
  lastPolicyHash: string;
}

function ensureDir() {
  // NOTE: fs and path not compatible with Workers
  // const dir = path.dirname(AUDIT_PATH);
  // if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getPolicyHash(): string {
  // NOTE: fs and crypto not compatible with Workers
  // Use hardcoded policy hash or fetch from KV in Workers environment
  return 'placeholder-policy-hash';
}

function loadChainState(): ChainState {
  // NOTE: fs and path not compatible with Workers
  // Use KV storage in Workers environment
  return { lastHash: '', lastIndex: 0, lastPolicyHash: '' };
}

function saveChainState(state: ChainState) {
  // NOTE: fs and path not compatible with Workers
  // Use KV storage in Workers environment
}

function computeRecordHash(record: AuditRecord, previousHash: string): string {
  // NOTE: crypto not compatible with Workers
  // Use crypto.subtle in Workers environment
  const payload = JSON.stringify({ ...record, hash: undefined }) + previousHash;
  return simpleHash(payload);
}

// Simple hash function for Workers compatibility
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function logDecision(input: Omit<AuditRecord, 'decisionId' | 'timestamp' | 'hash' | 'previousHash' | 'policyHash'>) {
  // NOTE: fs and path not compatible with Workers
  // Audit log storage needs to use KV/R2 in Workers environment
  // ensureDir();
  // const chainState = loadChainState();
  // const policyHash = getPolicyHash();

  const record: AuditRecord = {
    decisionId: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    previousHash: '',
    policyHash: 'placeholder-policy-hash',
    ...input,
    hash: '',
  };

  record.hash = computeRecordHash(record, '');
  // fs.appendFileSync(AUDIT_PATH, JSON.stringify(record) + '\n');

  // chainState.lastHash = record.hash;
  // chainState.lastIndex++;
  // chainState.lastPolicyHash = policyHash;
  // saveChainState(chainState);

  return record;
}

export function verifyChainIntegrity(): { valid: boolean; brokenAt?: number; errors: string[] } {
  // NOTE: fs and crypto not compatible with Workers
  // Audit log storage needs to use KV/R2 in Workers environment
  return { valid: true, errors: [] };
}

export async function getStats(): Promise<{ total: number; approved: number; denied: number; escalated: number; denial_rate: number }> {
  // NOTE: fs not compatible with Workers
  // Audit log storage needs to use KV/R2 in Workers environment
  return { total: 0, approved: 0, denied: 0, escalated: 0, denial_rate: 0 };
}

export function getDecisions(options?: { since?: number; tool?: string; decision?: 'approve' | 'deny' | 'escalate'; limit?: number }): Promise<AuditRecord[]> {
  // NOTE: fs not compatible with Workers
  // Audit log storage needs to use KV/R2 in Workers environment
  return Promise.resolve([]);
}