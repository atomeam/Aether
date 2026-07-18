/**
 * Tests for CLI Skill system — exit code mapping, arg validation, result envelopes.
 */

import { describe, it, expect } from 'vitest';
import {
  CliExitCode,
  interpretExitCode,
  type CLISkill,
} from './cli-skill';

describe('interpretExitCode', () => {
  it('maps exit 0 to success', () => {
    const result = interpretExitCode(CliExitCode.Success, '');
    expect(result.success).toBe(true);
    expect(result.semantic).toBe('completed');
  });

  it('maps exit 1 to usage_error with stderr', () => {
    const result = interpretExitCode(CliExitCode.UsageError, 'Missing UUID');
    expect(result.success).toBe(false);
    expect(result.semantic).toBe('usage_error');
    expect(result.error).toBe('Missing UUID');
  });

  it('maps exit 1 to usage_error with default message', () => {
    const result = interpretExitCode(CliExitCode.UsageError, '');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing or invalid arguments');
  });

  it('maps exit 2 to runtime_error', () => {
    const result = interpretExitCode(CliExitCode.RuntimeError, 'task export failed');
    expect(result.success).toBe(false);
    expect(result.semantic).toBe('runtime_error');
    expect(result.error).toBe('task export failed');
  });

  it('maps exit 3 to permission_error', () => {
    const result = interpretExitCode(CliExitCode.PermissionError, 'Production target blocked');
    expect(result.success).toBe(false);
    expect(result.semantic).toBe('permission_error');
    expect(result.error).toBe('Production target blocked');
  });

  it('maps exit 4 to not_found', () => {
    const result = interpretExitCode(CliExitCode.NotFound, 'UUID not found');
    expect(result.success).toBe(false);
    expect(result.semantic).toBe('not_found');
    expect(result.error).toBe('UUID not found');
  });

  it('maps unknown exit code to unknown_error with stderr', () => {
    const result = interpretExitCode(99, 'weird');
    expect(result.success).toBe(false);
    expect(result.semantic).toBe('unknown_error');
    expect(result.error).toBe('weird');
  });

  it('maps unknown exit code to unknown_error with default', () => {
    const result = interpretExitCode(99, '');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unexpected exit code: 99');
  });
});

describe('CLISkill type', () => {
  const mockSkill: CLISkill = {
    name: 'test',
    description: 'Test skill',
    adapterPath: '/test/adapter.ps1',
    commands: ['list', 'get'],
    environment: 'windows',
    exitCodes: {
      [CliExitCode.Success]: 'ok',
      [CliExitCode.UsageError]: 'bad args',
      [CliExitCode.RuntimeError]: 'crash',
      [CliExitCode.PermissionError]: 'blocked',
      [CliExitCode.NotFound]: 'missing',
    },
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        uuid: { type: 'string' },
      },
      required: ['command'],
    },
    async execute() {
      return { success: true };
    },
  };

  it('has all required fields', () => {
    expect(mockSkill.name).toBe('test');
    expect(mockSkill.commands).toEqual(['list', 'get']);
    expect(mockSkill.environment).toBe('windows');
    expect(mockSkill.exitCodes[CliExitCode.Success]).toBe('ok');
  });

  it('has valid exit code mapping', () => {
    for (const code of Object.values(CliExitCode).filter(v => typeof v === 'number')) {
      expect(mockSkill.exitCodes[code as CliExitCode]).toBeDefined();
    }
  });
});

describe('CliExitCode enum', () => {
  it('has exactly 5 codes (0-4)', () => {
    const codes = Object.values(CliExitCode).filter(v => typeof v === 'number');
    expect(codes).toEqual([0, 1, 2, 3, 4]);
  });
});
