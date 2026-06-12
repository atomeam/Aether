/**
 * Master PornPics Viewer - Complete Automated System
 * Implements all improvements: no-repeats, heart detection, image clicking, play button,
 * gallery selection, category exploration, adaptive timing, preference learning, quality scoring
 */

const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');

class MasterViewer {
  constructor() {
    this.viewedFile = 'viewed-galleries.json';
    this.preferencesFile = 'preferences.json';
    this.scoresFile = 'gallery-scores.json';
    
    this.viewedGalleries = this.loadJson(this.viewedFile, []);
    
    const defaultPreferences = {
      categories: {},
      keywords: {},
      dislikedKeywords: {},
      imageCountRange: [10, 100],
      totalViewed: 0,
      skipped: 0,
      viewingTime: 120,
      skipKeywords: ['lesbian', 'group', 'threesome', 'orgy']
    };
    
    const loadedPreferences = this.loadJson(this.preferencesFile, {});
    this.preferences = { ...defaultPreferences, ...loadedPreferences };
    
    this.scores = this.loadJson(this.scoresFile, {});
    
    this.categories = ['skirt', 'bikini', 'pussy', 'milf', 'teen', 'blonde', 'brunette'];
    this.shouldSkip = false;
    this.keepViewing = true;
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    
    // Start keyboard input
    this.startKeyboardInput();
  }
  
  startKeyboardInput() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n🎮 Keyboard Controls:');
    console.log('   "s" or "n" - Skip current gallery');
    console.log('   "q" - Quit');
    console.log('   " " (space) - Pause/Resume slideshow');
    console.log('   "+" - Speed up slideshow');
    console.log('   "-" - Slow down slideshow');
    console.log('   "f" - Toggle fullscreen\n');
    
    rl.on('line', (input) => {
      const cmd = input.toLowerCase().trim();
      
      if (cmd === 's' || cmd === 'n') {
        this.shouldSkip = true;
        console.log('⏭️  Skipping...');
      } else if (cmd === 'q') {
        this.keepViewing = false;
        console.log('🛑 Quitting...');
        process.exit(0);
      } else if (cmd === ' ') {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? '⏸️  Paused' : '▶️  Resumed');
      } else if (cmd === '+') {
        this.speedMultiplier = Math.min(this.speedMultiplier + 0.25, 3.0);
        console.log('⚡ Speed: ' + this.speedMultiplier + 'x');
      } else if (cmd === '-') {
        this.speedMultiplier = Math.max(this.speedMultiplier - 0.25, 0.5);
        console.log('🐢 Speed: ' + this.speedMultiplier + 'x');
      } else if (cmd === 'f') {
        console.log('🖥️  Fullscreen toggle (use browser F11)');
      }
    });
  }
  
  loadJson(file, defaultVal) {
    if (fs.existsSync(file)) {
      try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
      } catch (e) {
        return defaultVal;
      }
    }
    return defaultVal;
  }
  
  saveJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
  
  async isHearted(page) {
    // Method 1: Check for "del" class (already hearted)
    let isHearted = await page.$('.gall-info-favorite.del, .favorite-button.btn-frameless.del');
    if (isHearted) return true;
    
    // Method 2: Check for "active" or "added" class
    isHearted = await page.$('.favorite-button.btn-frameless.active, .favorite-button.btn-frameless.added');
    if (isHearted) return true;
    
    // Method 3: Check PhotoSwipe favorite button
    isHearted = await page.$('.pswp__button--favorite-button.del');
    if (isHearted) return true;
    
    // Method 4: Text check
    const heartButton = await page.$('.gall-info-favorite, .favorite-button.btn-frameless');
    if (heartButton) {
      const text = await heartButton.textContent();
      if (text && (text.includes('Remove') || text.includes('Favorited'))) {
        return true;
      }
    }
    
    return false;
  }
  
  async clickImage(page) {
    // PhotoSwipe gallery - click the image container/link
    const images = await page.$$('img[src*="cdni"]');
    if (images.length > 0) {
      // Method 1: Click parent link (works with PhotoSwipe)
      const parentLink = await images[0].$('xpath=..');
      if (parentLink) {
        await parentLink.click();
        await page.waitForTimeout(3000);
        return true;
      }
    }
    
    // Method 2: Force click
    try {
      await images[0].click({ force: true });
      await page.waitForTimeout(3000);
      return true;
    } catch (e) {
      console.log('Force click failed, trying direct navigation');
      // Method 3: Navigate to URL directly
      const imageUrl = await images[0].getAttribute('src');
      await page.goto(imageUrl);
      await page.waitForTimeout(3000);
      return true;
    }
  }
  
  async clickPlayButton(page) {
    const playSelectors = [
      '.pswp__button--slideshow-button',  // Correct PhotoSwipe slideshow button
      '.favorite-button.btn-frameless + button',
      'button:has-text("Play")',
      'button[title*="play"]',
      '[class*="play"] button',
      '.slideshow-play'
    ];
    
    for (const selector of playSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        return true;
      }
    }
    
    return false;
  }
  
  async getImageCount(page) {
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    const imageUrls = new Set();
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(500);
      
      const currentImages = await page.$$eval('img[src*="cdni"]', imgs => imgs.map(img => img.src));
      currentImages.forEach(url => imageUrls.add(url));
    }
    
    return imageUrls.size;
  }
  
  scoreGallery(gallery) {
    let score = 0;
    score += gallery.imageCount * 2;
    score += !gallery.isHearted ? 10 : 0;
    score += this.preferences.categories[gallery.category] ? 5 : 0;
    
    // Penalize disliked keywords
    for (const keyword of this.preferences.skipKeywords) {
      if (gallery.text.toLowerCase().includes(keyword)) {
        score -= 50;
      }
    }
    
    // Bonus for preferred keywords
    for (const keyword of Object.keys(this.preferences.keywords)) {
      if (gallery.text.toLowerCase().includes(keyword)) {
        score += 10;
      }
    }
    
    return score;
  }
  
  shouldSkipGallery(gallery) {
    // Check skip keywords
    for (const keyword of this.preferences.skipKeywords) {
      if (gallery.text.toLowerCase().includes(keyword)) {
        console.log('⏭️  Skipping (contains disliked keyword: ' + keyword + ')');
        return true;
      }
    }
    
    // Check image count range
    if (gallery.imageCount < this.preferences.imageCountRange[0] || 
        gallery.imageCount > this.preferences.imageCountRange[1]) {
      console.log('⏭️  Skipping (image count out of range: ' + gallery.imageCount + ')');
      return true;
    }
    
    return false;
  }
  
  recordLike(gallery) {
    // Track category preference
    this.preferences.categories[gallery.category] = (this.preferences.categories[gallery.category] || 0) + 1;
    
    // Track keywords from title
    const words = gallery.text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        this.preferences.keywords[word] = (this.preferences.keywords[word] || 0) + 1;
      }
    });
    
    this.saveJson(this.preferencesFile, this.preferences);
  }
  
  recordDislike(gallery) {
    // Track disliked keywords
    const words = gallery.text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        this.preferences.dislikedKeywords[word] = (this.preferences.dislikedKeywords[word] || 0) + 1;
      }
    });
    
    this.saveJson(this.preferencesFile, this.preferences);
  }
  
  async exploreCategory(page, category) {
    console.log('\n📂 Exploring category: ' + category);
    
    await page.goto('https://www.pornpics.com/' + category + '/');
    await page.waitForTimeout(3000);
    
    const galleryLinks = await page.$$eval('a', links => 
      links
        .filter(link => link.href && link.href.includes('/galleries/'))
        .map(link => ({ href: link.href, text: link.textContent?.substring(0, 60) }))
        .slice(0, 20)
    );
    
    console.log('Found ' + galleryLinks.length + ' galleries');
    
    const galleries = [];
    for (const link of galleryLinks) {
      if (this.viewedGalleries.includes(link.href)) {
        continue;
      }
      
      await page.goto(link.href);
      await page.waitForTimeout(2000);
      
      const isHearted = await this.isHearted(page);
      const imageCount = await this.getImageCount(page);
      
      galleries.push({
        href: link.href,
        text: link.text,
        category: category,
        isHearted: isHearted,
        imageCount: imageCount,
        score: 0
      });
    }
    
    // Score galleries
    galleries.forEach(g => g.score = this.scoreGallery(g));
    
    // Sort by score
    galleries.sort((a, b) => b.score - a.score);
    
    return galleries;
  }
  
  async viewGallery(page, gallery) {
    console.log('\n🖼️  Gallery: ' + gallery.text);
    console.log('Score: ' + gallery.score);
    console.log('Images: ' + gallery.imageCount);
    
    // Check if should skip
    if (this.shouldSkipGallery(gallery)) {
      this.preferences.skipped++;
      this.saveJson(this.preferencesFile, this.preferences);
      return false;
    }
    
    await page.goto(gallery.href);
    await page.waitForTimeout(3000);
    
    // Verify not hearted
    const isHearted = await this.isHearted(page);
    if (isHearted) {
      console.log('❌ Already hearted, skipping');
      return false;
    }
    
    console.log('✅ Fresh gallery (not hearted)');
    
    // Heart the gallery first
    console.log('Clicking heart...');
    const heartButton = await page.$('.gall-info-favorite');
    if (heartButton) {
      await heartButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Hearted');
    }
    
    // Now click first image to open PhotoSwipe
    console.log('Clicking first image...');
    const clicked = await this.clickImage(page);
    if (!clicked) {
      console.log('❌ Failed to click image');
      return false;
    }
    
    await page.waitForTimeout(3000);
    
    // Enter fullscreen
    console.log('🖥️  Entering fullscreen...');
    const fullscreenButton = await page.$('.pswp__button--fullscreen-button');
    if (fullscreenButton) {
      await fullscreenButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Fullscreen enabled');
    }
    
    // Try play button
    console.log('Trying play button...');
    const playClicked = await this.clickPlayButton(page);
    
    const viewingTime = this.preferences.viewingTime;
    
    if (playClicked) {
      console.log('✅ Play clicked - slideshow started');
      console.log('⏱️  Viewing for ' + viewingTime + ' seconds...');
      console.log('⚡ Speed: ' + this.speedMultiplier + 'x');
      
      // Progress feedback - show time remaining with pause and speed control
      for (let elapsed = 0; elapsed < viewingTime; elapsed += 10) {
        const remaining = viewingTime - elapsed;
        console.log('   Time remaining: ' + remaining + 's | Speed: ' + this.speedMultiplier + 'x');
        
        if (this.shouldSkip) {
          console.log('⏭️  Skipped by user');
          this.preferences.skipped++;
          this.saveJson(this.preferencesFile, this.preferences);
          this.shouldSkip = false;
          
          // Close PhotoSwipe
          const closeButton = await page.$('.pswp__button--close');
          if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
          
          return false;
        }
        
        // Handle pause
        while (this.isPaused) {
          console.log('⏸️  Paused...');
          await page.waitForTimeout(1000);
        }
        
        // Adjust wait time based on speed
        const adjustedWait = 10000 / this.speedMultiplier;
        await page.waitForTimeout(adjustedWait);
      }
    } else {
      console.log('⚠️  Play button not found, manual viewing');
      
      // Manual slideshow with progress
      const imageTime = viewingTime / Math.min(gallery.imageCount, 10);
      
      for (let i = 0; i < Math.min(gallery.imageCount, 10); i++) {
        console.log('📷 Image ' + (i + 1) + '/' + Math.min(gallery.imageCount, 10));
        console.log('   Time remaining: ' + (viewingTime - (i * imageTime)).toFixed(0) + 's | Speed: ' + this.speedMultiplier + 'x');
        
        if (this.shouldSkip) {
          console.log('⏭️  Skipped by user');
          this.preferences.skipped++;
          this.saveJson(this.preferencesFile, this.preferences);
          this.shouldSkip = false;
          
          const closeButton = await page.$('.pswp__button--close');
          if (closeButton) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
          
          return false;
        }
        
        // Handle pause
        while (this.isPaused) {
          console.log('⏸️  Paused...');
          await page.waitForTimeout(1000);
        }
        
        // Adjust wait time based on speed
        const adjustedWait = (imageTime * 1000) / this.speedMultiplier;
        await page.waitForTimeout(adjustedWait);
        
        // Try next
        const nextButton = await page.$('.pswp__button--arrow--next');
        if (nextButton) {
          await nextButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Record like (since we didn't skip)
    this.recordLike(gallery);
    
    // Mark as viewed
    this.viewedGalleries.push(gallery.href);
    this.saveJson(this.viewedFile, this.viewedGalleries);
    
    this.preferences.totalViewed++;
    this.saveJson(this.preferencesFile, this.preferences);
    
    console.log('✅ Gallery complete');
    return true;
  }
  
  async run() {
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
      console.log('🚀 Starting Master Viewer - Using Related Galleries');
      console.log('Viewed galleries: ' + this.viewedGalleries.length);
      
      // Start with a fresh gallery from skirt category
      console.log('\n📂 Finding starting gallery...');
      await page.goto('https://www.pornpics.com/skirt/');
      await page.waitForTimeout(3000);
      
      const galleryLinks = await page.$$eval('a', links => 
        links
          .filter(link => link.href && link.href.includes('/galleries/'))
          .map(link => link.href)
          .slice(0, 10)
      );
      
      console.log('Found ' + galleryLinks.length + ' galleries');
      
      // Scroll down and check hearts by hovering
      console.log('\n🔍 Scrolling to find unhearted galleries...');
      
      let currentGalleryUrl = null;
      let currentTitle = null;
      
      // Get all gallery links first
      const allGalleries = await page.$$eval('a', links => 
        links
          .filter(link => link.href && link.href.includes('/galleries/'))
          .map(link => link.href)
          .slice(0, 20)
      );
      
      console.log('Total galleries: ' + allGalleries.length);
      
      for (const galleryUrl of allGalleries) {
        if (this.viewedGalleries.includes(galleryUrl)) {
          continue;
        }
        
        // Navigate to gallery to check heart status and get title
        await page.goto(galleryUrl);
        await page.waitForTimeout(2000);
        
        const isHearted = await this.isHearted(page);
        if (isHearted) {
          console.log('❌ Hearted');
          continue;
        }
        
        // Get title from page
        const title = await page.$eval('h1, .gall-info-title, title', el => el.textContent).catch(() => 'Gallery');
        
        console.log('✅ Unhearted: ' + title);
        currentGalleryUrl = galleryUrl;
        currentTitle = title;
        break;
      }
      
      if (!currentGalleryUrl) {
        console.log('❌ No fresh galleries found');
        return;
      }
      
      console.log('✅ Selected: ' + currentTitle);
      
      // Continuous viewing loop
      let galleryCount = 0;
      const maxGalleries = 100;
      
      while (this.keepViewing && galleryCount < maxGalleries) {
        galleryCount++;
        
        // Already on the gallery page from heart check
        // Get image count
        const imageCount = await this.getImageCount(page);
        
        console.log('\n🖼️  Gallery ' + galleryCount + '/' + maxGalleries);
        console.log('Title: ' + currentTitle);
        console.log('Images: ' + imageCount);
        
        // View this gallery
        const gallery = {
          href: currentGalleryUrl,
          text: currentTitle,
          category: 'related',
          isHearted: false,
          imageCount: imageCount,
          score: 10
        };
        
        const success = await this.viewGallery(page, gallery);
        if (!success) {
          console.log('⏭️  Skipped, finding next...');
        }
        
        console.log('\n✅ Gallery complete');
        
        // Find next gallery from related
        console.log('\n🔍 Finding next gallery from related...');
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        let nextGalleryUrl = null;
        let nextTitle = null;
        
        for (let i = 0; i < 5; i++) {
          await page.evaluate(() => window.scrollBy(0, 500));
          await page.waitForTimeout(1000);
          
          // Find visible related galleries
          const visibleGalleries = await page.$$eval('a', (links) => 
            links
              .filter(link => {
                const rect = link.getBoundingClientRect();
                const href = link.href;
                return rect.top > 0 && rect.top < window.innerHeight && 
                       href && 
                       href.includes('/galleries/');
              })
              .map(link => link.href)
              .slice(0, 5)
          );
          
          console.log('Visible related: ' + visibleGalleries.length);
          
          // Filter out viewed and current
          const filteredGalleries = visibleGalleries.filter(url => 
            url !== currentGalleryUrl && !this.viewedGalleries.includes(url)
          );
          
          for (const galleryUrl of filteredGalleries) {
            // Navigate to gallery to check heart status and get title
            await page.goto(galleryUrl);
            await page.waitForTimeout(2000);
            
            const isHearted = await this.isHearted(page);
            if (isHearted) {
              console.log('❌ Hearted: ' + galleryUrl);
              continue;
            }
            
            // Get title from page
            const title = await page.$eval('h1, .gall-info-title, title', el => el.textContent).catch(() => 'Gallery');
            
            console.log('✅ Unhearted: ' + title);
            nextGalleryUrl = galleryUrl;
            nextTitle = title;
            break;
          }
          
          if (nextGalleryUrl) {
            break;
          }
        }
        
        if (!nextGalleryUrl) {
          console.log('❌ No fresh related galleries found, going back to category');
          // Go back to category to find fresh gallery
          await page.goto('https://www.pornpics.com/skirt/');
          await page.waitForTimeout(3000);
          
          const freshGalleries = await page.$$eval('a', links => 
            links
              .filter(link => link.href && link.href.includes('/galleries/'))
              .map(link => link.href)
              .slice(0, 10)
          );
          
          for (const galleryUrl of freshGalleries) {
            if (this.viewedGalleries.includes(galleryUrl)) {
              continue;
            }
            
            await page.goto(galleryUrl);
            await page.waitForTimeout(2000);
            
            const isHearted = await this.isHearted(page);
            if (isHearted) {
              continue;
            }
            
            const title = await page.$eval('h1, .gall-info-title, title', el => el.textContent).catch(() => 'Gallery');
            
            nextGalleryUrl = galleryUrl;
            nextTitle = title;
            break;
          }
          
          if (!nextGalleryUrl) {
            console.log('❌ No fresh galleries found anywhere, stopping');
            break;
          }
        }
        
        // Update for next iteration
        currentGalleryUrl = nextGalleryUrl;
        currentTitle = nextTitle;
        console.log('✅ Next: ' + currentTitle);
      }
      
      console.log('\n✅ Completed viewing ' + galleryCount + ' galleries');
      
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      const newStorageState = await context.storageState();
      fs.writeFileSync('.browser-sessions/persistent-session.json', JSON.stringify(newStorageState, null, 2));
      console.log('Session saved');
      await browser.close();
    }
  }
}

const viewer = new MasterViewer();
viewer.run().catch(console.error);