/**
 * Triage Queue
 *
 * Human review queue for escalated items.
 * SLA tracking and assignment.
 * NOTE: fs, path, and crypto not compatible with Workers
 * Triage storage needs to use KV/R2 in Workers environment
 */

// import fs from 'fs';
// import path from 'path';
// import crypto from 'crypto';

// Triage item
export interface TriageItem {
  id: string;
  type: 'escalation' | 'review' | 'approval';
  tool?: string;
  args: Record<string, unknown>;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'expired';
  assignedTo?: string;
  sla: number; // ms until SLA breach
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  notes?: string;
}

// Triage storage path
// const TRIAGE_PATH = path.resolve(process.cwd(), '../../logs/triage.jsonl');

function ensureDir() {
  // NOTE: fs and path not compatible with Workers
  // const dir = path.dirname(TRIAGE_PATH);
  // if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Add to triage
export function addToTriage(item: Omit<TriageItem, 'id' | 'createdAt' | 'status'>): TriageItem {
  // NOTE: fs and path not compatible with Workers
  // Triage storage needs to use KV/R2 in Workers environment
  // ensureDir();

  const triageItem: TriageItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 15),
    createdAt: Date.now(),
    status: 'pending',
  };

  // fs.appendFileSync(TRIAGE_PATH, JSON.stringify(triageItem) + '\n');
  return triageItem;
}

// Get pending items
export function getPending(priority?: TriageItem['priority'], limit = 50): TriageItem[] {
  // NOTE: fs and path not compatible with Workers
  // Triage storage needs to use KV/R2 in Workers environment
  // if (!fs.existsSync(TRIAGE_PATH)) return [];
  // const content = fs.readFileSync(TRIAGE_PATH, 'utf-8');
  // const items = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as TriageItem);

  return [];
}

// Assign item
export function assignItem(id: string, assignee: string): TriageItem | null {
  // NOTE: fs and path not compatible with Workers
  // Triage storage needs to use KV/R2 in Workers environment
  return null;
}

// Resolve item
export function resolveItem(id: string, status: 'approved' | 'rejected', resolvedBy: string, notes?: string): TriageItem | null {
  // NOTE: fs and path not compatible with Workers
  // Triage storage needs to use KV/R2 in Workers environment
  return null;
}

// Get stats
export function getStats(): { pending: number; in_review: number; resolved: number; sla_breached: number } {
  // NOTE: fs and path not compatible with Workers
  // Triage storage needs to use KV/R2 in Workers environment
  return { pending: 0, in_review: 0, resolved: 0, sla_breached: 0 };
}