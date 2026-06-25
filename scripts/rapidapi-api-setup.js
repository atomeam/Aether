/**
 * RapidAPI API Setup via REST API
 * Uses RapidAPI API key to programmatically add APIs
 */

const RAPIDAPI_KEY = 'fe52a02163msh358017676b9d258p1bcd48jsna5dbb5e09198';

const APIs = [
  {
    name: 'Email Validation API',
    description: 'Validate email addresses with format checking and suggestions. Fast, reliable email validation for forms and user input.',
    category: 'Validation',
    endpoint: 'https://bridge.a-to-mind.com/api/rapidapi/email-validator',
    method: 'POST',
    exampleRequest: {
      email: 'test@example.com'
    },
    exampleResponse: {
      valid: true,
      email: 'test@example.com'
    }
  },
  {
    name: 'IP Geolocation API',
    description: 'Get geolocation data from IP addresses using Cloudflare edge data. Returns country, city, region, coordinates, and timezone.',
    category: 'Data',
    endpoint: 'https://bridge.a-to-mind.com/api/rapidapi/ip-geolocation',
    method: 'POST',
    exampleRequest: {
      ip: '8.8.8.8'
    },
    exampleResponse: {
      ip: '8.8.8.8',
      country: 'United States',
      city: 'Mountain View',
      region: 'California',
      latitude: 37.4223,
      longitude: -122.085,
      timezone: 'America/Los_Angeles'
    }
  },
  {
    name: 'Text Analysis API',
    description: 'Analyze text for word count, character count, sentence count, reading time, and more. Perfect for content analysis and SEO.',
    category: 'Tools',
    endpoint: 'https://bridge.a-to-mind.com/api/rapidapi/text-analyzer',
    method: 'POST',
    exampleRequest: {
      text: 'This is a sample text for analysis.'
    },
    exampleResponse: {
      wordCount: 7,
      characterCount: 35,
      characterCountNoSpaces: 28,
      sentenceCount: 1,
      paragraphCount: 1,
      averageWordLength: 4,
      readingTime: 1
    }
  }
];

async function addAPIViaRapidAPI(api) {
  try {
    console.log(`📦 Adding API: ${api.name}`);
    
    // RapidAPI doesn't have a public API for adding APIs
    // We need to use their internal API or web interface
    // For now, let's try to use their API if available
    
    const response = await fetch('https://rapidapi.com/api/apis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'rapidapi.com'
      },
      body: JSON.stringify({
        name: api.name,
        description: api.description,
        category: api.category,
        endpoint: api.endpoint,
        method: api.method
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${api.name} added successfully`);
      return data;
    } else {
      const error = await response.text();
      console.log(`⚠️  Could not add ${api.name} via API:`, error);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error adding ${api.name}:`, error.message);
    return null;
  }
}

async function setupRapidAPI() {
  console.log('🚀 Starting RapidAPI setup via API...');
  console.log('🔑 Using provided API key');
  
  for (const api of APIs) {
    const result = await addAPIViaRapidAPI(api);
    if (!result) {
      console.log(`⚠️  ${api.name} needs to be added manually via web interface`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('RapidAPI does not have a public API for adding new APIs.');
  console.log('APIs must be added via the web interface at https://rapidapi.com/hub/create');
  console.log('\n💡 Use the browser automation script instead:');
  console.log('   node scripts/rapidapi-manual-setup.js');
}

setupRapidAPI().catch(console.error);
