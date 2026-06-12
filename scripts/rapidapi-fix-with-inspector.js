/**
 * RapidAPI Domain Fix - Standalone Playwright Script with Inspector
 * 
 * This script uses Playwright Inspector to debug and fix the domain issue.
 * 
 * Run with:
 *   node rapidapi-fix-with-inspector.js
 * 
 * The Inspector will open automatically at each page.pause() call
 */

const { chromium } = require('playwright');

async function rapidAPIFixWithInspector() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to RapidAPI...');
    await page.goto('https://rapidapi.com/atom-bomb-a-to-mind/api');
    
    // PAUSE 1 - Opens Inspector to see the initial page
    console.log('\n⏸️  PAUSE 1: Inspecting initial page');
    console.log('👀 Use Inspector to:');
    console.log('   - Press Ctrl+Shift+C to pick locators');
    console.log('   - Click elements to see their selectors');
    console.log('   - Inspect the DOM structure');
    console.log('   - Press F8 to resume when ready');
    await page.pause();
    
    // Get page info
    const title = await page.title();
    const url = page.url();
    console.log('📄 Page title:', title);
    console.log('🔗 Page URL:', url);
    
    // List buttons
    const buttons = await page.$$eval('button, [role="button"]', els =>
      els.map(el => ({ text: el.textContent?.substring(0, 50), id: el.id, ariaLabel: el.getAttribute('aria-label') }))
    );
    console.log('\n🔘 Buttons found:', buttons.length);
    buttons.forEach((btn, i) => {
      console.log(`   ${i + 1}. text="${btn.text}" id="${btn.id}" ariaLabel="${btn.ariaLabel}"`);
    });
    
    // Click User Profile
    console.log('\n👤 Clicking User Profile button...');
    await page.click('button[aria-label="User Profile"]');
    await page.waitForTimeout(2000);
    
    // PAUSE 2 - Opens Inspector to see the menu
    console.log('\n⏸️  PAUSE 2: Inspecting User Profile menu');
    console.log('👀 Use Inspector to:');
    console.log('   - See what menu options are available');
    console.log('   - Pick selectors for menu items');
    console.log('   - Press F8 to resume when ready');
    await page.pause();
    
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
      console.log('\n📝 Found API button:', apiButton.text);
      await page.click(`button:has-text("${apiButton.text}")`);
      await page.waitForLoadState('networkidle');
    } else if (settingsButton) {
      console.log('\n📝 Found Settings button:', settingsButton.text);
      await page.click(`button:has-text("${settingsButton.text}")`);
      await page.waitForLoadState('networkidle');
    } else {
      console.log('\n⚠️  No API or Settings button found in menu');
    }
    
    // PAUSE 3 - Opens Inspector to see the settings/API page
    console.log('\n⏸️  PAUSE 3: Inspecting settings/API page');
    console.log('👀 Use Inspector to:');
    console.log('   - Look for domain input field');
    console.log('   - Pick the domain field selector');
    console.log('   - Press F8 to resume when ready');
    await page.pause();
    
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
      
      // PAUSE 4 - Before changing domain
      console.log('\n⏸️  PAUSE 4: About to change domain');
      console.log('👀 Use Inspector to:');
      console.log('   - Verify this is the correct field');
      console.log('   - Press F8 to proceed with change');
      await page.pause();
      
      // Change domain
      const selector = domainInput.id ? `#${domainInput.id}` : 
                       domainInput.name ? `input[name="${domainInput.name}"]` :
                       domainInput.placeholder ? `input[placeholder="${domainInput.placeholder}"]` : 'input';
      
      console.log(`\n✏️  Changing domain to a-to-mind.com...`);
      await page.fill(selector, 'a-to-mind.com');
      
      // PAUSE 5 - After changing domain
      console.log('\n⏸️  PAUSE 5: Domain changed');
      console.log('👀 Use Inspector to:');
      console.log('   - Verify the change');
      console.log('   - Look for Save button');
      console.log('   - Press F8 to proceed');
      await page.pause();
      
      // Look for save button
      const saveButton = await page.$('button:has-text("Save"), button[type="submit"]');
      if (saveButton) {
        console.log('\n💾 Clicking Save button...');
        await saveButton.click();
        console.log('✅ Save clicked');
      } else {
        console.log('\n⚠️  Save button not found');
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'rapidapi-final.png', fullPage: true });
      console.log('\n📸 Final screenshot saved: rapidapi-final.png');
      
    } else {
      console.log('\n❌ Domain input not found');
      console.log('⚠️  May need to navigate to a different section');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'rapidapi-error.png', fullPage: true });
  } finally {
    console.log('\n🎯 Test complete. Closing browser...');
    await browser.close();
  }
}

// Run the function
rapidAPIFixWithInspector().catch(console.error);
