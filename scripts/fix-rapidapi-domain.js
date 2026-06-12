/**
 * Fix RapidAPI Domain - Using Persistent Browser Service
 * Navigates to RapidAPI and fixes the domain issue
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function fixRapidAPIDomain() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🚀 Fixing RapidAPI domain issue...');
    
    // Navigate to RapidAPI a-to-mind API
    console.log('📝 Navigating to RapidAPI a-to-mind API...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to RapidAPI');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click Edit API or Settings
    console.log('📝 Clicking Edit API or Settings...');
    const editSelectors = [
      'button:has-text("Edit API")',
      'button:has-text("Settings")',
      'a:has-text("Edit API")',
      'a:has-text("Settings")',
      '[data-testid*="edit"]',
      '[data-testid*="settings"]',
    ];
    
    let clicked = false;
    for (const selector of editSelectors) {
      try {
        await client.clickElement(selector);
        console.log(`✅ Clicked Edit/Settings with selector: ${selector}`);
        clicked = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!clicked) {
      console.log('⚠️  Could not find Edit/Settings button');
      console.log('📝 Trying to find by text content...');
      
      // Try to find any button with edit/settings text
      // This would require a more complex search, but for now we'll assume it's found
    }
    
    // Wait for settings page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find domain/endpoint URL field
    console.log('📝 Looking for domain/endpoint URL field...');
    
    // List inputs to see what's available
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - type=${input.type}, name=${input.name}, id=${input.id}, value=${input.value}`);
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
      
      // Try to find by looking at the inputs we listed
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
      console.log('📋 Please manually update the domain in the browser window');
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
