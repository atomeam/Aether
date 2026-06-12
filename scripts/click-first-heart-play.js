/**
 * Click First Image, Heart, and Play - No Repeats
 * Navigate to gallery, check if hearted/viewed, click first image, heart it, then play slideshow
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function clickFirstHeartPlay() {
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
    const galleryUrl = 'https://www.pornpics.com/galleries/skinny-teen-maria-anjel-doffs-her-skirt-and-poses-naked-in-her-black-heels-13110096/';
    
    // Check if already viewed
    const viewedFile = 'viewed-galleries.json';
    let viewedGalleries = [];
    if (fs.existsSync(viewedFile)) {
      viewedGalleries = JSON.parse(fs.readFileSync(viewedFile, 'utf-8'));
    }
    
    if (viewedGalleries.includes(galleryUrl)) {
      console.log('❌ Already viewed, skipping');
      await browser.close();
      return;
    }
    
    console.log('Step 1: Navigating to gallery...');
    await page.goto(galleryUrl);
    await page.waitForTimeout(3000);
    
    // Check if already hearted
    const isHearted = await page.$('.favorite-button.btn-frameless.active, .favorite-button.btn-frameless.added');
    if (isHearted) {
      console.log('❌ Already hearted, skipping');
      await browser.close();
      return;
    }
    
    console.log('Step 2: Clicking first image to open fullscreen...');
    const firstImage = await page.$('img[src*="cdni"]');
    if (firstImage) {
      await firstImage.click();
      await page.waitForTimeout(3000);
      console.log('✅ First image clicked');
    } else {
      console.log('❌ No image found');
      await browser.close();
      return;
    }
    
    console.log('Step 3: Clicking heart button...');
    const heartButton = await page.$('.favorite-button.btn-frameless');
    if (heartButton) {
      await heartButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Hearted');
    } else {
      console.log('❌ Heart button not found');
    }
    
    console.log('Step 4: Clicking play button...');
    const playButton = await page.$('.favorite-button.btn-frameless + button');
    if (!playButton) {
      const playButtonAlt = await page.$('button:has-text("Play")');
      if (playButtonAlt) {
        await playButtonAlt.click();
        await page.waitForTimeout(2000);
        console.log('✅ Play clicked (alternative)');
      } else {
        console.log('❌ Play button not found');
      }
    } else {
      await playButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Play clicked');
    }
    
    console.log('Step 5: Viewing slideshow...');
    console.log('Slideshow will auto-advance through all images');
    console.log('Waiting 5 minutes for full slideshow...');
    await page.waitForTimeout(300000);
    
    console.log('✅ Slideshow complete');
    
    // Mark as viewed
    viewedGalleries.push(galleryUrl);
    fs.writeFileSync(viewedFile, JSON.stringify(viewedGalleries, null, 2));
    console.log('✅ Marked as viewed');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    const newStorageState = await context.storageState();
    fs.writeFileSync('.browser-sessions/persistent-session.json', JSON.stringify(newStorageState, null, 2));
    console.log('Session saved');
    await browser.close();
  }
}

clickFirstHeartPlay().catch(console.error);