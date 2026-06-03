/**
 * Human Queue
 *
 * Manual review queue for escalated items.
 * NOTE: fs, path, and crypto not compatible with Workers
 * Queue storage needs to use KV/R2 in Workers environment
 */

// import fs from 'fs';
// import path from 'path';
// import crypto from 'crypto';

// Queue item
export interface QueueItem {
  id: string;
  type: 'escalation' | 'review' | 'approval';
  request: {
    tool: string;
    args: Record<string, unknown>;
    reason: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  priority: number;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

// Queue path
// const QUEUE_PATH = path.resolve(process.cwd(), '../../logs/human-queue.jsonl');

// Ensure directory
function ensureDir() {
  // NOTE: fs and path not compatible with Workers
  // const dir = path.dirname(QUEUE_PATH);
  // if (!fs.existsSync(dir)) {
  //   fs.mkdirSync(dir, { recursive: true });
  // }
}

// Add to queue
export function enqueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'status'>): QueueItem {
  // NOTE: fs and path not compatible with Workers
  // Queue storage needs to use KV/R2 in Workers environment
  // ensureDir();

  const fullItem: QueueItem = {
    ...item,
    id: Math.random().toString(36).substring(2, 15),
    createdAt: Date.now(),
    status: 'pending',
  };

  // fs.appendFileSync(QUEUE_PATH, JSON.stringify(fullItem) + '\n');
  return fullItem;
}

// Get pending items
export function getPending(limit = 20): QueueItem[] {
  // NOTE: fs and path not compatible with Workers
  // Queue storage needs to use KV/R2 in Workers environment
  // if (!fs.existsSync(QUEUE_PATH)) return [];
  // const content = fs.readFileSync(QUEUE_PATH, 'utf-8');
  // const items = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));

  return [];
}

// Resolve an item
export function resolve(id: string, status: 'approved' | 'rejected', resolvedBy = 'human'): QueueItem | null {
  // NOTE: fs and path not compatible with Workers
  // Queue storage needs to use KV/R2 in Workers environment
  // if (!fs.existsSync(QUEUE_PATH)) return null;
  // const content = fs.readFileSync(QUEUE_PATH, 'utf-8');
  // const lines = content.trim().split('\n').filter(Boolean);
  
  let found = false;
  const newLines = lines.map(line => {
    const item: QueueItem = JSON.parse(line);
    if (item.id === id) {
      found = true;
      item.status = status;
      item.resolvedAt = Date.now();
      item.resolvedBy = resolvedBy;
    }
    return JSON.stringify(item);
  });
  
  if (found) {
    fs.writeFileSync(QUEUE_PATH, newLines.join('\n') + '\n');
  }
  
  return found ? { id, status, resolvedAt: Date.now(), resolvedBy } : null;
}

// Get queue stats
export function getStats(): { pending: number; approved: number; rejected: number } {
  if (!fs.existsSync(QUEUE_PATH)) {
    return { pending: 0, approved: 0, rejected: 0 };
  }
  
  const content = fs.readFileSync(QUEUE_PATH, 'utf-8');
  const items = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as QueueItem);
  
  return {
    pending: items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  };
}