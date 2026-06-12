/**
 * Click Login with Google - Using Singleton Browser Manager
 * Clicks the Login with Google button on the current page without opening new browser
 */

const BrowserManager = require('./browser-manager');

async function clickLoginWithGoogle() {
  const browserManager = BrowserManager.getInstance();
  
  try {
    console.log('🚀 Attempting to click Login with Google button...');
    console.log('🔒 Using existing browser instance (singleton)');
    
    // Navigate to RapidAPI login page
    console.log('🔗 Navigating to RapidAPI login page...');
    await browserManager.navigateTo('https://rapidapi.com/auth/login');
    
    const page = await browserManager.getPage();
    
    // Look for Login with Google button with multiple strategies
    const googleLoginSelectors = [
      'button:has-text("Login with Google")',
      'button:has-text("Sign in with Google")',
      'button:has-text("Continue with Google")',
      'button:has-text("Google")',
      'a:has-text("Login with Google")',
      'a:has-text("Sign in with Google")',
      'a:has-text("Continue with Google")',
      '[data-testid*="google"]',
      '[data-provider*="google"]',
      '[class*="google"]',
      '[id*="google"]',
    ];
    
    let clicked = false;
    
    // Strategy 1: Try text-based selectors
    for (const selector of googleLoginSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          console.log(`✅ Found Login with Google button with selector: ${selector}`);
          await button.click();
          console.log('✅ Clicked Login with Google button');
          clicked = true;
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Strategy 2: Look for any button/link with Google text
    if (!clicked) {
      console.log('🔍 Searching for Google login button by text content...');
      const buttons = await page.$$('button, a');
      for (const button of buttons) {
        try {
          const text = await button.textContent();
          if (text && text.toLowerCase().includes('google')) {
            console.log(`✅ Found Google button with text: "${text}"`);
            await button.click();
            console.log('✅ Clicked Login with Google button');
            clicked = true;
            await new Promise(resolve => setTimeout(resolve, 3000));
            break;
          }
        } catch {
          continue;
        }
      }
    }
    
    // Strategy 3: Look for Google logo/icon
    if (!clicked) {
      console.log('🔍 Searching for Google logo/icon...');
      const googleSelectors = [
        'img[alt*="Google"]',
        'img[src*="google"]',
        'svg[class*="google"]',
        '[class*="google-logo"]',
        '[class*="google-icon"]',
      ];
      
      for (const selector of googleSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            // Try clicking the parent element
            const parent = await element.evaluateHandle(el => el.parentElement);
            if (parent) {
              console.log(`✅ Found Google logo with selector: ${selector}`);
              await parent.asElement().click();
              console.log('✅ Clicked Google login button');
              clicked = true;
              await new Promise(resolve => setTimeout(resolve, 3000));
              break;
            }
          }
        } catch {
          continue;
        }
      }
    }
    
    if (clicked) {
      console.log('✅ Successfully clicked Login with Google button');
      console.log('📝 Browser is still open for Google authentication');
    } else {
      console.log('⚠️  Could not find Login with Google button');
      console.log('📋 Current page URL:', page.url());
      console.log('📋 Please manually click Login with Google in the browser window');
    }
    
  } catch (error) {
    console.error('❌ Error clicking Login with Google:', error.message);
    console.log('💡 Please manually click Login with Google in the browser window');
  }
  // Don't close browser - keep it for future tasks
}

clickLoginWithGoogle().catch(console.error);
