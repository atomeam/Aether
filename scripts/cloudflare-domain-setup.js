/**
 * Cloudflare Domain Route Setup
 * Adds a-to-mind.com custom domain route to aether-bridge worker
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function setupCloudflareDomain() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });
  
  const sessionPath = 'C:\\Users\\adamm\\Aether\\.cloudflare-session.json';
  const sessionExists = fs.existsSync(sessionPath);
  
  // Use persistent context to stay logged in if session exists
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    acceptDownloads: true,
    ignoreHTTPSErrors: false,
    javaScriptEnabled: true,
    // Use storage state to persist login if it exists
    storageState: sessionExists ? sessionPath : undefined,
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting Cloudflare domain setup...');
    console.log('🔒 Browser is secure and ready');
    
    // Navigate to Cloudflare dashboard
    console.log('📝 Navigating to Cloudflare dashboard...');
    await page.goto('https://dash.cloudflare.com', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if already logged in
    const loginButton = await page.$('text=Log in');
    if (loginButton) {
      console.log('📝 Not logged in. Please log in manually in the browser window...');
      console.log('⏸️  Waiting for you to complete login...');
      console.log('⏱️  You have up to 5 minutes to complete the login');
      
      await page.waitForSelector('text=Workers & Pages', { timeout: 300000 });
      
      console.log('✅ Login detected. Continuing...');
    } else {
      console.log('✅ Already logged in (session persisted)');
    }
    
    // Navigate to Workers & Pages
    console.log('📝 Navigating to Workers & Pages...');
    await page.goto('https://dash.cloudflare.com/95745fedbea06314e24c27233033a37d/workers-and-pages', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📋 Instructions:');
    console.log('');
    console.log('1. Click on "aether-bridge" worker');
    console.log('2. Go to "Settings" tab');
    console.log('3. Click "Triggers"');
    console.log('4. Click "Add route"');
    console.log('5. Enter: a-to-mind.com/*');
    console.log('6. Click "Save"');
    console.log('');
    console.log('⏸️  Please complete these steps manually in the browser.');
    console.log('⌨️  Press Enter in terminal when you have completed the setup...');
    
    // Wait for user to complete setup
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Setup completed!');
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    console.log('💡 Browser window is still open for manual completion');
    console.log('⏸️  Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  } finally {
    // Save storage state to persist login for future sessions (only if logged in)
    const loginButton = await page.$('text=Log in');
    const isLoggedIn = !loginButton;
    if (isLoggedIn) {
      await context.storageState({ path: 'C:\\Users\\adamm\\Aether\\.cloudflare-session.json' });
    }
    await context.close();
    await browser.close();
  }
}

setupCloudflareDomain().catch(console.error);
