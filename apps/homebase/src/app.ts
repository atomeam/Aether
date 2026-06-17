import express from 'express';

import { createBridgeClient, type BridgeClient } from './lib/bridge-client.js';
import { getEnv, type AppEnv } from './lib/env.js';
import { getNotionLinks } from './lib/notion-links.js';
import type { AuditEventSummary, FeedResult, TaskSummary } from './types.js';

interface AppDependencies {
  env?: AppEnv;
  bridgeClient?: BridgeClient;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderList<T>(
  items: T[],
  renderItem: (item: T) => { title: string; meta?: string; submeta?: string }
): string {
  if (!items.length) {
    return '<li class="empty">No records found.</li>';
  }

  return items
    .map((item) => {
      const row = renderItem(item);
      return `<li>
        <div class="row-title">${escapeHtml(row.title)}</div>
        ${row.meta ? `<div class="row-meta">${escapeHtml(row.meta)}</div>` : ''}
        ${row.submeta ? `<div class="row-submeta">${escapeHtml(row.submeta)}</div>` : ''}
      </li>`;
    })
    .join('');
}

function renderDashboard(input: {
  tasks: FeedResult<TaskSummary>;
  events: FeedResult<AuditEventSummary>;
  env: AppEnv;
}): string {
  const notionLinks = getNotionLinks(input.env);
  const tasksHeading = `Tasks Hub (${input.tasks.source})`;
  const eventsHeading = `Recent Audit Events (${input.events.source})`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Homebase v1</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #081019;
        --panel: #0f1a28;
        --panel-soft: #132235;
        --line: #1d344d;
        --text: #ebf3ff;
        --muted: #8cb3d9;
        --accent: #5bd5c0;
        --warning: #ffca70;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background:
          radial-gradient(circle at 15% -10%, #12324d 0%, transparent 35%),
          radial-gradient(circle at 100% 0%, #11302f 0%, transparent 38%),
          var(--bg);
        color: var(--text);
        font-family: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif;
      }

      main {
        max-width: 1020px;
        margin: 0 auto;
        padding: 2rem 1rem 3rem;
      }

      h1 {
        margin: 0 0 0.45rem;
        font-size: 1.9rem;
        letter-spacing: 0.02em;
      }

      .subtitle {
        margin: 0 0 1.1rem;
        color: var(--muted);
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--line);
        color: #d1e8e4;
        background: var(--panel-soft);
        margin-bottom: 1.2rem;
        font-size: 0.8rem;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      @media (min-width: 900px) {
        .grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      section {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 1rem;
      }

      h2 {
        margin-top: 0;
        font-size: 1.05rem;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.7rem;
      }

      li {
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 0.65rem 0.75rem;
        background: var(--panel-soft);
      }

      .empty {
        color: var(--muted);
      }

      .row-title {
        font-weight: 650;
      }

      .row-meta {
        color: #9ad7cf;
        font-size: 0.85rem;
        margin-top: 0.2rem;
      }

      .row-submeta {
        color: var(--muted);
        font-size: 0.8rem;
        margin-top: 0.2rem;
      }

      .error {
        margin-bottom: 0.8rem;
        border-left: 3px solid var(--warning);
        padding: 0.5rem 0.75rem;
        background: rgba(255, 202, 112, 0.12);
        color: #ffe2ab;
        font-size: 0.84rem;
      }

      .links ul li a {
        color: var(--accent);
        text-decoration: none;
      }

      .links ul li a:hover {
        text-decoration: underline;
      }

      footer {
        margin-top: 1.25rem;
        color: var(--muted);
        font-size: 0.82rem;
      }

      code {
        background: var(--panel-soft);
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0.1rem 0.3rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Homebase v1</h1>
      <p class="subtitle">Primary cockpit (read-only): docs + status + tasks + ops links.</p>
      <div class="pill">Mode: read-only - Bridge writes disabled</div>
      <div class="grid">
        <section>
          <h2>${escapeHtml(tasksHeading)}</h2>
          ${input.tasks.error ? `<div class="error">Bridge fallback: ${escapeHtml(input.tasks.error)}</div>` : ''}
          <ul>
            ${renderList(input.tasks.items, (task) => ({
              title: `${task.title} [${task.status}]`,
              meta: task.updatedAt ? `Updated: ${task.updatedAt}` : undefined,
              submeta: `ID: ${task.id}`
            }))}
          </ul>
        </section>
        <section>
          <h2>${escapeHtml(eventsHeading)}</h2>
          ${input.events.error ? `<div class="error">Bridge fallback: ${escapeHtml(input.events.error)}</div>` : ''}
          <ul>
            ${renderList(input.events.items, (event) => ({
              title: event.type,
              meta: event.actor ? `Actor: ${event.actor}` : undefined,
              submeta: event.createdAt ? `When: ${event.createdAt}` : `ID: ${event.id}`
            }))}
          </ul>
        </section>
        <section class="links">
          <h2>Canonical Notion Links</h2>
          <ul>
            <li><a href="${escapeHtml(notionLinks.workspaceIndex)}" target="_blank" rel="noreferrer">Workspace Index</a></li>
            <li><a href="${escapeHtml(notionLinks.roster)}" target="_blank" rel="noreferrer">Roster</a></li>
            <li><a href="${escapeHtml(notionLinks.roleCards)}" target="_blank" rel="noreferrer">Role cards</a></li>
          </ul>
        </section>
        <section>
          <h2>Notion Sync Flags</h2>
          <ul>
            <li><div class="row-title">NOTION_PULL_ENABLED</div><div class="row-meta">${input.env.NOTION_PULL_ENABLED}</div></li>
            <li><div class="row-title">NOTION_SYNC_ENABLED</div><div class="row-meta">${input.env.NOTION_SYNC_ENABLED}</div></li>
          </ul>
        </section>
      </div>
      <footer>
        API endpoints: <code>${escapeHtml(input.tasks.endpoint)}</code> - <code>${escapeHtml(input.events.endpoint)}</code>
      </footer>
    </main>
  </body>
</html>`;
}

export function createApp(dependencies: AppDependencies = {}) {
  const env = dependencies.env ?? getEnv();
  const bridgeClient = dependencies.bridgeClient ?? createBridgeClient(env);
  const app = express();

  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('X-Homebase-Mode', 'read-only');
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      res.status(405).json({
        error: 'read_only_mode',
        message:
          'Homebase v1 does not permit write operations. Future write endpoints require strict validation and operator approval.'
      });
      return;
    }

    next();
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'homebase',
      mode: 'read-only',
      notion: {
        pullEnabled: env.NOTION_PULL_ENABLED,
        syncEnabled: env.NOTION_SYNC_ENABLED
      },
      timestamp: new Date().toISOString()
    });
  });

  app.get('/', async (_req, res) => {
    const [tasks, events] = await Promise.all([bridgeClient.getTasks(), bridgeClient.getAuditEvents()]);
    res.status(200).type('html').send(renderDashboard({ tasks, events, env }));
  });

  return app;
}
