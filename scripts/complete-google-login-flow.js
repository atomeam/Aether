/**
 * Complete Google Login Flow - Using Singleton Browser Manager
 * Navigates to RapidAPI, clicks Login with Google, then clicks email box
 */

const BrowserManager = require('./browser-manager');

async function completeGoogleLoginFlow() {
  const browserManager = BrowserManager.getInstance();
  
  try {
    console.log('🚀 Starting complete Google login flow...');
    console.log('🔒 Using singleton browser manager');
    
    // Step 1: Navigate to RapidAPI login page
    console.log('📝 Step 1: Navigating to RapidAPI login page...');
    await browserManager.navigateTo('https://rapidapi.com/auth/login');
    
    const page = await browserManager.getPage();
    
    // Step 2: Click Login with Google
    console.log('📝 Step 2: Clicking Login with Google button...');
    const googleButton = await page.$('button:has-text("Login with Google")');
    if (googleButton) {
      await googleButton.click();
      console.log('✅ Clicked Login with Google button');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('⚠️  Could not find Login with Google button');
    }
    
    // Step 3: Wait for Google authentication page
    console.log('📝 Step 3: Waiting for Google authentication page...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Proceeding to click email box');
    
    // Step 4: Click email input box
    console.log('📝 Step 4: Clicking email input box...');
    
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
    let emailInput = null;
    
    for (const selector of emailSelectors) {
      try {
        const input = await page.$(selector);
        if (input) {
          console.log(`✅ Found email input with selector: ${selector}`);
          await input.click();
          console.log('✅ Clicked email input box');
          clicked = true;
          emailInput = input;
          await new Promise(resolve => setTimeout(resolve, 1000));
          break;
        }
      } catch {
        continue;
      }
    }
    
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
            console.log('✅ Clicked email input box');
            clicked = true;
            emailInput = input;
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        } catch {
          continue;
        }
      }
    }
    
    if (clicked) {
      console.log('✅ Successfully clicked email input box');
      
      // Fill in email address
      console.log('📝 Filling in email address...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (emailInput) {
        await emailInput.fill('atomicmoonbeam88@gmail.com');
        console.log('✅ Filled email address: atomicmoonbeam88@gmail.com');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('✅ Successfully completed Google login flow');
      console.log('📝 Email address filled in');
      console.log('📝 Browser is still open for next step');
    } else {
      console.log('⚠️  Could not click email input box');
      console.log('📋 Current page URL:', page.url());
      console.log('📋 Please manually click the email input box in the browser window');
    }
    
  } catch (error) {
    console.error('❌ Error during Google login flow:', error.message);
    console.log('💡 Please complete the login manually in the browser window');
  }
  // Don't close browser - keep it for future tasks
}

completeGoogleLoginFlow().catch(console.error);
