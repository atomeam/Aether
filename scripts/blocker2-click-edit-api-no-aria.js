/**
 * Blocker 2: Click Edit API - Find Settings Icon Without Aria-Label
 * Look for settings icon that doesn't have aria-label (three dots, avatar, etc.)
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_noAria() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Finding settings icon without aria-label');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find all buttons with SVG that don't have aria-label
    console.log('📝 Finding buttons with SVG without aria-label...');
    const findCode = `
      (function() {
        const icons = [];
        const allElements = document.querySelectorAll('*');
        
        for (const el of allElements) {
          if (el.querySelector('svg') || el.tagName === 'svg') {
            const parent = el.closest('button, a, div[role="button"]');
            if (parent) {
              const ariaLabel = parent.getAttribute('aria-label') || '';
              const title = parent.getAttribute('title') || '';
              const visible = parent.offsetParent !== null;
              
              // Include icons without aria-label
              if (visible && !ariaLabel && !title) {
                const text = parent.textContent?.trim() || '';
                const className = parent.className?.substring(0, 100) || '';
                icons.push({
                  tag: parent.tagName,
                  text: text.substring(0, 50),
                  className,
                  ariaLabel,
                  title
                });
              }
            }
          }
        }
        return icons;
      })()
    `;
    
    const findResult = await client.executeJavaScript(findCode);
    console.log(`📋 Found ${findResult.result.length} SVG icons without aria-label`);
    
    for (const icon of findResult.result) {
      console.log(`  - tag=${icon.tag}, className="${icon.className}"`);
    }
    
    // Try each icon
    for (let i = 0; i < findResult.result.length; i++) {
      const icon = findResult.result[i];
      console.log(`📝 Trying icon ${i}: className="${icon.className}"`);
      
      // Navigate back to API page
      await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click the icon by class
      const clickCode = `
        (function() {
          const allElements = document.querySelectorAll('${icon.tag.toLowerCase()}');
          for (const el of allElements) {
            const className = el.className || '';
            if (className.includes('${icon.className.substring(0, 20)}')) {
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

blocker2_clickEditAPI_noAria().catch(console.error);
