/**
 * @aether/curator - Default-deny security gate for generated UI
 * 
 * Inspects component actions before they are allowed to impact the UI surface.
 * Default-deny means: if it's not explicitly allowed, it's blocked.
 * 
 * @version 1.0.0
 */

import { type ComponentAction, ComponentActionSchema } from "@aether/contracts";
import { ALLOWED_TYPES, getEntry } from "@aether/components";

export interface CuratorVerdict {
  approved: boolean;
  reason: string;
  rejectedActionIds: string[];
}

/**
 * Strict vocabulary of component types allowed to mount.
 * Derived from @aether/components manifest (single source of truth).
 */
const ALLOWED_COMPONENT_TYPES = ALLOWED_TYPES;

/**
 * Maximum actions allowed in a single response to prevent DoS
 */
const MAX_ACTIONS_PER_RESPONSE = 10;

/**
 * Default-Deny Curator Gate
 * 
 * Inspects generated actions before they are allowed to impact the UI surface.
 * Blocks:
 * - Unauthorized component types (not in ALLOWED_COMPONENT_TYPES)
 * - Too many actions (rate limit)
 * - Malformed actions (fails Zod validation)
 * 
 * @param actions - Array of component actions from the generative engine
 * @returns CuratorVerdict - approval/rejection with reason
 */
export function curateActions(actions: unknown): CuratorVerdict {
  // Ensure we have an array
  const actionArray = Array.isArray(actions) ? actions : [actions];
  
  // Validate each action against the schema
  for (const action of actionArray) {
    const validation = ComponentActionSchema.safeParse(action);
    if (!validation.success) {
      return {
        approved: false,
        reason: "Schema Violation: Actions failed Zod validation",
        rejectedActionIds: [],
      };
    }
  }
  
  // Rate limit check
  if (actionArray.length > MAX_ACTIONS_PER_RESPONSE) {
    return {
      approved: false,
      reason: `Rate Limit: ${actionArray.length} actions exceed maximum of ${MAX_ACTIONS_PER_RESPONSE}`,
      rejectedActionIds: [],
    };
  }

  const rejectedActionIds: string[] = [];

  // Capability check against allow-list
  for (const action of actionArray) {
    if (action.action === 'ADD') {
      if (!ALLOWED_COMPONENT_TYPES.has(action.plan.type)) {
        rejectedActionIds.push(action.plan.id);
      }
    } else if (action.action === 'MODIFY') {
      if (action.plan.type && !ALLOWED_COMPONENT_TYPES.has(action.plan.type)) {
        rejectedActionIds.push(action.targetId);
      }
    } else if (action.action === 'CLI_SKILL_CALL') {
      // CLI skill validation: block wuzz against production targets
      if (action.skillName === 'wuzz' && action.command === 'launch') {
        const url = action.args?.url as string | undefined;
        if (url && isProductionUrl(url)) {
          rejectedActionIds.push(`cli:${action.skillName}:${action.command}`);
        }
      }
    }
    // REMOVE, MCP_TOOL_CALL are allowed
  }

  if (rejectedActionIds.length > 0) {
    return {
      approved: false,
      reason: `Default-Deny: Unauthorized component types: ${rejectedActionIds.join(", ")}`,
      rejectedActionIds,
    };
  }

  return {
    approved: true,
    reason: "All actions clear security capability boundaries.",
    rejectedActionIds: [],
  };
}

/**
 * Log a curator verdict to the routing ledger
 * Stub - will be promoted to Logs DB in follow-up
 */
export function logCuratorVerdict(verdict: CuratorVerdict, prompt: string): void {
  const entry = {
    timestamp: new Date().toISOString(),
    verdict: verdict.approved ? 'APPROVED' : 'REJECTED',
    reason: verdict.reason,
    rejectedIds: verdict.rejectedActionIds,
    promptHash: prompt.slice(0, 32), // First 32 chars as identifier
  };
  console.log(`[CURATOR] ${JSON.stringify(entry)}`);
}

// --- Pre-Flight + Post-Flight Checks ---

import {
  checkBlastRadius,
  recordCycle,
  checkRevertSignals,
  recordCuratorDenial,
  recordCycleSuccess,
  recordCycleError,
  getRevertStatus,
  DEFAULT_CAPS,
  DEFAULT_REVERT_THRESHOLDS,
} from '@aether/chaos';

export interface PreFlightResult {
  passed: boolean;
  reason: string;
  checks: {
    inputValid: boolean;
    blastRadiusOk: boolean;
    revertSignal: boolean;
  };
}

/**
 * Pre-flight checks before Alpha execution
 * 
 * Validates input and checks if execution is safe
 */
export function preFlightCheck(
  filesToTouch: string[],
  surfacesToWrite: string[]
): PreFlightResult {
  const checks = {
    inputValid: filesToTouch.length > 0,
    blastRadiusOk: false,
    revertSignal: false,
  };
  
  // Check blast radius
  const blastCheck = checkBlastRadius(filesToTouch, surfacesToWrite);
  checks.blastRadiusOk = blastCheck.allowed;
  
  // Check for revert signals
  const revert = checkRevertSignals();
  checks.revertSignal = revert === null;
  
  // All checks must pass
  const passed = checks.inputValid && checks.blastRadiusOk && checks.revertSignal;
  
  const reasons: string[] = [];
  if (!checks.inputValid) reasons.push('Input invalid');
  if (!checks.blastRadiusOk) reasons.push(blastCheck.reason);
  if (!checks.revertSignal) reasons.push(`Revert signal: ${revert?.type}`);
  
  return {
    passed,
    reason: passed ? 'All pre-flight checks passed' : reasons.join('; '),
    checks,
  };
}

export interface PostFlightResult {
  passed: boolean;
  reason: string;
  curatorApproved: boolean;
  filesModified: number;
  cycleRecorded: boolean;
}

/**
 * Post-flight checks after Alpha execution
 * 
 * Validates output and records cycle
 */
export function postFlightCheck(
  actions: unknown,
  filesModified: string[],
  surfacesModified: string[]
): PostFlightResult {
  // 1. Curator gate - validate actions
  const curatorVerdict = curateActions(actions);
  const curatorApproved = curatorVerdict.approved;
  
  // 2. Record cycle outcome
  let cycleRecorded = false;
  if (curatorApproved) {
    recordCycle(filesModified, surfacesModified);
    recordCycleSuccess();
    cycleRecorded = true;
  } else {
    recordCuratorDenial();
    recordCycleError();
  }
  
  return {
    passed: curatorApproved,
    reason: curatorVerdict.reason,
    curatorApproved,
    filesModified: filesModified.length,
    cycleRecorded,
  };
}

/**
 * Get combined Curator + Hardening status
 */
export function getCuratorStatus(): {
  curator: {
    maxActions: number;
  };
  caps: typeof DEFAULT_CAPS;
  revert: ReturnType<typeof getRevertStatus>;
} {
  return {
    curator: {
      maxActions: MAX_ACTIONS_PER_RESPONSE,
    },
    caps: DEFAULT_CAPS,
    revert: getRevertStatus(),
  };
}

/**
 * Check if a URL points to a production target (blocks wuzz)
 */
function isProductionUrl(url: string): boolean {
  const productionPatterns = [
    /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i,
    /^https?:\/\/.*\.(local|internal|dev|test|staging)$/i,
    /^https?:\/\/localhost/i,
  ];
  const isLocal = productionPatterns.some(p => p.test(url));
  return !isLocal;
}