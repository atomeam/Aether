/**
 * Sandbox Enforcement Runtime
 * 
 * Multi-tenant isolation with path/network/process/resource policies.
 * Designed with per-tenant namespacing from the start.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface SandboxConfig {
  // Base path for all sandboxes
  basePath: string;
  
  // Per-tenant isolation
  perTenantNamespacing: boolean;
  
  // Resource limits per invocation
  resources: {
    maxMemoryMB: number;
    maxCPUSeconds: number;
    maxWallSeconds: number;
    maxFileDescriptors: number;
    maxFileSizeMB: number;
  };
  
  // Allowed hosts for http_request (empty = none)
  allowedHosts: string[];
  
  // Process spawning
  allowSubprocess: boolean;
  
  // Escape detection
  logDeniedSyscalls: boolean;
}

// Default config
export const DEFAULT_CONFIG: SandboxConfig = {
  basePath: process.env.SANDBOX_PATH || '/tmp/aether-sandbox',
  perTenantNamespacing: true,
  resources: {
    maxMemoryMB: 512,
    maxCPUSeconds: 30,
    maxWallSeconds: 60,
    maxFileDescriptors: 64,
    maxFileSizeMB: 50,
  },
  allowedHosts: [], // Empty = none allowed by default
  allowSubprocess: false,
  logDeniedSyscalls: true,
};

// Current config (loaded from file or env)
let config = { ...DEFAULT_CONFIG };

export function getConfig(): SandboxConfig {
  return { ...config };
}

export function setConfig(newConfig: Partial<SandboxConfig>) {
  config = { ...config, ...newConfig };
  return config;
}

// ============================================================================
// PATH POLICY
// ============================================================================

// Directory permissions
export type PathPermission = 'read' | 'write' | 'execute' | 'none';

// Path policy per tool (can be overridden per profile/tenant)
export interface PathPolicy {
  tool: string;
  basePaths: Record<string, PathPermission>; // /sandbox -> write
  deniedPatterns: string[]; // **/.env**, **/ secrets/**
}

// Default path policy
const DEFAULT_PATH_POLICY: PathPolicy[] = [
  {
    tool: 'file_read',
    basePaths: {
      'sandbox': 'read',
      'packages': 'read',
      'logs': 'read',
    },
    deniedPatterns: ['**/.env', '**/secrets/**', '**/*.key', '**/id_rsa*'],
  },
  {
    tool: 'file_write',
    basePaths: {
      'sandbox': 'write',
    },
    deniedPatterns: ['**/.env', '**/secrets/**', '**/node_modules/**'],
  },
  {
    tool: 'git_commit',
    basePaths: {
      'packages': 'write',
      'apps': 'write',
    },
    deniedPatterns: ['**/.env', '**/secrets/**', '**/node_modules/**'],
  },
];

// Export default path policy for external consumers
export { DEFAULT_PATH_POLICY };

export function getPathPolicy(tool: string): PathPolicy | undefined {
  return DEFAULT_PATH_POLICY.find(p => p.tool === tool);
}

// ============================================================================
// TENANT / PROFILE NAMESPACE
// ============================================================================

// Generate sandbox root for a profile/tenant
export function getSandboxRoot(profileId: string): string {
  if (!config.perTenantNamespacing) {
    return config.basePath;
  }
  return path.join(config.basePath, profileId);
}

// Resolve a path to its sandbox-limited version
export function resolveSandboxPath(profileId: string, requestedPath: string): {
  resolved: string;
  allowed: boolean;
  reason?: string;
} {
  const sandboxRoot = getSandboxRoot(profileId);
  
  // Resolve to absolute
  const absPath = path.isAbsolute(requestedPath)
    ? requestedPath
    : path.resolve(process.cwd(), requestedPath);
  
  // Check it's within sandbox (or explicitly allowed)
  const normalized = path.normalize(absPath);
  const normalizedRoot = path.normalize(sandboxRoot);
  
  // Allow if under sandbox root
  if (normalized.startsWith(normalizedRoot)) {
    return { resolved: normalized, allowed: true };
  }
  
  // Check explicitly allowed external paths
  const toolPolicy = getPathPolicy('file_write');
  if (toolPolicy) {
    for (const [base, perm] of Object.entries(toolPolicy.basePaths)) {
      if (perm !== 'none' && normalized.startsWith(base)) {
        return { resolved: normalized, allowed: true };
      }
    }
  }
  
  return {
    resolved: normalized,
    allowed: false,
    reason: `Path ${normalized} is outside sandbox root ${sandboxRoot}`,
  };
}

// Check path against denied patterns (glob-style)
export function isPathDenied(absolutePath: string, deniedPatterns: string[]): boolean {
  const normalized = absolutePath.replace(/\\/g, '/');
  
  for (const pattern of deniedPatterns) {
    // Simple glob: ** means any path
    const globPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
    const regex = new RegExp(`^${globPattern}$`);
    
    if (regex.test(normalized)) {
      return true;
    }
  }
  
  return false;
}

// ============================================================================
// NETWORK POLICY
// ============================================================================

export interface NetworkPolicy {
  allowlist: string[];  // hostnames/IPs
  denylist: string[];   // explicitly blocked
  defaultAllow: boolean;
}

export function checkNetworkAccess(host: string, policy?: NetworkPolicy): {
  allowed: boolean;
  reason: string;
} {
  const p = policy || {
    allowlist: config.allowedHosts,
    denylist: [],
    defaultAllow: config.allowedHosts.length === 0 ? false : true,
  };
  
  // Check denylist first
  for (const blocked of p.denylist) {
    if (host === blocked || host.endsWith('.' + blocked)) {
      return { allowed: false, reason: `Host ${host} is denylisted` };
    }
  }
  
  // Check allowlist
  if (p.allowlist.length > 0) {
    for (const allowed of p.allowlist) {
      if (host === allowed || host.endsWith('.' + allowed)) {
        return { allowed: true, reason: `Host ${host} is allowlisted` };
      }
    }
    return { allowed: false, reason: `Host ${host} not in allowlist` };
  }
  
  // Default policy
  if (p.defaultAllow) {
    return { allowed: true, reason: 'Default allow' };
  }
  
  return { allowed: false, reason: 'Network access denied by default' };
}

// ============================================================================
// PROCESS POLICY
// ============================================================================

export interface ProcessPolicy {
  allowSpawn: boolean;
  inheritSandbox: boolean;
  maxForkDepth: number;
}

export function checkProcessSpawn(policy?: ProcessPolicy): {
  allowed: boolean;
  reason: string;
} {
  const p = policy || {
    allowSpawn: config.allowSubprocess,
    inheritSandbox: true,
    maxForkDepth: 1,
  };
  
  if (!p.allowSpawn) {
    return { allowed: false, reason: 'Subprocess spawning is disabled' };
  }
  
  return { allowed: true, reason: 'Process spawn allowed' };
}

// ============================================================================
// RESOURCE ENFORCEMENT
// ============================================================================

export interface ResourceUsage {
  memoryBytes: number;
  cpuSeconds: number;
  wallSeconds: number;
  fileDescriptors: number;
  bytesWritten: number;
}

export function checkResources(usage: ResourceUsage): {
  allowed: boolean;
  exceeded: string[];
} {
  const exceeded: string[] = [];
  
  if (usage.memoryBytes > config.resources.maxMemoryMB * 1024 * 1024) {
    exceeded.push('memory');
  }
  if (usage.cpuSeconds > config.resources.maxCPUSeconds) {
    exceeded.push('cpu');
  }
  if (usage.wallSeconds > config.resources.maxWallSeconds) {
    exceeded.push('wall');
  }
  if (usage.fileDescriptors > config.resources.maxFileDescriptors) {
    exceeded.push('fds');
  }
  if (usage.bytesWritten > config.resources.maxFileSizeMB * 1024 * 1024) {
    exceeded.push('disk');
  }
  
  return {
    allowed: exceeded.length === 0,
    exceeded,
  };
}

// ============================================================================
// SANDBOX LIFECYCLE
// ============================================================================

// Create sandbox for a profile
export function createSandbox(profileId: string): { success: boolean; sandboxRoot?: string; error?: string } {
  const root = getSandboxRoot(profileId);
  
  try {
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
      
      // Create subdirectories
      fs.mkdirSync(path.join(root, 'workspace'), { recursive: true });
      fs.mkdirSync(path.join(root, 'temp'), { recursive: true });
    }
    
    return { success: true, sandboxRoot: root };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Delete sandbox for a profile
export function deleteSandbox(profileId: string): { success: boolean; error?: string } {
  const root = getSandboxRoot(profileId);
  
  try {
    if (fs.existsSync(root)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// List all sandboxes
export function listSandboxes(): string[] {
  if (!fs.existsSync(config.basePath)) return [];
  
  return fs.readdirSync(config.basePath).filter(stat => {
    try {
      return fs.statSync(path.join(config.basePath, stat)).isDirectory();
    } catch {
      return false;
    }
  });
}

// ============================================================================
// ESCAPE ATTEMPT LOGGING
// ============================================================================

const ESCAPE_LOG_PATH = path.resolve(process.cwd(), '../../logs/sandbox-escapes.jsonl');

export function logEscapeAttempt(options: {
  profileId: string;
  tool: string;
  attemptedPath?: string;
  attemptedHost?: string;
  syscall?: string;
  timestamp: number;
}) {
  if (!config.logDeniedSyscalls) return;
  
  const entry = {
    id: crypto.randomUUID(),
    ...options,
  };
  
  const dir = path.dirname(ESCAPE_LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.appendFileSync(ESCAPE_LOG_PATH, JSON.stringify(entry) + '\n');
}

// ============================================================================
// ENFORCEMENT WRAPPER
// ============================================================================

// Full enforcement check before tool execution
export function enforce(tool: string, profileId: string, args: Record<string, unknown>): {
  allowed: boolean;
  reason: string;
  sandboxRoot?: string;
  adjustedArgs?: Record<string, unknown>;
} {
  const policy = getPathPolicy(tool);
  
  if (!policy) {
    return { allowed: false, reason: `No policy for tool: ${tool}` };
  }
  
  // Resolve sandbox root
  const sandboxRoot = getSandboxRoot(profileId);
  
  // Check path-based args
  if (args.path && typeof args.path === 'string') {
    const { resolved, allowed, reason: pathReason } = resolveSandboxPath(profileId, args.path);
    
    if (!allowed) {
      logEscapeAttempt({
        profileId,
        tool,
        attemptedPath: resolved,
        timestamp: Date.now(),
      });
      return { allowed: false, reason: pathReason, sandboxRoot };
    }
    
    // Return adjusted args with sandbox path
    return {
      allowed: true,
      reason: 'OK',
      sandboxRoot,
      adjustedArgs: { ...args, path: resolved },
    };
  }
  
  // Check host-based args
  if (args.url && typeof args.url === 'string') {
    try {
      const url = new URL(args.url);
      const { allowed, reason: netReason } = checkNetworkAccess(url.hostname);
      
      if (!allowed) {
        logEscapeAttempt({
          profileId,
          tool,
          attemptedHost: url.hostname,
          timestamp: Date.now(),
        });
        return { allowed: false, reason: netReason, sandboxRoot };
      }
    } catch {}
  }
  
  return { allowed: true, reason: 'OK', sandboxRoot };
}