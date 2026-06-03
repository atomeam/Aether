/**
 * Storyteller
 *
 * Human-readable narrative journal of learning.
 * NOTE: fs and path not compatible with Workers
 * Journaling needs to use KV/R2 storage in Workers environment
 */

// import fs from 'fs';
// import path from 'path';

// Journal entry
export interface JournalEntry {
  id: string;
  date: string;
  summary: string;
  events: string[];
  lessonsLearned: number;
  keyInsight: string;
}

// const JOURNAL_PATH = path.resolve(process.cwd(), '../../logs/journal.jsonl');

function ensureDir() {
  // NOTE: fs and path not compatible with Workers
  // const dir = path.dirname(JOURNAL_PATH);
  // if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Write daily journal
export function writeJournal(summary: string, events: string[], lessonsLearned: number, insight: string): JournalEntry {
  // NOTE: fs and path not compatible with Workers
  // Journaling needs to use KV/R2 storage in Workers environment
  // ensureDir();

  const entry: JournalEntry = {
    id: Math.random().toString(36).substring(2, 15),
    date: new Date().toISOString().split('T')[0],
    summary,
    events,
    lessonsLearned,
    keyInsight: insight,
  };

  // fs.appendFileSync(JOURNAL_PATH, JSON.stringify(entry) + '\n');
  return entry;
}

// Generate auto-journal from recent events
export async function generateAutoJournal(): Promise<JournalEntry> {
  // Pull data from various sources
  const events: string[] = [];
  let lessonsLearned = 0;
  let keyInsight = 'System operating normally.';
  
  try {
    const { readLessons } = await import('@aether/lessons');
    const lessons = await readLessons({ limit: 10 });
    lessonsLearned = lessons.length;
    
    if (lessonsLearned > 0) {
      // Get pattern with highest confidence
      lessons.sort((a, b) => b.confidence - a.confidence);
      keyInsight = `Learned ${lessonsLearned} lessons. Highest confidence: ${lessons[0].pattern}`;
    }
  } catch {}
  
  try {
    const { getStats } = await import('@aether/curator-audit');
    const stats = await getStats();
    events.push(`Curator: ${stats.approved} approved, ${stats.denied} denied`);
  } catch {}
  
  events.push(`Timestamp: ${new Date().toISOString()}`);
  
  const summary = `Daily journal entry. ${events.length} events processed.`;
  
  return writeJournal(summary, events, lessonsLearned, keyInsight);
}

// Read recent journal
export function readJournal(days = 7): JournalEntry[] {
  if (!fs.existsSync(JOURNAL_PATH)) return [];
  
  const content = fs.readFileSync(JOURNAL_PATH, 'utf-8');
  const entries = content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as JournalEntry);
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  
  return entries.filter(e => e.date >= cutoffStr);
}

import crypto from 'crypto';