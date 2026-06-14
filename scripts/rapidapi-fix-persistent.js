/**
 * RapidAPI Domain Fix with Persistent Browser
 * 
 * This script uses the persistent browser service to fix the domain.
 */

const http = require('http');

async function fixRapidAPIDomain() {
  const port = 3456;
  
  // Navigate to provider console (API provider settings)
  console.log('🌐 Navigating to RapidAPI Provider Console...');
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/provider-console`);
  await sleep(5000);
  
  // Get page info
  const info = JSON.parse(await httpGet(`http://localhost:${port}/info`));
  console.log('📄 Page URL:', info.url);
  console.log('📄 Page title:', info.title);
  
  // List all buttons
  const buttons = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
  console.log('\n🔘 Buttons found:', buttons.buttons.length);
  buttons.buttons.forEach((btn, i) => {
    console.log(`   ${i + 1}. text="${btn.text}" ariaLabel="${btn.ariaLabel}"`);
  });
  
  // Take screenshot
  console.log('\n📸 Taking screenshot...');
  const screenshot = JSON.parse(await httpGet(`http://localhost:${port}/screenshot`));
  const screenshotPath = './rapidapi-provider-console.png';
  const fs = require('fs');
  fs.writeFileSync(screenshotPath, Buffer.from(screenshot.screenshot, 'base64'));
  console.log(`✅ Screenshot saved: ${screenshotPath}`);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

fixRapidAPIDomain().catch(console.error);