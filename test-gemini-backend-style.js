/**
 * Test Gemini API using the backend's exact API call structure
 */

const { GoogleGenAI } = require('./apps/backend/node_modules/@google/genai');
require('./apps/backend/node_modules/dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('========================================');
console.log('Gemini API Test (Backend Style)');
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

async function callGeminiWithRetry(modelName, prompt, config = {}, maxRetries = 3) {
  if (!ai) {
    throw new Error("GEMINI_API_KEY not configured. Please set GEMINI_API_KEY in your .env file.");
  }
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt.contents,
        config: config
      });
      console.log('✅ API call successful');
      return response;
    } catch (error) {
      lastError = error;
      
      const status = error.status || error.code || error.response?.status;
      const message = error.message || "";
      
      console.log(`❌ Attempt ${attempt + 1} failed. Status: ${status}. Message: ${message}`);
      
      const isTransient = status === 503 || status === 429 || 
                         message.includes('503') || message.includes('429') || 
                         message.includes('quota') || message.includes('overloaded');
      
      if (!isTransient || attempt === maxRetries) {
        console.error(`[GEMINI_FATAL]: Attempt ${attempt + 1} failed. Status: ${status}. Message: ${message}`);
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
      console.warn(`[GEMINI_RETRY]: Attempt ${attempt + 1} failed with status ${status}. Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function testBackendStyleCall() {
  console.log('\n========================================');
  console.log('Testing Backend-Style API Call');
  console.log('========================================');

  try {
    const response = await callGeminiWithRetry(
      "gemini-3-flash-preview",
      {
        contents: [{
          role: "user",
          parts: [{
            text: `You are the AXIOM Orchestrator, an autonomous UI architect.
            User Direction: "Add a simple button component"
            Current Architecture: []
    
            Construct a set of new structural nodes to expand the dashboard.
            Rules:
            - Return ONLY JSON.
            - The response must be a flat array of component objects.`
          }]
        }]
      },
      { responseMimeType: "application/json" }
    );

    console.log('✅ Backend-style API call successful');
    console.log(`Response text: ${response.text}`);
    
    try {
      const parsed = JSON.parse(response.text);
      console.log(`Parsed JSON: ${JSON.stringify(parsed, null, 2)}`);
    } catch (e) {
      console.log(`⚠️ Could not parse response as JSON: ${e.message}`);
    }

    return true;
  } catch (error) {
    console.log('❌ Backend-style API call failed');
    console.log(`Error: ${error.message}`);
    console.log(`Error Details: ${JSON.stringify(error, null, 2)}`);
    return false;
  }
}

testBackendStyleCall().then(success => {
  console.log('\n========================================');
  console.log('Test Result');
  console.log('========================================');
  if (success) {
    console.log('✅ Backend-style Gemini API is working correctly');
  } else {
    console.log('❌ Backend-style Gemini API has issues');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed with exception:', error);
  process.exit(1);
});
