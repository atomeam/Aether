/**
 * CLI Skill Adapters — Concrete CLISkill implementations for thyme, wuzz, fx, taskwarrior.
 *
 * Each adapter maps to a PowerShell entry point and follows the
 * exit-code and JSON contracts from ADAPTER-CONTRACTS.md.
 */

import { CLISkill, CliExitCode } from './cli-skill';
import * as path from 'path';

const INTEGRATIONS_DIR = path.resolve(__dirname, '../../../integrations');

// --- Thyme: Time tracking via tmux ---

export const thymeSkill: CLISkill = {
  name: 'thyme',
  description: 'Time tracking via tmux session (start, pause, resume, stop, status, logs)',
  adapterPath: path.join(INTEGRATIONS_DIR, 'thyme/adapter.ps1'),
  commands: ['start', 'pause', 'resume', 'stop', 'status', 'logs'],
  environment: 'wsl',
  wslDistro: 'Ubuntu',
  exitCodes: {
    [CliExitCode.Success]: 'Command completed',
    [CliExitCode.UsageError]: 'Missing tmux session or invalid config',
    [CliExitCode.RuntimeError]: 'Thyme binary returned non-zero',
    [CliExitCode.PermissionError]: 'Not used by thyme',
    [CliExitCode.NotFound]: 'Session not found',
  },
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'thyme command: start, pause, resume, stop, status, logs' },
    },
    required: ['command'],
  },
  productionGate: false,
  async execute(args) {
    // Delegate to executeCliSkill (imported by the registry)
    const { executeCliSkill } = await import('./cli-skill');
    return executeCliSkill(this, args);
  },
};

// --- Wuzz: HTTP inspection ---

export const wuzzSkill: CLISkill = {
  name: 'wuzz',
  description: 'HTTP inspection tool (launch, target) — production targets blocked',
  adapterPath: path.join(INTEGRATIONS_DIR, 'wuzz/adapter.ps1'),
  commands: ['launch', 'target'],
  environment: 'windows',
  exitCodes: {
    [CliExitCode.Success]: 'Wuzz launched or target inspected',
    [CliExitCode.UsageError]: 'Missing binary or bad arguments',
    [CliExitCode.RuntimeError]: 'Wuzz process failed',
    [CliExitCode.PermissionError]: 'Production target blocked by approval gate',
    [CliExitCode.NotFound]: 'Not used by wuzz',
  },
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'wuzz command: launch, target' },
      url: { type: 'string', description: 'Target URL (for launch)' },
    },
    required: ['command'],
  },
  productionGate: true,
  async execute(args) {
    const { executeCliSkill } = await import('./cli-skill');
    return executeCliSkill(this, args);
  },
};

// --- FX: JSON inspection/transform ---

export const fxSkill: CLISkill = {
  name: 'fx',
  description: 'JSON inspection and transform (inspect, query, transform-preview)',
  adapterPath: path.join(INTEGRATIONS_DIR, 'fx/adapter.ps1'),
  commands: ['inspect', 'query', 'transform-preview'],
  environment: 'windows',
  exitCodes: {
    [CliExitCode.Success]: 'Inspect, query, or transform-preview succeeded',
    [CliExitCode.UsageError]: 'Bad arguments or missing file',
    [CliExitCode.RuntimeError]: 'jq/fx parse error on the input',
    [CliExitCode.PermissionError]: 'Not used by fx',
    [CliExitCode.NotFound]: 'File not found',
  },
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'fx command: inspect, query, transform-preview' },
      path: { type: 'string', description: 'JSON file path' },
      expression: { type: 'string', description: 'jq/fx expression (for query)' },
      transform: { type: 'string', description: 'Transform expression (for transform-preview)' },
    },
    required: ['command', 'path'],
  },
  productionGate: false,
  async execute(args) {
    const { executeCliSkill } = await import('./cli-skill');
    return executeCliSkill(this, args);
  },
};

// --- Taskwarrior: Task management ---

export const taskwarriorSkill: CLISkill = {
  name: 'taskwarrior',
  description: 'Task management via WSL (list, get, create, done)',
  adapterPath: path.join(INTEGRATIONS_DIR, 'taskwarrior/adapter.ps1'),
  commands: ['list', 'get', 'create', 'done'],
  environment: 'wsl',
  wslDistro: 'Ubuntu',
  exitCodes: {
    [CliExitCode.Success]: 'Command succeeded',
    [CliExitCode.UsageError]: 'Missing args or invalid UUID format',
    [CliExitCode.RuntimeError]: 'Task export or task add failed internally',
    [CliExitCode.PermissionError]: 'Not used by taskwarrior',
    [CliExitCode.NotFound]: 'UUID not found in task database',
  },
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'taskwarrior command: list, get, create, done' },
      uuid: { type: 'string', description: 'Task UUID (for get, done)' },
      description: { type: 'string', description: 'Task description (for create)' },
      tags: { type: 'string', description: 'Comma-separated tags (for create)' },
      filter: { type: 'string', description: 'Filter expression (for list)' },
    },
    required: ['command'],
  },
  productionGate: false,
  async execute(args) {
    const { executeCliSkill } = await import('./cli-skill');
    return executeCliSkill(this, args);
  },
};

/** All CLI skills for registration */
export const cliSkills: CLISkill[] = [
  thymeSkill,
  wuzzSkill,
  fxSkill,
  taskwarriorSkill,
];
