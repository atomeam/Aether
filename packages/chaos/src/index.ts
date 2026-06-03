/**
 * Chaos Package
 *
 * Synthetic chaos injection for immunity testing.
 * Safely injects failure patterns to train the agent loop.
 * NOTE: fs and path not compatible with Workers
 * Chaos injection needs to use Workers-compatible storage or be disabled in Workers environment
 *
 * Also includes Alpha Loop Hardening modules:
 * - BlastRadiusCap: Per-cycle limits
 * - Quarantine: Holding state for failed validations
 * - Canary: Low-stakes testing surface
 * - AutoRevert: Rollback signals and mechanism
 */

// import fs from 'fs';
// import path from 'path';

// Re-export hardening modules
export {
  checkBlastRadius,
  recordCycle,
  resetCycleState,
  getCapStatus,
  DEFAULT_CAPS,
  type BlastRadiusCaps,
  type CapCheckResult,
} from './blast-radius.js';

export {
  quarantineItem,
  getQuarantinedItems,
  getQuarantinedItem,
  releaseItem,
  deleteQuarantinedItem,
  cleanupExpired,
  type QuarantinedItem,
  type QuarantineStatus,
  type FailedStage,
} from './quarantine.js';

export {
  initCanary,
  startCanaryRun,
  checkCanaryPromotion,
  triggerCanaryAlert,
  getPendingCanaryRuns,
  getCanaryStatus,
  DEFAULT_CANARY_CONFIG,
  type CanaryRun,
  type CanaryStatus,
} from './canary.js';

export {
  recordCycleSuccess,
  recordCycleError,
  recordCuratorDenial,
  checkRevertSignals,
  getErrorRate,
  getRevertStatus,
  createCheckpoint,
  revertToCheckpoint,
  DEFAULT_REVERT_THRESHOLDS,
  type RevertSignal,
  type RevertSignalType,
} from './auto-revert.js';

// Valid sandbox directories
const SANDBOX_PATHS = [
  'sandbox',
  'packages/mcp-tools/sandbox',
  '../../sandbox',
];

// Chaos scenarios
export type ChaosScenario = 'broken_package_json' | 'corrupted_env_var' | 'invalid_syntax' | 'missing_dep' | 'network_timeout';

export interface ChaosResult {
  status: 'success' | 'error';
  scenario: ChaosScenario;
  injected: string;
  ledgerTrace: string;
  sandboxPath: string;
}

// Execute chaos injection
export function executeChaos(scenario: ChaosScenario, targetPath?: string): ChaosResult {
  // NOTE: fs and path not compatible with Workers
  // Chaos injection disabled in Workers environment
  return {
    status: 'skipped',
    scenario,
    injected: 'Chaos injection not available in Workers environment',
    ledgerTrace: 'CHAOS_DISABLED: Workers environment does not support filesystem operations',
    sandboxPath: targetPath || 'sandbox',
  };
}

// Get available scenarios
export function getScenarios() {
  return [
    { id: 'broken_package_json', description: 'Corrupt a package.json (disabled in Workers)' },
    { id: 'corrupted_env_var', description: 'Invalid env variable (disabled in Workers)' },
    { id: 'invalid_syntax', description: 'JavaScript syntax error (disabled in Workers)' },
    { id: 'missing_dep', description: 'Missing npm dependency (disabled in Workers)' },
    { id: 'network_timeout', description: 'Simulated timeout (disabled in Workers)' },
  ];
}

// Clean up sandbox
export function cleanupSandbox(targetPath?: string) {
  // NOTE: fs and path not compatible with Workers
  // Cleanup disabled in Workers environment
  return { status: 'skipped', message: 'Cleanup not available in Workers environment' };
}