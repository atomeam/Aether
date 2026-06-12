/**
 * Debug and Fill Email - Using Singleton Browser Manager
 * Debugs why email wasn't filled and fixes it
 */

const BrowserManager = require('./browser-manager');

async function debugAndFillEmail() {
  const browserManager = BrowserManager.getInstance();
  
  try {
    console.log('🚀 Debugging email fill issue...');
    console.log('🔒 Using existing browser instance (singleton)');
    
    // First, navigate to the Google login page to ensure we're on the right page
    console.log('🔗 Navigating to Google login page...');
    await browserManager.navigateTo('https://accounts.google.com');
    
    const page = await browserManager.getPage();
    
    // Take screenshot to see current state
    console.log('📸 Taking screenshot to see current state...');
    await page.screenshot({ path: 'debug-email-state.png' });
    console.log('✅ Screenshot saved to debug-email-state.png');
    
    // Get current page URL
    const url = page.url();
    console.log('📋 Current page URL:', url);
    
    // List all input fields
    console.log('🔍 Listing all input fields...');
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input fields`);
    
    for (let i = 0; i < inputs.length; i++) {
      try {
        const input = inputs[i];
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        const placeholder = await input.getAttribute('placeholder');
        const value = await input.inputValue();
        const isVisible = await input.isVisible();
        
        console.log(`Input ${i}: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}, value=${value}, visible=${isVisible}`);
      } catch (error) {
        console.log(`Input ${i}: Error getting attributes: ${error.message}`);
      }
    }
    
    // Try to find and fill email input
    console.log('🔧 Attempting to fill email address...');
    
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
      '[id*="identifier"]',
    ];
    
    let filled = false;
    
    for (const selector of emailSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          console.log(`✅ Found email input with selector: ${selector}`);
          
          // Clear any existing value
          await input.click();
          await new Promise(resolve => setTimeout(resolve, 200));
          await input.fill('');
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Type email character by character
          await input.type('atomicmoonbeam88@gmail.com', { delay: 50 });
          console.log('✅ Typed email address: atomicmoonbeam88@gmail.com');
          
          // Verify it was filled
          const value = await input.inputValue();
          console.log(`📝 Current value in input: ${value}`);
          
          if (value === 'atomicmoonbeam88@gmail.com') {
            console.log('✅ Email address successfully filled and verified');
            filled = true;
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          } else {
            console.log('⚠️  Email address was typed but value doesn\'t match');
          }
        }
      } catch (error) {
        console.log(`⚠️  Error with selector ${selector}: ${error.message}`);
        continue;
      }
    }
    
    // If still not filled, try attribute-based search
    if (!filled) {
      console.log('🔍 Trying attribute-based search...');
      const inputs = await page.$$('input');
      for (const input of inputs) {
        try {
          const type = await input.getAttribute('type');
          const name = await input.getAttribute('name');
          const id = await input.getAttribute('id');
          const placeholder = await input.getAttribute('placeholder');
          const ariaLabel = await input.getAttribute('aria-label');
          const isVisible = await input.isVisible();
          
          if (!isVisible) continue;
          
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
            await new Promise(resolve => setTimeout(resolve, 200));
            await input.fill('');
            await new Promise(resolve => setTimeout(resolve, 200));
            await input.type('atomicmoonbeam88@gmail.com', { delay: 50 });
            console.log('✅ Typed email address: atomicmoonbeam88@gmail.com');
            
            const value = await input.inputValue();
            console.log(`📝 Current value in input: ${value}`);
            
            if (value === 'atomicmoonbeam88@gmail.com') {
              console.log('✅ Email address successfully filled and verified');
              filled = true;
              await new Promise(resolve => setTimeout(resolve, 1000));
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    // Take final screenshot
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ path: 'debug-email-final.png' });
    console.log('✅ Final screenshot saved to debug-email-final.png');
    
    if (filled) {
      console.log('✅ Successfully filled email address');
    } else {
      console.log('⚠️  Could not fill email address');
      console.log('📋 Check debug-email-state.png and debug-email-final.png for visual confirmation');
    }
    
  } catch (error) {
    console.error('❌ Error debugging and filling email:', error.message);
  }
  // Don't close browser - keep it for future tasks
}

debugAndFillEmail().catch(console.error);
