/**
 * Fullscreen Image Viewer - Basic Mode
 * Views gallery images in fullscreen at max resolution
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function viewFullscreenImages(galleryUrl) {
  const sessionFile = '.browser-sessions/persistent-session.json';
  let storageState = undefined;
  
  if (fs.existsSync(sessionFile)) {
    try {
      storageState = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    } catch (e) {
      console.log('Could not load session');
    }
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
    
    // Scroll to ensure images are loaded
    console.log('Scrolling to load images...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(2000);
    
    // Find all image links
    console.log('Finding image links...');
    const imageLinks = await page.$$eval('.gall-item a', links => 
      links.map(link => link.href)
    );
    
    console.log('Found ' + imageLinks.length + ' images');
    
    // View each image
    for (let i = 0; i < Math.min(imageLinks.length, 15); i++) {
      console.log('\n=== Image ' + (i + 1) + '/' + Math.min(imageLinks.length, 15) + ' ===');
      
      // Navigate to image
      await page.goto(imageLinks[i]);
      await page.waitForTimeout(3000);
      
      // Try to click for max resolution
      console.log('Checking for max resolution...');
      const maxResButton = await page.$('button:has-text("HD"), button:has-text("Original"), button:has-text("Full")');
      if (maxResButton) {
        console.log('Clicking max resolution button');
        await maxResButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Take screenshot
      await page.screenshot({ path: 'image-' + (i + 1) + '.png', fullPage: true });
      console.log('Screenshot saved');
      
      // View for 15 seconds
      console.log('Viewing (15 seconds)...');
      await page.waitForTimeout(15000);
      
      // Go back to gallery
      await page.goBack();
      await page.waitForTimeout(2000);
    }
    
    console.log('\nCompleted viewing all images');
    
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
viewFullscreenImages(galleryUrl).catch(console.error);