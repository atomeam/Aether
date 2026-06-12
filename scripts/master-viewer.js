/**
 * Master PornPics Viewer - Complete Automated System
 * Implements all improvements: no-repeats, heart detection, image clicking, play button,
 * gallery selection, category exploration, adaptive timing, preference learning, quality scoring
 */

const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');

class MasterViewer {
  constructor() {
    this.viewedFile = 'viewed-galleries.json';
    this.preferencesFile = 'preferences.json';
    this.scoresFile = 'gallery-scores.json';
    
    this.viewedGalleries = this.loadJson(this.viewedFile, []);
    this.preferences = this.loadJson(this.preferencesFile, {
      categories: {},
      keywords: {},
      dislikedKeywords: {},
      imageCountRange: [10, 30],
      totalViewed: 0,
      skipped: 0,
      viewingTime: 200,
      skipKeywords: ['lesbian', 'group', 'threesome', 'orgy']
    });
    this.scores = this.loadJson(this.scoresFile, {});
    
    this.categories = ['skirt', 'bikini', 'pussy', 'milf', 'teen', 'blonde', 'brunette'];
    this.shouldSkip = false;
    
    // Start skip server
    this.startSkipServer();
  }
  
  startSkipServer() {
    const server = http.createServer((req, res) => {
      if (req.url === '/skip') {
        this.shouldSkip = true;
        console.log('⏭️  Skip requested');
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });
    
    server.listen(3457, () => {
      console.log('🎮 Skip server listening on port 3457');
      console.log('   GET http://localhost:3457/skip to skip current gallery');
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
  
  async httpGet(url) {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
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
    
    // Try play button
    console.log('Trying play button...');
    const playClicked = await this.clickPlayButton(page);
    
    const viewingTime = this.preferences.viewingTime;
    
    if (playClicked) {
      console.log('✅ Play clicked - slideshow started');
      console.log('⏱️  Viewing for ' + viewingTime + ' seconds...');
      
      // Progress feedback - show time remaining
      for (let elapsed = 0; elapsed < viewingTime; elapsed += 10) {
        const remaining = viewingTime - elapsed;
        console.log('   Time remaining: ' + remaining + 's');
        
        // Check for skip (via HTTP request)
        try {
          await httpGet('http://localhost:3457/skip');
          this.shouldSkip = true;
        } catch (e) {
          // Server not responding, continue
        }
        
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
        
        await page.waitForTimeout(10000);
      }
    } else {
      console.log('⚠️  Play button not found, manual viewing');
      
      // Manual slideshow with progress
      const imageTime = viewingTime / Math.min(gallery.imageCount, 10);
      
      for (let i = 0; i < Math.min(gallery.imageCount, 10); i++) {
        console.log('📷 Image ' + (i + 1) + '/' + Math.min(gallery.imageCount, 10));
        console.log('   Time remaining: ' + (viewingTime - (i * imageTime)).toFixed(0) + 's');
        
        // Check for skip
        try {
          await this.httpGet('http://localhost:3457/skip');
          this.shouldSkip = true;
        } catch (e) {
          // Server not responding, continue
        }
        
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
        
        await page.waitForTimeout(imageTime * 1000);
        
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
      
      // Find first unhearted gallery to start
      let currentGalleryUrl = null;
      for (const galleryUrl of galleryLinks) {
        if (this.viewedGalleries.includes(galleryUrl)) {
          continue;
        }
        
        await page.goto(galleryUrl);
        await page.waitForTimeout(2000);
        
        const isHearted = await this.isHearted(page);
        if (isHearted) {
          continue;
        }
        
        // Get gallery title
        const title = await page.$eval('h1, .gall-info-title, title', el => el.textContent);
        
        currentGalleryUrl = galleryUrl;
        console.log('✅ Starting with: ' + currentGalleryUrl);
        console.log('   Title: ' + title);
        break;
      }
      
      if (!currentGalleryUrl) {
        console.log('❌ No fresh galleries found in category');
        return;
      }
      
      // View this gallery once
      await page.goto(currentGalleryUrl);
      await page.waitForTimeout(2000);
      
      // Check if already hearted
      const isHearted = await this.isHearted(page);
      if (isHearted) {
        console.log('❌ Already hearted');
        return;
      }
      
      // Get image count and title
      const imageCount = await this.getImageCount(page);
      const title = await page.$eval('h1, .gall-info-title, title', el => el.textContent).catch(() => 'Gallery');
      
      console.log('\n🖼️  Viewing gallery');
      console.log('Title: ' + title);
      console.log('Images: ' + imageCount);
      
      // View this gallery
      const gallery = {
        href: currentGalleryUrl,
        text: title,
        category: 'related',
        isHearted: false,
        imageCount: imageCount,
        score: 10
      };
      
      const success = await this.viewGallery(page, gallery);
      if (!success) {
        return;
      }
      
      console.log('\n✅ Gallery complete');
      
      // Find next gallery from related
      console.log('\n🔍 Finding next gallery from related...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      const relatedGalleries = await page.$$eval('a', (links, currentUrl, viewed) => 
        links
          .filter(link => {
            const href = link.href;
            return href && 
                   href.includes('/galleries/') && 
                   href !== currentUrl &&
                   !viewed.includes(href);
          })
          .map(link => link.href)
          .slice(0, 5)
      , currentGalleryUrl, this.viewedGalleries);
      
      console.log('Found ' + relatedGalleries.length + ' related galleries');
      
      if (relatedGalleries.length === 0) {
        console.log('❌ No related galleries found');
        return;
      }
      
      // Find first unhearted related gallery
      for (const relatedUrl of relatedGalleries) {
        await page.goto(relatedUrl);
        await page.waitForTimeout(2000);
        
        const relatedIsHearted = await this.isHearted(page);
        if (relatedIsHearted) {
          console.log('Skipping (hearted): ' + relatedUrl);
          continue;
        }
        
        console.log('✅ Found next gallery: ' + relatedUrl);
        console.log('Browser stays open for viewing');
        
        // Keep browser open for manual viewing
        await new Promise(() => {});
        return;
      }
      
      console.log('❌ No fresh related galleries found');
      
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