/**
 * Blocker 2: Click Edit API - Try All SVG Icons
 * Try clicking each SVG icon to find the correct settings menu
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_allIcons() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Trying all SVG icons to find settings menu');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find all SVG icons with their context
    console.log('📝 Finding all SVG icons with context...');
    const findCode = `
      (function() {
        const icons = [];
        const allElements = document.querySelectorAll('*');
        
        for (const el of allElements) {
          if (el.querySelector('svg') || el.tagName === 'svg') {
            const parent = el.closest('button, a, div[role="button"]');
            if (parent) {
              const text = parent.textContent?.trim() || '';
              const ariaLabel = parent.getAttribute('aria-label') || '';
              const title = parent.getAttribute('title') || '';
              const visible = parent.offsetParent !== null;
              
              if (visible) {
                icons.push({
                  tag: parent.tagName,
                  text: text.substring(0, 50),
                  ariaLabel,
                  title,
                  class: parent.className?.substring(0, 50)
                });
              }
            }
          }
        }
        return icons;
      })()
    `;
    
    const findResult = await client.executeJavaScript(findCode);
    console.log(`📋 Found ${findResult.result.length} SVG icons`);
    
    for (const icon of findResult.result) {
      console.log(`  - tag=${icon.tag}, aria-label="${icon.ariaLabel}", title="${icon.title}"`);
    }
    
    // Try clicking each icon
    for (let i = 0; i < findResult.result.length; i++) {
      const icon = findResult.result[i];
      
      // Skip icons without aria-label or title
      if (!icon.ariaLabel && !icon.title) {
        continue;
      }
      
      console.log(`📝 Clicking icon ${i}: aria-label="${icon.ariaLabel}"`);
      
      // Navigate back to API page
      await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click the icon by aria-label
      const clickCode = `
        (function() {
          const allElements = document.querySelectorAll('${icon.tag.toLowerCase()}');
          for (const el of allElements) {
            const ariaLabel = el.getAttribute('aria-label') || '';
            const title = el.getAttribute('title') || '';
            if (ariaLabel === '${icon.ariaLabel}' || title === '${icon.title}') {
              el.click();
              return 'Clicked';
            }
          }
          return 'Not found';
        })()
      `;
      
      await client.executeJavaScript(clickCode);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for overlay with Edit API
      const checkCode = `
        (function() {
          const overlay = document.querySelector('[role="menu"]');
          if (!overlay) return { found: false };
          
          const allElements = overlay.querySelectorAll('*');
          for (const el of allElements) {
            const text = el.textContent?.trim() || '';
            if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
              return { found: true, text: text.substring(0, 100) };
            }
          }
          return { found: false };
        })()
      `;
      
      const checkResult = await client.executeJavaScript(checkCode);
      
      if (checkResult.result.found) {
        console.log(`✅ Found Edit API in menu from icon ${i}`);
        
        // Click Edit API
        const clickEditCode = `
          (function() {
            const overlay = document.querySelector('[role="menu"]');
            if (!overlay) return 'Overlay not found';
            
            const allElements = overlay.querySelectorAll('*');
            for (const el of allElements) {
              const text = el.textContent?.trim() || '';
              if (text.toLowerCase().includes('edit') && text.toLowerCase().includes('api')) {
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
        
        await client.executeJavaScript(clickEditCode);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const info = await client.getPageInfo();
        console.log(`📋 Current URL: ${info.url}`);
        
        if (info.url.includes('edit') || info.url.includes('settings')) {
          console.log('✅ Blocker 2 SOLVED: Found correct settings icon');
          return true;
        }
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: No icon opened menu with Edit API');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_allIcons().catch(console.error);
