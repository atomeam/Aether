/**
 * Fullscreen Image Viewer - Improved Mode
 * Uses learned data for optimal performance
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function viewFullscreenImagesImproved(galleryUrl) {
  const sessionFile = '.browser-sessions/persistent-session.json';
  let storageState = undefined;
  
  if (fs.existsSync(sessionFile)) {
    try {
      storageState = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    } catch (e) {
      console.log('Could not load session');
    }
  }
  
  // Load learning data
  const learningFile = 'fullscreen-learning-data.json';
  let learnedData = {
    selector: 'a img',
    scrollMethod: 'scrollBy 500',
    navMethod: 'ArrowRight'
  };
  
  if (fs.existsSync(learningFile)) {
    const allData = JSON.parse(fs.readFileSync(learningFile, 'utf-8'));
    const latestData = allData[allData.length - 1];
    
    if (latestData.successfulMethods.includes('scrollBy 500')) {
      learnedData.scrollMethod = 'scrollBy 500';
    }
    
    // Find working selector
    for (const [selector, data] of Object.entries(latestData.selectors)) {
      if (data.works && data.found > 0) {
        learnedData.selector = selector;
        break;
      }
    }
    
    if (latestData.successfulMethods.includes('nav-ArrowRight')) {
      learnedData.navMethod = 'ArrowRight';
    }
    
    console.log('📚 Using learned data:');
    console.log('   Selector: ' + learnedData.selector);
    console.log('   Scroll: ' + learnedData.scrollMethod);
    console.log('   Navigation: ' + learnedData.navMethod);
  }
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    storageState: storageState
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to gallery: ' + galleryUrl);
    await page.goto(galleryUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Use learned scroll method
    console.log('Scrolling (learned method)...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(2000);
    
    // Use learned selector
    console.log('Finding images (learned selector)...');
    const imageElements = await page.$$(learnedData.selector);
    console.log('Found ' + imageElements.length + ' images');
    
    // View each image
    for (let i = 0; i < Math.min(imageElements.length, 15); i++) {
      console.log('\n=== Image ' + (i + 1) + '/' + Math.min(imageElements.length, 15) + ' ===');
      
      // Scroll to image
      await imageElements[i].scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Click image
      await imageElements[i].click();
      await page.waitForTimeout(3000);
      
      // Take screenshot
      await page.screenshot({ path: 'image-' + (i + 1) + '.png', fullPage: true });
      console.log('Screenshot saved');
      
      // View for 15 seconds
      console.log('Viewing (15 seconds)...');
      await page.waitForTimeout(15000);
      
      // Use learned navigation method
      if (i < Math.min(imageElements.length, 15) - 1) {
        console.log('Navigating to next image (learned method)...');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(3000);
      }
    }
    
    console.log('\n✅ Completed viewing all images');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    const newStorageState = await context.storageState();
    fs.writeFileSync('.browser-sessions/persistent-session.json', JSON.stringify(newStorageState, null, 2));
    console.log('Session saved');
    await browser.close();
  }
}

const galleryUrl = process.argv[2] || 'https://www.pornpics.com/galleries/sweet-teen-eve-sweet-removes-a-short-dress-for-great-nude-poses-in-heels-57334227/';
viewFullscreenImagesImproved(galleryUrl).catch(console.error);