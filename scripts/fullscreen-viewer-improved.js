/**
 * Fullscreen Image Viewer - Improved with Visibility Check
 * Only clicks visible images
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
    
    // Scroll more to load all images
    console.log('Scrolling to load all images...');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(500);
    }
    
    // Find only visible images
    console.log('Finding visible images...');
    const visibleImages = await page.$$eval('a img', imgs => 
      imgs
        .filter(img => {
          const rect = img.getBoundingClientRect();
          return rect.top > 0 && rect.top < window.innerHeight;
        })
        .map(img => img.src)
    );
    
    console.log('Found ' + visibleImages.length + ' visible images');
    
    if (visibleImages.length === 0) {
      console.log('No visible images found, trying all images...');
      const allImages = await page.$$eval('a img', imgs => imgs.map(img => img.src));
      visibleImages.push(...allImages.slice(0, 10));
    }
    
    // View each image
    for (let i = 0; i < Math.min(visibleImages.length, 10); i++) {
      console.log('\n=== Image ' + (i + 1) + '/' + Math.min(visibleImages.length, 10) + ' ===');
      console.log('URL: ' + visibleImages[i]);
      
      // Navigate directly to image URL
      await page.goto(visibleImages[i]);
      await page.waitForTimeout(3000);
      
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