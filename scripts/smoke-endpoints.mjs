#!/usr/bin/env node
// Live smoke test for the AtoMind stack. Usage: node scripts/smoke-endpoints.mjs
const checks = [
  { name: 'bridge /health', url: 'https://bridge.a-to-mind.com/health', expect: (j) => j.ok === true },
  { name: 'bridge /api/stack', url: 'https://bridge.a-to-mind.com/api/stack', expect: (j) => j.status === 'online' },
  { name: 'notion-worker /health', url: 'https://notion.a-to-mind.com/health', expect: (j) => j.ok === true },
  { name: 'apex SPA', url: 'https://a-to-mind.com/', expect: null },
  { name: 'apex /api/health', url: 'https://a-to-mind.com/api/health', expect: (j) => j.status === 'healthy' },
];

let failed = 0;
for (const c of checks) {
  try {
    const r = await fetch(c.url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    if (c.expect) {
      const j = await r.json();
      if (!c.expect(j)) throw new Error(`unexpected body: ${JSON.stringify(j).slice(0, 120)}`);
    }
    console.log(`PASS  ${c.name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${c.name} — ${e.message}`);
  }
}
console.log(failed ? `\n${failed} check(s) failing` : '\nAll endpoints healthy');
process.exit(failed ? 1 : 0);
