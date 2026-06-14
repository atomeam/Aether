/**
 * Fill Email Address - Using Singleton Browser Manager
 * Fills in the email address in the email input box
 */

const BrowserManager = require('./browser-manager');

async function fillEmailAddress(email) {
  const browserManager = BrowserManager.getInstance();
  
  try {
    console.log('🚀 Attempting to fill email address...');
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
    
    let filled = false;
    
    // Strategy 1: Try standard selectors
    for (const selector of emailSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          console.log(`✅ Found email input with selector: ${selector}`);
          await input.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          await input.fill(email);
          console.log(`✅ Filled email address: ${email}`);
          filled = true;
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Strategy 2: Look for any input with email-related attributes
    if (!filled) {
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
            await new Promise(resolve => setTimeout(resolve, 500));
            await input.fill(email);
            console.log(`✅ Filled email address: ${email}`);
            filled = true;
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        } catch {
          continue;
        }
      }
    }
    
    if (filled) {
      console.log('✅ Successfully filled email address');
      console.log('📝 Browser is still open for next step');
    } else {
      console.log('⚠️  Could not find email input box');
      console.log('📋 Current page URL:', page.url());
      console.log('📋 Please manually fill the email address in the browser window');
    }
    
  } catch (error) {
    console.error('❌ Error filling email address:', error.message);
    console.log('💡 Please manually fill the email address in the browser window');
  }
  // Don't close browser - keep it for future tasks
}

// Use your email address here
fillEmailAddress('your-email@example.com').catch(console.error);
