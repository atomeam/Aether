/**
 * RapidAPI Domain Fix
 * Opens browser to RapidAPI to fix domain issue (remove leading dot before www)
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function fixRapidAPIDomain() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });
  
  const sessionPath = 'C:\\Users\\adamm\\Aether\\.cloudflare-session.json';
  const sessionExists = fs.existsSync(sessionPath);
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    acceptDownloads: true,
    ignoreHTTPSErrors: false,
    javaScriptEnabled: true,
    storageState: sessionExists ? sessionPath : undefined,
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Opening RapidAPI to fix domain issue...');
    console.log('🔒 Browser is secure and ready');
    
    // Navigate to RapidAPI a-to-mind API
    console.log('📝 Navigating to RapidAPI a-to-mind API...');
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api', {
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
      
      await page.waitForSelector('text=API Overview', { timeout: 300000 });
      
      console.log('✅ Login detected. Continuing...');
    } else {
      console.log('✅ Already logged in (session persisted)');
    }
    
    console.log('📋 Attempting to fix domain automatically...');
    
    // Try to find and click Edit button
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Look for Edit button
      const editButton = await page.$('button:has-text("Edit"), button:has-text("Settings"), a:has-text("Edit"), a:has-text("Settings")');
      if (editButton) {
        await editButton.click();
        console.log('✅ Clicked Edit/Settings button');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Look for domain/endpoint input field
      const domainInput = await page.$('input[type="text"], input[type="url"]');
      if (domainInput) {
        const currentValue = await domainInput.inputValue();
        console.log(`📝 Current domain value: ${currentValue}`);
        
        if (currentValue.includes('.www.')) {
          const fixedValue = currentValue.replace('.www.', 'www.');
          await domainInput.fill(fixedValue);
          console.log(`✅ Fixed domain to: ${fixedValue}`);
          
          // Look for Save button
          const saveButton = await page.$('button:has-text("Save"), button[type="submit"]');
          if (saveButton) {
            await saveButton.click();
            console.log('✅ Clicked Save button');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          console.log('⚠️  Domain does not have leading dot, checking for other issues...');
        }
      } else {
        console.log('⚠️  Could not find domain input field, may need manual intervention');
      }
      
    } catch (error) {
      console.log('⚠️  Automation failed, may need manual completion:', error.message);
    }
    
    console.log('📋 Manual backup instructions:');
    console.log('');
    console.log('ISSUE: Domain has a leading dot (.www.a-to-mind.com instead of www.a-to-mind.com)');
    console.log('');
    console.log('FIX NEEDED:');
    console.log('1. Click "Edit API" or "Settings"');
    console.log('2. Find the domain/endpoint URL field');
    console.log('3. Remove the leading dot from the domain');
    console.log('4. Change from: .www.a-to-mind.com');
    console.log('5. Change to: a-to-mind.com');
    console.log('6. OR use: bridge.a-to-mind.com (already working)');
    console.log('7. Click Save');
    console.log('');
    console.log('⏸️  If automation failed, please complete manually in the browser.');
    console.log('⌨️  Press Enter in terminal when done...');
    
    // Wait for user to complete fix
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Fix completed!');
    
  } catch (error) {
    console.error('❌ Error during fix:', error.message);
    console.log('💡 Browser window is still open for manual completion');
    console.log('⏸️  Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  } finally {
    const loginButton = await page.$('text=Log in');
    const isLoggedIn = !loginButton;
    if (isLoggedIn) {
      await context.storageState({ path: 'C:\\Users\\adamm\\Aether\\.cloudflare-session.json' });
    }
    await context.close();
    await browser.close();
  }
}

fixRapidAPIDomain().catch(console.error);
