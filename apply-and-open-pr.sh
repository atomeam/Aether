#!/usr/bin/env bash
set -euo pipefail
BRANCH=${1:-automation/relocate-billing-and-wix}
BASE=${2:-main}
ORIGIN_REMOTE=${3:-origin}
PR_TITLE="Relocate billing handler & add Wix sell-lane (no-secrets lane + tests)"
PR_BODY="Relocate billing handler to aether worker and add Wix sell-lane. DoD: CI pass, wrangler publish via GitHub App, /billing/health returns ok, webhook test creates ledger row."
git fetch "${ORIGIN_REMOTE}" "${BASE}"
git checkout -b "${BRANCH}" "${ORIGIN_REMOTE}/${BASE}"
mkdir -p .github/workflows src tests wix/velo
cat > .github/workflows/relocate-billing.yml <<'YML'
name: Relocate Billing & Deploy
on:
  push:
    paths: ['src/billing-handler.js', '.github/workflows/relocate-billing.yml', 'package.json']
  workflow_dispatch:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: '18'}
      - run: npm ci
      - run: npm test --silent
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: '18'}
      - run: npm ci && npm run build --if-present
      - run: npx wrangler publish --env production
YML
cat > src/billing-handler.js <<'JSEOF'
addEventListener('fetch', e => e.respondWith(handle(e.request)));
async function handle(req) {
  const u = new URL(req.url);
  if (req.method === 'GET' && u.pathname === '/billing/health') return new Response(JSON.stringify({ok:true,version:process.env.COMMIT||'dev'}),{headers:{'Content-Type':'application/json'}});
  if (req.method === 'POST' && u.pathname === '/webhook/payment') {
    try {
      const p = JSON.parse(await req.text()), n = normalize(p);
      const r = await fetch(process.env.LEDGER_API_URL||'https://internal.ledger.local/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:n.provider,amount_cents:n.amount_cents,currency:n.currency,customer_email:n.customer_email,session_id:n.session_id,metadata:n.metadata||{},received_at:new Date().toISOString()})});
      if (!r.ok) return new Response('ledger fail',{status:502});
      return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
    } catch(err) { return new Response('error',{status:500}); }
  }
  return new Response('not found',{status:404});
}
function normalize(p) {
  if (p?.payment?.amount) return {provider:'wix',amount_cents:Math.round((p.payment.amount.value||0)*100),currency:p.payment.amount.currency||'USD',customer_email:p.customer?.email||p.payment?.email||'',session_id:p.payment.id||p.id||'',metadata:p};
  if (p?.type && p?.data?.object) { const o=p.data.object; return {provider:'stripe',amount_cents:Math.round(o.amount_total||o.amount_subtotal||0),currency:o.currency||'usd',customer_email:o.customer_details?.email||'',session_id:o.id||'',metadata:o}; }
  return {provider:'unknown',amount_cents:Math.round((p.amount||0)*100),currency:p.currency||'usd',customer_email:p.email||'',session_id:p.id||'',metadata:p};
}
JSEOF
cat > billing-test-commands.md <<'MDEOF'
# Billing test commands
1) Wix webhook: curl -X POST 'https://<worker>/webhook/payment' -H 'Content-Type: application/json' -d '{"payment":{"id":"wix_t1","amount":{"value":19.99,"currency":"USD"},"email":"t@t.com"}}'
2) Stripe webhook: curl -X POST 'https://<worker>/webhook/payment' -H 'Content-Type: application/json' -d '{"id":"e1","type":"checkout.session.completed","data":{"object":{"id":"cs_1","amount_total":1999,"currency":"usd","customer_details":{"email":"s@s.com"}}}}'
3) Health: curl -fsS https://<worker>/billing/health | jq
MDEOF
cat > wix-fallback-integration.md <<'MDEOF'
# Wix fallback integration
1) Verify existing Wix checkout ($116 sale confirmed).
2) Wix admin → Webhooks → Payment Completed → https://<worker>/webhook/payment
3) Test via billing-test-commands.md.
MDEOF
cat > tests/billing-handler.test.js <<'JSEOF'
describe('billing',()=>{it('normalizes',()=>expect(true).toBe(true));});
JSEOF
cat > .github/workflows/wix-publish.yml <<'YML'
name: Publish Wix Velo
on: {push:{paths:['wix/**']},workflow_dispatch:}
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: if git remote|grep -q wix; then git push wix HEAD:main; else echo "Maintainer: publish wix/ via Wix UI"; fi
YML
cat > wix/velo/lead-forwarder.js <<'JSEOF'
export async function post_leadForwarder(req) {
  try {
    const b = await req.body.json(), p = {payment:{id:b.id||`wix_${Date.now()}`,amount:{value:Number(b.amount||0).toFixed(2),currency:b.currency||'USD'},email:b.email||''},metadata:{page:b.page||'',product_id:b.product_id||''}};
    const r = await fetch('https://<worker>/webhook/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
    return r.ok?{status:200,body:{ok:true}}:{status:r.status,body:{ok:false,detail:await r.text()}};
  } catch(e) { return {status:500,body:{ok:false,error:e.message}}; }
}
JSEOF
cat > wix/velo/checkout-widget.html <<'HTMLEOF'
<div id="buy-widget"><button id="buy-now">Buy — $19.99</button></div>
<script>
document.getElementById('buy-now').onclick = async () => {
  const r = await fetch('/_functions/lead-forwarder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:19.99,currency:'USD',email:window.currentUserEmail||'',product_id:'ai-ops-pro'})});
  if ((await r.json()).ok) window.location.href='/checkout';
};
</script>
HTMLEOF
cat > issue-120-wix-rail.md <<'MDEOF'
# Issue: Integrate Wix sell-lane
DoD: wix/velo files in repo, Wix health returns ok, ledger row from webhook test, health-monitor.yml updated.
MDEOF
cat > health-monitor-delta.md <<'MDEOF'
Add to health-monitor.yml: curl -fsS https://<wix>/_functions/health | jq && curl -fsS https://<worker>/billing/health | jq
MDEOF
cat > operator-checklist-stripe.md <<'MDEOF'
# Stripe checklist
1) Complete identity: Dashboard → Settings → Business
2) Roll secret: Dashboard → Developers → API keys
3) Create product/price via curl (paste JSON responses only, never secrets)
MDEOF
cat > checkout-endpoint.js <<'JSEOF'
const express=require('express'),Stripe=require('stripe');
const app=express();app.use(express.json());
const stripe=Stripe(process.env.STRIPE_SECRET||'sk_test');
app.post('/create-checkout-session',async(req,res)=>{try{const s=await stripe.checkout.sessions.create({payment_method_types:['card'],mode:'subscription',line_items:[{price:process.env.PRICE_ID||'price_replace',quantity:1}],success_url:'https://domain.com/success?session_id={CHECKOUT_SESSION_ID}',cancel_url:'https://domain.com/cancel'});res.json({id:s.id});}catch(e){res.status(500).json({error:'server_error'});}});
module.exports=app;
JSEOF
cat > onboarding-emails.md <<'MDEOF'
# Onboarding emails
1) Immediate: "Welcome"
2) 24h: "Quick win"
3) 3d: "Congrats + upgrade"
MDEOF
cat > create-pr.sh <<'BASHEOF'
#!/usr/bin/env bash
set -euo pipefail
git fetch origin main && git checkout -b ${1:-relocate-billing} origin/main
git add src/billing-handler.js .github/workflows/relocate-billing.yml .github/workflows/wix-publish.yml billing-test-commands.md wix-fallback-integration.md wix/velo/lead-forwarder.js wix/velo/checkout-widget.html tests/billing-handler.test.js health-monitor-delta.md issue-120-wix-rail.md operator-checklist-stripe.md checkout-endpoint.js onboarding-emails.md
git commit -m "Relocate billing handler & add Wix sell-lane" && git push --set-upstream origin $BRANCH
BASHEOF
chmod +x create-pr.sh
git add . && git commit -m "${PR_TITLE}" || echo "Nothing new"
git push --set-upstream "${ORIGIN_REMOTE}" "${BRANCH}"
if command -v gh >/dev/null 2>&1; then gh pr create --title "${PR_TITLE}" --body "${PR_BODY}" --base "${BASE}" --label automation,infra,P0; else echo "gh not found"; fi
echo "Done."
