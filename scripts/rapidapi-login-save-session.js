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
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🌐 Navigating to RapidAPI...');
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    
    console.log('\n⏸️  WAITING FOR MANUAL LOGIN');
    console.log('👀 Please:');
    console.log('   1. Click "Sign In" button');
    console.log('   2. Complete Google login with 2FA/passkey');
    console.log('   3. Wait until you see the API page');
    console.log('   4. Press Enter in this terminal when done');
    
    // Wait for user to complete login
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
  } finally {
    await browser.close();
  }
}

loginAndSaveSession().catch(console.error);
