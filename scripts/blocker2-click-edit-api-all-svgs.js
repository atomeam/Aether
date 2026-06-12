/**
 * Blocker 2: Click Edit API - Find All SVG Icons
 * Find all SVG icons and try clicking them
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_allSVGs() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Finding and clicking all SVG icons');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Execute JavaScript to find all elements with SVG
    console.log('📝 Finding all elements with SVG...');
    const jsCode = `
      (function() {
        const elements = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.querySelector('svg') || el.tagName === 'svg') {
            const parent = el.closest('button, a, div[role="button"]');
            if (parent) {
              const text = parent.textContent?.trim() || '';
              const visible = parent.offsetParent !== null;
              if (visible) {
                elements.push({
                  tag: parent.tagName,
                  text: text.substring(0, 50),
                  class: parent.className?.substring(0, 50),
                  ariaLabel: parent.getAttribute('aria-label')
                });
              }
            }
          }
        }
        return elements;
      })()
    `;
    
    const jsResult = await client.executeJavaScript(jsCode);
    console.log(`📋 Found ${jsResult.result.length} elements with SVG`);
    
    for (const el of jsResult.result) {
      console.log(`  - tag=${el.tag}, text="${el.text}", aria-label=${el.ariaLabel}`);
    }
    
    // Try clicking each one
    for (let i = 0; i < jsResult.result.length; i++) {
      const el = jsResult.result[i];
      console.log(`📝 Clicking element ${i}: ${el.tag} with aria-label="${el.ariaLabel}"`);
      
      try {
        // Navigate back to API page first
        await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Click the element via JavaScript
        const clickCode = `
          (function() {
            const elements = document.querySelectorAll('${el.tag.toLowerCase()}');
            for (const el of elements) {
              if (el.getAttribute('aria-label') === '${el.ariaLabel || ''}') {
                el.click();
                return 'Clicked';
              }
            }
            return 'Not found';
          })()
        `;
        
        await client.executeJavaScript(clickCode);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if dropdown appeared
        const buttonsResult = await client.listButtons();
        const editButton = buttonsResult.buttons.find(b => b.text.includes('Edit') || b.text.includes('edit'));
        
        if (editButton) {
          console.log(`✅ Found Edit button after clicking element ${i}`);
          await client.clickElement(`button:has-text("${editButton.text}")`);
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const info = await client.getPageInfo();
          console.log(`📋 Current URL: ${info.url}`);
          
          if (info.url.includes('edit') || info.url.includes('settings')) {
            console.log('✅ Blocker 2 SOLVED: Found correct SVG icon');
            return true;
          }
        }
      } catch (error) {
        console.log(`⚠️  Error clicking element ${i}:`, error.message);
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: No SVG icon triggered dropdown');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_allSVGs().catch(console.error);
