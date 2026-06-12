/**
 * Lessons DB
 * 
 * Append-only store of learned patterns from agent runs.
 * Turns executor actions into training signals.
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Schema for lesson entries
export const LessonSchema = z.object({
  id: z.string(),
  pattern: z.string(),           // e.g., "npm error", "E404", "422"
  suggestion: z.string(),       // what Evaluator suggested
  action: z.string(),          // what Executor did
  outcome: z.enum(['success', 'failure', 'noop']),
  confidence: z.number().min(0).max(1),
  runId: z.string().optional(),
  timestamp: z.string(),
});

// Type inference
export type Lesson = z.infer<typeof LessonSchema>;

// Input schema (id auto-generated)
export const WriteLessonInput = LessonSchema.omit({ id: true, timestamp: true });

// Path to lessons store
const LESSONS_PATH = path.resolve(process.cwd(), '../../logs/lessons.jsonl');

// Ensure directory exists
function ensureDir() {
  const dir = path.dirname(LESSONS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Write a lesson entry
export function writeLesson(input: z.infer<typeof WriteLessonInput>) {
  ensureDir();
  
  const lesson = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...input,
  };
  
  const line = JSON.stringify(lesson) + '\n';
  fs.appendFileSync(LESSONS_PATH, line);
  
  return lesson;
}

// Read lessons (last N or filtered by pattern)
export function readLessons(options?: { 
  since?: number;  // ms ago
  pattern?: string;
  limit?: number;
}): Promise<Lesson[]> {
  const { since, pattern, limit = 100 } = options || {};
  
  if (!fs.existsSync(LESSONS_PATH)) {
    return Promise.resolve([]);
  }
  
  const content = fs.readFileSync(LESSONS_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  let lessons = lines.map(line => LessonSchema.parse(JSON.parse(line)));
  
  // Filter by time
  if (since) {
    const cutoff = Date.now() - since;
    lessons = lessons.filter(l => new Date(l.timestamp).getTime() >= cutoff);
  }
  
  // Filter by pattern
  if (pattern) {
    lessons = lessons.filter(l => l.pattern.includes(pattern));
  }
  
  // Limit
  return Promise.resolve(lessons.slice(-limit));
}

// Get confidence for a pattern
export async function getPatternConfidence(pattern: string): Promise<number> {
  const lessons = await readLessons({ pattern, limit: 50 });
  
  if (lessons.length === 0) {
    return 0.5; // default confidence
  }
  
  // Weight by recency: recent successes boost, recent failures drop
  let weightedSum = 0;
  let totalWeight = 0;
  
  const now = Date.now();
  
  for (const lesson of lessons) {
    const age = now - new Date(lesson.timestamp).getTime();
    const recency = Math.max(0.1, 1 - age / (7 * 24 * 60 * 60 * 1000)); // decay over 7 days
    const weight = recency;
    
    if (lesson.outcome === 'success') {
      weightedSum += lesson.confidence * weight;
    } else if (lesson.outcome === 'failure') {
      weightedSum += (1 - lesson.confidence) * weight * -1;
    }
    
    totalWeight += weight;
  }
  
  if (totalWeight === 0) return 0.5;
  
  // Normalize to 0-1
  return Math.max(0, Math.min(1, (weightedSum / totalWeight + 1) / 2));
}

// Get all patterns with their confidences
export async function getPatternConfidences(): Promise<Record<string, number>> {
  if (!fs.existsSync(LESSONS_PATH)) {
    return {};
  }
  
  const content = fs.readFileSync(LESSONS_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  const patterns = new Map<string, { success: number; failure: number; total: number }>();
  
  for (const line of lines) {
    const lesson = LessonSchema.parse(JSON.parse(line));
    const stats = patterns.get(lesson.pattern) || { success: 0, failure: 0, total: 0 };
    
    if (lesson.outcome === 'success') stats.success++;
    else if (lesson.outcome === 'failure') stats.failure++;
    stats.total++;
    
    patterns.set(lesson.pattern, stats);
  }
  
  const result: Record<string, number> = {};
  for (const [pattern, stats] of patterns) {
    result[pattern] = stats.total > 0 
      ? stats.success / stats.total 
      : 0.5;
  }
  
  return result;
}

// Import crypto for UUID
import crypto from 'crypto';