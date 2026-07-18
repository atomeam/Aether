/**
 * CLI Skill — Agent-ready adapter interface for CLI tools.
 *
 * Extends the base Tool with CLI-specific metadata:
 * - Adapter path (PowerShell entry point)
 * - Exit code semantics (0-4 mapped from our contracts)
 * - Input schema (for Curator validation)
 * - Environment requirements (WSL distro, temp dir)
 */

import { Tool } from './index';

// --- Exit codes (from ADAPTER-CONTRACTS.md) ---

export enum CliExitCode {
  Success = 0,
  UsageError = 1,
  RuntimeError = 2,
  PermissionError = 3,
  NotFound = 4,
}

// --- CLI Skill result envelope ---

export interface CliSkillResult {
  success: boolean;
  exitCode: CliExitCode;
  data?: unknown;
  error?: string;
  tool: string;
  command: string;
}

// --- CLI Skill definition ---

export interface CLISkill extends Tool {
  /** Adapter entry point (PowerShell script path) */
  adapterPath: string;

  /** Exit code to semantic meaning mapping */
  exitCodes: Record<CliExitCode, string>;

  /** Input schema for Curator validation (JSON Schema shape) */
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };

  /** Which commands this skill supports */
  commands: string[];

  /** Environment: 'wsl' | 'windows' | 'both' */
  environment: 'wsl' | 'windows' | 'both';

  /** Optional: WSL distro required (only if environment includes wsl) */
  wslDistro?: string;

  /** Production target gate: if true, blocks against prod URLs */
  productionGate?: boolean;
}

// --- Exit code interpretation ---

export function interpretExitCode(
  exitCode: number,
  stderr: string
): { success: boolean; semantic: string; error?: string } {
  switch (exitCode) {
    case CliExitCode.Success:
      return { success: true, semantic: 'completed' };
    case CliExitCode.UsageError:
      return {
        success: false,
        semantic: 'usage_error',
        error: stderr || 'Missing or invalid arguments',
      };
    case CliExitCode.RuntimeError:
      return {
        success: false,
        semantic: 'runtime_error',
        error: stderr || 'Target tool returned non-zero',
      };
    case CliExitCode.PermissionError:
      return {
        success: false,
        semantic: 'permission_error',
        error: stderr || 'Adapter refused to run (production target blocked)',
      };
    case CliExitCode.NotFound:
      return {
        success: false,
        semantic: 'not_found',
        error: stderr || 'Requested resource not found',
      };
    default:
      return {
        success: false,
        semantic: 'unknown_error',
        error: stderr || `Unexpected exit code: ${exitCode}`,
      };
  }
}

// --- Execute a CLI skill ---

export async function executeCliSkill(
  skill: CLISkill,
  args: Record<string, unknown>
): Promise<CliSkillResult> {
  const command = args.command as string;
  if (!command || !skill.commands.includes(command)) {
    return {
      success: false,
      exitCode: CliExitCode.UsageError,
      error: `Unknown command: ${command}. Supported: ${skill.commands.join(', ')}`,
      tool: skill.name,
      command: command || '(none)',
    };
  }

  // Validate required args per command
  const validation = validateArgs(skill, command, args);
  if (!validation.valid) {
    return {
      success: false,
      exitCode: CliExitCode.UsageError,
      error: validation.error,
      tool: skill.name,
      command,
    };
  }

  // Build the PowerShell invocation
  const psArgs = buildPowerShellArgs(skill, args);

  try {
    const { execSync } = await import('child_process');
    const output = execSync(
      `powershell -NoProfile -File "${skill.adapterPath}" ${psArgs}`,
      {
        encoding: 'utf-8',
        timeout: 30_000,
        windowsHide: true,
      }
    );

    // Parse JSON output from adapter
    let data: unknown;
    try {
      data = JSON.parse(output);
    } catch {
      data = output.trim();
    }

    return {
      success: true,
      exitCode: CliExitCode.Success,
      data,
      tool: skill.name,
      command,
    };
  } catch (err: unknown) {
    const execErr = err as { status?: number; stderr?: string; stdout?: string };
    const exitCode = execErr.status ?? CliExitCode.RuntimeError;
    const interpretation = interpretExitCode(exitCode, execErr.stderr || '');

    // Try to parse stdout as JSON (adapter may have written partial output)
    let data: unknown;
    if (execErr.stdout) {
      try {
        data = JSON.parse(execErr.stdout);
      } catch {
        data = execErr.stdout.trim();
      }
    }

    return {
      success: interpretation.success,
      exitCode,
      data,
      error: interpretation.error,
      tool: skill.name,
      command,
    };
  }
}

// --- Arg validation ---

function validateArgs(
  skill: CLISkill,
  command: string,
  args: Record<string, unknown>
): { valid: boolean; error?: string } {
  const required = skill.inputSchema.required || [];
  for (const field of required) {
    if (args[field] === undefined || args[field] === null || args[field] === '') {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // UUID validation for commands that expect it
  if (['get', 'done'].includes(command) && args.uuid) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!uuidPattern.test(args.uuid as string)) {
      return { valid: false, error: `Invalid UUID format: ${args.uuid}` };
    }
  }

  return { valid: true };
}

// --- Build PowerShell args ---

function buildPowerShellArgs(
  skill: CLISkill,
  args: Record<string, unknown>
): string {
  const parts: string[] = [];
  const command = args.command as string;

  // Command is always first
  parts.push(command);

  // Remaining args (skip 'command' itself)
  for (const [key, value] of Object.entries(args)) {
    if (key === 'command') continue;
    if (value === undefined || value === null) continue;

    // Escape values that might contain spaces
    const strVal = String(value);
    if (strVal.includes(' ') || strVal.includes('"')) {
      parts.push(`"${strVal.replace(/"/g, '""')}"`);
    } else {
      parts.push(strVal);
    }
  }

  return parts.join(' ');
}
