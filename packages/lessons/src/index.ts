/**
 * Lessons DB
 *
 * Append-only store of learned patterns from agent runs.
 * Turns executor actions into training signals.
 * NOTE: fs and path not compatible with Workers
 * Lessons storage needs to use KV/R2 in Workers environment
 */

import { z } from 'zod';
// import fs from 'fs';
// import path from 'path';

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
// const LESSONS_PATH = path.resolve(process.cwd(), '../../logs/lessons.jsonl');

// Ensure directory exists
function ensureDir() {
  // NOTE: fs and path not compatible with Workers
  // const dir = path.dirname(LESSONS_PATH);
  // if (!fs.existsSync(dir)) {
  //   fs.mkdirSync(dir, { recursive: true });
  // }
}

// Write a lesson entry
export function writeLesson(input: z.infer<typeof WriteLessonInput>) {
  // NOTE: fs and path not compatible with Workers
  // Lessons storage needs to use KV/R2 in Workers environment
  // ensureDir();

  const lesson = {
    id: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    ...input,
  };

  // const line = JSON.stringify(lesson) + '\n';
  // fs.appendFileSync(LESSONS_PATH, line);

  return lesson;
}

// Read lessons (last N or filtered by pattern)
export function readLessons(options?: {
  since?: number;  // ms ago
  pattern?: string;
  limit?: number;
}): Promise<Lesson[]> {
  // NOTE: fs and path not compatible with Workers
  // Lessons storage needs to use KV/R2 in Workers environment
  // const { since, pattern, limit = 100 } = options || {};
  // if (!fs.existsSync(LESSONS_PATH)) {
  //   return Promise.resolve([]);
  // }
  // const content = fs.readFileSync(LESSONS_PATH, 'utf-8');
  // const lines = content.trim().split('\n').filter(Boolean);
  // let lessons = lines.map(line => LessonSchema.parse(JSON.parse(line)));

  return Promise.resolve([]);
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
  // NOTE: fs and path not compatible with Workers
  // Lessons storage needs to use KV/R2 in Workers environment
  // if (!fs.existsSync(LESSONS_PATH)) {
  //   return {};
  // }
  // const content = fs.readFileSync(LESSONS_PATH, 'utf-8');
  // const lines = content.trim().split('\n').filter(Boolean);
  // const lessons = lines.map(line => LessonSchema.parse(JSON.parse(line)));

  return {};
}