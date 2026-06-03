/**
 * Signed Provenance
 *
 * Cryptographically signed lesson provenance.
 * Prevents lesson poisoning via source verification and quotas.
 * NOTE: crypto, fs, and path not compatible with Workers
 * Provenance storage needs to use KV/R2 in Workers environment
 */

// import crypto from 'crypto';
// import fs from 'fs';
// import path from 'path';

// Signer keys (in production, use external key service)
// NOTE: crypto.randomBytes not compatible with Workers
// const SIGNING_KEY = process.env.AETHER_SIGNING_KEY || crypto.randomBytes(32).toString('hex');
// const VERIFY_KEY = process.env.AETHER_VERIFY_KEY || SIGNING_KEY.slice(0, 32);
const SIGNING_KEY = process.env.AETHER_SIGNING_KEY || Math.random().toString(36).substring(2, 34);
const VERIFY_KEY = process.env.AETHER_VERIFY_KEY || SIGNING_KEY.substring(0, 32);

// Provenance record for each lesson
export interface SignedLesson {
  id: string;
  pattern: string;
  action: string;
  outcome: 'success' | 'failure' | 'noop';
  confidence: number;
  source: 'reflector' | 'human' | 'system' | 'dream';
  signature: string;
  createdAt: number;
  policyHash: string; // Hash of policy at decision time
}

// Quota tracking
interface QuotaUsage {
  source: string;
  count: number;
  lastReset: number;
}

const QUOTAS_PATH = path.resolve(process.cwd(), '../../logs/quotas.json');
const MAX_QUOTA_PER_HOUR = 100;

// Signature helper
function sign(data: string): string {
  return crypto.createHmac('sha256', VERIFY_KEY).update(data).digest('hex');
}

function verify(data: string, signature: string): boolean {
  return sign(data) === signature;
}

// Write signed lesson
export function writeSignedLesson(lesson: Omit<SignedLesson, 'id' | 'signature' | 'createdAt' | 'policyHash'>): SignedLesson {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  
  // Get current policy hash
  let policyHash = '';
  try {
    const policyContent = fs.readFileSync('../../packages/curator/policy.yaml', 'utf-8');
    policyHash = crypto.createHash('sha256').update(policyContent).digest('hex').slice(0, 16);
  } catch {
    policyHash = 'unknown';
  }
  
  const payload = JSON.stringify({ id, ...lesson, createdAt, policyHash });
  const signature = sign(payload);
  
  const fullLesson: SignedLesson = {
    id,
    ...lesson,
    signature,
    createdAt,
    policyHash,
  };
  
  // Check quota
  checkAndIncrementQuota(lesson.source);
  
  return fullLesson;
}

// Verify signed lesson
export function verifyLesson(lesson: SignedLesson): { valid: boolean; reason: string } {
  const { signature, createdAt, policyHash, ...payload } = lesson;
  const payloadStr = JSON.stringify({ ...payload, createdAt, policyHash });
  
  if (!verify(payloadStr, signature)) {
    return { valid: false, reason: 'Invalid signature' };
  }
  
  // Check policy hash matches (optional - warn if different)
  // In practice, we capture the policy hash at write time for audit
  
  return { valid: true, reason: 'OK' };
}

// Quota management
function getQuotas(): Map<string, QuotaUsage> {
  if (!fs.existsSync(QUOTAS_PATH)) return new Map();
  
  const content = fs.readFileSync(QUOTAS_PATH, 'utf-8');
  return new Map(Object.entries(JSON.parse(content)));
}

function saveQuotas(quotas: Map<string, QuotaUsage>) {
  const obj = Object.fromEntries(quotas);
  const dir = path.dirname(QUOTAS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(QUOTAS_PATH, JSON.stringify(obj));
}

function checkAndIncrementQuota(source: string): boolean {
  const quotas = getQuotas();
  const now = Date.now();
  const hourMs = 3600000;
  
  const usage = quotas.get(source) || { source, count: 0, lastReset: now };
  
  // Reset if hour passed
  if (now - usage.lastReset > hourMs) {
    usage.count = 0;
    usage.lastReset = now;
  }
  
  if (usage.count >= MAX_QUOTA_PER_HOUR) {
    throw new Error(`Quota exceeded for source: ${source}`);
  }
  
  usage.count++;
  quotas.set(source, usage);
  saveQuotas(quotas);
  
  return true;
}

// Get remaining quota
export function getQuotaRemaining(source: string): number {
  const quotas = getQuotas();
  const usage = quotas.get(source);
  if (!usage) return MAX_QUOTA_PER_HOUR;
  
  const now = Date.now();
  if (now - usage.lastReset > 3600000) return MAX_QUOTA_PER_HOUR;
  
  return Math.max(0, MAX_QUOTA_PER_HOUR - usage.count);
}

// Anomaly detection on confidence drift
export interface DriftAlert {
  pattern: string;
  previousConfidence: number;
  currentConfidence: number;
  drift: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function detectConfidenceDrift(history: SignedLesson[], threshold = 0.2): DriftAlert[] {
  const byPattern = new Map<string, number[]>();
  
  // Group by pattern
  for (const lesson of history) {
    const confidences = byPattern.get(lesson.pattern) || [];
    confidences.push(lesson.confidence);
    byPattern.set(lesson.pattern, confidences);
  }
  
  const alerts: DriftAlert[] = [];
  
  for (const [pattern, confidences] of byPattern) {
    if (confidences.length < 2) continue;
    
    const prev = confidences[confidences.length - 2];
    const curr = confidences[confidences.length - 1];
    const drift = Math.abs(curr - prev);
    
    // Large drift in either direction
    if (drift > threshold) {
      let severity: DriftAlert['severity'] = 'low';
      if (drift > 0.5) severity = 'critical';
      else if (drift > 0.3) severity = 'high';
      else if (drift > 0.2) severity = 'medium';
      
      alerts.push({
        pattern,
        previousConfidence: prev,
        currentConfidence: curr,
        drift,
        severity,
      });
    }
  }
  
  return alerts;
}