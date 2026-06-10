#!/usr/bin/env node
// End-to-end billing verification for the AtoMind bridge.
// Simulates a signed Stripe checkout.session.completed webhook, then verifies
// key issuance, one-time retrieval, and replay/signature rejection.
//
// Usage: STRIPE_WEBHOOK_SECRET=whsec_xxx node scripts/verify-billing.mjs [bridge-url]
// The secret must match the bridge's STRIPE_WEBHOOK_SECRET wrangler secret.

import crypto from 'node:crypto';

const BRIDGE = process.argv[2] || 'https://bridge.a-to-mind.com';
const SECRET = process.env.STRIPE_WEBHOOK_SECRET;
if (!SECRET) { console.error('Set STRIPE_WEBHOOK_SECRET (same value as the bridge wrangler secret).'); process.exit(2); }

const sessionId = `cs_test_verify_${Date.now()}`;
const event = {
  id: `evt_test_${Date.now()}`,
  type: 'checkout.session.completed',
  data: { object: {
    id: sessionId,
    customer: 'cus_test_verify',
    customer_details: { email: 'verify@a-to-mind.com' },
    metadata: { tier: 'pro' },
  }},
};
const payload = JSON.stringify(event);

function sign(body, secret, t = Math.floor(Date.now() / 1000)) {
  const mac = crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return `t=${t},v1=${mac}`;
}

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

// 1. Reject bad signature
let r = await fetch(`${BRIDGE}/api/billing/webhook`, { method: 'POST', body: payload, headers: { 'stripe-signature': sign(payload, 'whsec_wrong') } });
check('rejects invalid signature', r.status === 401, `HTTP ${r.status}`);

// 2. Reject stale timestamp (replay)
r = await fetch(`${BRIDGE}/api/billing/webhook`, { method: 'POST', body: payload, headers: { 'stripe-signature': sign(payload, SECRET, Math.floor(Date.now() / 1000) - 3600) } });
check('rejects stale timestamp (replay)', r.status === 400, `HTTP ${r.status}`);

// 3. Accept valid webhook → issues key
r = await fetch(`${BRIDGE}/api/billing/webhook`, { method: 'POST', body: payload, headers: { 'stripe-signature': sign(payload, SECRET) } });
const wj = await r.json().catch(() => ({}));
check('accepts signed checkout.session.completed', r.ok && wj.received === true, `HTTP ${r.status}`);

// 4. One-time key retrieval
r = await fetch(`${BRIDGE}/api/billing/key?session_id=${sessionId}`);
const kj = await r.json().catch(() => ({}));
const key = kj.api_key || '';
check('issues amk_ key via session_id', r.ok && key.startsWith('amk_') && key.length > 20, key ? key.slice(0, 12) + '…' : `HTTP ${r.status}`);

// 5. Replayed webhook (same event id) must be deduped, not re-issue
r = await fetch(`${BRIDGE}/api/billing/webhook`, { method: 'POST', body: payload, headers: { 'stripe-signature': sign(payload, SECRET) } });
const dj = await r.json().catch(() => ({}));
check('duplicate event deduped', r.ok && dj.duplicate === true, JSON.stringify(dj).slice(0, 60));

// 6. Second retrieval must 404
r = await fetch(`${BRIDGE}/api/billing/key?session_id=${sessionId}`);
check('second retrieval denied (one-time)', r.status === 404, `HTTP ${r.status}`);

console.log(`\n${pass} passed, ${fail} failed.`);
if (key) console.log(`Cleanup note: test key hash remains in STATE KV (api_key:sha256). Revoke via KV delete if desired; tier metadata marks it customer cus_test_verify.`);
process.exit(fail ? 1 : 0);
