/**
 * Masturbuddy - Your Personal Gallery Companion
 * Complete automated system with collaborative learning, quality analysis,
 * adaptive timing, and preference synchronization
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
    
    // Force viewingTime to 120
    const loadedPreferences = this.loadJson(this.preferencesFile, {});
    this.preferences = { ...defaultPreferences, ...loadedPreferences, viewingTime: 120 };
    
    this.scores = this.loadJson(this.scoresFile, {});
    
    this.categories = ['skirt', 'bikini', 'pussy', 'milf', 'teen', 'blonde', 'brunette'];
    this.shouldSkip = false;
    this.keepViewing = true;
    this.isPaused = false;
    this.speedMultiplier = 1.0;
    this.favoriteGalleries = this.loadJson('favorites.json', []);
    this.currentGallery = null;
    this.viewHistory = this.loadJson('history.json', []);
    this.shuffleMode = false;
    this.favoritesOnlyMode = false;
    this.currentCategory = 'bikini'; // Start with bikini instead of skirt
    this.loopMode = false;
    this.randomImageOrder = false;
    this.categoryOnlyMode = false;
    this.skipLowQuality = true;
    this.minImageCount = 15;
    this.currentImageIndex = 0;
    this.savedImages = this.loadJson('saved-images.json', []);
    this.galleryRatings = this.loadJson('gallery-ratings.json', {});
    this.brightness = 100;
    this.contrast = 100;
    this.skipImage = false;
    this.collectingFeedback = null;
    
    // Collaborative learning
    this.userPreferences = this.loadJson('user-preferences.json', {
      likedKeywords: {},
      dislikedKeywords: {},
      likedCategories: {},
      preferredImageCount: [10, 30],
      preferredFeatures: {
        hasFace: true,
        cleanBackground: true,
        goodLighting: true,
        naturalLook: true
      }
    });
    
    // Current gallery analysis (for feedback)
    this.currentImageScores = [];
    this.currentImageUrls = [];
    
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
    console.log('   "i" - Skip current image only');
    console.log('   "q" - Quit');
    console.log('   " " (space) - Pause/Resume slideshow');
    console.log('   "+" - Speed up slideshow');
    console.log('   "-" - Slow down slideshow');
    console.log('   "f" - Toggle fullscreen (use browser F11)');
    console.log('   "h" - Add to favorites');
    console.log('   "p" - Play from favorites only');
    console.log('   "r" - View history (recently viewed)');
    console.log('   "c" - Change category');
    console.log('   "u" - Toggle shuffle mode');
    console.log('   "l" - Toggle loop mode');
    console.log('   "o" - Toggle random image order');
    console.log('   "k" - Toggle category-only mode');
    console.log('   "z" - Toggle auto-skip low quality');
    console.log('   "d" - Download current image');
    console.log('   "1-5" - Rate current gallery (1-5 stars)');
    console.log('   "b" - Decrease brightness');
    console.log('   "B" - Increase brightness');
    console.log('   "t" - Decrease contrast');
    console.log('   "T" - Increase contrast');
    console.log('   "→" - Next image (manual)');
    console.log('   "←" - Previous image (manual)');
    console.log('   Any text - Tell me what you thought (I\'m learning!)\n');
    
    rl.on('line', (input) => {
      const cmd = input.toLowerCase().trim();
      
      if (cmd === 's' || cmd === 'n') {
        this.shouldSkip = true;
        console.log('⏭️  Skipping gallery...');
      } else if (cmd === 'i') {
        this.skipImage = true;
        console.log('⏭️  Skipping image...');
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
      } else if (cmd === 'h') {
        if (this.currentGallery && !this.favoriteGalleries.includes(this.currentGallery.href)) {
          this.favoriteGalleries.push(this.currentGallery.href);
          this.saveJson('favorites.json', this.favoriteGalleries);
          console.log('❤️  Added to favorites (' + this.favoriteGalleries.length + ' total)');
        } else {
          console.log('❤️  Already in favorites or no gallery loaded');
        }
      } else if (cmd === 'p') {
        this.favoritesOnlyMode = !this.favoritesOnlyMode;
        console.log(this.favoritesOnlyMode ? '❤️  Favorites mode ON' : '🌐 Normal mode ON');
      } else if (cmd === 'r') {
        console.log('📜 Recent history:');
        this.viewHistory.slice(-5).forEach((url, i) => {
          console.log('   ' + (i + 1) + '. ' + url);
        });
      } else if (cmd === 'c') {
        console.log('📂 Available categories: ' + this.categories.join(', '));
        console.log('   Current: ' + this.currentCategory);
      } else if (cmd === 'u') {
        this.shuffleMode = !this.shuffleMode;
        console.log(this.shuffleMode ? '🔀 Shuffle mode ON' : '📋 Sequential mode ON');
      } else if (cmd === 'l') {
        this.loopMode = !this.loopMode;
        console.log(this.loopMode ? '🔄 Loop mode ON' : '➡️  Sequential mode ON');
      } else if (cmd === 'o') {
        this.randomImageOrder = !this.randomImageOrder;
        console.log(this.randomImageOrder ? '🔀 Random image order ON' : '📋 Sequential image order ON');
      } else if (cmd === 'k') {
        this.categoryOnlyMode = !this.categoryOnlyMode;
        console.log(this.categoryOnlyMode ? '📂 Category-only mode ON' : '🌐 Related galleries ON');
      } else if (cmd === 'z') {
        this.skipLowQuality = !this.skipLowQuality;
        console.log(this.skipLowQuality ? '✅ Auto-skip low quality ON' : '⚠️  Auto-skip low quality OFF');
      } else if (cmd === 'd') {
        console.log('💾 Download feature - would save current image');
      } else if (['1', '2', '3', '4', '5'].includes(cmd)) {
        if (this.currentGallery) {
          const rating = parseInt(cmd);
          this.galleryRatings[this.currentGallery.href] = rating;
          this.saveJson('gallery-ratings.json', this.galleryRatings);
          console.log('⭐ Rated ' + rating + '/5 stars');
        } else {
          console.log('⚠️  No gallery loaded to rate');
        }
      } else if (input === 'b') {
        this.brightness = Math.max(this.brightness - 10, 50);
        console.log('🔆 Brightness: ' + this.brightness + '%');
      } else if (input === 'B') {
        this.brightness = Math.min(this.brightness + 10, 150);
        console.log('🔆 Brightness: ' + this.brightness + '%');
      } else if (input === 't') {
        this.contrast = Math.max(this.contrast - 10, 50);
        console.log('🎨 Contrast: ' + this.contrast + '%');
      } else if (input === 'T') {
        this.contrast = Math.min(this.contrast + 10, 150);
        console.log('🎨 Contrast: ' + this.contrast + '%');
      } else if (input === '→') {
        console.log('➡️  Next image (manual)');
      } else if (input === '←') {
        console.log('⬅️  Previous image (manual)');
      } else if (input.length > 0) {
        // Natural language feedback - Masturbuddy learns from anything you type
        this.processNaturalFeedback(input);
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
    // Use the same logic as getAllImageUrls for consistency
    const imageUrls = await this.getAllImageUrls(page);
    return imageUrls.length;
  }
  
  async analyzeImageQuality(page, imageUrl) {
    // Lightweight browser-based quality analysis
    try {
      const img = await page.$('img[src="' + imageUrl + '"]');
      if (!img) return { score: 50, metrics: {} };
      
      // Get image dimensions
      const rect = await img.boundingBox();
      const resolution = rect.width * rect.height;
      
      // Get natural size
      const naturalWidth = await img.evaluate(img => img.naturalWidth);
      const naturalHeight = await img.evaluate(img => img.naturalHeight);
      const naturalResolution = naturalWidth * naturalHeight;
      
      // Aspect ratio (prefer standard ratios)
      const aspectRatio = naturalWidth / naturalHeight;
      const standardRatios = [0.75, 1.0, 1.33, 1.5, 1.77, 2.0];
      const closestRatio = standardRatios.reduce((prev, curr) => 
        Math.abs(curr - aspectRatio) < Math.abs(prev - aspectRatio) ? curr : prev
      );
      const ratioScore = 1 - Math.abs(aspectRatio - closestRatio) * 2;
      
      // Resolution score (higher is better, up to 2MP)
      const resolutionScore = Math.min(naturalResolution / 2000000, 1) * 100;
      
      // Blur detection (can't do Laplacian in browser, use file size as proxy)
      // Larger files usually = higher quality
      const fileSize = await img.evaluate(img => {
        // Get file size from network (approximate)
        return img.src.length * 0.5; // Rough estimate
      });
      const sizeScore = Math.min(fileSize / 50000, 1) * 100;
      
      // Calculate overall score
      const score = (resolutionScore * 0.4) + (sizeScore * 0.3) + (ratioScore * 100 * 0.3);
      
      return {
        score: Math.max(0, Math.min(100, score)),
        metrics: {
          resolution: naturalResolution,
          aspectRatio: aspectRatio.toFixed(2),
          fileSize: fileSize
        }
      };
    } catch (e) {
      return { score: 50, metrics: {} };
    }
  }
  
  async getAllImageUrls(page) {
    // Get images from the current gallery page
    // Scroll to load all images in the gallery
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    const imageUrls = new Set();
    
    // Get all cdni images (these are the actual gallery images)
    const allImages = await page.$$eval('img[src*="cdni"]', imgs => imgs.map(img => img.src));
    
    // Filter to unique URLs
    allImages.forEach(url => imageUrls.add(url));
    
    // Limit to reasonable gallery size (15-20 is typical)
    const urls = Array.from(imageUrls);
    return urls.slice(0, 20);
  }
  
  calculateTiming(qualityScore) {
    // Higher quality = longer viewing time
    // Base time: 8 seconds
    // Quality multiplier: 0.5x to 2.0x
    
    const baseTime = 8000;
    const multiplier = 0.5 + (qualityScore / 100) * 1.5;
    
    return baseTime * multiplier / this.speedMultiplier;
  }
  
  shuffleArray(array) {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  scoreGallery(gallery) {
    let score = 0;
    score += gallery.imageCount * 2;
    score += !gallery.isHearted ? 10 : 0;
    score += this.preferences.categories[gallery.category] ? 5 : 0;
    
    // Penalize system skip keywords
    for (const keyword of this.preferences.skipKeywords) {
      if (gallery.text.toLowerCase().includes(keyword)) {
        score -= 50;
      }
    }
    
    // Bonus for user-liked keywords
    for (const keyword of Object.keys(this.userPreferences.likedKeywords)) {
      if (gallery.text.toLowerCase().includes(keyword)) {
        score += this.userPreferences.likedKeywords[keyword] * 5;
      }
    }
    
    // Penalize user-disliked keywords
    for (const keyword of Object.keys(this.userPreferences.dislikedKeywords)) {
      if (gallery.text.toLowerCase().includes(keyword)) {
        score -= this.userPreferences.dislikedKeywords[keyword] * 10;
      }
    }
    
    // Bonus for liked category
    if (this.userPreferences.likedCategories[gallery.category]) {
      score += this.userPreferences.likedCategories[gallery.category] * 3;
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
    
    // Auto-skip low quality if enabled
    if (this.skipLowQuality && gallery.imageCount < this.minImageCount) {
      console.log('⏭️  Skipping (low quality: only ' + gallery.imageCount + ' images)');
      return true;
    }
    
    // Skip low-rated galleries
    if (this.galleryRatings[gallery.href] && this.galleryRatings[gallery.href] < 3) {
      console.log('⏭️  Skipping (low rating: ' + this.galleryRatings[gallery.href] + '/5)');
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
  

  
  processNaturalFeedback(input) {
    if (!this.currentGallery) return;
    
    const feedback = input.toLowerCase();
    const galleryTitle = this.currentGallery.text.toLowerCase();
    const category = this.currentGallery.category;
    
    // Detect sentiment (simple keyword-based)
    const positiveWords = ['liked', 'loved', 'hot', 'good', 'great', 'amazing', 'beautiful', 'sexy', 'nice', 'perfect', 'love', 'like', 'enjoyed', 'awesome'];
    const negativeWords = ['disliked', 'hated', 'bad', 'ugly', 'boring', 'not', 'didn\'t', 'hate', 'dislike', 'awful', 'terrible', 'worst'];
    
    let isPositive = false;
    let isNegative = false;
    
    positiveWords.forEach(word => {
      if (feedback.includes(word)) isPositive = true;
    });
    
    negativeWords.forEach(word => {
      if (feedback.includes(word)) isNegative = true;
    });
    
    // If no clear sentiment, assume positive (user is sharing what they liked)
    if (!isPositive && !isNegative) {
      isPositive = true;
    }
    
    // Extract keywords from feedback
    const words = feedback.split(/\s+/).filter(w => w.length > 2);
    
    if (isPositive) {
      // Track liked keywords
      words.forEach(word => {
        this.userPreferences.likedKeywords[word] = (this.userPreferences.likedKeywords[word] || 0) + 1;
      });
      
      // Track liked category
      this.userPreferences.likedCategories[category] = (this.userPreferences.likedCategories[category] || 0) + 1;
      
      // Extract keywords from gallery title and boost them
      const processTitleWords = galleryTitle.split(/\s+/);
      processTitleWords.forEach(word => {
        if (word.length > 2) {
          this.userPreferences.likedKeywords[word] = (this.userPreferences.likedKeywords[word] || 0) + 0.5;
        }
      });
      
      console.log('💕 I learned: ' + input);
      console.log('   I\'ll look for more like this!');
      
    } else if (isNegative) {
      // Track disliked keywords
      words.forEach(word => {
        this.userPreferences.dislikedKeywords[word] = (this.userPreferences.dislikedKeywords[word] || 0) + 1;
      });
      
      // Extract keywords from gallery title and penalize them
      const processTitleWordsNegative = galleryTitle.split(/\s+/);
      processTitleWordsNegative.forEach(word => {
        if (word.length > 2) {
          this.userPreferences.dislikedKeywords[word] = (this.userPreferences.dislikedKeywords[word] || 0) + 0.5;
        }
      });
      
      console.log('💔 I learned: ' + input);
      console.log('   I\'ll avoid this in the future!');
    }
    
    this.saveJson('user-preferences.json', this.userPreferences);
    
    // Move to next gallery
    this.shouldSkip = true;
    console.log('👉 Moving to next gallery...\n');
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
    console.log('Rating: ' + (this.galleryRatings[gallery.href] || 'Not rated') + '/5');
    
    // Set current gallery for keyboard controls
    this.currentGallery = gallery;
    this.currentImageIndex = 0;
    
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
    
    // PRE-SCAN: Get all image URLs and analyze quality
    console.log('🔍 Pre-scanning images for quality analysis...');
    const imageUrls = await this.getAllImageUrls(page);
    console.log('Found ' + imageUrls.length + ' images');
    
    // Store for feedback
    this.currentImageUrls = imageUrls;
    
    // Analyze quality for each image
    const imageScores = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      console.log('Analyzing image ' + (i + 1) + '/' + imageUrls.length + '...');
      const quality = await this.analyzeImageQuality(page, url);
      imageScores.push({ url, score: quality.score, metrics: quality.metrics });
    }
    
    // Store for feedback
    this.currentImageScores = imageScores;
    
    // Sort by quality score (highest first)
    imageScores.sort((a, b) => b.score - a.score);
    
    console.log('✅ Quality analysis complete');
    console.log('Best image score: ' + imageScores[0].score.toFixed(1));
    console.log('Average score: ' + (imageScores.reduce((sum, img) => sum + img.score, 0) / imageScores.length).toFixed(1));
    
    // Tell user what the system liked
    console.log('\n🤖 What I liked about this gallery:');
    console.log('   Title: ' + gallery.text);
    console.log('   Category: ' + gallery.category);
    console.log('   Image count: ' + imageUrls.length + ' (your preference: ' + this.userPreferences.preferredImageCount.join('-') + ')');
    console.log('   Quality: ' + imageScores[0].score.toFixed(1) + '/100 (best image)');
    
    // Extract keywords from title
    const galleryKeywords = gallery.text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const likedMatches = galleryKeywords.filter(k => this.userPreferences.likedKeywords[k]);
    if (likedMatches.length > 0) {
      console.log('   Matches your likes: ' + likedMatches.join(', '));
    }
    
    const dislikedMatches = galleryKeywords.filter(k => this.userPreferences.dislikedKeywords[k]);
    if (dislikedMatches.length > 0) {
      console.log('   ⚠️  Contains your dislikes: ' + dislikedMatches.join(', '));
    }
    
    // Filter out low-quality images (score < 30)
    const qualityThreshold = 30;
    const highQualityImages = imageScores.filter(img => img.score >= qualityThreshold);
    console.log('High-quality images: ' + highQualityImages.length + '/' + imageScores.length);
    
    if (highQualityImages.length === 0) {
      console.log('❌ No high-quality images found, skipping gallery');
      return false;
    }
    
    // Use high-quality images for viewing
    const imagesToView = this.randomImageOrder ? 
      this.shuffleArray(highQualityImages) : 
      highQualityImages;
    
    console.log('🎬 Starting manual slideshow with ' + imagesToView.length + ' images');
    
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
    
    // Apply brightness/contrast if adjusted
    if (this.brightness !== 100 || this.contrast !== 100) {
      await page.addStyleTag({
        content: `.pswp__img { filter: brightness(${this.brightness}%) contrast(${this.contrast}%); }`
      });
      console.log('🎨 Applied brightness: ' + this.brightness + '%, contrast: ' + this.contrast + '%');
    }
    
    // MANUAL SLIDESHOW: Don't use PhotoSwipe play button
    console.log('🎬 Manual slideshow with quality-based timing');
    
    for (let idx = 0; idx < imagesToView.length; idx++) {
      const image = imagesToView[idx];
      this.currentImageIndex = idx + 1;
      
      const timing = this.calculateTiming(image.score);
      console.log('📷 Image ' + (idx + 1) + '/' + imagesToView.length + ' | Quality: ' + image.score.toFixed(0) + '/100 | Time: ' + (timing / 1000).toFixed(1) + 's');
      
      // Wait with quality-based timing
      const totalWait = timing;
      for (let elapsed = 0; elapsed < totalWait; elapsed += 1000) {
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
        
        if (this.skipImage) {
          console.log('⏭️  Skipped image');
          this.skipImage = false;
          break;
        }
        
        while (this.isPaused) {
          console.log('⏸️  Paused...');
          await page.waitForTimeout(1000);
        }
        
        await page.waitForTimeout(1000);
      }
      
      // Click next manually
      if (idx < imagesToView.length - 1) {
        const nextButton = await page.$('.pswp__button--arrow--next');
        if (nextButton) {
          await nextButton.click();
          await page.waitForTimeout(2000);
        } else {
          console.log('⚠️  No next button found');
          break;
        }
      }
    }
    
    // Record like (since we didn't skip)
    this.recordLike(gallery);
    
    // Add to history
    if (!this.viewHistory.includes(gallery.href)) {
      this.viewHistory.push(gallery.href);
      this.saveJson('history.json', this.viewHistory);
    }
    
    // Mark as viewed
    this.viewedGalleries.push(gallery.href);
    this.saveJson(this.viewedFile, this.viewedGalleries);
    
    this.preferences.totalViewed++;
    this.saveJson(this.preferencesFile, this.preferences);
    
    console.log('✅ Gallery complete');
    
    // Masturbuddy shares what it thought
    console.log('\n💭 Masturbuddy\'s thoughts:');
    console.log('   I liked: ' + gallery.text);
    console.log('   The quality was good (' + this.currentImageScores[0].score.toFixed(1) + '/100)');
    console.log('   ' + this.currentImageUrls.length + ' images in this gallery');
    
    // Check for user preferences
    const galleryTitleKeywords = gallery.text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const likedMatchesThoughts = galleryTitleKeywords.filter(k => this.userPreferences.likedKeywords[k]);
    if (likedMatchesThoughts.length > 0) {
      console.log('   This matches what you like: ' + likedMatchesThoughts.join(', '));
    }
    
    console.log('\n💬 Tell me what you thought (or press "s" to skip):');
    console.log('   Type anything - I\'m learning from you!');
    
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
      console.log('🚀 Masturbuddy - Your Personal Gallery Companion');
      console.log('Viewed galleries: ' + this.viewedGalleries.length);
      console.log('Favorites: ' + this.favoriteGalleries.length);
      console.log('Mode: ' + (this.favoritesOnlyMode ? 'Favorites only' : 'Normal'));
      
      // If favorites mode, play from favorites
      if (this.favoritesOnlyMode && this.favoriteGalleries.length > 0) {
        console.log('\n❤️  Playing from favorites...');
        
        for (const galleryUrl of this.favoriteGalleries) {
          if (!this.keepViewing) break;
          
          await page.goto(galleryUrl);
          await page.waitForTimeout(2000);
          
          const title = await page.$eval('h1, .gall-info-title, title', el => el.textContent).catch(() => 'Gallery');
          const imageCount = await this.getImageCount(page);
          
          const gallery = {
            href: galleryUrl,
            text: title,
            category: 'favorites',
            isHearted: false,
            imageCount: imageCount,
            score: 10
          };
          
          await this.viewGallery(page, gallery);
          console.log('\n✅ Gallery complete');
        }
        
        console.log('\n✅ Favorites complete');
        return;
      }
      
      // Normal mode: find gallery from category
      console.log('\n📂 Finding starting gallery in ' + this.currentCategory + '...');
      await page.goto('https://www.pornpics.com/' + this.currentCategory + '/');
      await page.waitForTimeout(3000);
      
      // Get all gallery links
      const allGalleries = await page.$$eval('a', links => 
        links
          .filter(link => link.href && link.href.includes('/galleries/'))
          .map(link => link.href)
          .slice(0, 20)
      );
      
      console.log('Total galleries: ' + allGalleries.length);
      
      // Shuffle if enabled
      if (this.shuffleMode) {
        for (let i = allGalleries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allGalleries[i], allGalleries[j]] = [allGalleries[j], allGalleries[i]];
        }
        console.log('🔀 Shuffled galleries');
      }
      
      // Find first unhearted gallery
      let currentGalleryUrl = null;
      let currentTitle = null;
      
      for (const galleryUrl of allGalleries) {
        if (this.viewedGalleries.includes(galleryUrl)) {
          continue;
        }
        
        await page.goto(galleryUrl);
        await page.waitForTimeout(2000);
        
        const isHearted = await this.isHearted(page);
        if (isHearted) {
          console.log('❌ Hearted');
          continue;
        }
        
        const title = await page.$eval('h1, .gall-info-title, title', el => el.textContent).catch(() => 'Gallery');
        
        console.log('✅ Unhearted: ' + title);
        currentGalleryUrl = galleryUrl;
        currentTitle = title;
        break;
      }
      
      if (!currentGalleryUrl) {
        console.log('❌ No fresh galleries found in category');
        return;
      }
      
      console.log('✅ Selected: ' + currentTitle);
      
      // Continuous viewing loop
      let galleryCount = 0;
      const maxGalleries = this.loopMode ? 1000 : 100; // Higher limit for loop mode
      
      while (this.keepViewing && galleryCount < maxGalleries) {
        galleryCount++;
        
        // Already on the gallery page from heart check
        // Get image count
        const imageCount = await this.getImageCount(page);
        
        console.log('\n🖼️  Gallery ' + galleryCount + '/' + (this.loopMode ? '∞' : maxGalleries));
        console.log('Title: ' + currentTitle);
        console.log('Images: ' + imageCount);
        
        // View this gallery
        const gallery = {
          href: currentGalleryUrl,
          text: currentTitle,
          category: this.currentCategory,
          isHearted: false,
          imageCount: imageCount,
          score: 10
        };
        
        const success = await this.viewGallery(page, gallery);
        if (!success) {
          console.log('Skipped, finding next...');
        }
        
        console.log('\n✅ Gallery complete');
        
        // Find next gallery
        if (this.categoryOnlyMode) {
          // Stay in current category only
          console.log('\n🔍 Finding next gallery in ' + this.currentCategory + '...');
          await page.goto('https://www.pornpics.com/' + this.currentCategory + '/');
          await page.waitForTimeout(3000);
          
          const freshGalleries = await page.$$eval('a', links =>
            links
              .filter(link => link.href && link.href.includes('/galleries/'))
              .map(link => link.href)
              .slice(0, 10)
          );
          
          if (this.shuffleMode) {
            for (let i = freshGalleries.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [freshGalleries[i], freshGalleries[j]] = [freshGalleries[j], freshGalleries[i]];
            }
          }
          
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
            
            currentGalleryUrl = galleryUrl;
            currentTitle = title;
            break;
          }
          
          if (!currentGalleryUrl) {
            console.log('❌ No fresh galleries found in category, stopping');
            break;
          }
        } else {
          // Use related galleries
          console.log('\n🔍 Finding next gallery from related...');
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(2000);
          
          let nextGalleryUrl = null;
          let nextTitle = null;
          
          for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 500));
            await page.waitForTimeout(1000);
            
            const visibleGalleries = await page.$$eval('a', (links) =>
              links
                .filter(link => {
                  const rect = link.getBoundingClientRect();
                  return rect.top > 0 && rect.top < window.innerHeight &&
                    link.href &&
                    link.href.includes('/galleries/');
                })
                .map(link => link.href)
                .slice(0, 5)
            );
            
            const filteredGalleries = visibleGalleries.filter(url =>
              url !== currentGalleryUrl && !this.viewedGalleries.includes(url)
            );
            
            for (const galleryUrl of filteredGalleries) {
              await page.goto(galleryUrl);
              await page.waitForTimeout(2000);
              
              const isHearted = await this.isHearted(page);
              if (isHearted) {
                console.log('❌ Hearted: ' + galleryUrl);
                continue;
              }
              
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
            await page.goto('https://www.pornpics.com/' + this.currentCategory + '/');
            await page.waitForTimeout(3000);
            
            const freshGalleries = await page.$$eval('a', links =>
              links
                .filter(link => link.href && link.href.includes('/galleries/'))
                .map(link => link.href)
                .slice(0, 10)
            );
            
            if (this.shuffleMode) {
              for (let i = freshGalleries.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [freshGalleries[i], freshGalleries[j]] = [freshGalleries[j], freshGalleries[i]];
              }
            }
            
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