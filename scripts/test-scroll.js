/**
 * Test Scroll Function
 */

const http = require('http');

async function testScroll() {
  console.log('📜 Testing scroll function...');
  
  // Navigate to main site
  await httpGet('http://localhost:3456/navigate?url=https://www.pornpics.com');
  await sleep(3000);
  
  // Scroll down
  console.log('⬇️  Scrolling down 500px...');
  const response = await httpGet('http://localhost:3456/scroll?direction=down&amount=500');
  const result = JSON.parse(response);
  console.log('Result:', result);
  
  await sleep(2000);
  
  // Take screenshot
  const screenshot = JSON.parse(await httpGet('http://localhost:3456/screenshot'));
  const fs = require('fs');
  const buffer = Buffer.from(screenshot.screenshot.data, 'base64');
  fs.writeFileSync('scrolled-test.png', buffer);
  console.log('📸 Screenshot saved');
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

testScroll().catch(console.error);