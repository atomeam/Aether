const { chromium } = require('playwright');

async function triggerPrivacySMS() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Privacy.com signup...');
    await page.goto('https://privacy.com');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on Sign up button
    console.log('Looking for Sign up button...');
    const signupButton = await page.$('button:has-text("Sign up")');
    if (signupButton) {
      await signupButton.click();
      console.log('Clicked Sign up button');
    } else {
      console.log('Sign up button not found, trying alternative...');
      await page.click('a:has-text("Sign up")');
    }
    
    // Wait for signup form
    await page.waitForTimeout(2000);
    
    // Look for email input
    console.log('Looking for email input...');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      console.log('Found email input');
      // Enter a temporary email (you'll need to change this)
      await emailInput.fill('temp.privacy.signup@gmail.com');
      console.log('Entered temporary email');
    }
    
    // Look for phone input
    console.log('Looking for phone input...');
    const phoneInput = await page.$('input[type="tel"], input[name="phone"], input[name="phoneNumber"]');
    if (phoneInput) {
      console.log('Found phone input');
      // Enter a free SMS number (you'll need to get one from the services)
      // For now, I'll use a placeholder
      await phoneInput.fill('+1234567890');
      console.log('Entered placeholder phone number');
      
      // Look for "Send code" or "Verify" button
      console.log('Looking for send code button...');
      await page.waitForTimeout(1000);
      
      const sendCodeButton = await page.$('button:has-text("Send"), button:has-text("Verify"), button:has-text("Code")');
      if (sendCodeButton) {
        await sendCodeButton.click();
        console.log('Clicked send code button - SMS should be sent now');
      } else {
        console.log('Send code button not found');
      }
    } else {
      console.log('Phone input not found - might be on next step');
    }
    
    console.log('\n=== MANUAL STEPS NEEDED ===');
    console.log('1. Get a free phone number from: https://www.receive-sms-online.com/');
    console.log('2. Copy a US number from the list');
    console.log('3. Enter it in the Privacy.com form');
    console.log('4. Click "Send code" or "Verify"');
    console.log('5. Refresh the SMS website to see the code');
    console.log('6. Enter the code in Privacy.com');
    
    console.log('\n=== Browser will stay open for manual completion ===');
    console.log('Press Ctrl+C to close when done');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

triggerPrivacySMS().catch(console.error);
