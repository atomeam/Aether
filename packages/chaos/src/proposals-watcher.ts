#!/usr/bin/env node
/**
 * ProposalsWatcher - Nervous System
 * 
 * Polls Proposals DB for new pending items.
 * Part of the ALPHA Gate workflow.
 * 
 * Usage: node packages/chaos/src/proposals-watcher.ts
 * 
 * Environment (loaded from .env if present):
 *   NOTION_API_KEY - Notion integration token
 *   PROPOSALS_DB_ID - Database ID to poll
 *   POLL_INTERVAL_MS - Polling interval (default: 5000ms)
 *   USE_MOCK - Set to 'true' for mock responses
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env if present
const ENV_FILE = '.env';
if (fs.existsSync(ENV_FILE)) {
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
  console.log('[Watcher] Loaded .env configuration');
}

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PROPOSALS_DB_ID = process.env.PROPOSALS_DB_ID || process.env.ALPHA_PROPOSALS_DB_URL;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '5000');
const USE_MOCK = process.env.USE_MOCK === 'true';

// Cloudflare KV config
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_KV_STATE_ID = process.env.CF_KV_STATE_ID || '7319ee9195df4ccf8f4b2c8449dd7930';
const CF_KV_STATE_CACHE_ID = process.env.CF_KV_STATE_CACHE_ID || 'd22e703c3af9451a9942fa2a551a1aa8';

// Write to Cloudflare KV
async function writeToKV(namespaceId: string, key: string, value: unknown): Promise<boolean> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.log(`[KV] Skipping write - CF credentials not set`);
    return false;
  }
  
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    
    if (!response.ok) {
      console.log(`[KV] Write failed: ${response.status}`);
      return false;
    }
    
    console.log(`[KV] Wrote ${key} to namespace ${namespaceId}`);
    return true;
  } catch (e) {
    console.log(`[KV] Write error: ${e}`);
    return false;
  }
}

// Write proposals snapshot to KV
async function pushProposalsSnapshot(proposals: Proposal[]): Promise<boolean> {
  const snapshot = {
    updatedAt: new Date().toISOString(),
    proposals: proposals.map(p => ({
      id: p.id,
      title: p.title,
      stage: p.status,
      source: 'backend-proposals-watcher',
    })),
  };
  
  return writeToKV(CF_KV_STATE_ID, 'proposals:snapshot', JSON.stringify(snapshot));
}

// Write lessons index to KV (mock for now - would come from Lessons system)
async function pushLessonsIndex(lessons: unknown[]): Promise<boolean> {
  const index = {
    updatedAt: new Date().toISOString(),
    lessons,
  };
  
  return writeToKV(CF_KV_STATE_CACHE_ID, 'lessons:index', JSON.stringify(index));
}

// Local fallback path
const PROPOSALS_LOG = './logs/proposals.jsonl';

// Mock responses for testing/fallback
const MOCK_PROPOSALS = [
  { id: 'mock_prop_001', title: 'Mock Proposal - Test', status: 'pending_review', summary: 'Mock response for testing' },
];

interface Proposal {
  id: string;
  title: string;
  status: string;
  summary: string;
}

async function fetchFromNotion(): Promise<Proposal[]> {
  if (USE_MOCK) {
    console.log('[Watcher] Using mock responses');
    return MOCK_PROPOSALS;
  }
  
  if (!NOTION_API_KEY || !PROPOSALS_DB_ID) {
    throw new Error('NOTION_API_KEY or PROPOSALS_DB_ID not set');
  }
  
  const response = await fetch(`https://api.notion.com/v1/databases/${PROPOSALS_DB_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: { property: 'Status', status: { equals: 'Drafted' } },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results?.map((page: any) => ({
    id: page.id,
    title: page.properties?.Title?.title?.[0]?.plain_text || 'Untitled',
    status: page.properties?.Status?.status?.name || 'unknown',
    summary: page.properties?.Summary?.rich_text?.[0]?.plain_text || '',
  })) || [];
}

function fetchFromLocal(): Proposal[] {
  if (!fs.existsSync(PROPOSALS_LOG)) return [];
  
  const lines = fs.readFileSync(PROPOSALS_LOG, 'utf-8').split('\n').filter(Boolean);
  return lines
    .map(line => JSON.parse(line))
    .filter(p => p.status === 'pending_review' || p.status === 'draft');
}

async function dispatch(proposal: Proposal): Promise<void> {
  console.log(`[Dispatcher] Dispatching proposal: ${proposal.id}`);
  console.log(`  Title: ${proposal.title}`);
  console.log(`  Status: ${proposal.status}`);
  
  // Write proposal to Cloudflare KV
  const snapshot = {
    updatedAt: new Date().toISOString(),
    proposals: [{
      id: proposal.id,
      title: proposal.title,
      stage: proposal.status,
      source: 'backend-proposals-watcher',
    }],
  };
  
  await writeToKV(CF_KV_STATE_ID, 'proposals:snapshot', JSON.stringify(snapshot));
}

async function poll(): Promise<void> {
  console.log('[Dispatcher] ProposalsWatcher initialized.');
  console.log(`  Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`  Source: ${NOTION_API_KEY ? 'Notion API' : 'Local fallback'}\n`);
  
  let lastIds: string[] = [];
  
  while (true) {
    try {
      const proposals = NOTION_API_KEY 
        ? await fetchFromNotion() 
        : fetchFromLocal();
      
      const newProposals = proposals.filter(p => !lastIds.includes(p.id));
      
      if (newProposals.length > 0) {
        console.log(`[Dispatcher] ${newProposals.length} new proposal(s) detected`);
        for (const proposal of newProposals) {
          await dispatch(proposal);
        }
      }
      
      lastIds = proposals.map(p => p.id);
    } catch (error) {
      console.error(`[Dispatcher] Heartbeat failure: ${error}`);
    }
    
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// CLI entry
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
ProposalsWatcher - Nervous System

Usage: node packages/chaos/src/proposals-watcher.ts

Environment:
  NOTION_API_KEY       - Notion integration token
  PROPOSALS_DB_ID      - Database ID to poll
  POLL_INTERVAL_MS    - Polling interval (default: 5000)

Example:
  NOTION_API_KEY=secret_xxx POLL_INTERVAL_MS=3000 node packages/chaos/src/proposals-watcher.ts
`);
  process.exit(0);
}

poll().catch(console.error);