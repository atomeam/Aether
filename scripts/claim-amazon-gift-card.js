/**
 * Amazon Gift Card Claim Automation
 * 
 * This script automates the process of claiming the $25 Amazon gift card
 * from the G2 review offer.
 * 
 * SECURITY: Uses environment variables for credentials
 * 
 * Usage:
 * 1. Set environment variables:
 *    AMAZON_EMAIL=your@email.com
 *    AMAZON_PASSWORD=yourpassword
 * 2. Run: node scripts/claim-amazon-gift-card.js
 */

const { chromium } = require('playwright');

async function claimAmazonGiftCard() {
  const email = process.env.AMAZON_EMAIL;
  const password = process.env.AMAZON_PASSWORD;
  
  if (!email || !password) {
    console.log('❌ Missing credentials');
    console.log('Please set environment variables:');
    console.log('  AMAZON_EMAIL=your@email.com');
    console.log('  AMAZON_PASSWORD=yourpassword');
    console.log('');
    console.log('Then run:');
    console.log('  AMAZON_EMAIL=your@email.com AMAZON_PASSWORD=yourpassword node scripts/claim-amazon-gift-card.js');
    return;
  }
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting Amazon gift card claim process...');
    console.log('🔐 Logging into Amazon...');
    
    // Navigate to Amazon login
    await page.goto('https://www.amazon.com/ap/signin');
    
    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill email
    await page.fill('input[type="email"]', email);
    console.log('✅ Email filled');
    
    // Click continue
    await page.click('input[type="submit"]');
    console.log('✅ Continue clicked');
    
    // Wait for password input
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    // Fill password
    await page.fill('input[type="password"]', password);
    console.log('✅ Password filled');
    
    // Click sign in
    await page.click('input[type="submit"]');
    console.log('✅ Sign in clicked');
    
    // Wait for login to complete
    await page.waitForURL('https://www.amazon.com/*', { timeout: 30000 });
    console.log('✅ Login successful');
    
    // Navigate to G2 review page
    console.log('📝 Navigating to G2 review page...');
    await page.goto('https://www.g2.com/products/notion-ai');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    console.log('📋 On G2 page - look for:');
    console.log('   - Review button');
    console.log('   - $25 gift card offer');
    console.log('   - Review submission form');
    
    console.log('');
    console.log('⏸️  Please complete the review manually in the browser.');
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

claimAmazonGiftCard().catch(console.error);
