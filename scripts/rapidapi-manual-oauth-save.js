/**
 * RapidAPI Manual OAuth + Session Save
 * 
 * This script opens the browser and lets you complete OAuth manually,
 * then saves the session for future use.
 * 
 * Run with:
 *   node rapidapi-manual-oauth-save.js
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function manualOAuthAndSave() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🌐 Navigating to RapidAPI...');
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    
    console.log('\n⏸️  MANUAL OAUTH REQUIRED');
    console.log('👀 Please:');
    console.log('   1. Click "Sign In" button');
    console.log('   2. Click "Login with Google"');
    console.log('   3. Select atomicmoonbeam88@gmail.com');
    console.log('   4. Approve permissions');
    console.log('   5. Wait until you see the API page');
    console.log('   6. Press Enter in this terminal when done');
    
    // Wait for user to complete OAuth
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('\n✅ OAuth complete!');
    
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

manualOAuthAndSave().catch(console.error);