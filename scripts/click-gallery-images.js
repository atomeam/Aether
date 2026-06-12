/**
 * Click Gallery Images - Simple
 * Just click each image to view at high resolution
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function clickGalleryImages() {
  const sessionFile = '.browser-sessions/persistent-session.json';
  let storageState = undefined;
  
  if (fs.existsSync(sessionFile)) {
    try {
      storageState = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    } catch (e) {}
  }
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    storageState: storageState
  });
  const page = await context.newPage();
  
  try {
    const galleryUrl = 'https://www.pornpics.com/galleries/glamour-babe-isabella-flaunts-her-firm-tits-gives-a-pantyless-upskirt-66354052/';
    
    console.log('Opening gallery...');
    await page.goto(galleryUrl);
    await page.waitForTimeout(3000);
    
    // Find all image elements
    console.log('Finding images...');
    const images = await page.$$('a img');
    console.log('Found ' + images.length + ' images');
    
    // Click each image
    for (let i = 0; i < Math.min(images.length, 20); i++) {
      console.log('Clicking image ' + (i + 1) + '/' + Math.min(images.length, 20));
      
      await images[i].click();
      await page.waitForTimeout(15000); // 15 seconds viewing
      
      await page.goBack();
      await page.waitForTimeout(2000);
    }
    
    console.log('Done');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    const newStorageState = await context.storageState();
    fs.writeFileSync('.browser-sessions/persistent-session.json', JSON.stringify(newStorageState, null, 2));
    await browser.close();
  }
}

clickGalleryImages().catch(console.error);