/**
 * Fix RapidAPI Domain - Research-Based
 * Uses research findings to fix the domain issue
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function fixRapidAPIDomain() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Fixing RapidAPI domain based on research...');
    
    // Navigate to RapidAPI
    console.log('📝 Navigating to RapidAPI...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to RapidAPI');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click settings icon (gear) in top right
    console.log('📝 Clicking settings icon (gear) in top right corner...');
    
    // Try multiple selectors for settings icon
    const settingsSelectors = [
      'button[aria-label="Settings"]',
      'button[aria-label="settings"]',
      'button[title="Settings"]',
      'button[title="settings"]',
      'svg[aria-label="Settings"]',
      'svg[aria-label="settings"]',
      '[data-testid*="settings"]',
      'button:has(svg)',
      'button[class*="settings"]',
    ];
    
    let clicked = false;
    for (const selector of settingsSelectors) {
      try {
        await client.clickElement(selector);
        console.log(`✅ Clicked settings with selector: ${selector}`);
        clicked = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!clicked) {
      console.log('⚠️  Could not click settings icon with standard selectors');
      console.log('📝 Trying to find by SVG...');
      
      // Try to find any button with SVG
      const buttonsResult = await client.listButtons();
      for (const button of buttonsResult.buttons) {
        if (button.visible && button.className.includes('svg')) {
          console.log(`📝 Found button with SVG: ${button.text}`);
          try {
            await client.clickElement(`button:has-text("${button.text}")`);
            console.log('✅ Clicked button');
            clicked = true;
            break;
          } catch (error) {
            continue;
          }
        }
      }
    }
    
    if (!clicked) {
      console.log('⚠️  Could not click settings icon');
      console.log('📝 Please manually click the settings icon (gear) in the top right corner');
      console.log('⏸️  Press Enter in terminal when settings is clicked...');
      
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    }
    
    // Wait for settings page to load
    console.log('📝 Waiting for settings page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for domain field
    console.log('📝 Looking for domain field...');
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - type=${input.type}, name=${input.name}, id=${input.id}, value=${input.value}, placeholder=${input.placeholder}`);
      }
    }
    
    // Try to find domain field
    const domainSelectors = [
      'input[name="domain"]',
      'input[name="endpoint"]',
      'input[name="url"]',
      'input[placeholder*="domain"]',
      'input[placeholder*="endpoint"]',
      'input[placeholder*="url"]',
    ];
    
    let domainFound = false;
    for (const selector of domainSelectors) {
      try {
        const result = await client.fillInput(selector, 'a-to-mind.com');
        console.log(`✅ Updated domain to a-to-mind.com with selector: ${selector}`);
        domainFound = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!domainFound) {
      console.log('⚠️  Could not find domain field with standard selectors');
      console.log('📝 Trying to find by attributes...');
      
      for (const input of inputsResult.inputs) {
        if (input.visible && (input.name?.toLowerCase().includes('domain') || input.name?.toLowerCase().includes('endpoint') || input.name?.toLowerCase().includes('url'))) {
          console.log(`📝 Found domain field: name=${input.name}, id=${input.id}, current value=${input.value}`);
          try {
            await client.fillInput(`input[name="${input.name}"]`, 'a-to-mind.com');
            console.log('✅ Updated domain to a-to-mind.com');
            domainFound = true;
            break;
          } catch (error) {
            continue;
          }
        }
      }
    }
    
    if (!domainFound) {
      console.log('⚠️  Could not find domain field');
      console.log('📝 Please manually update the domain in the browser window');
      console.log('📋 Change from: .www.a-to-mind.com');
      console.log('📋 Change to: a-to-mind.com');
      console.log('📋 OR use: bridge.a-to-mind.com (recommended)');
      return;
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click Save button
    console.log('📝 Clicking Save button...');
    const saveSelectors = [
      'button:has-text("Save")',
      'button:has-text("Update")',
      'button[type="submit"]',
      '[data-testid*="save"]',
      '[data-testid*="update"]',
    ];
    
    let saved = false;
    for (const selector of saveSelectors) {
      try {
        await client.clickElement(selector);
        console.log(`✅ Clicked Save with selector: ${selector}`);
        saved = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!saved) {
      console.log('⚠️  Could not find Save button');
      console.log('📋 Please manually click Save in the browser window');
    } else {
      console.log('✅ Successfully updated domain and saved');
      console.log('📝 Browser is still alive');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Please complete manually in the browser window');
  }
}

fixRapidAPIDomain().catch(console.error);
