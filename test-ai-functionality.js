/**
 * AI Functionality Test Script
 * Tests the /api/build endpoint with the new Gemini API key
 */

const http = require('http');

// Configuration
const BACKEND_URL = 'localhost';
const BACKEND_PORT = 3002; // From .env file

// Test cases
const testCases = [
  {
    name: 'Simple Component Request',
    prompt: 'Add a simple button component',
    currentComponents: []
  },
  {
    name: 'Dashboard Widget Request',
    prompt: 'Create a dashboard widget showing system metrics',
    currentComponents: []
  },
  {
    name: 'Complex UI Request',
    prompt: 'Build a settings panel with toggle switches and sliders',
    currentComponents: []
  }
];

/**
 * Make HTTP request to backend
 */
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Test a single build request
 */
async function testBuildRequest(testCase) {
  console.log(`\n========================================`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`========================================`);
  console.log(`Prompt: ${testCase.prompt}`);
  console.log(`Current Components: ${JSON.stringify(testCase.currentComponents)}`);

  const options = {
    hostname: BACKEND_URL,
    port: BACKEND_PORT,
    path: '/api/build',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-trace-id': `test_${Date.now()}`
    }
  };

  try {
    const response = await makeRequest(options, {
      prompt: testCase.prompt,
      currentComponents: testCase.currentComponents
    });

    console.log(`\nStatus Code: ${response.statusCode}`);
    console.log(`Trace ID: ${response.body.traceId || 'N/A'}`);
    
    if (response.statusCode === 200) {
      console.log(`✅ SUCCESS`);
      console.log(`Thought: ${response.body.thought}`);
      console.log(`Explanation: ${response.body.explanation}`);
      console.log(`Actions Generated: ${response.body.actions ? response.body.actions.length : 0}`);
      if (response.body.actions && response.body.actions.length > 0) {
        console.log(`First Action: ${JSON.stringify(response.body.actions[0], null, 2)}`);
      }
      console.log(`Is Fallback: ${response.body.isFallback}`);
    } else if (response.statusCode === 422) {
      console.log(`⚠️ CURATOR DENIED`);
      console.log(`Reason: ${response.body.reason}`);
      console.log(`Offending Action IDs: ${JSON.stringify(response.body.offendingActionIds)}`);
    } else {
      console.log(`❌ FAILED`);
      console.log(`Error: ${JSON.stringify(response.body)}`);
    }

    return { success: response.statusCode === 200, response };
  } catch (error) {
    console.log(`❌ REQUEST ERROR`);
    console.log(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test backend health
 */
async function testBackendHealth() {
  console.log(`\n========================================`);
  console.log(`Testing Backend Health`);
  console.log(`========================================`);

  const options = {
    hostname: BACKEND_URL,
    port: BACKEND_PORT,
    path: '/api/stack',
    method: 'GET'
  };

  try {
    const response = await makeRequest(options);
    console.log(`Status Code: ${response.statusCode}`);
    if (response.statusCode === 200) {
      console.log(`✅ Backend is healthy`);
      console.log(`Response: ${JSON.stringify(response.body, null, 2)}`);
      return true;
    } else {
      console.log(`❌ Backend health check failed`);
      console.log(`Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to backend`);
    console.log(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('========================================');
  console.log('AI Functionality Test Suite');
  console.log('========================================');
  console.log(`Backend URL: http://${BACKEND_URL}:${BACKEND_PORT}`);
  console.log(`Test Cases: ${testCases.length}`);

  // Test backend health first
  const isHealthy = await testBackendHealth();
  if (!isHealthy) {
    console.log('\n❌ Backend is not accessible. Please start the backend with:');
    console.log('   cd Aether && npm run dev:backend');
    process.exit(1);
  }

  // Run all test cases
  const results = [];
  for (const testCase of testCases) {
    const result = await testBuildRequest(testCase);
    results.push({ name: testCase.name, ...result });
    
    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  
  let successCount = 0;
  let curatorDeniedCount = 0;
  let errorCount = 0;

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.name}: PASSED`);
      successCount++;
    } else if (result.response && result.response.statusCode === 422) {
      console.log(`⚠️ ${result.name}: CURATOR DENIED`);
      curatorDeniedCount++;
    } else {
      console.log(`❌ ${result.name}: FAILED`);
      errorCount++;
    }
  });

  console.log(`\nTotal: ${results.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Curator Denied: ${curatorDeniedCount}`);
  console.log(`Errors: ${errorCount}`);

  if (successCount > 0) {
    console.log('\n✅ AI functionality is working correctly');
  } else {
    console.log('\n❌ AI functionality has issues');
  }
}

// Run tests
runTests().catch(console.error);
