/**
 * Chaos Package
 * 
 * Synthetic chaos injection for immunity testing.
 * Safely injects failure patterns to train the agent loop.
 * 
 * Also includes Alpha Loop Hardening modules:
 * - BlastRadiusCap: Per-cycle limits
 * - Quarantine: Holding state for failed validations
 * - Canary: Low-stakes testing surface
 * - AutoRevert: Rollback signals and mechanism
 */

import fs from 'fs';
import path from 'path';

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
  const sandboxPath = targetPath || 'sandbox';
  
  // Guardrail: stay in sandbox
  const allowed = SANDBOX_PATHS.some(sp => sandboxPath.startsWith(sp) || sandboxPath.includes('sandbox'));
  if (!allowed) {
    throw new Error('Security: Chaos injection restricted to sandbox directories');
  }
  
  // Ensure sandbox exists
  const fullPath = path.resolve(process.cwd(), sandboxPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  
  switch (scenario) {
    case 'broken_package_json': {
      const pkg = JSON.stringify({ name: "broken", version: "1.0", dependencies: { invalid: "}" } }, null, 2);
      fs.writeFileSync(path.join(fullPath, 'package.json'), pkg);
      return {
        status: 'success',
        scenario: 'broken_package_json',
        injected: 'SyntaxError: Unexpected token } in package.json',
        ledgerTrace: 'ERR_CHAOS_001: package.json parsing failed',
        sandboxPath,
      };
    }
    
    case 'corrupted_env_var': {
      fs.writeFileSync(path.join(fullPath, '.env'), 'PORT=not_a_number\nDEBUG=invalid\n');
      return {
        status: 'success',
        scenario: 'corrupted_env_var',
        injected: 'PORT=not_a_number',
        ledgerTrace: 'ERR_CHAOS_002: [@aether/env] validation failed for PORT',
        sandboxPath,
      };
    }
    
    case 'invalid_syntax': {
      fs.writeFileSync(path.join(fullPath, 'broken.js'), 'const x == 5;\nexport default x;');
      return {
        status: 'success',
        scenario: 'invalid_syntax',
        injected: 'const x == 5;',
        ledgerTrace: 'ERR_CHAOS_003: Parsing error: Unexpected token ==',
        sandboxPath,
      };
    }
    
    case 'missing_dep': {
      const pkg = JSON.stringify({ name: "test", version: "1.0.0" }, null, 2);
      fs.writeFileSync(path.join(fullPath, 'package.json'), pkg);
      return {
        status: 'success',
        scenario: 'missing_dep',
        injected: 'missing dependency: non-existent-package',
        ledgerTrace: 'ERR_CHAOS_004: npm install failed - package not found',
        sandboxPath,
      };
    }
    
    case 'network_timeout': {
      fs.writeFileSync(path.join(fullPath, 'timeout.sh'), '#!/bin/bash\necho "Simulated timeout"\nsleep 300\n');
      return {
        status: 'success',
        scenario: 'network_timeout',
        injected: 'timeout: 300s',
        ledgerTrace: 'ERR_CHAOS_005: Request timeout after 300s',
        sandboxPath,
      };
    }
    
    default:
      throw new Error(`Unknown chaos scenario: ${scenario}`);
  }
}

// Get available scenarios
export function getScenarios() {
  return [
    { id: 'broken_package_json', description: 'Corrupt a package.json' },
    { id: 'corrupted_env_var', description: 'Invalid env variable' },
    { id: 'invalid_syntax', description: 'JavaScript syntax error' },
    { id: 'missing_dep', description: 'Missing npm dependency' },
    { id: 'network_timeout', description: 'Simulated timeout' },
  ];
}

// Clean up sandbox
export function cleanupSandbox(targetPath?: string) {
  const sandboxPath = targetPath || 'sandbox';
  const fullPath = path.resolve(process.cwd(), sandboxPath);
  
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
  
  return { cleaned: sandboxPath };
}