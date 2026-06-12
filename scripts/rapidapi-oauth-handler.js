/**
 * RapidAPI OAuth Handler with Persistent Browser
 * 
 * This script uses the persistent browser service to handle OAuth
 * and save the session permanently.
 */

const http = require('http');

async function rapidAPIOAuth() {
  const port = 3456;
  
  // Navigate to RapidAPI
  console.log('🌐 Navigating to RapidAPI...');
  await httpGet(`http://localhost:${port}/navigate?url=https://rapidapi.com/atom-bomb-a-to-mind/api`);
  await sleep(3000);
  
  // Get page info
  const info = JSON.parse(await httpGet(`http://localhost:${port}/info`));
  console.log('📄 Page URL:', info.url);
  console.log('📄 Page title:', info.title);
  
  // List buttons
  const buttons = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
  console.log('\n🔘 Buttons found:', buttons.buttons.length);
  
  // Find Sign In button
  const signInButton = buttons.buttons.find(btn => btn.text === 'Sign In');
  if (signInButton) {
    console.log('👆 Clicking Sign In button...');
    await httpGet(`http://localhost:${port}/click?selector=button:has-text("Sign In")`);
    await sleep(3000);
  }
  
  // List buttons again
  const buttons2 = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
  console.log('\n🔘 Buttons after Sign In:', buttons2.buttons.length);
  buttons2.buttons.forEach((btn, i) => {
    console.log(`   ${i + 1}. text="${btn.text}" ariaLabel="${btn.ariaLabel}"`);
  });
  
  // Find Login with Google button
  const googleButton = buttons2.buttons.find(btn => btn.text === 'Login with Google');
  if (googleButton) {
    console.log('🔑 Clicking Login with Google...');
    await httpGet(`http://localhost:${port}/click?selector=button:has-text("Login with Google")`);
    await sleep(5000);
  }
  
  // Wait for OAuth page
  console.log('⏳ Waiting for OAuth page...');
  await sleep(5000);
  
  // Get page info
  const info2 = JSON.parse(await httpGet(`http://localhost:${port}/info`));
  console.log('📄 Current URL:', info2.url);
  
  // Check if we're on Google OAuth page
  if (info2.url.includes('accounts.google.com')) {
    console.log('✅ On Google OAuth page');
    
    // List buttons to find account
    const buttons3 = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
    console.log('\n🔘 OAuth page buttons:', buttons3.buttons.length);
    buttons3.buttons.forEach((btn, i) => {
      console.log(`   ${i + 1}. text="${btn.text}"`);
    });
    
    // Find account button
    const accountButton = buttons3.buttons.find(btn => btn.text.includes('atomicmoonbeam88@gmail.com'));
    if (accountButton) {
      console.log('📧 Clicking account button...');
      await httpGet(`http://localhost:${port}/click?selector=text=atomicmoonbeam88@gmail.com`);
      await sleep(5000);
    }
    
    // Check for approve button
    const buttons4 = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
    const approveButton = buttons4.buttons.find(btn => 
      btn.text === 'Continue' || btn.text === 'Allow' || btn.text === 'Approve'
    );
    if (approveButton) {
      console.log('✅ Clicking approve button...');
      await httpGet(`http://localhost:${port}/click?selector=button:has-text("${approveButton.text}")`);
      await sleep(5000);
    }
  }
  
  // Wait for redirect
  console.log('⏳ Waiting for redirect to RapidAPI...');
  await sleep(10000);
  
  // Get final page info
  const info3 = JSON.parse(await httpGet(`http://localhost:${port}/info`));
  console.log('📄 Final URL:', info3.url);
  console.log('📄 Final title:', info3.title);
  
  // List buttons to verify login
  const buttons5 = JSON.parse(await httpGet(`http://localhost:${port}/list-buttons`));
  const signInCheck = buttons5.buttons.find(btn => btn.text === 'Sign In');
  
  if (signInCheck) {
    console.log('❌ Login failed - still showing Sign In');
  } else {
    console.log('✅ Login successful!');
  }
  
  console.log('\n🎉 OAuth complete! Session saved automatically by persistent browser.');
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

rapidAPIOAuth().catch(console.error);