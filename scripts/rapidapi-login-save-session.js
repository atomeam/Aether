/**
 * RapidAPI Login with Session Persistence
 * 
 * This script logs in to RapidAPI and saves the session for future use.
 * 
 * Run with:
 *   node rapidapi-login-save-session.js
 * 
 * The script will:
 * 1. Open browser
 * 2. Navigate to RapidAPI
 * 3. Wait for you to log in manually (with 2FA)
 * 4. Save the session state
 * 5. Close browser
 * 
 * Future scripts can use the saved session to bypass login.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function loginAndSaveSession() {
  // Load credentials
  const credentialsPath = './.credentials.json';
  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ Credentials file not found!');
    console.log('📝 Please create .credentials.json with email and password');
    return;
  }
  
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  console.log('📧 Using email:', credentials.email);
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🌐 Navigating to RapidAPI...');
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    await page.waitForTimeout(2000);
    
    // Click Sign In
    console.log('👆 Clicking Sign In button...');
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Fill in email
    console.log('📧 Filling in email...');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      await emailInput.fill(credentials.email);
      await page.waitForTimeout(500);
    }
    
    // Fill in password
    console.log('🔑 Filling in password...');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.fill(credentials.password);
      await page.waitForTimeout(500);
    }
    
    // Click login/continue
    console.log('🔐 Clicking login button...');
    const loginButton = await page.$('button[type="submit"], button:has-text("Next"), button:has-text("Sign in")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    console.log('\n⏸️  WAITING FOR 2FA/PASSKEY');
    console.log('👀 Please:');
    console.log('   1. Complete 2FA/passkey verification in the browser');
    console.log('   2. Wait until you see the API page');
    console.log('   3. Press Enter in this terminal when done');
    
    // Wait for user to complete 2FA
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('\n✅ Login complete!');
    
    // Save session state
    console.log('💾 Saving session state...');
    const storageState = await context.storageState();
    const sessionPath = './rapidapi-session.json';
    fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));
    console.log(`✅ Session saved to: ${sessionPath}`);
    
    // Save cookies
    const cookies = await context.cookies();
    const cookiesPath = './rapidapi-cookies.json';
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log(`✅ Cookies saved to: ${cookiesPath}`);
    
    // Take screenshot to verify login
    await page.screenshot({ path: 'rapidapi-logged-in.png', fullPage: true });
    console.log('📸 Screenshot saved: rapidapi-logged-in.png');
    
    console.log('\n🎉 Session saved successfully!');
    console.log('📝 Future scripts can now use this session to bypass login.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'rapidapi-login-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

loginAndSaveSession().catch(console.error);
