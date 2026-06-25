/**
 * Blocker 2: Click Edit API - Click Edit API from Profile Menu
 * Click Edit API directly from the User Profile dropdown menu
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_editAPI() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Clicking Edit API from Profile menu');
    
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
    
    // Click Edit API from the menu
    console.log('📝 Clicking Edit API from menu...');
    const editAPICode = `
      (function() {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if (text === 'Edit API') {
            const parentButton = el.closest('button, a, div[role="menuitem"]');
            if (parentButton) {
              parentButton.click();
              return 'Clicked Edit API';
            }
            el.click();
            return 'Clicked Edit API';
          }
        }
        return 'Edit API not found';
      })()
    `;
    
    await client.executeJavaScript(editAPICode);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get current URL
    const info = await client.getPageInfo();
    console.log(`📋 Current URL: ${info.url}`);
    console.log(`📋 Page title: ${info.title}`);
    
    // List inputs to find domain field
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - name="${input.name}", placeholder="${input.placeholder}", value="${input.value}"`);
      }
    }
    
    // Look for domain input field
    const domainInput = inputsResult.inputs.find(i => 
      (i.name && i.name.toLowerCase().includes('domain')) || 
      (i.placeholder && i.placeholder.toLowerCase().includes('domain')) ||
      (i.value && i.value.toLowerCase().includes('domain'))
    );
    
    if (domainInput) {
      console.log(`📝 Found domain input: ${domainInput.name}`);
      console.log(`📝 Current value: ${domainInput.value}`);
      
      // Fix the domain
      const newValue = domainInput.value.replace('.www.', '.');
      console.log(`📝 Fixing domain from "${domainInput.value}" to "${newValue}"`);
      
      await client.fillInput(`input[name="${domainInput.name}"]`, newValue);
      console.log('✅ Domain fixed');
      
      // Save
      console.log('📝 Clicking Save button...');
      const saveCode = `
        (function() {
          const allButtons = document.querySelectorAll('button');
          for (const button of allButtons) {
            const text = button.textContent?.trim() || '';
            if (text === 'Save' || text === 'Save Changes') {
              button.click();
              return 'Clicked Save';
            }
          }
          return 'Save button not found';
        })()
      `;
      
      await client.executeJavaScript(saveCode);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('✅ Blocker 2 SOLVED: Domain fixed and saved');
      return true;
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: No domain input field found');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_editAPI().catch(console.error);
