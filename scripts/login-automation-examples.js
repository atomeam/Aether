/**
 * Browser Automation for Login Flows - Educational Examples
 * 
 * IMPORTANT SECURITY NOTES:
 * - Only use for accounts you own
 * - Never share scripts with credentials
 * - Use environment variables for sensitive data
 * - Consider using password managers instead
 * - Be aware of 2FA - may require manual intervention
 */

const { chromium } = require('playwright');

/**
 * Example 1: Amazon Login Flow
 * For claiming the $25 gift card from G2 review
 */
async function amazonLogin(email, password) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔐 Navigating to Amazon login...');
    await page.goto('https://www.amazon.com/ap/signin');
    
    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill email
    await page.fill('input[type="email"]', email);
    
    // Click continue
    await page.click('input[type="submit"]');
    
    // Wait for password input
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    // Fill password
    await page.fill('input[type="password"]', password);
    
    // Click sign in
    await page.click('input[type="submit"]');
    
    // Handle 2FA if present
    const otpInput = await page.$('input[type="text"][maxlength="6"]');
    if (otpInput) {
      console.log('📱 2FA detected - please enter OTP manually');
      // Wait for user to enter OTP
      await page.waitForSelector('input[type="text"][maxlength="6"]', { state: 'visible' });
      // User would need to enter OTP manually
    }
    
    console.log('✅ Login complete');
    
    // Navigate to G2 review page
    await page.goto('https://www.g2.com/products/notion-ai');
    
    console.log('📝 On G2 page - look for review button');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Example 2: eToro Login Flow
 * For checking your $25 balance
 */
async function etoroLogin(email, password) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔐 Navigating to eToro login...');
    await page.goto('https://www.etoro.com/login');
    
    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill email
    await page.fill('input[type="email"]', email);
    
    // Fill password
    await page.fill('input[type="password"]', password);
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Handle 2FA if present
    const otpInput = await page.$('input[type="text"][maxlength="6"]');
    if (otpInput) {
      console.log('📱 2FA detected - please enter OTP manually');
    }
    
    console.log('✅ Login complete');
    
    // Navigate to portfolio/balance
    await page.goto('https://www.etoro.com/portfolio');
    
    console.log('💰 On portfolio page - check balance');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Example 3: Generic Login Template
 * Can be adapted for any login flow
 */
async function genericLogin(url, selectors, credentials) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log(`🔐 Navigating to ${url}...`);
    await page.goto(url);
    
    // Fill in each field
    for (const [field, value] of Object.entries(credentials)) {
      const selector = selectors[field];
      if (selector) {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.fill(selector, value);
      }
    }
    
    // Click submit button
    if (selectors.submit) {
      await page.click(selectors.submit);
    }
    
    console.log('✅ Login complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Example 4: Subscription Cancellation Template
 * For Squibler, EMERGENT LABS, etc.
 */
async function cancelSubscription(url, loginSelectors, credentials, cancelSelectors) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔐 Logging in...');
    await page.goto(url);
    
    // Login
    for (const [field, value] of Object.entries(credentials)) {
      const selector = loginSelectors[field];
      if (selector) {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.fill(selector, value);
      }
    }
    
    await page.click(loginSelectors.submit);
    
    // Navigate to subscription/billing page
    await page.goto(cancelSelectors.billingPage);
    
    // Find and click cancel button
    await page.click(cancelSelectors.cancelButton);
    
    // Confirm cancellation
    if (cancelSelectors.confirmButton) {
      await page.click(cancelSelectors.confirmButton);
    }
    
    console.log('✅ Subscription cancelled');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

// Usage examples (DO NOT run with real credentials - this is for learning)
console.log('📚 Browser Automation for Login Flows - Educational Examples');
console.log('');
console.log('To use these scripts:');
console.log('1. Install Playwright: npm install playwright');
console.log('2. Run: node scripts/login-automation-examples.js');
console.log('3. Adapt the functions to your specific needs');
console.log('');
console.log('⚠️  SECURITY REMINDERS:');
console.log('- Only use for accounts you own');
console.log('- Use environment variables for credentials');
console.log('- Be cautious with 2FA - may require manual intervention');
console.log('- Never share scripts with embedded credentials');
console.log('- Consider using password managers instead');
