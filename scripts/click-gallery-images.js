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
    
    // Find all link elements that contain images
    console.log('Finding image links...');
    const imageLinks = await page.$$('a');
    console.log('Found ' + imageLinks.length + ' links');
    
    // Click each link that has an image
    let clickedCount = 0;
    for (let i = 0; i < imageLinks.length && clickedCount < 20; i++) {
      const hasImage = await imageLinks[i].$('img');
      if (hasImage) {
        console.log('Clicking image link ' + (clickedCount + 1));
        
        await imageLinks[i].click();
        await page.waitForTimeout(15000); // 15 seconds viewing
        
        await page.goBack();
        await page.waitForTimeout(2000);
        
        clickedCount++;
      }
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