/**
 * Click Sign In - Using Singleton Browser Manager
 * Clicks the Sign In button on the current page without opening new browser
 */

const BrowserManager = require('./browser-manager');

async function clickSignIn() {
  const browserManager = BrowserManager.getInstance();
  
  try {
    console.log('🚀 Attempting to click Sign In button...');
    console.log('🔒 Using existing browser instance (singleton)');
    
    // Navigate to RapidAPI first
    console.log('🔗 Navigating to RapidAPI...');
    await browserManager.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    
    const page = await browserManager.getPage();
    
    // Look for Sign In button with multiple strategies
    const signInSelectors = [
      'button:has-text("Sign in")',
      'button:has-text("Sign In")',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'a:has-text("Sign in")',
      'a:has-text("Sign In")',
      'a:has-text("Log in")',
      'a:has-text("Login")',
      '[data-testid*="signin"]',
      '[data-testid*="login"]',
      '[data-testid*="sign-in"]',
      '.sign-in',
      '.login',
      '#sign-in',
      '#login',
    ];
    
    let clicked = false;
    
    // Strategy 1: Try text-based selectors
    for (const selector of signInSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          console.log(`✅ Found Sign In button with selector: ${selector}`);
          await button.click();
          console.log('✅ Clicked Sign In button');
          clicked = true;
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      } catch {
        continue;
      }
    }
    
    // Strategy 2: Look for any button/link with sign in text
    if (!clicked) {
      console.log('🔍 Searching for Sign In button by text content...');
      const buttons = await page.$$('button, a');
      for (const button of buttons) {
        try {
          const text = await button.textContent();
          if (text && (text.toLowerCase().includes('sign in') || text.toLowerCase().includes('log in') || text.toLowerCase().includes('login'))) {
            console.log(`✅ Found Sign In button with text: "${text}"`);
            await button.click();
            console.log('✅ Clicked Sign In button');
            clicked = true;
            await new Promise(resolve => setTimeout(resolve, 3000));
            break;
          }
        } catch {
          continue;
        }
      }
    }
    
    // Strategy 3: Look for auth-related elements
    if (!clicked) {
      console.log('🔍 Searching for auth-related elements...');
      const authSelectors = [
        '[class*="auth"]',
        '[class*="login"]',
        '[class*="signin"]',
        '[id*="auth"]',
        '[id*="login"]',
        '[id*="signin"]',
      ];
      
      for (const selector of authSelectors) {
        try {
          const elements = await page.$$(selector);
          for (const element of elements) {
            const text = await element.textContent();
            if (text && (text.toLowerCase().includes('sign in') || text.toLowerCase().includes('log in'))) {
              console.log(`✅ Found auth element with selector: ${selector}`);
              await element.click();
              console.log('✅ Clicked Sign In button');
              clicked = true;
              await new Promise(resolve => setTimeout(resolve, 3000));
              break;
            }
          }
          if (clicked) break;
        } catch {
          continue;
        }
      }
    }
    
    if (clicked) {
      console.log('✅ Successfully clicked Sign In button');
      console.log('📝 Browser is still open for login completion');
    } else {
      console.log('⚠️  Could not find Sign In button');
      console.log('📋 Current page URL:', page.url());
      console.log('📋 Please manually click Sign In in the browser window');
    }
    
  } catch (error) {
    console.error('❌ Error clicking Sign In:', error.message);
    console.log('💡 Please manually click Sign In in the browser window');
  }
  // Don't close browser - keep it for future tasks
}

clickSignIn().catch(console.error);
