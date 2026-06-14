/**
 * Blocker 2: Click Edit API - Click Settings from Profile Menu
 * Click Settings from the User Profile dropdown menu
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_settings() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Clicking Settings from Profile menu');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click User Profile button
    console.log('📝 Clicking User Profile button...');
    const clickCode = `
      (function() {
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
          const ariaLabel = button.getAttribute('aria-label') || '';
          if (ariaLabel === 'User Profile') {
            button.click();
            return 'Clicked User Profile';
          }
        }
        return 'User Profile not found';
      })()
    `;
    
    await client.executeJavaScript(clickCode);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click Settings from the menu
    console.log('📝 Clicking Settings from menu...');
    const settingsCode = `
      (function() {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if (text === 'Settings') {
            const parentButton = el.closest('button, a, div[role="menuitem"]');
            if (parentButton) {
              parentButton.click();
              return 'Clicked Settings';
            }
            el.click();
            return 'Clicked Settings';
          }
        }
        return 'Settings not found';
      })()
    `;
    
    await client.executeJavaScript(settingsCode);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get current URL
    const info = await client.getPageInfo();
    console.log(`📋 Current URL: ${info.url}`);
    console.log(`📋 Page title: ${info.title}`);
    
    // List buttons on settings page
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}"`);
      }
    }
    
    // Look for Edit API or domain field
    const editButton = buttonsResult.buttons.find(b => 
      b.text.toLowerCase().includes('edit') || 
      b.text.toLowerCase().includes('api') ||
      b.text.toLowerCase().includes('domain')
    );
    
    if (editButton) {
      console.log(`📝 Found button: ${editButton.text}`);
      console.log('✅ Blocker 2 SOLVED: Settings page opened');
      return true;
    }
    
    // Look for domain input field
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - name="${input.name}", placeholder="${input.placeholder}"`);
      }
    }
    
    const domainInput = inputsResult.inputs.find(i => 
      i.name.toLowerCase().includes('domain') || 
      i.placeholder.toLowerCase().includes('domain')
    );
    
    if (domainInput) {
      console.log(`📝 Found domain input: ${domainInput.name}`);
      console.log('✅ Blocker 2 SOLVED: Settings page has domain field');
      return true;
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Settings page opened but no Edit API or domain field found');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_settings().catch(console.error);
