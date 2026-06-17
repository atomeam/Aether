import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { getEnv } from '../src/lib/env.js';
import type { BridgeClient } from '../src/lib/bridge-client.js';

const env = getEnv({
  PORT: '3000',
  BRIDGE_BASE_URL: 'http://bridge.local',
  BRIDGE_TASKS_PATH: '/tasks',
  BRIDGE_AUDIT_EVENTS_PATH: '/ops/deploy-event',
  NOTION_WORKSPACE_INDEX_URL: 'https://www.notion.so/workspace-index',
  NOTION_ROSTER_URL: 'https://www.notion.so/roster',
  NOTION_ROLE_CARDS_URL: 'https://www.notion.so/role-cards',
  NOTION_PULL_ENABLED: 'false',
  NOTION_SYNC_ENABLED: 'false'
});

describe('homebase app routes', () => {
  it('returns health status', async () => {
    const bridgeClient: BridgeClient = {
      getTasks: async () => ({ source: 'live', endpoint: 'http://bridge.local/tasks', items: [] }),
      getAuditEvents: async () => ({ source: 'live', endpoint: 'http://bridge.local/ops/deploy-event', items: [] })
    };

    const app = createApp({ env, bridgeClient });
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.mode).toBe('read-only');
  });

  it('renders dashboard with tasks, events, and notion links', async () => {
    const bridgeClient: BridgeClient = {
      getTasks: async () => ({
        source: 'live',
        endpoint: 'http://bridge.local/tasks',
        items: [
          {
            id: 'task-123',
            title: 'Investigate Tasks Hub lag',
            status: 'in_progress',
            updatedAt: '2026-05-24T12:00:00.000Z'
          }
        ]
      }),
      getAuditEvents: async () => ({
        source: 'live',
        endpoint: 'http://bridge.local/ops/deploy-event',
        items: [
          {
            id: 'event-123',
            type: 'deploy_completed',
            actor: 'ops-bot',
            createdAt: '2026-05-24T12:01:00.000Z'
          }
        ]
      })
    };

    const app = createApp({ env, bridgeClient });
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Homebase v1');
    expect(response.text).toContain('Investigate Tasks Hub lag');
    expect(response.text).toContain('deploy_completed');
    expect(response.text).toContain('Workspace Index');
    expect(response.text).toContain('Roster');
    expect(response.text).toContain('Role cards');
  });

  it('rejects write methods in read-only mode', async () => {
    const bridgeClient: BridgeClient = {
      getTasks: async () => ({ source: 'live', endpoint: 'http://bridge.local/tasks', items: [] }),
      getAuditEvents: async () => ({ source: 'live', endpoint: 'http://bridge.local/ops/deploy-event', items: [] })
    };

    const app = createApp({ env, bridgeClient });
    const response = await request(app).post('/').send({ test: true });

    expect(response.status).toBe(405);
    expect(response.body.error).toBe('read_only_mode');
  });
});
