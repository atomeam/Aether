/**
 * RapidAPI UI Explorer - Find Domain Settings
 * 
 * This script systematically explores the RapidAPI UI to find
 * where the domain settings are located.
 */

const http = require('http');
const fs = require('fs');

async function exploreRapidAPI() {
  const port = 3456;
  const explorationDir = './rapidapi-exploration';
  fs.mkdirSync(explorationDir, { recursive: true });
  
  let step = 0;
  
  const screenshot = async (name) => {
    step++;
    const screenshot = JSON.parse(await httpGet(`http://localhost:${port}/screenshot`));
    const path = `${explorationDir}/${step}-${name}.png`;
    fs.writeFileSync(path, Buffer.from(screenshot.screenshot, 'base64'));
    console.log(`📸 Screenshot: ${path}`);
    return path;
  };
  
  const logButtons = async (context) => {
    const buttons = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
    console.log(`\n🔘 ${context} - Buttons found: ${buttons.buttons.length}`);
    buttons.buttons.forEach((btn, i) => {
      console.log(`   ${i + 1}. text="${btn.text}" ariaLabel="${btn.ariaLabel}"`);
    });
    return buttons.buttons;
  };
  
  const logInputs = async (context) => {
    const inputs = JSON.parse(await httpGet(`http://localhost:${port}/list-inputs`));
    console.log(`\n📝 ${context} - Inputs found: ${inputs.inputs.length}`);
    inputs.inputs.forEach((input, i) => {
      console.log(`   ${i + 1}. type="${input.type}" name="${input.name}" id="${input.id}" value="${input.value}"`);
    });
    return inputs.inputs;
  };
  
  const logInfo = async (context) => {
    const info = JSON.parse(await httpGet(`http://localhost:${port}/info`));
    console.log(`\n📄 ${context}`);
    console.log(`   URL: ${info.url}`);
    console.log(`   Title: ${info.title}`);
    return info;
  };
  
  const clickButton = async (text) => {
    console.log(`\n👆 Clicking: ${text}`);
    await httpGet(`http://localhost:${port}/click?selector=button:has-text("${text}")`);
    await sleep(3000);
  };
  
  // Start exploration
  console.log('🔍 Starting RapidAPI UI Exploration...\n');
  
  // 1. Main API page
  console.log('=== STEP 1: Main API Page ===');
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/atom-bomb-a-to-mind/api`);
  await sleep(5000);
  await logInfo('Main API Page');
  await screenshot('01-main-api-page');
  const mainButtons = await logButtons('Main API Page');
  const mainInputs = await logInputs('Main API Page');
  
  // 2. Console
  console.log('\n=== STEP 2: Console ===');
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/console`);
  await sleep(5000);
  await logInfo('Console');
  await screenshot('02-console');
  const consoleButtons = await logButtons('Console');
  
  // 3. Click Applications
  const appsButton = consoleButtons.find(btn => btn.text === 'Applications');
  if (appsButton) {
    await clickButton('Applications');
    await logInfo('Applications Page');
    await screenshot('03-applications');
    const appsButtons = await logButtons('Applications');
    const appsInputs = await logInputs('Applications');
  }
  
  // 4. Back to Console
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/console`);
  await sleep(3000);
  
  // 5. Click Analytics
  const analyticsButton = consoleButtons.find(btn => btn.text === 'Analytics');
  if (analyticsButton) {
    await clickButton('Analytics');
    await logInfo('Analytics Page');
    await screenshot('04-analytics');
    await logButtons('Analytics');
  }
  
  // 6. Back to Console
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/console`);
  await sleep(3000);
  
  // 7. Click Security
  const securityButton = consoleButtons.find(btn => btn.text === 'Security');
  if (securityButton) {
    await clickButton('Security');
    await logInfo('Security Page');
    await screenshot('05-security');
    const securityButtons = await logButtons('Security');
    const securityInputs = await logInputs('Security');
  }
  
  // 8. Back to Console
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/console`);
  await sleep(3000);
  
  // 9. Click Account Settings
  const accountSettingsButton = consoleButtons.find(btn => btn.text === 'Account Settings');
  if (accountSettingsButton) {
    await clickButton('Account Settings');
    await logInfo('Account Settings Page');
    await screenshot('06-account-settings');
    const accountButtons = await logButtons('Account Settings');
    const accountInputs = await logInputs('Account Settings');
  }
  
  // 10. Back to Console
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/console`);
  await sleep(3000);
  
  // 11. Try Studio
  console.log('\n=== STEP 3: Studio ===');
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/studio`);
  await sleep(5000);
  await logInfo('Studio');
  await screenshot('07-studio');
  const studioButtons = await logButtons('Studio');
  
  // 12. Look for "My APIs" or similar
  const myAPIsButton = studioButtons.find(btn => 
    btn.text.toLowerCase().includes('my api') ||
    btn.text.toLowerCase().includes('manage api')
  );
  if (myAPIsButton) {
    await clickButton(myAPIsButton.text);
    await logInfo('My APIs Page');
    await screenshot('08-my-apis');
    await logButtons('My APIs');
    await logInputs('My APIs');
  }
  
  // 13. Try navigating to hub.rapidapi.com (old interface)
  console.log('\n=== STEP 4: Hub Interface ===');
  await httpGet(`http://localhost:${port}/navigate?url=https://hub.rapidapi.com`);
  await sleep(5000);
  await logInfo('Hub');
  await screenshot('09-hub');
  const hubButtons = await logButtons('Hub');
  
  // 14. Look for API settings in hub
  const hubSettingsButton = hubButtons.find(btn => 
    btn.text.toLowerCase().includes('settings') ||
    btn.text.toLowerCase().includes('edit')
  );
  if (hubSettingsButton) {
    await clickButton(hubSettingsButton.text);
    await logInfo('Hub Settings');
    await screenshot('10-hub-settings');
    await logButtons('Hub Settings');
    await logInputs('Hub Settings');
  }
  
  // 15. Try direct API management URL
  console.log('\n=== STEP 5: API Management URLs ===');
  const possibleURLs = [
    'https://rapidapi.com/atom-bomb-a-to-mind/api/settings',
    'https://rapidapi.com/atom-bomb-a-to-mind/api/manage',
    'https://rapidapi.com/atom-bomb-a-to-mind/api/edit',
    'https://rapidapi.com/hub/atom-bomb-a-to-mind/api/settings',
    'https://rapidapi.com/hub/atom-bomb-a-to-mind/api/edit',
  ];
  
  for (const url of possibleURLs) {
    console.log(`\n🔍 Trying: ${url}`);
    await httpGet(`http://localhost:${port}/navigate?url=${url}`);
    await sleep(3000);
    const info = await logInfo(url);
    
    if (!info.url.includes('server-error')) {
      await screenshot(`url-${url.split('/').pop()}`);
      const buttons = await logButtons(url);
      const inputs = await logInputs(url);
      
      // Check for domain input
      const domainInput = inputs.find(input => 
        (input.name && input.name.toLowerCase().includes('domain')) ||
        (input.id && input.id.toLowerCase().includes('domain')) ||
        (input.value && input.value.includes('.www.a-to-mind.com'))
      );
      
      if (domainInput) {
        console.log('\n🎉 FOUND DOMAIN INPUT!');
        console.log(`   URL: ${url}`);
        console.log(`   Input: ${JSON.stringify(domainInput)}`);
        fs.writeFileSync(`${explorationDir}/DOMAIN-FOUND.txt`, JSON.stringify({
          url,
          input: domainInput,
          buttons: buttons,
          inputs: inputs
        }, null, 2));
        return;
      }
    }
  }
  
  console.log('\n⚠️  Domain input not found in any explored page');
  console.log('📸 All screenshots saved to:', explorationDir);
  console.log('📝 Please review the screenshots to find the correct path');
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

exploreRapidAPI().catch(console.error);