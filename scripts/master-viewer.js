/**
 * Master PornPics Viewer - Complete Automated System
 * Implements all improvements: no-repeats, heart detection, image clicking, play button,
 * gallery selection, category exploration, adaptive timing, preference learning, quality scoring
 */

const { chromium } = require('playwright');
const fs = require('fs');

class MasterViewer {
  constructor() {
    this.viewedFile = 'viewed-galleries.json';
    this.preferencesFile = 'preferences.json';
    this.scoresFile = 'gallery-scores.json';
    
    this.viewedGalleries = this.loadJson(this.viewedFile, []);
    this.preferences = this.loadJson(this.preferencesFile, {
      categories: {},
      keywords: {},
      imageCountRange: [10, 30],
      totalViewed: 0
    });
    this.scores = this.loadJson(this.scoresFile, {});
    
    this.categories = ['skirt', 'bikini', 'pussy', 'milf', 'teen', 'blonde', 'brunette'];
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
    // Method 1: Class check
    let isHearted = await page.$('.favorite-button.btn-frameless.active, .favorite-button.btn-frameless.added');
    if (isHearted) return true;
    
    // Method 2: Text check
    const heartButton = await page.$('.favorite-button.btn-frameless');
    if (heartButton) {
      const text = await heartButton.textContent();
      if (text && (text.includes('Remove') || text.includes('Favorited'))) {
        return true;
      }
    }
    
    return false;
  }
  
  async clickImage(page) {
    // Method 1: Click parent link (bypasses ppc-layer)
    const images = await page.$$('img[src*="cdni"]');
    if (images.length > 0) {
      const parentLink = await images[0].$('xpath=..');
      if (parentLink) {
        await parentLink.click();
        return true;
      }
    }
    
    // Method 2: Force click
    try {
      await images[0].click({ force: true });
      return true;
    } catch (e) {
      // Method 3: Navigate to URL
      const imageUrl = await images[0].getAttribute('src');
      await page.goto(imageUrl);
      return true;
    }
  }
  
  async clickPlayButton(page) {
    const playSelectors = [
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
    return score;
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
    console.log('\n🖼️  Viewing gallery: ' + gallery.text);
    console.log('Score: ' + gallery.score);
    console.log('Images: ' + gallery.imageCount);
    
    await page.goto(gallery.href);
    await page.waitForTimeout(3000);
    
    // Verify not hearted
    const isHearted = await this.isHearted(page);
    if (isHearted) {
      console.log('❌ Already hearted, skipping');
      return false;
    }
    
    // Click first image
    console.log('Clicking first image...');
    const clicked = await this.clickImage(page);
    if (!clicked) {
      console.log('❌ Failed to click image');
      return false;
    }
    
    await page.waitForTimeout(3000);
    
    // Heart the gallery
    console.log('Clicking heart...');
    const heartButton = await page.$('.favorite-button.btn-frameless');
    if (heartButton) {
      await heartButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Hearted');
    }
    
    // Try play button
    console.log('Trying play button...');
    const playClicked = await this.clickPlayButton(page);
    if (playClicked) {
      console.log('✅ Play clicked - slideshow started');
      
      // Adaptive timing
      const totalTime = gallery.imageCount * 10000;
      console.log('Viewing for ' + (totalTime / 1000) + ' seconds...');
      await page.waitForTimeout(totalTime);
    } else {
      console.log('⚠️  Play button not found, manual viewing');
      
      // Manual slideshow
      for (let i = 0; i < Math.min(gallery.imageCount, 10); i++) {
        console.log('Image ' + (i + 1) + '/' + Math.min(gallery.imageCount, 10));
        await page.waitForTimeout(10000);
        
        // Try next
        const nextButton = await page.$('button:has-text("Next"), [class*="next"]');
        if (nextButton) {
          await nextButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Mark as viewed
    this.viewedGalleries.push(gallery.href);
    this.saveJson(this.viewedFile, this.viewedGalleries);
    
    // Update preferences
    this.preferences.categories[gallery.category] = (this.preferences.categories[gallery.category] || 0) + 1;
    this.preferences.totalViewed++;
    this.saveJson(this.preferencesFile, this.preferences);
    
    console.log('✅ Gallery complete');
    return true;
  }
  
  async run() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    try {
      console.log('🚀 Starting Master Viewer');
      console.log('Viewed galleries: ' + this.viewedGalleries.length);
      console.log('Total viewed: ' + this.preferences.totalViewed);
      
      // Explore categories
      const allGalleries = [];
      for (const category of this.categories) {
        const galleries = await this.exploreCategory(page, category);
        allGalleries.push(...galleries);
      }
      
      console.log('\n📊 Total galleries found: ' + allGalleries.length);
      
      // Filter unhearted
      const freshGalleries = allGalleries.filter(g => !g.isHearted);
      console.log('Fresh galleries: ' + freshGalleries.length);
      
      if (freshGalleries.length === 0) {
        console.log('❌ No fresh galleries found');
        return;
      }
      
      // View top 5 galleries
      for (let i = 0; i < Math.min(freshGalleries.length, 5); i++) {
        const success = await this.viewGallery(page, freshGalleries[i]);
        if (!success) continue;
        
        // Find related galleries
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        const related = await page.$$eval('a', links => 
          links
            .filter(link => link.href && link.href.includes('/galleries/') && !this.viewedGalleries.includes(link.href))
            .map(link => link.href)
            .slice(0, 3)
        );
        
        console.log('Related galleries: ' + related.length);
      }
      
      console.log('\n✅ Master Viewer complete');
      
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      await browser.close();
    }
  }
}

const viewer = new MasterViewer();
viewer.run().catch(console.error);