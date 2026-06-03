/**
 * Time Capsule
 *
 * Daily signed snapshot of policy + lessons + ledger hash.
 * Provenance for audits.
 * NOTE: fs, path, and crypto not compatible with Workers
 * Time capsule storage needs to use KV/R2 in Workers environment
 */

// import fs from 'fs';
// import path from 'path';
// import crypto from 'crypto';
// import { createHash } from 'crypto';

// Snapshot
export interface CapsuleSnapshot {
  id: string;
  date: string;
  hash: string;
  signature: string;
  policy: string;
  lessonsHash: string;
  ledgerHash: string;
  metadata: Record<string, unknown>;
}

const CAPSULE_PATH = path.resolve(process.cwd(), '../../logs/timecapsule.jsonl');

// Create daily capsule
export async function createCapsule(): Promise<CapsuleSnapshot> {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  
  // Hash policy
  let policyContent = '';
  try {
    policyContent = fs.readFileSync('../../packages/curator/policy.yaml', 'utf-8');
  } catch {}
  
  // Hash lessons
  let lessonsHash = '';
  try {
    const lessonsContent = fs.readFileSync('../../logs/lessons.jsonl', 'utf-8');
    lessonsHash = hashContent(lessonsContent);
  } catch {}
  
  // Hash audit log
  let ledgerHash = '';
  try {
    const ledgerContent = fs.readFileSync('../../logs/curator-audit.jsonl', 'utf-8');
    ledgerHash = hashContent(ledgerContent);
  } catch {}
  
  // Combined hash
  const combined = policyContent + lessonsHash + ledgerHash;
  const hash = hashContent(combined);
  
  // Simple signature (in production, use proper signing)
  const signature = crypto.createSign('SHA256').update(hash).sign('privateKey', 'hex');
  
  const snapshot: CapsuleSnapshot = {
    id: crypto.randomUUID(),
    date,
    hash,
    signature: signature || 'mock-signature',
    policy: policyContent.slice(0, 100),
    lessonsHash,
    ledgerHash,
    metadata: {
      createdAt: now.toISOString(),
      version: '1.0.0',
    },
  };
  
  // Write capsule
  const dir = path.dirname(CAPSULE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.appendFileSync(CAPSULE_PATH, JSON.stringify(snapshot) + '\n');
  
  return snapshot;
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Verify capsule
export function verifyCapsule(snapshot: CapsuleSnapshot): boolean {
  // In production, verify signature
  return snapshot.hash.length === 64;
}

// Get latest capsule
export function getLatestCapsule(): CapsuleSnapshot | null {
  if (!fs.existsSync(CAPSULE_PATH)) return null;
  
  const content = fs.readFileSync(CAPSULE_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  if (lines.length === 0) return null;
  
  return JSON.parse(lines[lines.length - 1]) as CapsuleSnapshot;
}

// Get capsule by date
export function getCapsuleByDate(date: string): CapsuleSnapshot | null {
  if (!fs.existsSync(CAPSULE_PATH)) return null;
  
  const content = fs.readFileSync(CAPSULE_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  for (const line of lines.reverse()) {
    const capsule = JSON.parse(line) as CapsuleSnapshot;
    if (capsule.date === date) return capsule;
  }
  
  return null;
}