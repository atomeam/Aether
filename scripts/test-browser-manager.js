/**
 * Test Singleton Browser Manager
 * Verifies that the same browser instance is reused across multiple tasks
 */

const BrowserManager = require('./browser-manager');

async function test1() {
  console.log('\n=== TEST 1: First Task ===');
  const browserManager = BrowserManager.getInstance();
  
  await browserManager.navigateTo('https://example.com');
  const page = await browserManager.getPage();
  
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Don't close browser - keep it for next task
}

async function test2() {
  console.log('\n=== TEST 2: Second Task (Should Reuse Browser) ===');
  const browserManager = BrowserManager.getInstance();
  
  await browserManager.navigateTo('https://example.org');
  const page = await browserManager.getPage();
  
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Don't close browser - keep it for next task
}

async function test3() {
  console.log('\n=== TEST 3: Third Task (Should Reuse Browser Again) ===');
  const browserManager = BrowserManager.getInstance();
  
  await browserManager.navigateTo('https://example.net');
  const page = await browserManager.getPage();
  
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  // Don't close browser - keep it for next task
}

async function runTests() {
  try {
    console.log('🧪 Testing Singleton Browser Manager');
    console.log('=====================================');
    
    await test1();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await test2();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await test3();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n✅ All tests completed');
    console.log('📝 Check the console output above');
    console.log('   - "Launching new browser instance" should appear only once');
    console.log('   - "Reusing existing browser instance" should appear for test 2 and 3');
    console.log('   - "Creating new browser context" should appear only once');
    console.log('   - "Reusing existing browser context" should appear for test 2 and 3');
    console.log('   - "Creating new page" should appear only once');
    console.log('   - "Reusing existing page" should appear for test 2 and 3');
    
    console.log('\n⏸️  Browser is still open. Press Enter to close it...');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    // Close browser when completely done
    const browserManager = BrowserManager.getInstance();
    await browserManager.close();
    
    console.log('✅ Browser closed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Cleanup on error
    const browserManager = BrowserManager.getInstance();
    await browserManager.close();
  }
}

runTests().catch(console.error);
