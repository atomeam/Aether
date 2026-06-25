/**
 * Blocker 2: Click Edit API - Overlay/Portal Container Solution
 * Solve React/Vue/Angular overlay container rendering
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_overlay() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Solving overlay/portal container rendering');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click settings icon
    console.log('📝 Clicking settings icon...');
    await client.clickElement('button:has(svg)');
    console.log('✅ Clicked settings icon');
    
    // Wait for overlay container to appear (React/Vue/Angular render dropdowns in overlay)
    console.log('📝 Waiting for overlay container to appear...');
    
    // Execute JavaScript to wait for overlay container
    // Use polling instead of async JavaScript
    console.log('📝 Polling for overlay container...');
    
    let found = false;
    let overlaySelector = null;
    
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 250));
      
      const checkCode = `
        (function() {
          const overlaySelectors = [
            '.cdk-overlay-container',
            '.cdk-overlay-pane',
            '[role="menu"]',
            '[role="listbox"]',
            '.dropdown-menu',
            '.popover',
            '.portal',
            '[data-radix-portal]',
            '[data-state="open"]',
          ];
          
          for (const selector of overlaySelectors) {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
              return { found: true, selector };
            }
          }
          return { found: false };
        })()
      `;
      
      const checkResult = await client.executeJavaScript(checkCode);
      
      if (checkResult.result.found) {
        found = true;
        overlaySelector = checkResult.result.selector;
        console.log(`✅ Found overlay container: ${overlaySelector}`);
        break;
      }
    }
    
    if (!found) {
      console.log('⚠️  No overlay container found after polling');
    }
    
    if (found) {
      console.log(`✅ Found overlay container: ${overlaySelector}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // List all elements in the overlay
      const listCode = `
        (function() {
          const selector = '${overlaySelector}';
          const overlay = document.querySelector(selector);
          if (!overlay) return { elements: [] };
          
          const elements = [];
          const allElements = overlay.querySelectorAll('button, a, div[role="menuitem"], div[role="option"]');
          for (const el of allElements) {
            const text = el.textContent?.trim() || '';
            const visible = el.offsetParent !== null;
            if (visible && text) {
              elements.push({
                tag: el.tagName,
                text: text.substring(0, 50),
                role: el.getAttribute('role'),
                class: el.className?.substring(0, 50)
              });
            }
          }
          return { elements, selector };
        })()
      `;
      
      const listResult = await client.executeJavaScript(listCode);
      console.log(`📋 Found ${listResult.result.elements.length} elements in overlay`);
      
      for (const el of listResult.result.elements) {
        console.log(`  - tag=${el.tag}, text="${el.text}", role=${el.role}`);
      }
      
      // Look for Edit API in the overlay
      const editElement = listResult.result.elements.find(el => 
        el.text.toLowerCase().includes('edit') && el.text.toLowerCase().includes('api')
      );
      
      if (editElement) {
        console.log(`📝 Found Edit API element: ${JSON.stringify(editElement)}`);
        
        // Click it via JavaScript
        const clickCode = `
          (function() {
            const overlay = document.querySelector('${listResult.result.selector}');
            if (!overlay) return 'Overlay not found';
            
            const allElements = overlay.querySelectorAll('button, a, div[role="menuitem"], div[role="option"]');
            for (const el of allElements) {
              const text = el.textContent?.trim() || '';
              if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
                el.click();
                return 'Clicked Edit API';
              }
            }
            return 'Edit API not found in overlay';
          })()
        `;
        
        const clickResult = await client.executeJavaScript(clickCode);
        console.log(`✅ Click result: ${clickResult.result}`);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const info = await client.getPageInfo();
        console.log(`📋 Current URL: ${info.url}`);
        
        if (info.url.includes('edit') || info.url.includes('settings')) {
          console.log('✅ Blocker 2 SOLVED: Used overlay container approach');
          return true;
        }
      }
    } else {
      console.log('⚠️  No overlay container found');
    }
    
    // Alternative: Try to find any element with "Edit" text that appeared after click
    console.log('📝 Alternative: Looking for any Edit element that appeared...');
    const alternativeCode = `
      (function() {
        const allElements = document.querySelectorAll('button, a, div[role="button"]');
        const editElements = [];
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if (text.toLowerCase().includes('edit') && el.offsetParent !== null) {
            editElements.push({
              tag: el.tagName,
              text: text.substring(0, 50),
              class: el.className?.substring(0, 50)
            });
          }
        }
        return editElements;
      })()
    `;
    
    const altResult = await client.executeJavaScript(alternativeCode);
    console.log(`📋 Found ${altResult.result.length} Edit elements`);
    
    for (const el of altResult.result) {
      console.log(`  - tag=${el.tag}, text="${el.text}"`);
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Overlay container approach failed');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_overlay().catch(console.error);
