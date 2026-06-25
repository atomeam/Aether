/**
 * RapidAPI Domain Fix - Login and Fix in One Session
 * 
 * This script logs in and fixes the domain in the same session.
 * 
 * Run with:
 *   node rapidapi-login-and-fix.js
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function loginAndFixDomain() {
  // Load credentials
  const credentialsPath = './.credentials.json';
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
  console.log('📧 Using email:', credentials.email);
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 100 
  });
  const context = await browser.newContext();
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
    console.log('🌐 STEP 1: Navigating to RapidAPI...');
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    await page.waitForTimeout(2000);
    await screenshot('01-initial-page');
    
    // Click Sign In
    console.log('👆 STEP 2: Clicking Sign In button...');
    const signInButton = await page.$('button:has-text("Sign In")');
    if (signInButton) {
      await signInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Click Login with Google (OAuth)
    console.log('🔑 STEP 3: Clicking Login with Google...');
    const googleLoginButton = await page.$('button:has-text("Login with Google")');
    if (googleLoginButton) {
      await googleLoginButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Wait for Google OAuth page
    console.log('⏳ Waiting for Google OAuth page...');
    await page.waitForTimeout(3000);
    
    // Select the account (atomicmoonbeam88@gmail.com)
    console.log('📧 STEP 4: Selecting account...');
    const accountButton = await page.$(`text=atomicmoonbeam88@gmail.com`);
    if (accountButton) {
      await accountButton.click();
      await page.waitForTimeout(3000);
    } else {
      // Try alternative selector
      const accountAlt = await page.$(`div:has-text("atomicmoonbeam88@gmail.com")`);
      if (accountAlt) {
        await accountAlt.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Approve permissions if needed
    console.log('✅ STEP 5: Approving permissions...');
    await page.waitForTimeout(2000);
    const approveButton = await page.$('button:has-text("Continue"), button:has-text("Allow"), button:has-text("Approve")');
    if (approveButton) {
      await approveButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Wait for redirect back to RapidAPI
    console.log('⏳ STEP 6: Waiting for redirect to RapidAPI...');
    await page.waitForTimeout(5000);
    
    // Accept cookies if present
    console.log('🍪 STEP 7: Accepting cookies...');
    const acceptAllButton = await page.$('button:has-text("Accept"), button:has-text("Allow")');
    if (acceptAllButton) {
      await acceptAllButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Wait for page to load
    console.log('⏳ STEP 8: Waiting for page to load...');
    await page.waitForTimeout(5000);
    await screenshot('02-logged-in');
    
    // Verify logged in
    const buttons = await page.$$eval('button, [role="button"]', els =>
      els.map(el => ({ text: el.textContent?.substring(0, 50), id: el.id, ariaLabel: el.getAttribute('aria-label') }))
    );
    console.log('\n🔘 Buttons found:', buttons.length);
    
    const signInButtonCheck = buttons.find(btn => btn.text === 'Sign In');
    if (signInButtonCheck) {
      console.log('❌ Login failed');
      await screenshot('03-login-failed');
      return;
    }
    
    console.log('✅ Successfully logged in!');
    
    // Look for Edit API or Settings button directly on the page
    console.log('\n🔍 Looking for Edit API or Settings button on page...');
    const pageButtons = await page.$$eval('button, [role="button"]', els =>
      els.map(el => ({ text: el.textContent?.substring(0, 50), id: el.id, ariaLabel: el.getAttribute('aria-label') }))
    );
    console.log('\n🔘 Page buttons found:', pageButtons.length);
    pageButtons.forEach((btn, i) => {
      console.log(`   ${i + 1}. text="${btn.text}" id="${btn.id}" ariaLabel="${btn.ariaLabel}"`);
    });
    
    const editAPIButton = pageButtons.find(btn => btn.text === 'Edit API');
    const settingsButton = pageButtons.find(btn => btn.text.toLowerCase().includes('settings'));
    
    if (editAPIButton) {
      console.log('\n📝 Found Edit API button, clicking it...');
      await page.click('button:has-text("Edit API")');
      await page.waitForTimeout(3000);
      await screenshot('03-edit-api-clicked');
    } else if (settingsButton) {
      console.log('\n📝 Found Settings button, clicking it...');
      await page.click(`button:has-text("${settingsButton.text}")`);
      await page.waitForTimeout(3000);
      await screenshot('03-settings-button-clicked');
    } else {
      console.log('\n⚠️  No Edit API or Settings button found on page');
      console.log('🔍 Looking for profile menu button...');
      
      // Try to find any profile-related button
      const profileButton = pageButtons.find(btn => 
        btn.ariaLabel && (btn.ariaLabel.toLowerCase().includes('profile') || btn.ariaLabel.toLowerCase().includes('user'))
      );
      
      if (profileButton) {
        console.log('📝 Found profile button:', profileButton.ariaLabel);
        await page.click(`button[aria-label="${profileButton.ariaLabel}"]`);
        await page.waitForTimeout(2000);
        await screenshot('03-profile-clicked');
        
        // List menu buttons after clicking profile
        const menuButtons = await page.$$eval('button, [role="button"]', els =>
          els.map(el => ({ text: el.textContent?.substring(0, 50), id: el.id, ariaLabel: el.getAttribute('aria-label') }))
        );
        console.log('\n🔘 Menu buttons found:', menuButtons.length);
        menuButtons.forEach((btn, i) => {
          console.log(`   ${i + 1}. text="${btn.text}" id="${btn.id}" ariaLabel="${btn.ariaLabel}"`);
        });
        
        // Look for Edit API in menu
        const menuEditAPI = menuButtons.find(btn => btn.text === 'Edit API');
        const menuSettings = menuButtons.find(btn => btn.text.toLowerCase().includes('settings'));
        
        if (menuEditAPI) {
          console.log('📝 Found Edit API in menu');
          await page.click('button:has-text("Edit API")');
          await page.waitForTimeout(3000);
          await screenshot('04-menu-edit-api-clicked');
        } else if (menuSettings) {
          console.log('📝 Found Settings in menu');
          await page.click(`button:has-text("${menuSettings.text}")`);
          await page.waitForTimeout(3000);
          await screenshot('04-menu-settings-clicked');
        }
      } else {
        console.log('❌ No profile button found');
        await screenshot('03-no-profile-button');
        return;
      }
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
      console.log('\n🎉 Found domain input:', domainInput);
      await screenshot('04-domain-input-found');
      
      // Change domain
      const selector = domainInput.id ? `#${domainInput.id}` : 
                       domainInput.name ? `input[name="${domainInput.name}"]` :
                       domainInput.placeholder ? `input[placeholder="${domainInput.placeholder}"]` : 'input';
      
      console.log(`\n✏️  Changing domain to a-to-mind.com...`);
      await page.fill(selector, 'a-to-mind.com');
      await screenshot('05-domain-changed');
      
      // Look for save button
      const saveButton = await page.$('button:has-text("Save"), button[type="submit"]');
      if (saveButton) {
        console.log('\n💾 Clicking Save button...');
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
    // Save session for future use
    console.log('\n💾 Saving session for future use...');
    const storageState = await context.storageState();
    const sessionPath = './rapidapi-session.json';
    fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));
    console.log(`✅ Session saved to: ${sessionPath}`);
    
    // Save cookies
    const cookies = await context.cookies();
    const cookiesPath = './rapidapi-cookies.json';
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log(`✅ Cookies saved to: ${cookiesPath}`);
    
    console.log('\n🎯 Test complete. Closing browser...');
    await browser.close();
  }
}

loginAndFixDomain().catch(console.error);