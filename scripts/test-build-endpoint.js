#!/usr/bin/env node

/**
 * Test the /api/build endpoint using Node.js fetch (Solution 6 - BEST)
 * This avoids all PowerShell escaping issues
 * Node.js 18+ has built-in fetch, no external dependency needed
 */

const API_URL = 'http://localhost:3002/api/build';

async function testBuildEndpoint() {
  console.log('Testing /api/build endpoint with Node.js fetch...');
  console.log('This avoids PowerShell escaping issues completely.\n');
  
  const requestData = {
    prompt: "Create a simple button component",
    context: "test"
  };
  
  try {
    console.log('Sending request to:', API_URL);
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\nResponse data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Build endpoint is working');
    } else {
      console.log('\n❌ FAILED! Build endpoint returned error');
      console.log('Error:', data.error || data.message);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBuildEndpoint();
