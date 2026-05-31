#!/usr/bin/env tsx
/**
 * Admin Actuator Endpoints Test Suite
 * Tests HMAC auth, replay protection, and all /admin/* endpoints
 */

import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'https://aether-bridge.atomicmoonbeam88.workers.dev';
const ADMIN_HMAC_SECRET = process.env.ADMIN_HMAC_SECRET || 'test-secret-change-in-production';

// Helper: Generate HMAC signature
function generateSignature(timestamp: string, body: string): string {
  const message = `${timestamp}:${body}`;
  const sig = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(message).digest('hex');
  return `sha256=${sig}`;
}

// Helper: Make authenticated request
async function adminRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<Response> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const signature = generateSignature(timestamp, bodyStr);
  
  const headers: Record<string, string> = {
    'X-Atomind-Timestamp': timestamp,
    'X-Atomind-Signature': signature,
    'Content-Type': 'application/json',
  };
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body) {
    options.body = bodyStr;
  }
  
  return fetch(`${BASE_URL}${endpoint}`, options);
}

// Test: Missing timestamp header
async function testMissingTimestamp() {
  console.log('\n🧪 Test: Missing X-Atomind-Timestamp header');
  
  try {
    const response = await fetch(`${BASE_URL}/admin/cloudflare/verify-token-scopes`, {
      method: 'GET',
      headers: {
        'X-Atomind-Signature': 'sha256=test',
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data)}`);
    
    if (response.status === 401 && data.error === 'Missing X-Atomind-Timestamp header') {
      console.log('✅ PASS: Correctly rejected missing timestamp');
    } else {
      console.log('❌ FAIL: Expected 401 with missing timestamp error');
    }
  } catch (e) {
    console.log(`❌ FAIL: ${e}`);
  }
}

// Test: Missing signature header
async function testMissingSignature() {
  console.log('\n🧪 Test: Missing X-Atomind-Signature header');
  
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const response = await fetch(`${BASE_URL}/admin/cloudflare/verify-token-scopes`, {
      method: 'GET',
      headers: {
        'X-Atomind-Timestamp': timestamp,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data)}`);
    
    if (response.status === 401 && data.error === 'Missing X-Atomind-Signature header') {
      console.log('✅ PASS: Correctly rejected missing signature');
    } else {
      console.log('❌ FAIL: Expected 401 with missing signature error');
    }
  } catch (e) {
    console.log(`❌ FAIL: ${e}`);
  }
}

// Test: Expired timestamp (replay protection)
async function testExpiredTimestamp() {
  console.log('\n🧪 Test: Expired timestamp (replay protection)');
  
  try {
    const expiredTimestamp = Math.floor((Date.now() - 400000) / 1000).toString(); // 400 seconds ago
    const bodyStr = '';
    const signature = generateSignature(expiredTimestamp, bodyStr);
    
    const response = await fetch(`${BASE_URL}/admin/cloudflare/verify-token-scopes`, {
      method: 'GET',
      headers: {
        'X-Atomind-Timestamp': expiredTimestamp,
        'X-Atomind-Signature': signature,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data)}`);
    
    if (response.status === 401 && data.error === 'Timestamp expired or invalid') {
      console.log('✅ PASS: Correctly rejected expired timestamp');
    } else {
      console.log('❌ FAIL: Expected 401 with expired timestamp error');
    }
  } catch (e) {
    console.log(`❌ FAIL: ${e}`);
  }
}

// Test: Invalid signature
async function testInvalidSignature() {
  console.log('\n🧪 Test: Invalid signature');
  
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const response = await fetch(`${BASE_URL}/admin/cloudflare/verify-token-scopes`, {
      method: 'GET',
      headers: {
        'X-Atomind-Timestamp': timestamp,
        'X-Atomind-Signature': 'sha256=invalid',
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data)}`);
    
    if (response.status === 401 && data.error === 'Invalid signature') {
      console.log('✅ PASS: Correctly rejected invalid signature');
    } else {
      console.log('❌ FAIL: Expected 401 with invalid signature error');
    }
  } catch (e) {
    console.log(`❌ FAIL: ${e}`);
  }
}

// Test: Valid auth (positive test)
async function testValidAuth() {
  console.log('\n🧪 Test: Valid authentication');
  
  try {
    const response = await adminRequest('/admin/cloudflare/verify-token-scopes', 'GET');
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 200) {
      console.log('✅ PASS: Valid authentication accepted');
    } else {
      console.log('❌ FAIL: Expected 200 with valid auth');
    }
  } catch (e) {
    console.log(`❌ FAIL: ${e}`);
  }
}

// Test: Unknown admin endpoint
async function testUnknownEndpoint() {
  console.log('\n🧪 Test: Unknown admin endpoint');
  
  try {
    const response = await adminRequest('/admin/unknown', 'GET');
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data)}`);
    
    if (response.status === 404 && data.error === 'Unknown admin endpoint') {
      console.log('✅ PASS: Correctly returned 404 for unknown endpoint');
    } else {
      console.log('❌ FAIL: Expected 404 for unknown endpoint');
    }
  } catch (e) {
    console.log(`❌ FAIL: ${e}`);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Admin Actuator Test Suite');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Secret: ${ADMIN_HMAC_SECRET.substring(0, 8)}...`);
  
  await testMissingTimestamp();
  await testMissingSignature();
  await testExpiredTimestamp();
  await testInvalidSignature();
  await testUnknownEndpoint();
  await testValidAuth();
  
  console.log('\n✨ Test suite complete');
}

runTests().catch(console.error);