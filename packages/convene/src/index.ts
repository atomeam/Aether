/**
 * Convene - Cross-Assistant Coordination Layer
 *
 * "Your AI tools don't just have memory. They have meetings."
 *
 * Enables multiple assistants to deliberate through a shared profile,
 * weighted voting, and unified resolution.
 * NOTE: fs, path, and crypto not compatible with Workers
 * Convene storage needs to use KV/R2 in Workers environment
 */

import { z } from 'zod';
// import fs from 'fs';
// import path from 'path';
// import crypto from 'crypto';

// ============================================================================
// SCHEMAS
// ============================================================================

// Assistant/participant identity
export const AssistantIdentitySchema = z.object({
  id: z.string(),
  name: z.string(),
  scopes: z.array(z.string()), // payments, support, code, etc.
  signedClaim: z.string().optional(), // Signed assertion of identity
});

export type AssistantIdentity = z.infer<typeof AssistantIdentitySchema>;

// Vote from an assistant
export const ParticipantVoteSchema = z.object({
  assistantId: z.string(),
  assistantName: z.string(),
  scope: z.string(),
  vote: z.enum(['approve', 'deny', 'abstain', 'escalate']),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

export type ParticipantVote = z.infer<typeof ParticipantVoteSchema>;

// A convened session
export const ConveneSessionSchema = z.object({
  sessionId: z.string(),
  profileId: z.string(),
  question: z.string(),
  context: z.record(z.unknown()),
  requiredScopes: z.array(z.string()),
  votes: z.array(ParticipantVoteSchema),
  consensus: z.number().min(0).max(1),
  recommended: z.enum(['approve', 'deny', 'escalate']),
  resolution: z.enum(['auto_executed', 'escalated_to_triage', 'rejected', 'pending']),
  narrative: z.string(),
  createdAt: number,
  resolvedAt: number,
});

export type ConveneSession = z.infer<typeof ConveneSessionSchema>;

// ============================================================================
// SCOPES TAXONOMY
// ============================================================================

export const SCOPES = {
  payments: { description: 'Billing, refunds, webhooks, financial' },
  support: { description: 'Customer tickets, communication, triage' },
  code: { description: 'Code review, commits, refactoring' },
  infrastructure: { description: 'Deployments, scaling, monitoring' },
  calendar: { description: 'Meetings, scheduling' },
  general: { description: 'General purpose' },
} as const;

export type Scope = keyof typeof SCOPES;

// ============================================================================
// STORAGE
// ============================================================================

const CONVENE_PATH = path.resolve(process.cwd(), '../../logs/convene.jsonl');
const ASSISTANTS_PATH = path.resolve(process.cwd(), '../../logs/assistant-identities.jsonl');

function ensureDir() {
  const dir = path.dirname(CONVENE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ============================================================================
// ASSISTANT IDENTITY MANAGEMENT
// ============================================================================

// Register an assistant
export function registerAssistant(identity: Omit<AssistantIdentity, 'id'>): AssistantIdentity {
  ensureDir();
  
  const full: AssistantIdentity = {
    id: crypto.randomUUID(),
    ...identity,
  };
  
  fs.appendFileSync(ASSISTANTS_PATH, JSON.stringify(full) + '\n');
  return full;
}

// List registered assistants
export function listAssistants(): AssistantIdentity[] {
  if (!fs.existsSync(ASSISTANTS_PATH)) return [];
  
  const content = fs.readFileSync(ASSISTANTS_PATH, 'utf-8');
  return content.trim().split('\n').filter(Boolean).map(line => AssistantIdentitySchema.parse(JSON.parse(line)));
}

// Get assistants by scope
export function getAssistantsByScope(scope: string): AssistantIdentity[] {
  return listAssistants().filter(a => a.scopes.includes(scope));
}

// ============================================================================
// CONVENENCE SESSION
// ============================================================================

// Create a convening session
export function convene(options: {
  profileId: string;
  question: string;
  context?: Record<string, unknown>;
  requiredScopes?: string[];
}): ConveneSession {
  ensureDir();
  
  const { profileId, question, context = {}, requiredScopes = ['general'] } = options;
  
  const session: ConveneSession = {
    sessionId: crypto.randomUUID(),
    profileId,
    question,
    context,
    requiredScopes,
    votes: [],
    consensus: 0,
    recommended: 'escalate',
    resolution: 'pending',
    narrative: '',
    createdAt: Date.now(),
    resolvedAt: 0,
  };
  
  // Write initial session
  fs.appendFileSync(CONVENE_PATH, JSON.stringify(session) + '\n');
  
  return session;
}

// Cast a vote in a session
export function castVote(
  sessionId: string,
  vote: Omit<ParticipantVote, 'assistantId'>
): ParticipantVote | null {
  if (!fs.existsSync(CONVENE_PATH)) return null;
  
  const content = fs.readFileSync(CONVENE_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  let found = false;
  const newLines: string[] = [];
  
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    
    if (session.sessionId === sessionId) {
      found = true;
      
      // Add vote
      const fullVote: ParticipantVote = {
        assistantId: crypto.randomUUID(), // New ID per vote
        ...vote,
      };
      session.votes.push(fullVote);
      
      // Compute consensus
      if (session.votes.length > 0) {
        const approve = session.votes.filter(v => v.vote === 'approve').length;
        const deny = session.votes.filter(v => v.vote === 'deny').length;
        const escalate = session.votes.filter(v => v.vote === 'escalate').length;
        
        // Weighted by confidence
        const weightedSum = session.votes.reduce(
          (sum, v) => sum + (v.vote === 'approve' ? v.confidence : v.vote === 'deny' ? -v.confidence : 0),
          0
        );
        
        session.consensus = Math.max(0, Math.min(1, (weightedSum + 1) / 2));
        
        // Determine recommendation
        if (escalate > 0) {
          session.recommended = 'escalate';
          session.resolution = 'escalated_to_triage';
        } else if (weightedSum > 0.3 && session.consensus > 0.6) {
          session.recommended = 'approve';
          session.resolution = 'auto_executed';
        } else if (weightedSum < -0.3) {
          session.recommended = 'deny';
          session.resolution = 'rejected';
        }
      }
      
      // Generate narrative
      const voteSummaries = session.votes.map(
        v => `${v.assistantName} (${v.scope}): ${v.vote} (${v.confidence})`
      );
      session.narrative = `${session.votes.length} assistants convened. ${voteSummaries.join('. ')}. Consensus: ${session.consensus.toFixed(2)}.`;
    }
    
    newLines.push(JSON.stringify(session));
  }
  
  if (found) {
    fs.writeFileSync(CONVENE_PATH, newLines.join('\n') + '\n');
  }
  
  return found ? vote : null;
}

// Resolve a session
export function resolveSession(
  sessionId: string,
  resolution: ConveneSession['resolution']
): ConveneSession | null {
  if (!fs.existsSync(CONVENE_PATH)) return null;
  
  const content = fs.readFileSync(CONVENE_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  let found = false;
  const newLines: string[] = [];
  
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    
    if (session.sessionId === sessionId) {
      found = true;
      session.resolution = resolution;
      session.resolvedAt = Date.now();
      
      if (!session.narrative) {
        session.narrative = `Session resolved as ${resolution}.`;
      }
    }
    
    newLines.push(JSON.stringify(session));
  }
  
  if (found) {
    fs.writeFileSync(CONVENE_PATH, newLines.join('\n') + '\n');
  }
  
  return found ? { sessionId, resolution } as ConveneSession : null;
}

// Get session by ID
export function getSession(sessionId: string): ConveneSession | null {
  if (!fs.existsSync(CONVENE_PATH)) return null;
  
  const content = fs.readFileSync(CONVENE_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    if (session.sessionId === sessionId) return session;
  }
  
  return null;
}

// List sessions for a profile
export function listSessions(profileId: string, limit = 20): ConveneSession[] {
  if (!fs.existsSync(CONVENE_PATH)) return [];
  
  const content = fs.readFileSync(CONVENE_PATH, 'utf-8');
  return content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => ConveneSessionSchema.parse(JSON.parse(line)))
    .filter(s => s.profileId === profileId)
    .slice(-limit);
}

// ============================================================================
// DELIBERATION RESULT
// ============================================================================

export interface DeliberationResult {
  sessionId: string;
  question: string;
  votes: ParticipantVote[];
  consensus: number;
  recommended: ConveneSession['recommended'];
  resolution: ConveneSession['resolution'];
  narrative: string;
  requiresApproval: boolean;
}

// Full deliberation with mock fan-out
export async function deliberate(options: {
  profileId: string;
  question: string;
  context?: Record<string, unknown>;
}): Promise<DeliberationResult> {
  // Start session
  const session = convene(options);
  
  // Fan-out to internal assistants (simulated)
  // In production, these would be actual webhook calls
  const mockVotes: Omit<ParticipantVote, 'assistantId'>[] = [
    {
      assistantName: 'Aether Evaluator',
      scope: 'code',
      vote: 'approve',
      confidence: 0.82,
      rationale: 'Pattern matches lesson #4471 with 0.82 confidence.',
    },
    {
      assistantName: 'Aether Foresight',
      scope: 'infrastructure',
      vote: 'escalate',
      confidence: 0.65,
      rationale: 'Predicts 40% chance of downstream cascade.',
    },
  ];
  
  // Cast votes
  for (const vote of mockVotes) {
    castVote(session.sessionId, vote);
  }
  
  // Get final session
  const final = getSession(session.sessionId)!;
  
  return {
    sessionId: final.sessionId,
    question: final.question,
    votes: final.votes,
    consensus: final.consensus,
    recommended: final.recommended,
    resolution: final.resolution,
    narrative: final.narrative,
    requiresApproval: final.resolution === 'escalated_to_triage',
  };
}