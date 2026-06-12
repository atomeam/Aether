/**
 * Blocker 2: Click Edit API - JavaScript Execution
 * Solve dynamic UI using JavaScript execution and hover
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_javascript() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Solving dynamic UI with JavaScript execution');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Approach 1: Hover over settings icon
    console.log('📝 Approach 1: Hovering over settings icon...');
    try {
      const hoverResult = await client.hoverElement('button:has(svg)');
      console.log(`✅ Hover result: ${JSON.stringify(hoverResult)}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // List buttons to see if dropdown appeared
      const buttonsResult = await client.listButtons();
      console.log(`📋 After hover: ${buttonsResult.buttons.length} buttons`);
      
      for (const button of buttonsResult.buttons) {
        if (button.visible) {
          console.log(`  - text="${button.text}"`);
        }
      }
      
      // Look for Edit API
      const editButton = buttonsResult.buttons.find(b => b.text.includes('Edit') || b.text.includes('edit'));
      if (editButton) {
        console.log(`📝 Found Edit button: ${editButton.text}`);
        await client.clickElement(`button:has-text("${editButton.text}")`);
        console.log('✅ Clicked Edit button');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const info = await client.getPageInfo();
        console.log(`📋 Current URL: ${info.url}`);
        
        console.log('✅ Blocker 2 SOLVED: Used hover to trigger dropdown');
        return true;
      }
    } catch (error) {
      console.log('⚠️  Hover approach failed:', error.message);
    }
    
    // Approach 2: Execute JavaScript to trigger dropdown
    console.log('📝 Approach 2: Executing JavaScript to trigger dropdown...');
    try {
      // Find settings button and click it via JavaScript
      const jsCode = `
        (function() {
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            if (button.querySelector('svg')) {
              button.click();
              return 'Clicked settings button';
            }
          }
          return 'Settings button not found';
        })()
      `;
      
      const jsResult = await client.executeJavaScript(jsCode);
      console.log(`✅ JavaScript result: ${JSON.stringify(jsResult)}`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // List buttons to see if dropdown appeared
      const buttonsResult2 = await client.listButtons();
      console.log(`📋 After JS click: ${buttonsResult2.buttons.length} buttons`);
      
      for (const button of buttonsResult2.buttons) {
        if (button.visible) {
          console.log(`  - text="${button.text}"`);
        }
      }
      
      // Look for Edit API
      const editButton2 = buttonsResult2.buttons.find(b => b.text.includes('Edit') || b.text.includes('edit'));
      if (editButton2) {
        console.log(`📝 Found Edit button: ${editButton2.text}`);
        await client.clickElement(`button:has-text("${editButton2.text}")`);
        console.log('✅ Clicked Edit button');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const info2 = await client.getPageInfo();
        console.log(`📋 Current URL: ${info2.url}`);
        
        console.log('✅ Blocker 2 SOLVED: Used JavaScript to trigger dropdown');
        return true;
      }
    } catch (error) {
      console.log('⚠️  JavaScript approach failed:', error.message);
    }
    
    // Approach 3: Execute JavaScript to find and click Edit API directly
    console.log('📝 Approach 3: Executing JavaScript to find and click Edit API...');
    try {
      const jsCode2 = `
        (function() {
          // First click settings
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            if (button.querySelector('svg')) {
              button.click();
              break;
            }
          }
          
          // Find and click Edit API
          const allButtons = document.querySelectorAll('button, a');
          for (const button of allButtons) {
            const text = button.textContent?.toLowerCase() || '';
            if (text.includes('edit') && text.includes('api')) {
              button.click();
              return 'Clicked Edit API';
            }
          }
          return 'Edit API not found';
        })()
      `;
      
      const jsResult2 = await client.executeJavaScript(jsCode2);
      console.log(`✅ JavaScript result: ${JSON.stringify(jsResult2)}`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const info3 = await client.getPageInfo();
      console.log(`📋 Current URL: ${info3.url}`);
      
      if (info3.url.includes('edit') || info3.url.includes('settings')) {
        console.log('✅ Blocker 2 SOLVED: Used JavaScript to find and click Edit API');
        return true;
      }
    } catch (error) {
      console.log('⚠️  JavaScript direct click failed:', error.message);
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: All JavaScript approaches failed');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_javascript().catch(console.error);
