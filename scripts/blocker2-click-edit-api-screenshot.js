/**
 * Blocker 2: Click Edit API - Screenshot After Click
 * Take screenshot after clicking settings to see what actually happens
 */

const PersistentBrowserClient = require('./persistent-browser-client');
const fs = require('fs');

async function blocker2_clickEditAPI_screenshot() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Taking screenshots to understand UI behavior');
    
    // Navigate to API page
    console.log('📝 Navigating to API page...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to API page');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot before click
    console.log('📸 Taking screenshot before click...');
    const result1 = await client.takeScreenshot();
    if (result1.success) {
      const buffer1 = Buffer.from(result1.screenshot, 'base64');
      fs.writeFileSync('screenshot-before-click.png', buffer1);
      console.log('✅ Screenshot saved to screenshot-before-click.png');
    }
    
    // Click settings icon
    console.log('📝 Clicking settings icon...');
    await client.clickElement('button:has(svg)');
    console.log('✅ Clicked settings icon');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot after click
    console.log('📸 Taking screenshot after click...');
    const result2 = await client.takeScreenshot();
    if (result2.success) {
      const buffer2 = Buffer.from(result2.screenshot, 'base64');
      fs.writeFileSync('screenshot-after-click.png', buffer2);
      console.log('✅ Screenshot saved to screenshot-after-click.png');
    }
    
    // List all elements (not just buttons)
    console.log('📝 Executing JavaScript to list all clickable elements...');
    const jsCode = `
      (function() {
        const elements = [];
        const allElements = document.querySelectorAll('button, a, div[role="button"], span[role="button"]');
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
        return elements;
      })()
    `;
    
    const jsResult = await client.executeJavaScript(jsCode);
    console.log(`📋 Found ${jsResult.result.length} clickable elements`);
    
    for (const el of jsResult.result) {
      console.log(`  - tag=${el.tag}, text="${el.text}", role=${el.role}`);
    }
    
    // Look for Edit API in the list
    const editElement = jsResult.result.find(el => el.text.toLowerCase().includes('edit') && el.text.toLowerCase().includes('api'));
    if (editElement) {
      console.log(`📝 Found Edit API element: ${JSON.stringify(editElement)}`);
    }
    
    console.log('📝 Check screenshots to see what happened after clicking settings');
    console.log('📝 screenshot-before-click.png - before click');
    console.log('📝 screenshot-after-click.png - after click');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

blocker2_clickEditAPI_screenshot().catch(console.error);
