/**
 * RapidAPI Setup Automation
 * Automates listing 3 APIs on RapidAPI marketplace
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
  // Launch browser with secure settings for safe login
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--disable-dev-shm-usage', // Prevent memory issues
    ]
  });
  
  // Create context with realistic browser settings
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
    console.log('🚀 Starting RapidAPI setup with secure browser...');
    console.log('🔒 Browser is configured with security settings for safe login');
    console.log('🛡️  HTTPS is enabled, JavaScript is enabled, cookies are accepted');
    
    // Navigate to RapidAPI
    console.log('📝 Navigating to RapidAPI...');
    await page.goto('https://rapidapi.com', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Wait for page to load
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if already logged in
    const loginButton = await page.$('text=Log in');
    if (loginButton) {
      console.log('📝 Not logged in. Please log in manually in the browser window...');
      console.log('🔐 The browser is secure and ready for login');
      console.log('⏸️  Waiting for you to complete login...');
      console.log('⏱️  You have up to 5 minutes to complete the login');
      
      // Wait for login to complete (check for dashboard elements)
      await page.waitForSelector('text=Hub', { timeout: 300000 }); // 5 minutes for login
      
      console.log('✅ Login detected. Continuing...');
    } else {
      console.log('✅ Already logged in');
    }
    
    // Add each API
    for (const api of APIs) {
      console.log(`\n📦 Adding API: ${api.name}`);
      
      // Navigate to "Add New API" page
      console.log('📝 Navigating to API creation page...');
      await page.goto('https://rapidapi.com/hub/create', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try to find and fill the API name field
      try {
        console.log('🔤 Filling in API name...');
        const nameInput = await page.$('input[placeholder*="name"], input[name*="name"], input[id*="name"]');
        if (nameInput) {
          await nameInput.fill(api.name);
          console.log('✅ API name filled');
        } else {
          console.log('⚠️  Could not find name input, trying alternative selectors...');
          await page.fill('input[type="text"]', api.name);
        }
      } catch (error) {
        console.log('⚠️  Error filling name:', error.message);
      }
      
      // Try to find and fill the description field
      try {
        console.log('📝 Filling in description...');
        const descInput = await page.$('textarea[placeholder*="description"], textarea[name*="description"], textarea[id*="description"]');
        if (descInput) {
          await descInput.fill(api.description);
          console.log('✅ Description filled');
        } else {
          console.log('⚠️  Could not find description input, trying alternative selectors...');
          await page.fill('textarea', api.description);
        }
      } catch (error) {
        console.log('⚠️  Error filling description:', error.message);
      }
      
      // Try to find and fill the endpoint field
      try {
        console.log('🔗 Filling in endpoint...');
        const endpointInput = await page.$('input[placeholder*="endpoint"], input[name*="endpoint"], input[id*="endpoint"]');
        if (endpointInput) {
          await endpointInput.fill(api.endpoint);
          console.log('✅ Endpoint filled');
        } else {
          console.log('⚠️  Could not find endpoint input');
        }
      } catch (error) {
        console.log('⚠️  Error filling endpoint:', error.message);
      }
      
      // Wait for user to review and submit
      console.log('\n⏸️  Please review the form and click "Create API" or "Submit" button.');
      console.log('💡 If any fields are missing, fill them in manually.');
      console.log('⌨️  Press Enter in terminal when you have submitted this API...');
      
      // Wait for user to complete this API
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
      
      console.log(`✅ ${api.name} submitted (or skipped)`);
      
      // Wait a bit before next API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 All APIs have been processed!');
    console.log('📊 Next steps: Set pricing tiers and add documentation for each API');
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    await page.screenshot({ path: 'rapidapi-error.png' });
    console.log('📸 Screenshot saved to rapidapi-error.png');
    console.log('💡 Browser window is still open. You can complete the setup manually.');
    
    // Keep browser open for manual completion
    console.log('⏸️  Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

// Run the setup
setupRapidAPI().catch(console.error);
