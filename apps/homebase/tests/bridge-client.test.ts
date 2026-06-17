import { afterEach, describe, expect, it, vi } from 'vitest';

import { createBridgeClient } from '../src/lib/bridge-client.js';
import { getEnv } from '../src/lib/env.js';

describe('Bridge read-only client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses live task and audit responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ tasks: [{ id: '1', title: 'Task A', status: 'open' }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ events: [{ id: '2', type: 'deploy_started', actor: 'ops' }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );

    vi.stubGlobal('fetch', fetchMock);

    const env = getEnv({
      BRIDGE_BASE_URL: 'https://bridge.example.com',
      BRIDGE_TASKS_PATH: '/tasks',
      BRIDGE_AUDIT_EVENTS_PATH: '/ops/deploy-event',
      NOTION_PULL_ENABLED: 'false',
      NOTION_SYNC_ENABLED: 'false'
    });

    const client = createBridgeClient(env, { timeoutMs: 50 });
    const tasks = await client.getTasks();
    const events = await client.getAuditEvents();

    expect(tasks.source).toBe('live');
    expect(tasks.items[0].title).toBe('Task A');
    expect(events.source).toBe('live');
    expect(events.items[0].type).toBe('deploy_started');
  });

  it('falls back to stubs when Bridge is unavailable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'));
    vi.stubGlobal('fetch', fetchMock);

    const env = getEnv({
      BRIDGE_BASE_URL: 'https://bridge.example.com',
      BRIDGE_TASKS_PATH: '/tasks',
      BRIDGE_AUDIT_EVENTS_PATH: '/ops/deploy-event',
      NOTION_PULL_ENABLED: 'false',
      NOTION_SYNC_ENABLED: 'false'
    });

    const client = createBridgeClient(env, { timeoutMs: 50 });
    const tasks = await client.getTasks();

    expect(tasks.source).toBe('stub');
    expect(tasks.error).toContain('connection refused');
    expect(tasks.items.length).toBeGreaterThan(0);
  });
});
