/**
 * RapidAPI Domain Fix with Persistent Browser
 * 
 * This script uses the persistent browser service to fix the domain.
 */

const http = require('http');

async function fixRapidAPIDomain() {
  const port = 3456;
  
  // Navigate to RapidAPI
  console.log('🌐 Navigating to RapidAPI...');
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/atom-bomb-a-to-mind/api`);
  await sleep(3000);
  
  // Get page info
  const info = JSON.parse(await httpGet(`http://localhost:${port}/info`));
  console.log('📄 Page URL:', info.url);
  
  // List buttons
  const buttons = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
  console.log('\n🔘 Buttons found:', buttons.buttons.length);
  buttons.buttons.forEach((btn, i) => {
    console.log(`   ${i + 1}. text="${btn.text}" ariaLabel="${btn.ariaLabel}"`);
  });
  
  // Check if logged in
  const signInButton = buttons.buttons.find(btn => btn.text === 'Sign In');
  if (signInButton) {
    console.log('❌ Not logged in - need to complete OAuth first');
    return;
  }
  
  console.log('✅ Already logged in!');
  
  // Look for Edit API button on main page first
  const editAPIOnPage = buttons.buttons.find(btn => btn.text === 'Edit API');
  if (editAPIOnPage) {
    console.log('\n📝 Found Edit API button on main page, clicking it...');
    await httpGet(`http://localhost:${port}/click?selector=button:has-text("Edit API")`);
    await sleep(3000);
    
    // List inputs
    const inputs = JSON.parse(await httpGet(`http://localhost:${port}/list-inputs`));
    console.log('\n📝 Inputs found:', inputs.inputs.length);
    inputs.inputs.forEach((input, i) => {
      console.log(`   ${i + 1}. type="${input.type}" name="${input.name}" id="${input.id}" value="${input.value}"`);
    });
    
    // Find domain input
    const domainInput = inputs.inputs.find(input => 
      (input.name && input.name.toLowerCase().includes('domain')) ||
      (input.id && input.id.toLowerCase().includes('domain')) ||
      (input.value && input.value.includes('.www.a-to-mind.com'))
    );
    
    if (domainInput) {
      console.log('\n🎉 Found domain input:', domainInput);
      
      // Change domain
      const selector = domainInput.id ? `#${domainInput.id}` : 
                       domainInput.name ? `input[name="${domainInput.name}"]` : 'input';
      
      console.log(`\n✏️  Changing domain to a-to-mind.com...`);
      await httpGet(`http://localhost:${port}/fill?selector=${selector}&value=a-to-mind.com`);
      await sleep(2000);
      
      // Look for save button
      const buttons2 = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
      const saveButton = buttons2.buttons.find(btn => btn.text === 'Save' || btn.type === 'submit');
      
      if (saveButton) {
        console.log('\n💾 Clicking Save button...');
        await httpGet(`http://localhost:${port}/click?selector=button:has-text("Save")`);
        await sleep(2000);
        console.log('✅ Save clicked');
      }
      
      console.log('\n🎉 Domain fix complete!');
      return;
    }
  }
  
  // Click User Profile
  console.log('\n👤 Clicking User Profile button...');
  await httpGet(`http://localhost:${port}/click?selector=button[aria-label="User Profile"]`);
  await sleep(3000);
  
  // List menu buttons
  const menuButtons = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
  console.log('\n🔘 Menu buttons found:', menuButtons.buttons.length);
  menuButtons.buttons.forEach((btn, i) => {
    console.log(`   ${i + 1}. text="${btn.text}" ariaLabel="${btn.ariaLabel}"`);
  });
  
  // Look for Edit API or Settings
  const editAPIButton = menuButtons.buttons.find(btn => btn.text === 'Edit API');
  const settingsButton = menuButtons.buttons.find(btn => btn.text.toLowerCase().includes('settings'));
  
  if (editAPIButton) {
    console.log('\n📝 Clicking Edit API button...');
    await httpGet(`http://localhost:${port}/click?selector=button:has-text("Edit API")`);
    await sleep(3000);
  } else if (settingsButton) {
    console.log('\n📝 Clicking Settings button...');
    await httpGet(`http://localhost:${port}/click?selector=button:has-text("${settingsButton.text}")`);
    await sleep(3000);
  } else {
    console.log('\n⚠️  No Edit API or Settings button found');
    console.log('🔍 Looking for API-related buttons...');
    menuButtons.buttons.forEach((btn, i) => {
      if (btn.text.toLowerCase().includes('api')) {
        console.log(`   Found: ${btn.text}`);
      }
    });
    return;
  }
  
  // List inputs
  const inputs = JSON.parse(await httpGet(`http://localhost:${port}/list-inputs`));
  console.log('\n📝 Inputs found:', inputs.inputs.length);
  inputs.inputs.forEach((input, i) => {
    console.log(`   ${i + 1}. type="${input.type}" name="${input.name}" id="${input.id}" value="${input.value}"`);
  });
  
  // Find domain input
  const domainInput = inputs.inputs.find(input => 
    (input.name && input.name.toLowerCase().includes('domain')) ||
    (input.id && input.id.toLowerCase().includes('domain')) ||
    (input.value && input.value.includes('.www.a-to-mind.com'))
  );
  
  if (domainInput) {
    console.log('\n🎉 Found domain input:', domainInput);
    
    // Change domain
    const selector = domainInput.id ? `#${domainInput.id}` : 
                     domainInput.name ? `input[name="${domainInput.name}"]` : 'input';
    
    console.log(`\n✏️  Changing domain to a-to-mind.com...`);
    await httpGet(`http://localhost:${port}/fill?selector=${selector}&value=a-to-mind.com`);
    await sleep(2000);
    
    // Look for save button
    const buttons2 = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
    const saveButton = buttons2.buttons.find(btn => btn.text === 'Save' || btn.type === 'submit');
    
    if (saveButton) {
      console.log('\n💾 Clicking Save button...');
      await httpGet(`http://localhost:${port}/click?selector=button:has-text("Save")`);
      await sleep(2000);
      console.log('✅ Save clicked');
    }
    
    console.log('\n🎉 Domain fix complete!');
  } else {
    console.log('\n❌ Domain input not found');
  }
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