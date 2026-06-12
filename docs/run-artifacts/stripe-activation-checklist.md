# Stripe Activation Checklist

This is the **first broken link** in the profit chain. Complete these steps to enable revenue collection.

## Current Status
- ✅ Stripe checkout endpoint implemented (`POST /api/billing/checkout`)
- ✅ Pricing UI updated with checkout button
- ✅ Webhook handler implemented (`POST /api/billing/webhook`)
- ✅ API key issuance flow implemented
- ❌ Stripe account not activated (returns 503 "billing not configured")

## Activation Steps

### 1. Activate Stripe Account
1. Go to https://dashboard.stripe.com
2. Complete account activation:
   - Verify email
   - Add bank account for payouts
   - Complete business profile
3. Note: You need a **bare domain** (e.g., `a-to-mind.com`) for Stripe verification

### 2. Create Product and Price
1. In Stripe dashboard → Products → Add product
2. Product details:
   - Name: "Aether Pro - Monthly"
   - Description: "Automation for one business"
   - Price: $49.00 USD
   - Billing: Monthly recurring
3. Copy the **Price ID** (format: `price_...`)
4. Update `src/components/PricingContact.tsx` with actual price ID:
   ```typescript
   { name: 'Pro', price: '$49/mo', ..., priceId: 'price_ACTUAL_ID_HERE' }
   ```

### 3. Create Webhook Endpoint
1. In Stripe dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://bridge.a-to-mind.com/api/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy the **Webhook Signing Secret** (format: `whsec_...`)

### 4. Set Cloudflare Secrets
Run these commands from `apps/bridge` directory:

```bash
# Set Stripe secret key (from Stripe dashboard → Developers → API keys)
npx wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_test_... (test mode) or sk_live_... (production)

# Set webhook signing secret
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_...
```

### 5. Deploy Bridge
```bash
cd apps/bridge
npx wrangler deploy
```

### 6. Test Checkout Flow
1. Visit https://aether.a-to-mind.com
2. Enter email in pricing section
3. Click "Start trial" on Pro tier
4. Should redirect to Stripe checkout
5. Complete test payment (use Stripe test card: 4242 4242 4242 4242)
6. Verify API key is issued via `GET /api/billing/key?session_id=cs_...`

## Verification Commands

```bash
# Test checkout endpoint (will return 503 until activated)
curl -X POST https://bridge.a-to-mind.com/api/billing/checkout \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_pro_monthly","email":"test@example.com"}'

# Check webhook endpoint
curl -X POST https://bridge.a-to-mind.com/api/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"test"}}}'
```

## Revenue Chain Position

**Current state**: First broken link (Stripe activation)
**Next link**: Bridge deploy (already live ✅)
**Following links**: Pricing page (live ✅), Leads follow-up (ready ✅)

## Estimated Time: 15 minutes

Most time is spent on Stripe dashboard setup. The code is already implemented and deployed.
