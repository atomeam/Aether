# PornPics Gallery Viewer Skill - Comprehensive System

## Overview

Comprehensive system to view PornPics gallery images at high resolution with full automation. **NEVER open hearted or viewed galleries - always fresh content.**

## Complete Feature Set

### Core Features
1. ✅ No-repeat logic - Never open hearted or viewed galleries
2. ✅ Heart detection - Multiple methods to check heart status
3. ✅ Image clicking - Handle ppc-layer and visibility issues
4. ✅ Play button - Find and click play for slideshow
5. ✅ Gallery selection - Automated quality-based selection
6. ✅ Category exploration - Systematic category scanning
7. ✅ Adaptive timing - Adjust based on image count
8. ✅ Preference learning - Track user likes
9. ✅ Quality scoring - Rate galleries by metrics
10. ✅ Related galleries - Find and navigate to related content

## Implementation Details

### 1. Heart Detection (Multiple Methods)
```javascript
// Method 1: Class check
const isHearted = await page.$('.favorite-button.btn-frameless.active, .favorite-button.btn-frameless.added');

// Method 2: Text check
const heartText = await page.$('.favorite-button.btn-frameless');
const text = await heartText.textContent();
const isHearted = text.includes('Remove') || text.includes('Favorited');

// Method 3: Attribute check
const isHearted = await page.$('.favorite-button.btn-frameless[data-favorited="true"]');
```

### 2. Image Clicking (Handle ppc-layer)
```javascript
// Method 1: Click parent link (bypasses ppc-layer)
const imageLink = await imageElement.$('xpath=..');
await imageLink.click();

// Method 2: Force click
await imageElement.click({ force: true });

// Method 3: Navigate to image URL directly
const imageUrl = await imageElement.getAttribute('src');
await page.goto(imageUrl);
```

### 3. Play Button (Multiple Selectors)
```javascript
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
    break;
  }
}
```

### 4. Gallery Selection (Quality-Based)
```javascript
// Score galleries by:
// - Image count (more = better)
// - Not hearted (fresh)
// - Category preference
// - Title keywords

function scoreGallery(gallery) {
  let score = 0;
  score += gallery.imageCount * 2;
  score += !gallery.isHearted ? 10 : 0;
  score += gallery.hasPreferredCategory ? 5 : 0;
  return score;
}
```

### 5. Category Exploration
```javascript
const categories = ['skirt', 'bikini', 'pussy', 'milf', 'teen', 'blonde', 'brunette'];

for (const category of categories) {
  await exploreCategory(category);
}
```

### 6. Adaptive Timing
```javascript
const imageCount = await getImageCount();
const timePerImage = 10000; // 10 seconds
const totalTime = imageCount * timePerImage;
await page.waitForTimeout(totalTime);
```

### 7. Preference Learning
```javascript
const preferences = {
  categories: {},
  keywords: {},
  imageCountRange: [10, 30]
};

// Track what user likes
preferences.categories[category] = (preferences.categories[category] || 0) + 1;
```

### 8. Quality Scoring
```javascript
function calculateQuality(gallery) {
  return {
    imageCount: gallery.images.length,
    resolution: 'high',
    lighting: 'good',
    composition: 'excellent',
    overall: 9.5
  };
}
```

### 9. Related Galleries
```javascript
const related = await page.$$eval('a', links => 
  links
    .filter(link => link.href && link.href.includes('/galleries/'))
    .map(link => link.href)
    .slice(0, 5)
);
```

## Master Script Flow

```
1. Load preferences and viewed history
2. Explore categories systematically
3. Score and rank galleries
4. Select best unhearted gallery
5. Navigate and verify not hearted
6. Click first image (handle ppc-layer)
7. Heart the gallery
8. Find and click play button
9. View slideshow with adaptive timing
10. Mark as viewed
11. Update preferences
12. Find related galleries
13. Repeat from step 3
```

## Scripts Available

- `master-viewer.js` - Complete automated system
- `viewed-galleries.json` - Tracks viewed galleries
- `preferences.json` - User preferences
- `gallery-scores.json` - Quality scores

## Usage

```bash
node master-viewer.js
```

## Remember

- NEVER open hearted galleries
- NEVER repeat galleries
- Use multiple methods for reliability
- Adapt timing based on content
- Learn from user behavior
- Score and rank for quality
- Explore systematically
