/**
 * Tests for /ops/run-event endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handlePostRunEvent } from './ops-routes';

describe('POST /ops/run-event', () => {
  const mockEnv = {
    BRIDGE_DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    },
    OPS_SECRET: 'test-secret',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects without auth', async () => {
    const request = new Request('https://example.com/ops/run-event', {
      method: 'POST',
      body: JSON.stringify({
        run_id: 'test-run-1',
        task_id: 'task-1',
        type: 'deploy',
        state: 'running',
        started: new Date().toISOString(),
      }),
    });

    const response = await handlePostRunEvent(request, mockEnv as any);
    expect(response.status).toBe(401);
  });

  it('accepts valid deploy event with auth', async () => {
    const request = new Request('https://example.com/ops/run-event', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        run_id: 'test-run-1',
        task_id: 'task-1',
        type: 'deploy',
        state: 'running',
        started: new Date().toISOString(),
        actor: 'Devin',
        repo: 'atomeam/Aether',
        commit_sha: 'abc123',
        ci_run_url: 'https://github.com/atomeam/Aether/actions/runs/123',
      }),
    });

    const response = await handlePostRunEvent(request, mockEnv as any);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.run_id).toBe('test-run-1');
    expect(data.state).toBe('running');
  });

  it('validates type enum', async () => {
    const request = new Request('https://example.com/ops/run-event', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        run_id: 'test-run-1',
        task_id: 'task-1',
        type: 'invalid-type',
        state: 'running',
        started: new Date().toISOString(),
      }),
    });

    const response = await handlePostRunEvent(request, mockEnv as any);
    expect(response.status).toBe(400);
  });

  it('validates state enum', async () => {
    const request = new Request('https://example.com/ops/run-event', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        run_id: 'test-run-1',
        task_id: 'task-1',
        type: 'deploy',
        state: 'invalid-state',
        started: new Date().toISOString(),
      }),
    });

    const response = await handlePostRunEvent(request, mockEnv as any);
    expect(response.status).toBe(400);
  });

  it('requires all fields', async () => {
    const request = new Request('https://example.com/ops/run-event', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        run_id: 'test-run-1',
        // missing task_id, type, state, started
      }),
    });

    const response = await handlePostRunEvent(request, mockEnv as any);
    expect(response.status).toBe(400);
  });
});
