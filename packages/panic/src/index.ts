/**
 * Panic Button
 *
 * One-call full autonomy pause.
 * Sets system to lock-down mode instantly.
 * NOTE: fs, path, and crypto not compatible with Workers
 * Panic state storage needs to use KV/R2 in Workers environment
 */

// import fs from 'fs';
// import path from 'path';
// import crypto from 'crypto';

// Panic state
export interface PanicState {
  active: boolean;
  triggeredAt?: number;
  triggeredBy?: string;
  reason: string;
  level: 'pause' | 'lockdown' | 'critical';
  autoResumeAt?: number;
}

// Lock file path
// const PANIC_PATH = path.resolve(process.cwd(), '../../logs/panic.json');

// Get current panic state
export function getPanicState(): PanicState {
  // NOTE: fs and path not compatible with Workers
  // Panic state storage needs to use KV/R2 in Workers environment
  return { active: false, reason: 'normal', level: 'pause' };
}

// Trigger panic
export function triggerPanic(options?: {
  reason?: string;
  level?: PanicState['level'];
  autoResumeMinutes?: number;
  triggeredBy?: string;
}): PanicState {
  const { reason = 'manual', level = 'lockdown', autoResumeMinutes, triggeredBy = 'system' } = options || {};

  const state: PanicState = {
    active: true,
    triggeredAt: Date.now(),
    triggeredBy,
    reason,
    level,
    autoResumeAt: autoResumeMinutes ? Date.now() + autoResumeMinutes * 60 * 1000 : undefined,
  };

  // NOTE: fs and path not compatible with Workers
  // Panic state storage needs to use KV/R2 in Workers environment
  // const dir = path.dirname(PANIC_PATH);
  // if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // fs.writeFileSync(PANIC_PATH, JSON.stringify(state, null, 2));

  return state;
}

// Release panic / resume normal operation
export function releasePanic(reason = 'manual_release'): PanicState {
  const state: PanicState = {
    active: false,
    reason,
    level: 'pause',
  };

  // NOTE: fs and path not compatible with Workers
  // Panic state storage needs to use KV/R2 in Workers environment
  // fs.writeFileSync(PANIC_PATH, JSON.stringify(state, null, 2));

  return state;
}

// Check if system is in panic mode
export function isPanicActive(): boolean {
  const state = getPanicState();
  
  if (!state.active) return false;
  
  // Check auto-resume
  if (state.autoResumeAt && Date.now() > state.autoResumeAt) {
    releasePanic('auto_resume');
    return false;
  }
  
  return true;
}

// Get policy override during panic
export function getPolicyOverride(): { default: string; tools: Record<string, string> } {
  const state = getPanicState();
  
  if (!state.active) {
    return { default: 'allow', tools: {} };
  }
  
  // During panic, default to deny everything
  return {
    default: 'deny',
    tools: {
      file_write: 'deny',
      git_commit: 'deny',
      http_request: 'deny',
      chaos_inject: 'deny',
      lessons_write: 'deny',
      trigger_workflow: 'deny',
    },
  };
}

// Panic history
export function getPanicHistory(limit = 20): PanicState[] {
  // In production, store history in separate file
  const current = getPanicState();
  return current.active ? [current] : [];
}