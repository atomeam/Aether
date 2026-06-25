/**
 * Blocker 2: Click Edit API - Deep Overlay Inspection
 * Deep inspection of overlay container to find hidden elements
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_deep() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Deep inspection of overlay container');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click settings icon
    console.log('📝 Clicking settings icon...');
    await client.clickElement('button:has(svg)');
    console.log('✅ Clicked settings icon');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Deep inspection of overlay
    console.log('📝 Deep inspection of overlay container...');
    const inspectCode = `
      (function() {
        const overlay = document.querySelector('[role="menu"]');
        if (!overlay) return { found: false };
        
        // Get all children
        const allChildren = overlay.querySelectorAll('*');
        const elements = [];
        
        for (const el of allChildren) {
          const text = el.textContent?.trim() || '';
          const tag = el.tagName;
          const visible = el.offsetParent !== null;
          const display = window.getComputedStyle(el).display;
          const opacity = window.getComputedStyle(el).opacity;
          
          elements.push({
            tag,
            text: text.substring(0, 50),
            visible,
            display,
            opacity,
            class: el.className?.substring(0, 50)
          });
        }
        
        return { 
          found: true, 
          innerHTML: overlay.innerHTML.substring(0, 1000),
          elementCount: elements.length,
          elements: elements.slice(0, 20)
        };
      })()
    `;
    
    const inspectResult = await client.executeJavaScript(inspectCode);
    console.log(`✅ Inspect result: ${JSON.stringify(inspectResult.result, null, 2)}`);
    
    // Try to find Edit API by text content even if hidden
    console.log('📝 Looking for Edit API by text content...');
    const findCode = `
      (function() {
        const overlay = document.querySelector('[role="menu"]');
        if (!overlay) return { found: false };
        
        const allElements = overlay.querySelectorAll('*');
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
            return { 
              found: true, 
              tag: el.tagName,
              text: text.substring(0, 100),
              class: el.className?.substring(0, 100)
            };
          }
        }
        return { found: false };
      })()
    `;
    
    const findResult = await client.executeJavaScript(findCode);
    console.log(`✅ Find result: ${JSON.stringify(findResult.result)}`);
    
    if (findResult.result.found) {
      console.log(`📝 Found Edit API element: ${findResult.result.tag}`);
      
      // Try to click it even if hidden
      const clickCode = `
        (function() {
          const overlay = document.querySelector('[role="menu"]');
          if (!overlay) return 'Overlay not found';
          
          const allElements = overlay.querySelectorAll('*');
          for (const el of allElements) {
            const text = el.textContent?.trim() || '';
            if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
              // Try to click parent button
              const parentButton = el.closest('button, a, div[role="menuitem"]');
              if (parentButton) {
                parentButton.click();
                return 'Clicked parent button';
              }
              // Try to click the element itself
              el.click();
              return 'Clicked element';
            }
          }
          return 'Edit API not found';
        })()
      `;
      
      const clickResult = await client.executeJavaScript(clickCode);
      console.log(`✅ Click result: ${clickResult.result}`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const info = await client.getPageInfo();
      console.log(`📋 Current URL: ${info.url}`);
      
      if (info.url.includes('edit') || info.url.includes('settings')) {
        console.log('✅ Blocker 2 SOLVED: Deep inspection approach');
        return true;
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Deep inspection approach failed');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_deep().catch(console.error);
