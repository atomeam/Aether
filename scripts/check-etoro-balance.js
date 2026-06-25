/**
 * eToro Balance Check Automation
 * 
 * This script automates checking your eToro balance for the $25
 * 
 * SECURITY: Uses environment variables for credentials
 * 
 * Usage:
 * 1. Set environment variables:
 *    ETORO_EMAIL=your@email.com
 *    ETORO_PASSWORD=yourpassword
 * 2. Run: node scripts/check-etoro-balance.js
 */

const { chromium } = require('playwright');

async function checkEtoroBalance() {
  const email = process.env.ETORO_EMAIL;
  const password = process.env.ETORO_PASSWORD;
  
  if (!email || !password) {
    console.log('❌ Missing credentials');
    console.log('Please set environment variables:');
    console.log('  ETORO_EMAIL=your@email.com');
    console.log('  ETORO_PASSWORD=yourpassword');
    console.log('');
    console.log('Then run:');
    console.log('  ETORO_EMAIL=your@email.com ETORO_PASSWORD=yourpassword node scripts/check-etoro-balance.js');
    return;
  }
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting eToro balance check...');
    console.log('🔐 Logging into eToro...');
    
    // Navigate to eToro login
    await page.goto('https://www.etoro.com/login');
    
    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill email
    await page.fill('input[type="email"]', email);
    console.log('✅ Email filled');
    
    // Fill password
    await page.fill('input[type="password"]', password);
    console.log('✅ Password filled');
    
    // Click login
    await page.click('button[type="submit"]');
    console.log('✅ Login clicked');
    
    // Wait for login to complete
    await page.waitForURL('https://www.etoro.com/*', { timeout: 30000 });
    console.log('✅ Login successful');
    
    // Navigate to portfolio
    console.log('💰 Navigating to portfolio...');
    await page.goto('https://www.etoro.com/portfolio');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    console.log('📊 On portfolio page - look for:');
    console.log('   - Available balance');
    console.log('   - "$25 is waiting" message');
    console.log('   - Withdrawal options');
    
    console.log('');
    console.log('⏸️  Please check the balance manually in the browser.');
    console.log('⌨️  Press Enter in terminal when done...');
    
    // Wait for user to complete
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('✅ Process complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Browser window is still open for manual completion');
    console.log('⏸️  Press Enter to close browser...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

checkEtoroBalance().catch(console.error);
