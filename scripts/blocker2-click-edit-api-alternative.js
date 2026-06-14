/**
 * Blocker 2: Click Edit API - Try Alternative URLs
 * Research and fix: Try different URL patterns for edit page
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function blocker2_clickEditAPI_alternative() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔍 Blocker 2: Trying alternative URLs for edit page');
    
    // Try different URL patterns
    const urls = [
      'https://rapidapi.com/atom-bomb-a-to-mind/api/edit',
      'https://rapidapi.com/atom-bomb-a-to-mind/api/settings',
      'https://rapidapi.com/atom-bomb-a-to-mind/api/configure',
      'https://rapidapi.com/atom-bomb-a-to-mind/api/manage',
      'https://rapidapi.com/atom-bomb-a-to-mind/api/admin',
    ];
    
    for (const url of urls) {
      console.log(`🔍 Trying URL: ${url}`);
      await client.navigateTo(url);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const info = await client.getPageInfo();
      console.log(`📋 Current URL: ${info.url}`);
      console.log(`📋 Page title: ${info.title}`);
      
      // List inputs to see if we're on edit page
      const inputsResult = await client.listInputs();
      console.log(`📋 Found ${inputsResult.inputs.length} inputs`);
      
      for (const input of inputsResult.inputs) {
        if (input.visible) {
          console.log(`  - type=${input.type}, name=${input.name}, value=${input.value}`);
        }
      }
      
      // Check if we found domain field
      const hasDomainField = inputsResult.inputs.some(input => 
        input.visible && (input.value?.includes('.www.a-to-mind.com') || input.name?.toLowerCase().includes('domain'))
      );
      
      if (hasDomainField) {
        console.log('✅ Blocker 2 SOLVED: Found edit page with domain field');
        return true;
      }
    }
    
    console.log('❌ Blocker 2 NOT SOLVED: Could not find edit page');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

blocker2_clickEditAPI_alternative().catch(console.error);
