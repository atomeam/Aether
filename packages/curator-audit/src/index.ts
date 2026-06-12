/**
 * Curator Audit Log (Hash-Chained)
 * 
 * Append-only decision log with intra-day tamper detection.
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

const AUDIT_PATH = path.resolve(process.cwd(), '../../logs/curator-audit.jsonl');
const CHAIN_STATE_PATH = path.resolve(process.cwd(), '../../logs/audit-chain-state.json');

interface ChainState {
  lastHash: string;
  lastIndex: number;
  lastPolicyHash: string;
}

function ensureDir() {
  const dir = path.dirname(AUDIT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getPolicyHash(): string {
  try {
    const policyContent = fs.readFileSync('../../packages/curator/policy.yaml', 'utf-8');
    return crypto.createHash('sha256').update(policyContent).digest('hex').slice(0, 16);
  } catch {
    return 'unknown';
  }
}

function loadChainState(): ChainState {
  if (!fs.existsSync(CHAIN_STATE_PATH)) return { lastHash: '', lastIndex: 0, lastPolicyHash: '' };
  return JSON.parse(fs.readFileSync(CHAIN_STATE_PATH, 'utf-8'));
}

function saveChainState(state: ChainState) {
  const dir = path.dirname(CHAIN_STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CHAIN_STATE_PATH, JSON.stringify(state));
}

function computeRecordHash(record: AuditRecord, previousHash: string): string {
  const payload = JSON.stringify({ ...record, hash: undefined }) + previousHash;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function logDecision(input: Omit<AuditRecord, 'decisionId' | 'timestamp' | 'hash' | 'previousHash' | 'policyHash'>) {
  ensureDir();
  const chainState = loadChainState();
  const policyHash = getPolicyHash();
  
  const record: AuditRecord = {
    decisionId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    previousHash: chainState.lastHash,
    policyHash,
    ...input,
    hash: '',
  };
  
  record.hash = computeRecordHash(record, chainState.lastHash);
  fs.appendFileSync(AUDIT_PATH, JSON.stringify(record) + '\n');
  
  chainState.lastHash = record.hash;
  chainState.lastIndex++;
  chainState.lastPolicyHash = policyHash;
  saveChainState(chainState);
  
  return record;
}

export function verifyChainIntegrity(): { valid: boolean; brokenAt?: number; errors: string[] } {
  if (!fs.existsSync(AUDIT_PATH)) return { valid: true, errors: [] };
  
  const chainState = loadChainState();
  const content = fs.readFileSync(AUDIT_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  const errors: string[] = [];
  let expectedPreviousHash = '';
  
  for (let i = 0; i < lines.length; i++) {
    const record = AuditRecordSchema.parse(JSON.parse(lines[i]));
    
    if (record.previousHash !== expectedPreviousHash) {
      errors.push(`Line ${i + 1}: Previous hash mismatch`);
    }
    
    const payload = JSON.stringify({ ...record, hash: undefined }) + record.previousHash;
    const expectedHash = crypto.createHash('sha256').update(payload).digest('hex');
    
    if (record.hash !== expectedHash) {
      errors.push(`Line ${i + 1}: Hash mismatch`);
    }
    
    expectedPreviousHash = record.hash ?? '';
  }
  
  if (expectedPreviousHash !== chainState.lastHash) {
    errors.push('Terminal state mismatch');
  }
  
  return { valid: errors.length === 0, brokenAt: errors[0] ? 1 : undefined, errors };
}

export function getDecisions(options?: { since?: number; tool?: string; decision?: 'approve' | 'deny' | 'escalate'; limit?: number }): Promise<AuditRecord[]> {
  const { since, tool, decision, limit = 100 } = options || {};
  
  if (!fs.existsSync(AUDIT_PATH)) return Promise.resolve([]);
  
  const content = fs.readFileSync(AUDIT_PATH, 'utf-8');
  let records = content.trim().split('\n').filter(Boolean).map(line => AuditRecordSchema.parse(JSON.parse(line)));
  
  if (since) {
    const cutoff = Date.now() - since;
    records = records.filter(r => new Date(r.timestamp).getTime() >= cutoff);
  }
  if (tool) records = records.filter(r => r.tool === tool);
  if (decision) records = records.filter(r => r.decision === decision);
  
  return Promise.resolve(records.slice(-limit));
}

export async function getStats() {
  const records = await getDecisions({ limit: 1000 });
  const total = records.length;
  const approved = records.filter(r => r.decision === 'approve').length;
  const denied = records.filter(r => r.decision === 'deny').length;
  const escalated = records.filter(r => r.decision === 'escalate').length;
  
  return { total, approved, denied, escalated, denial_rate: total > 0 ? denied / total : 0 };
}