/**
 * Click Email Box for Passkey - Using Singleton Browser Manager
 * Clicks the email input box to trigger Windows passkey popup
 */

const BrowserManager = require('./browser-manager');

async function clickEmailBoxForPasskey() {
  const browserManager = BrowserManager.getInstance();
  
  try {
    console.log('🚀 Attempting to click email input box for passkey...');
    console.log('🔒 Using existing browser instance (singleton)');
    
    const page = await browserManager.getPage();
    
    // Look for email input with multiple strategies
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email"]',
      'input[placeholder*="email"]',
      'input[placeholder*="Email"]',
      'input[aria-label*="email"]',
      'input[aria-label*="Email"]',
      '[data-testid*="email"]',
      '[class*="email"]',
      '[id*="identifier"]', // Google uses "identifier" for email
    ];
    
    let clicked = false;
    
    // Strategy 1: Try standard selectors
    for (const selector of emailSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          console.log(`✅ Found email input with selector: ${selector}`);
          await input.click();
          console.log('✅ Clicked email input box to trigger passkey popup');
          clicked = true;
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Strategy 2: Look for any input with email-related attributes
    if (!clicked) {
      console.log('🔍 Searching for email input by attributes...');
      const inputs = await page.$$('input');
      for (const input of inputs) {
        try {
          const type = await input.getAttribute('type');
          const name = await input.getAttribute('name');
          const id = await input.getAttribute('id');
          const placeholder = await input.getAttribute('placeholder');
          const ariaLabel = await input.getAttribute('aria-label');
          
          if (
            type === 'email' ||
            name?.toLowerCase().includes('email') ||
            id?.toLowerCase().includes('email') ||
            placeholder?.toLowerCase().includes('email') ||
            ariaLabel?.toLowerCase().includes('email') ||
            id?.toLowerCase().includes('identifier')
          ) {
            console.log(`✅ Found email input with attributes: type=${type}, name=${name}, id=${id}`);
            await input.click();
            console.log('✅ Clicked email input box to trigger passkey popup');
            clicked = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          }
        } catch {
          continue;
        }
      }
    }
    
    if (clicked) {
      console.log('✅ Successfully clicked email input box');
      console.log('📝 Windows passkey popup should appear now');
      console.log('📝 Browser is still open for passkey authentication');
    } else {
      console.log('⚠️  Could not find email input box');
      console.log('📋 Current page URL:', page.url());
      console.log('📋 Please manually click the email input box in the browser window');
    }
    
  } catch (error) {
    console.error('❌ Error clicking email input box:', error.message);
    console.log('💡 Please manually click the email input box in the browser window');
  }
  // Don't close browser - keep it for future tasks
}

clickEmailBoxForPasskey().catch(console.error);
