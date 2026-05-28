/**
 * Dispatcher - Event Trigger & Reason Codes
 * 
 * Monitors Proposals DB and integrates with Lessons DB.
 * Part of the AtoMind Bridge autonomous loop.
 */

import * as fs from 'fs';
import * as path from 'path';

// --- Reason Codes ---

export const ReasonCode = {
  // CUR_* prefix table
  CUR_ZERO_KEY_OK: 'CUR_ZERO_KEY_MISSING',       // No key required - auto-approved
  CUR_ONE_KEY_OK: 'CUR_ONE_KEY_MISSING',         // Requires user co-sign only
  CUR_TWO_KEY_MISSING: 'CUR_TWO_KEY_MISSING', // Requires Operator co-sign (NEW)
  CUR_THREE_KEY_ESCALATE: 'CUR_THREE_KEY_ESCALATE', // Requires full council
  
  // Standard reasons
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_SCOPE: 'INVALID_SCOPE',
  SECURITY_RISK: 'SECURITY_RISK',
  RATE_LIMIT: 'RATE_LIMIT',
  CUR_DO_NOT_REPEAT: 'CUR_DO_NOT_REPEAT', // Lesson collision
} as const;

export type ReasonCode = typeof ReasonCode[keyof typeof ReasonCode];

// --- Risk Levels ---

export const RiskLevel = {
  LOW: { threshold: 0, reason: ReasonCode.CUR_ZERO_KEY_OK },
  MEDIUM: { threshold: 1, reason: ReasonCode.CUR_ONE_KEY_OK },
  HIGH: { threshold: 2, reason: ReasonCode.CUR_TWO_KEY_MISSING },
  CRITICAL: { threshold: 3, reason: ReasonCode.CUR_THREE_KEY_ESCALATE },
} as const;

// --- Lessons DB Integration with Dual-Field Support ---

const LESSONS_LOG = './logs/lessons.jsonl';

interface Lesson {
  id: string;
  proposalId?: string;
  'Hash neighborhood'?: string;       // NEW: prefix matching
  'Inputs hash neighborhood'?: string; // LEGACY: preserved for historical
  outcome: 'success' | 'failure' | 'partial' | 'pending_operator_cosign';
  errorType?: string;
  filesAffected: string[];
  timestamp: number;
}

export async function readLessons(forProposal?: string): Promise<Lesson[]> {
  if (!fs.existsSync(LESSONS_LOG)) return [];
  
  const lines = fs.readFileSync(LESSONS_LOG, 'utf-8').split('\n').filter(Boolean);
  const lessons = lines.map(line => JSON.parse(line));
  
  if (forProposal) {
    return lessons.filter(l => l.proposalId === forProposal);
  }
  return lessons;
}

export async function suggestFromLessons(proposalFiles: string[]): Promise<string[]> {
  const lessons = await readLessons();
  
  // Find similar past proposals
  const related = lessons.filter(l => 
    l.filesAffected.some(f => proposalFiles.includes(f))
  );
  
  // Return error patterns to avoid
  return related
    .filter(l => l.outcome === 'failure')
    .map(l => l.errorType)
    .filter((e): e is string => Boolean(e));
}

// --- Event Trigger (The Nervous System) ---

export class ProposalsWatcher {
  private lastCheck: number = 0;
  private intervalMs: number = 5000; // Poll every 5s
  
  constructor(pollIntervalMs?: number) {
    if (pollIntervalMs) this.intervalMs = pollIntervalMs;
  }
  
  /**
   * Check for new pending proposals
   */
  async check(): Promise<Array<{ id: string; summary: string; requires: string[] }>> {
    const PROPOSALS_LOG = './logs/proposals.jsonl';
    if (!fs.existsSync(PROPOSALS_LOG)) return [];
    
    const lines = fs.readFileSync(PROPOSALS_LOG, 'utf-8').split('\n').filter(Boolean);
    const proposals = lines.map(line => JSON.parse(line))
      .filter(p => p.status === 'pending_review' && p.updatedAt > this.lastCheck);
    
    if (proposals.length > 0) {
      this.lastCheck = Date.now();
    }
    
    return proposals.map(p => ({
      id: p.id,
      summary: p.summary,
      requires: p.requires || [],
    }));
  }
  
  /**
   * Start polling loop
   */
  async startPolling(callback: (proposal: { id: string; summary: string; requires: string[] }) => Promise<void>): Promise<void> {
    console.log('[Dispatcher] Starting proposals poll loop...');
    
    while (true) {
      const newProposals = await this.check();
      
      for (const proposal of newProposals) {
        console.log(`[Dispatcher] New proposal: ${proposal.id}`);
        await callback(proposal);
      }
      
      await new Promise(r => setTimeout(r, this.intervalMs));
    }
  }
}

// --- Dispatcher Decision Engine ---

export function evaluateRisk(proposal: {
  filesOrPagesTouched: string[];
  requires: string[];
}): { requiredKeys: number; reason: ReasonCode } {
  
  let riskScore = 0;
  
  // File risk scoring
  const criticalDirs = ['/apps/backend', '/packages/governance'];
  for (const file of proposal.filesOrPagesTouched) {
    if (criticalDirs.some(d => file.includes(d))) {
      riskScore += 2;
    } else if (file.includes('/packages/')) {
      riskScore += 1;
    }
  }
  
  // Requirement scaling
  if (proposal.requires.includes('security_audit')) riskScore += 2;
  if (proposal.requires.includes('code_review')) riskScore += 1;
  
  // Map to reason code
  if (riskScore >= 3) {
    return { requiredKeys: 3, reason: ReasonCode.CUR_THREE_KEY_ESCALATE };
  } else if (riskScore >= 2) {
    return { requiredKeys: 2, reason: ReasonCode.CUR_TWO_KEY_MISSING };
  } else if (riskScore >= 1) {
    return { requiredKeys: 1, reason: ReasonCode.CUR_ONE_KEY_OK };
  }
  return { requiredKeys: 0, reason: ReasonCode.CUR_ZERO_KEY_OK };
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`) {
  const watcher = new ProposalsWatcher();
  
  console.log('[Dispatcher] Event trigger started.\n');
  console.log('Reason codes:', Object.values(ReasonCode).join(', '));
  console.log('Polling every 5s...\n');
  
  watcher.startPolling(async (proposal) => {
    console.log(`\n📥 Received: ${proposal.id}`);
    console.log(`   Summary: ${proposal.summary.substring(0, 60)}...`);
    console.log(`   Requires: ${proposal.requires.join(', ')}`);
  });
}