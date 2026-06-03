/**
 * Profile API
 *
 * Read-only, scoped, signed API exposing lessons/patterns to external assistants.
 * This is the bridge from internal runtime to Loxa product.
 * NOTE: crypto not compatible with Workers
 * Use crypto.subtle in Workers environment
 */

import { readLessons, getPatternConfidence, getLearnedPatterns } from '@aether/lessons';
import { getStats } from '@aether/curator-audit';
import { getStats as getTriageStats } from '@aether/triage';
// import crypto from 'crypto';

// Profile data structure (what external assistants see)
export interface AgentProfile {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  patterns: PatternSummary[];
  confidence: number;
  stats: ProfileStats;
  signature: string;
  generatedAt: number;
}

export interface PatternSummary {
  pattern: string;
  confidence: number;
  successRate: number;
  lastSeen: number;
}

export interface ProfileStats {
  totalLessons: number;
  totalDecisions: number;
  approvalRate: number;
  pendingEscalations: number;
}

// Generate signed profile snapshot
export async function generateProfile(options?: {
  includePatterns?: boolean;
  includeStats?: boolean;
  minConfidence?: number;
}): Promise<AgentProfile> {
  const { includePatterns = true, includeStats = true, minConfidence = 0.1 } = options || {};
  
  const patterns: PatternSummary[] = [];
  
  if (includePatterns) {
    const lessons = await readLessons({ limit: 100 });
    
    // Group by pattern
    const byPattern = new Map<string, { count: number; successes: number; lastSeen: number; confidence: number }>();
    
    for (const lesson of lessons) {
      if (lesson.confidence < minConfidence) continue;
      
      const existing = byPattern.get(lesson.pattern) || { count: 0, successes: 0, lastSeen: 0, confidence: 0 };
      existing.count++;
      if (lesson.outcome === 'success') existing.successes++;
      existing.lastSeen = Math.max(existing.lastSeen, new Date(lesson.timestamp).getTime());
      existing.confidence = Math.max(existing.confidence, lesson.confidence);
      byPattern.set(lesson.pattern, existing);
    }
    
    for (const [pattern, data] of byPattern) {
      patterns.push({
        pattern,
        confidence: Math.round(data.confidence * 100) / 100,
        successRate: Math.round((data.successes / data.count) * 100) / 100,
        lastSeen: data.lastSeen,
      });
    }
    
    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  let stats: ProfileStats = {
    totalLessons: 0,
    totalDecisions: 0,
    approvalRate: 0,
    pendingEscalations: 0,
  };
  
  if (includeStats) {
    const auditStats = await getStats();
    const triageStats = await getTriageStats();
    
    stats = {
      totalLessons: patterns.length,
      totalDecisions: auditStats.total,
      approvalRate: 1 - auditStats.denial_rate,
      pendingEscalations: triageStats.pending,
    };
  }
  
  // Calculate overall confidence
  const avgConfidence = patterns.length > 0
    ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
    : 0;

  const profile: AgentProfile = {
    id: Math.random().toString(36).substring(2, 15),
    name: 'Aether',
    version: '1.0.0',
    capabilities: [
      'code_generation',
      'bug_fix',
      'refactoring',
      'self_improvement',
      'policy_enforcement',
    ],
    patterns,
    confidence: Math.round(avgConfidence * 100) / 100,
    stats,
    signature: '', // Filled below
    generatedAt: Date.now(),
  };

  // Sign the profile
  // NOTE: crypto.createHash not compatible with Workers
  // Use crypto.subtle in Workers environment
  const payload = JSON.stringify({ patterns, stats, generatedAt: profile.generatedAt });
  profile.signature = simpleHash(payload);

  return profile;
}

// Simple hash function for Workers compatibility
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Query patterns (public read-only API)
export async function queryPatterns(filters?: {
  minConfidence?: number;
  minSuccessRate?: number;
  limit?: number;
}): Promise<PatternSummary[]> {
  const { minConfidence = 0, minSuccessRate = 0, limit = 50 } = filters || {};
  
  const lessons = await readLessons({ limit: 200 });
  
  // Aggregate by pattern
  const byPattern = new Map<string, { count: number; successes: number; lastSeen: number; confidence: number }>();
  
  for (const lesson of lessons) {
    const existing = byPattern.get(lesson.pattern) || { count: 0, successes: 0, lastSeen: 0, confidence: 0 };
    existing.count++;
    if (lesson.outcome === 'success') existing.successes++;
    existing.lastSeen = Math.max(existing.lastSeen, new Date(lesson.timestamp).getTime());
    existing.confidence = Math.max(existing.confidence, lesson.confidence);
    byPattern.set(lesson.pattern, existing);
  }
  
  const results: PatternSummary[] = [];
  
  for (const [pattern, data] of byPattern) {
    const successRate = data.count > 0 ? data.successes / data.count : 0;
    
    if (data.confidence >= minConfidence && successRate >= minSuccessRate) {
      results.push({
        pattern,
        confidence: Math.round(data.confidence * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        lastSeen: data.lastSeen,
      });
    }
  }
  
  // Sort by confidence and apply limit
  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, limit);
}

// Verify profile signature
export function verifyProfile(profile: AgentProfile): boolean {
  const { signature, ...rest } = profile;
  const payload = JSON.stringify({ patterns: rest.patterns, stats: rest.stats, generatedAt: profile.generatedAt });
  const expected = simpleHash(payload);
  return signature === expected;
}