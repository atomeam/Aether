/**
 * Human Queue
 * 
 * Manual review queue for escalated items.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
const QUEUE_PATH = path.resolve(process.cwd(), '../../logs/human-queue.jsonl');

// Ensure directory
function ensureDir() {
  const dir = path.dirname(QUEUE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Add to queue
export function enqueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'status'>): QueueItem {
  ensureDir();
  
  const fullItem: QueueItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'pending',
  };
  
  fs.appendFileSync(QUEUE_PATH, JSON.stringify(fullItem) + '\n');
  return fullItem;
}

// Get pending items
export function getPending(limit = 20): QueueItem[] {
  if (!fs.existsSync(QUEUE_PATH)) return [];
  
  const content = fs.readFileSync(QUEUE_PATH, 'utf-8');
  const items = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  
  return items
    .filter((item: QueueItem) => item.status === 'pending')
    .sort((a: QueueItem, b: QueueItem) => b.priority - a.priority)
    .slice(0, limit);
}

// Resolve an item
export function resolve(id: string, status: 'approved' | 'rejected', resolvedBy = 'human'): QueueItem | null {
  if (!fs.existsSync(QUEUE_PATH)) return null;
  
  const content = fs.readFileSync(QUEUE_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  let resolvedItem: QueueItem | null = null;
  const newLines = lines.map(line => {
    const item: QueueItem = JSON.parse(line);
    if (item.id === id) {
      item.status = status;
      item.resolvedAt = Date.now();
      item.resolvedBy = resolvedBy;
      resolvedItem = item;
    }
    return JSON.stringify(item);
  });
  
  if (resolvedItem) {
    fs.writeFileSync(QUEUE_PATH, newLines.join('\n') + '\n');
  }
  
  return resolvedItem;
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