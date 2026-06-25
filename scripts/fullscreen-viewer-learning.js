/**
 * Fullscreen Image Viewer - Learning Mode
 * Records data about what works and what doesn't
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function viewFullscreenImagesLearning(galleryUrl) {
  const sessionFile = '.browser-sessions/persistent-session.json';
  let storageState = undefined;
  
  if (fs.existsSync(sessionFile)) {
    try {
      storageState = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    } catch (e) {
      console.log('Could not load session');
    }
  }
  
  const learningData = {
    gallery: galleryUrl,
    timestamp: new Date().toISOString(),
    attempts: [],
    successfulMethods: [],
    failedMethods: [],
    timing: {},
    selectors: {}
  };
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    storageState: storageState
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to gallery: ' + galleryUrl);
    const startTime = Date.now();
    await page.goto(galleryUrl);
    await page.waitForLoadState('networkidle');
    learningData.timing.navigation = Date.now() - startTime;
    
    await page.waitForTimeout(3000);
    
    // Try different scroll methods
    console.log('Testing scroll methods...');
    const scrollMethods = [
      { name: 'scrollBy 500', action: () => page.evaluate(() => window.scrollBy(0, 500)) },
      { name: 'scrollTo 500', action: () => page.evaluate(() => window.scrollTo(0, 500)) },
      { name: 'scrollIntoView', action: () => page.evaluate(() => document.body.scrollIntoView()) }
    ];
    
    for (const method of scrollMethods) {
      try {
        const scrollStart = Date.now();
        await method.action();
        await page.waitForTimeout(1000);
        learningData.timing[method.name] = Date.now() - scrollStart;
        learningData.successfulMethods.push(method.name);
        console.log('✅ Scroll method worked: ' + method.name);
        break;
      } catch (e) {
        learningData.failedMethods.push(method.name);
        console.log('❌ Scroll method failed: ' + method.name);
      }
    }
    
    // Try different selectors for images
    console.log('Testing image selectors...');
    const selectors = [
      '.gall-item a',
      '.gallery-item a',
      'a img',
      '.gall-item img',
      '[class*="gall"] a'
    ];
    
    let workingSelector = null;
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          learningData.selectors[selector] = { found: elements.length, works: true };
          workingSelector = selector;
          console.log('✅ Selector works: ' + selector + ' (' + elements.length + ' elements)');
          break;
        } else {
          learningData.selectors[selector] = { found: 0, works: false };
        }
      } catch (e) {
        learningData.selectors[selector] = { found: 0, works: false, error: e.message };
      }
    }
    
    if (workingSelector) {
      const imageLinks = await page.$$eval(workingSelector, links => 
        links.map(link => link.href || link.src)
      );
      
      console.log('Found ' + imageLinks.length + ' images with selector: ' + workingSelector);
      learningData.imagesFound = imageLinks.length;
      
      // Test clicking first image
      console.log('Testing click methods...');
      if (imageLinks.length > 0) {
        await page.goto(imageLinks[0]);
        await page.waitForTimeout(3000);
        
        // Check for fullscreen indicators
        const fullscreenIndicators = await page.evaluate(() => {
          return {
            hasFullscreen: document.querySelector('.fullscreen, .modal, .lightbox') !== null,
            hasFullInUrl: window.location.href.includes('/full/'),
            hasMaxWidthImg: document.querySelector('img[style*="max-width: 100%"]') !== null
          };
        });
        
        learningData.fullscreenIndicators = fullscreenIndicators;
        console.log('Fullscreen indicators:', JSON.stringify(fullscreenIndicators));
        
        // Test navigation methods
        console.log('Testing navigation methods...');
        const navMethods = [
          { name: 'ArrowRight', action: () => page.keyboard.press('ArrowRight') },
          { name: 'ArrowDown', action: () => page.keyboard.press('ArrowDown') },
          { name: 'Next button', action: () => page.$('button:has-text("Next"), [class*="next"]').then(btn => btn ? btn.click() : null) }
        ];
        
        for (const method of navMethods) {
          try {
            await method.action();
            await page.waitForTimeout(2000);
            learningData.successfulMethods.push('nav-' + method.name);
            console.log('✅ Navigation worked: ' + method.name);
            break;
          } catch (e) {
            learningData.failedMethods.push('nav-' + method.name);
          }
        }
      }
    }
    
    // Save learning data
    const learningFile = 'fullscreen-learning-data.json';
    let allLearningData = [];
    if (fs.existsSync(learningFile)) {
      allLearningData = JSON.parse(fs.readFileSync(learningFile, 'utf-8'));
    }
    allLearningData.push(learningData);
    fs.writeFileSync(learningFile, JSON.stringify(allLearningData, null, 2));
    console.log('Learning data saved to: ' + learningFile);
    
    console.log('\n✅ Learning complete');
    console.log('📊 Summary:');
    console.log('   Working selector: ' + workingSelector);
    console.log('   Images found: ' + learningData.imagesFound);
    console.log('   Successful methods: ' + learningData.successfulMethods.join(', '));
    console.log('   Failed methods: ' + learningData.failedMethods.join(', '));
    
  } catch (error) {
    console.error('Error:', error.message);
    learningData.error = error.message;
  } finally {
    const newStorageState = await context.storageState();
    fs.writeFileSync('.browser-sessions/persistent-session.json', JSON.stringify(newStorageState, null, 2));
    console.log('Session saved');
    await browser.close();
  }
}

const galleryUrl = process.argv[2] || 'https://www.pornpics.com/galleries/sweet-teen-eve-sweet-removes-a-short-dress-for-great-nude-poses-in-heels-57334227/';
viewFullscreenImagesLearning(galleryUrl).catch(console.error);