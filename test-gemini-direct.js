/**
 * Direct Gemini API Test
 * Tests the Gemini API directly without going through the backend
 */

const { GoogleGenAI } = require('./apps/backend/node_modules/@google/genai');
require('./apps/backend/node_modules/dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('========================================');
console.log('Direct Gemini API Test');
console.log('========================================');
console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);

if (!apiKey) {
  console.log('❌ GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function testGeminiAPI() {
  console.log('\n========================================');
  console.log('Testing Gemini API Call');
  console.log('========================================');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        role: 'user',
        parts: [{
          text: 'You are the AXIOM Orchestrator, an autonomous UI architect.\nUser Direction: "Add a simple button component"\nCurrent Architecture: []\n\nConstruct a set of new structural nodes to expand the dashboard.\nRules:\n- Return ONLY JSON.\n- The response must be a flat array of component objects.'
        }]
      }]
    }, {
      responseMimeType: 'application/json'
    });

    console.log('✅ Gemini API call successful');
    console.log(`Response: ${response.text}`);
    
    try {
      const parsed = JSON.parse(response.text);
      console.log(`Parsed JSON: ${JSON.stringify(parsed, null, 2)}`);
    } catch (e) {
      console.log(`⚠️ Could not parse response as JSON: ${e.message}`);
    }

    return true;
  } catch (error) {
    console.log('❌ Gemini API call failed');
    console.log(`Error: ${error.message}`);
    console.log(`Error Details: ${JSON.stringify(error, null, 2)}`);
    return false;
  }
}

testGeminiAPI().then(success => {
  console.log('\n========================================');
  console.log('Test Result');
  console.log('========================================');
  if (success) {
    console.log('✅ Gemini API is working correctly');
  } else {
    console.log('❌ Gemini API has issues');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed with exception:', error);
  process.exit(1);
});
