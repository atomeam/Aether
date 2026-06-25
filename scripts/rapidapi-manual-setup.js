/**
 * RapidAPI Manual Setup Helper
 * Opens browser and displays API details for manual entry
 */

const { chromium } = require('playwright');

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

async function setupRapidAPI() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    acceptDownloads: true,
    ignoreHTTPSErrors: false,
    javaScriptEnabled: true,
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting RapidAPI manual setup helper...');
    console.log('🔒 Browser is secure and ready for manual entry');
    
    // Navigate to RapidAPI
    console.log('📝 Navigating to RapidAPI...');
    await page.goto('https://rapidapi.com', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if already logged in
    const loginButton = await page.$('text=Log in');
    if (loginButton) {
      console.log('📝 Not logged in. Please log in manually...');
      await page.waitForSelector('text=Hub', { timeout: 300000 });
      console.log('✅ Login detected. Continuing...');
    } else {
      console.log('✅ Already logged in');
    }
    
    // Navigate to "Add New API" page
    console.log('📦 Navigating to API creation page...');
    await page.goto('https://rapidapi.com/hub/create', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🎯 Browser is on the API creation page.');
    console.log('📋 Here are the API details to enter:\n');
    
    for (const api of APIs) {
      console.log('='.repeat(60));
      console.log(`API: ${api.name}`);
      console.log('='.repeat(60));
      console.log(`Description: ${api.description}`);
      console.log(`Category: ${api.category}`);
      console.log(`Endpoint: ${api.endpoint}`);
      console.log(`Method: ${api.method}`);
      console.log(`Example Request: ${JSON.stringify(api.exampleRequest)}`);
      console.log(`Example Response: ${JSON.stringify(api.exampleResponse)}`);
      console.log('');
    }
    
    console.log('💡 Pricing for each API:');
    console.log('   - Free: 100 requests/day');
    console.log('   - Basic: $5/month, 1,000 requests');
    console.log('   - Pro: $15/month, 10,000 requests');
    console.log('');
    console.log('⏸️  Please fill in the 3 APIs manually in the browser.');
    console.log('⌨️  Press Enter in terminal when you have completed the setup...');
    
    // Wait for user to complete setup
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Browser window is still open for manual completion');
    console.log('⏸️  Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

setupRapidAPI().catch(console.error);
