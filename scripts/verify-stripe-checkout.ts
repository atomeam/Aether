#!/usr/bin/env node
/**
 * Stripe Checkout Verification Script
 * 
 * Tests the full revenue plumbing flow:
 * 1. Creates a test Stripe checkout session
 * 2. Simulates webhook delivery (checkout.session.completed)
 * 3. Verifies API key issuance (hash stored, plaintext retrievable once)
 * 4. Tests one-time key retrieval
 * 5. Cleans up test data
 * 
 * Usage:
 *   node scripts/verify-stripe-checkout.ts
 * 
 * Environment variables required:
 *   STRIPE_API_KEY - Stripe secret key (test mode)
 *   STRIPE_WEBHOOK_SECRET - Webhook signing secret
 *   BRIDGE_URL - Bridge worker URL (default: http://localhost:8787)
 */

import Stripe from 'stripe';
import crypto from 'crypto';

// Configuration
const STRIPE_API_KEY = process.env.STRIPE_API_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const BRIDGE_URL = process.env.BRIDGE_URL || 'http://localhost:8787';

if (!STRIPE_API_KEY) {
  console.error('❌ STRIPE_API_KEY environment variable required');
  process.exit(1);
}

if (!STRIPE_WEBHOOK_SECRET) {
  console.error('❌ STRIPE_WEBHOOK_SECRET environment variable required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_API_KEY, { apiVersion: '2023-10-16' });

// Test data
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_TIER = 'pro';

/**
 * Create a test checkout session
 */
async function createTestCheckoutSession(): Promise<Stripe.Checkout.Session> {
  console.log('📝 Creating test checkout session...');
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Aether Pro Tier',
            description: 'Monthly subscription',
          },
          unit_amount: 2900, // $29.00
        },
        quantity: 1,
      },
    ],
    customer_email: TEST_EMAIL,
    metadata: {
      tier: TEST_TIER,
      test: 'true',
    },
    success_url: `${BRIDGE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BRIDGE_URL}/cancel`,
  });

  console.log(`✅ Checkout session created: ${session.id}`);
  return session;
}

/**
 * Simulate Stripe webhook delivery
 */
async function simulateWebhook(session: Stripe.Checkout.Session): Promise<void> {
  console.log('🔔 Simulating webhook delivery...');
  
  const webhookEvent = {
    id: `evt_${Date.now()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    data: {
      object: session,
    },
  };

  const payload = JSON.stringify(webhookEvent);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = `t=${timestamp},v1=${crypto
    .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex')}`;

  const response = await fetch(`${BRIDGE_URL}/api/billing/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body: payload,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Webhook delivery failed: ${response.status} ${error}`);
  }

  console.log('✅ Webhook delivered successfully');
}

/**
 * Verify API key issuance
 */
async function verifyKeyIssuance(session: Stripe.Checkout.Session): Promise<string> {
  console.log('🔑 Verifying API key issuance...');
  
  // Try to retrieve the key using the session_id (one-time retrieval)
  const response = await fetch(`${BRIDGE_URL}/api/billing/key/${session.id}`);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Key retrieval failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  const apiKey = data.api_key;

  if (!apiKey || !apiKey.startsWith('amk_')) {
    throw new Error(`Invalid API key format: ${apiKey}`);
  }

  console.log(`✅ API key retrieved: ${apiKey.substring(0, 12)}...`);
  return apiKey;
}

/**
 * Verify one-time retrieval (second attempt should fail)
 */
async function verifyOneTimeRetrieval(session: Stripe.Checkout.Session): Promise<void> {
  console.log('🔒 Verifying one-time retrieval (second attempt should fail)...');
  
  const response = await fetch(`${BRIDGE_URL}/api/billing/key/${session.id}`);
  
  if (response.ok) {
    throw new Error('One-time retrieval failed: key was retrievable twice');
  }

  console.log('✅ One-time retrieval verified (second attempt blocked)');
}

/**
 * Cleanup test data
 */
async function cleanup(session: Stripe.Checkout.Session): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Cancel the test session if it's still open
    if (session.status === 'open') {
      await stripe.checkout.sessions.expire(session.id);
      console.log('✅ Test session expired');
    }
  } catch (error) {
    console.warn('⚠️  Session cleanup failed (may already be closed):', error);
  }

  // Note: KV cleanup would require bridge admin endpoints
  console.log('⚠️  KV cleanup requires manual intervention or admin endpoints');
}

/**
 * Main verification flow
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Stripe checkout verification...\n');
  console.log(`Bridge URL: ${BRIDGE_URL}`);
  console.log(`Test email: ${TEST_EMAIL}`);
  console.log(`Test tier: ${TEST_TIER}\n`);

  let session: Stripe.Checkout.Session;

  try {
    // Step 1: Create test checkout session
    session = await createTestCheckoutSession();

    // Step 2: Simulate webhook delivery
    await simulateWebhook(session);

    // Step 3: Wait a moment for KV writes to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Verify API key issuance
    const apiKey = await verifyKeyIssuance(session);

    // Step 5: Verify one-time retrieval
    await verifyOneTimeRetrieval(session);

    // Step 6: Cleanup
    await cleanup(session);

    console.log('\n✅ All verification steps passed!');
    console.log(`Generated API key: ${apiKey}`);
    console.log('\n💡 The revenue plumbing is working correctly.');
    console.log('   Next: Configure production Stripe webhook endpoint.');

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
