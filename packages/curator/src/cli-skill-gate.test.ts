/**
 * Tests for Curator CLI_SKILL_CALL handling — wuzz production gate.
 */

import { describe, it, expect } from 'vitest';
import { curateActions } from '../src/index';

describe('Curator CLI_SKILL_CALL', () => {
  it('allows CLI_SKILL_CALL for non-wuzz skills', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'thyme',
        command: 'start',
        args: {},
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(true);
  });

  it('allows wuzz launch against localhost', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'wuzz',
        command: 'launch',
        args: { url: 'http://localhost:3000' },
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(true);
  });

  it('allows wuzz launch against 127.0.0.1', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'wuzz',
        command: 'launch',
        args: { url: 'http://127.0.0.1:8080' },
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(true);
  });

  it('blocks wuzz launch against production URL', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'wuzz',
        command: 'launch',
        args: { url: 'https://api.production.com/v1' },
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(false);
    expect(verdict.reason).toContain('Default-Deny');
    expect(verdict.rejectedActionIds).toContain('cli:wuzz:launch');
  });

  it('blocks wuzz launch against non-local hostname', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'wuzz',
        command: 'launch',
        args: { url: 'https://staging.example.com' },
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(false);
  });

  it('allows wuzz target command (read-only)', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'wuzz',
        command: 'target',
        args: { url: 'https://api.production.com' },
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(true);
  });

  it('allows taskwarrior create', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'taskwarrior',
        command: 'create',
        args: { description: 'Test task', tags: 'taco-test' },
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(true);
  });

  it('allows fx inspect', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'fx',
        command: 'inspect',
        args: { path: '/tmp/test.json' },
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(true);
  });
});

describe('Curator mixed actions', () => {
  it('allows mix of MCP_TOOL_CALL and CLI_SKILL_CALL', () => {
    const actions = [
      {
        action: 'MCP_TOOL_CALL',
        toolName: 'file_read',
        toolArgs: { path: '/tmp/test.json' },
      },
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'thyme',
        command: 'status',
        args: {},
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(true);
  });

  it('blocks entire batch if one CLI_SKILL_CALL fails', () => {
    const actions = [
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'thyme',
        command: 'start',
        args: {},
      },
      {
        action: 'CLI_SKILL_CALL',
        skillName: 'wuzz',
        command: 'launch',
        args: { url: 'https://evil.com' },
      },
    ];
    const verdict = curateActions(actions);
    expect(verdict.approved).toBe(false);
  });
});
