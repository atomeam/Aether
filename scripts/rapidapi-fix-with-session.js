/**
 * RapidAPI Domain Fix with Saved Session
 * 
 * This script uses a saved session to automatically log in and fix the domain.
 * 
 * Prerequisites:
 *   1. Run rapidapi-login-save-session.js first to save session
 *   2. This script will use that session to bypass login
 * 
 * Run with:
 *   node rapidapi-fix-with-session.js
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function rapidAPIFixWithSession() {
  // Check if session exists
  const sessionPath = './rapidapi-session.json';
  if (!fs.existsSync(sessionPath)) {
    console.log('❌ Session file not found!');
    console.log('📝 Please run: node rapidapi-login-save-session.js');
    console.log('   to save your login session first.');
    return;
  }
  
  const storageState = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visibility
    slowMo: 100 // Slow down actions
  });
  
  // Create context with saved session
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();
  
  // Create screenshots directory
  const screenshotDir = './rapidapi-fix-screenshots';
  fs.mkdirSync(screenshotDir, { recursive: true });
  
  let step = 0;
  
  const screenshot = async (name) => {
    step++;
    const path = `${screenshotDir}/${step}-${name}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot: ${path}`);
    return path;
  };
  
  try {
    console.log('🌐 STEP 1: Navigating to RapidAPI with saved session...');
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot('01-initial-page');
    
    // Verify logged in
    const buttons = await page.$$eval('button, [role="button"]', els =>
      els.map(el => ({ text: el.textContent?.substring(0, 50), id: el.id, ariaLabel: el.getAttribute('aria-label') }))
    );
    console.log('\n🔘 Buttons found:', buttons.length);
    
    const signInButton = buttons.find(btn => btn.text === 'Sign In');
    if (signInButton) {
      console.log('❌ Session expired or invalid');
      console.log('📝 Please run: node rapidapi-login-save-session.js');
      console.log('   to save a new session.');
      await screenshot('02-session-expired');
      return;
    }
    
    console.log('✅ Successfully logged in with saved session!');
    
    // Click User Profile
    console.log('\n👤 STEP 2: Clicking User Profile button...');
    await page.click('button[aria-label="User Profile"]');
    await page.waitForTimeout(2000);
    await screenshot('02-user-profile-clicked');
    
    // List menu buttons
    const menuButtons = await page.$$eval('button, [role="button"]', els =>
      els.map(el => ({ text: el.textContent?.substring(0, 50), id: el.id, ariaLabel: el.getAttribute('aria-label') }))
    );
    console.log('\n🔘 Menu buttons found:', menuButtons.length);
    menuButtons.forEach((btn, i) => {
      console.log(`   ${i + 1}. text="${btn.text}" id="${btn.id}" ariaLabel="${btn.ariaLabel}"`);
    });
    
    // Try to find API-related or Settings button
    const apiButton = menuButtons.find(btn => 
      btn.text.toLowerCase().includes('api') && !btn.text.toLowerCase().includes('marketplace')
    );
    const settingsButton = menuButtons.find(btn => 
      btn.text.toLowerCase().includes('settings')
    );
    
    if (apiButton) {
      console.log('\n📝 STEP 3: Found API button:', apiButton.text);
      await page.click(`button:has-text("${apiButton.text}")`);
      await page.waitForTimeout(3000);
      await screenshot('03-api-button-clicked');
    } else if (settingsButton) {
      console.log('\n📝 STEP 3: Found Settings button:', settingsButton.text);
      await page.click(`button:has-text("${settingsButton.text}")`);
      await page.waitForTimeout(3000);
      await screenshot('03-settings-button-clicked');
    } else {
      console.log('\n⚠️  No API or Settings button found in menu');
      console.log('🔍 Trying Account Settings specifically...');
      await page.click('button:has-text("Account Settings")');
      await page.waitForTimeout(3000);
      await screenshot('03-account-settings-clicked');
    }
    
    // List all inputs
    const inputs = await page.$$eval('input, textarea, select', els =>
      els.map(el => ({ 
        type: el.type, 
        name: el.name, 
        id: el.id, 
        placeholder: el.placeholder,
        value: el.value 
      }))
    );
    console.log('\n📝 Inputs found:', inputs.length);
    inputs.forEach((input, i) => {
      console.log(`   ${i + 1}. type="${input.type}" name="${input.name}" id="${input.id}" placeholder="${input.placeholder}" value="${input.value}"`);
    });
    
    // Look for domain input
    const domainInput = inputs.find(input => 
      (input.name && input.name.toLowerCase().includes('domain')) ||
      (input.id && input.id.toLowerCase().includes('domain')) ||
      (input.placeholder && input.placeholder.toLowerCase().includes('domain')) ||
      (input.value && input.value.includes('.www.a-to-mind.com'))
    );
    
    if (domainInput) {
      console.log('\n🎉 STEP 4: Found domain input:', domainInput);
      await screenshot('04-domain-input-found');
      
      // Change domain
      const selector = domainInput.id ? `#${domainInput.id}` : 
                       domainInput.name ? `input[name="${domainInput.name}"]` :
                       domainInput.placeholder ? `input[placeholder="${domainInput.placeholder}"]` : 'input';
      
      console.log(`\n✏️  STEP 5: Changing domain to a-to-mind.com...`);
      await page.fill(selector, 'a-to-mind.com');
      await screenshot('05-domain-changed');
      
      // Look for save button
      const saveButton = await page.$('button:has-text("Save"), button[type="submit"]');
      if (saveButton) {
        console.log('\n💾 STEP 6: Clicking Save button...');
        await saveButton.click();
        await page.waitForTimeout(2000);
        await screenshot('06-save-clicked');
        console.log('✅ Save clicked');
      } else {
        console.log('\n⚠️  Save button not found, looking for other save options...');
        const allButtons = await page.$$eval('button', els =>
          els.map(el => ({ text: el.textContent?.substring(0, 50), type: el.type }))
        );
        console.log('All buttons:', JSON.stringify(allButtons, null, 2));
        await screenshot('06-no-save-button');
      }
      
      // Take final screenshot
      await screenshot('07-final-state');
      console.log('\n🎉 Domain fix complete!');
      
    } else {
      console.log('\n❌ Domain input not found');
      console.log('⚠️  May need to navigate to a different section');
      await screenshot('04-no-domain-input');
      
      // Try to find Edit API button
      console.log('\n🔍 Looking for Edit API button...');
      const editAPIButton = await page.$('button:has-text("Edit API")');
      if (editAPIButton) {
        console.log('📝 Found Edit API button');
        await editAPIButton.click();
        await page.waitForTimeout(3000);
        await screenshot('05-edit-api-clicked');
        
        // List inputs again
        const inputs2 = await page.$$eval('input, textarea, select', els =>
          els.map(el => ({ 
            type: el.type, 
            name: el.name, 
            id: el.id, 
            placeholder: el.placeholder,
            value: el.value 
          }))
        );
        console.log('\n📝 Inputs after Edit API:', inputs2.length);
        inputs2.forEach((input, i) => {
          console.log(`   ${i + 1}. type="${input.type}" name="${input.name}" id="${input.id}" placeholder="${input.placeholder}" value="${input.value}"`);
        });
        
        const domainInput2 = inputs2.find(input => 
          (input.name && input.name.toLowerCase().includes('domain')) ||
          (input.id && input.id.toLowerCase().includes('domain')) ||
          (input.placeholder && input.placeholder.toLowerCase().includes('domain')) ||
          (input.value && input.value.includes('.www.a-to-mind.com'))
        );
        
        if (domainInput2) {
          console.log('\n🎉 Found domain input after Edit API:', domainInput2);
          const selector2 = domainInput2.id ? `#${domainInput2.id}` : 
                           domainInput2.name ? `input[name="${domainInput2.name}"]` :
                           domainInput2.placeholder ? `input[placeholder="${domainInput2.placeholder}"]` : 'input';
          
          await page.fill(selector2, 'a-to-mind.com');
          await screenshot('06-domain-changed-edit-api');
          console.log('✅ Domain changed');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: `${screenshotDir}/error.png`, fullPage: true });
  } finally {
    console.log('\n🎯 Test complete. Closing browser...');
    await browser.close();
  }
}

rapidAPIFixWithSession().catch(console.error);
