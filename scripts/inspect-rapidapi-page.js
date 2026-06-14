/**
 * Inspect RapidAPI Page - Using Persistent Browser Service
 * Inspects the RapidAPI page to find Edit/Settings button and domain field
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function inspectRapidAPIPage() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Inspecting RapidAPI page...');
    
    // Navigate to RapidAPI
    console.log('📝 Navigating to RapidAPI...');
    await client.navigateTo('https://rapidapi.com/atom-bomb-a-to-mind/api');
    console.log('✅ Navigated to RapidAPI');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get page info
    const info = await client.getPageInfo();
    console.log('📋 Current page:', info.url);
    console.log('📋 Page title:', info.title);
    
    // List all inputs
    console.log('📝 Listing all inputs...');
    const inputsResult = await client.listInputs();
    console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
    
    for (const input of inputsResult.inputs) {
      if (input.visible) {
        console.log(`  - type=${input.type}, name=${input.name}, id=${input.id}, value=${input.value}, placeholder=${input.placeholder}`);
      }
    }
    
    // List all buttons
    console.log('📝 Listing all buttons...');
    const buttonsResult = await client.listButtons();
    console.log(`📋 Found ${buttonsResult.buttons.length} buttons`);
    
    for (const button of buttonsResult.buttons) {
      if (button.visible) {
        console.log(`  - text="${button.text}", id=${button.id}, className=${button.className}`);
      }
    }
    
    console.log('📝 Please check the browser window to see the current state');
    console.log('📝 Look for Edit/Settings button and domain field');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectRapidAPIPage().catch(console.error);
