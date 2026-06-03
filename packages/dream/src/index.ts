/**
 * Dream State
 * 
 * Idle-time memory consolidation.
 * Replays recent events through the pipeline without side effects.
 */

import { readLessons, getPatternConfidence } from '@aether/lessons';

// Config
export interface DreamConfig {
  idleMinutes: number;
  maxDreams: number;
  confidenceCap: number;
}

const DEFAULT_CONFIG: DreamConfig = {
  idleMinutes: 5,
  maxDreams: 20,
  confidenceCap: 0.75, // Cap dream lesson confidence
};

// State
let lastActivity = Date.now();
let isDreaming = false;

// Touch to reset idle timer
export function touch() {
  lastActivity = Date.now();
}

// Check if should dream
export function shouldDream(config = DEFAULT_CONFIG): boolean {
  const idleMs = Date.now() - lastActivity;
  const idleMinutes = idleMs / 60000;
  return idleMinutes >= config.idleMinutes && !isDreaming;
}

// Dream state: consolidate memory
export async function dream(config = DEFAULT_CONFIG): Promise<{
  dreamId: string;
  scenarios: number;
  lessons: number;
}> {
  isDreaming = true;
  
  try {
    // Get recent lessons
    const lessons = await readLessons({ limit: config.maxDreams });
    
    // Filter only recent ones (last hour)
    const oneHourAgo = Date.now() - 3600000;
    const recent = lessons.filter(l => new Date(l.timestamp).getTime() > oneHourAgo);
    
    // For each, check current confidence vs original
    const updatedPatterns = new Map<string, { original: number; current: number }>();
    
    for (const lesson of recent) {
      const current = await getPatternConfidence(lesson.pattern);
      const existing = updatedPatterns.get(lesson.pattern);
      
      if (existing) {
        existing.current = Math.max(existing.current, current);
      } else {
        updatedPatterns.set(lesson.pattern, {
          original: lesson.confidence,
          current,
        });
      }
    }
    
    // Check if confidence evolved
    let lessonsWritten = 0;
    for (const [pattern, { original, current }] of updatedPatterns) {
      if (Math.abs(current - original) > 0.1) {
        lessonsWritten++;
      }
    }
    
    const dreamId = crypto.randomUUID();
    
    return {
      dreamId,
      scenarios: updatedPatterns.size,
      lessons: lessonsWritten,
    };
  } finally {
    isDreaming = false;
  }
}

// Get dream status
export function getDreamStatus() {
  return {
    isDreaming,
    lastActivity: new Date(lastActivity).toISOString(),
    idleMinutes: (Date.now() - lastActivity) / 60000,
  };
}