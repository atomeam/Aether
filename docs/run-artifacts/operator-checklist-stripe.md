# Operator checklist — Stripe (optional lane; Wix is the proven rail)

Only needed to activate the Stripe lane (issue #117). Never paste secret keys anywhere — dashboard + terminal only.

1. Complete Stripe identity verification: Dashboard → Settings → Business settings.
2. Roll the leaked key: Dashboard → Developers → API keys → Roll key (the old sk_test_ appeared in relay logs — rotate it regardless).
3. Create Product + Price (Dashboard or CLI):
   - `curl -X POST https://api.stripe.com/v1/products -u SK_NEW: -d name="..."`
   - `curl -X POST https://api.stripe.com/v1/prices -u SK_NEW: -d unit_amount=1999 -d currency=usd -d "recurring[interval]=month" -d product=prod_XXX`
4. Webhook: add endpoint `https://bridge.a-to-mind.com/api/billing/webhook`, event `checkout.session.completed`; then `wrangler secret put STRIPE_WEBHOOK_SECRET` on the bridge worker.
5. Payment Link/Checkout must set `metadata.tier` and success URL `https://a-to-mind.com/welcome?session_id={CHECKOUT_SESSION_ID}`.
6. Verify: `node scripts/verify-billing.mjs` — expect 6 PASS.
