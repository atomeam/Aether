# PornPics Gallery Viewer Skill - Complete System

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
9. ✅ Smart timing - First and last images get 2x viewing time
10. ✅ Related galleries - Find and navigate to related content

### Control Features
1. ✅ Keyboard skip - Press 's' or 'n' to skip current gallery
2. ✅ Skip image - Press 'i' to skip current image only
3. ✅ Keyboard quit - Press 'q' to stop viewing
4. ✅ Pause/Resume - Press space to pause/resume slideshow
5. ✅ Speed control - Press + to speed up, - to slow down (0.5x to 3x)
6. ✅ Fullscreen - Auto-enter fullscreen when slideshow starts
7. ✅ Favorites - Press 'h' to add current gallery to favorites
8. ✅ Favorites mode - Press 'p' to play from favorites only
9. ✅ History tracking - Press 'r' to view recently viewed galleries
10. ✅ Category selection - Press 'c' to see available categories
11. ✅ Shuffle mode - Press 'u' to toggle random gallery selection
12. ✅ Loop mode - Press 'l' to loop current gallery repeatedly
13. ✅ Random image order - Press 'o' to shuffle images within gallery
14. ✅ Category-only mode - Press 'k' to stay in current category only
15. ✅ Auto-skip low quality - Press 'z' to toggle quality filtering
16. ✅ Gallery rating - Press 1-5 to rate current gallery
17. ✅ Brightness control - Press b/B to decrease/increase brightness
18. ✅ Contrast control - Press t/T to decrease/increase contrast
19. ✅ Manual navigation - Arrow keys for next/prev image

## Implementation Details

### Heart Detection (Multiple Methods)
```javascript
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
```

### Image Clicking (Handle ppc-layer)
```javascript
// Method 1: Click parent link (bypasses ppc-layer)
const images = await page.$$('img[src*="cdni"]');
if (images.length > 0) {
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
  // Method 3: Navigate to URL directly
  const imageUrl = await images[0].getAttribute('src');
  await page.goto(imageUrl);
  await page.waitForTimeout(3000);
  return true;
}
```

### Play Button (Correct Selector)
```javascript
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
```

### Smart Timing
```javascript
// First and last images get 2x viewing time
const imageCount = Math.min(gallery.imageCount, 10);
const timePerImage = viewingTime / imageCount;

for (let i = 0; i < imageCount; i++) {
  const isFirstOrLast = (i === 0 || i === imageCount - 1);
  const adjustedTime = isFirstOrLast ? timePerImage * 2 : timePerImage;
  
  console.log('📷 Image ' + (i + 1) + '/' + imageCount + (isFirstOrLast ? ' (extended)' : ''));
  
  const adjustedWait = (adjustedTime * 1000) / speedMultiplier;
  await page.waitForTimeout(adjustedWait);
}
```

### Gallery Selection (Quality-Based)
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
```

### Favorites System
```javascript
// Add to favorites
if (this.currentGallery && !this.favoriteGalleries.includes(this.currentGallery.href)) {
  this.favoriteGalleries.push(this.currentGallery.href);
  this.saveJson('favorites.json', this.favoriteGalleries);
}

// Play from favorites mode
if (this.favoritesOnlyMode && this.favoriteGalleries.length > 0) {
  for (const galleryUrl of this.favoriteGalleries) {
    await viewGallery(galleryUrl);
  }
}
```

### History Tracking
```javascript
// Add to history after viewing
if (!this.viewHistory.includes(gallery.href)) {
  this.viewHistory.push(gallery.href);
  this.saveJson('history.json', this.viewHistory);
}

// View recent history
this.viewHistory.slice(-5).forEach((url, i) => {
  console.log('   ' + (i + 1) + '. ' + url);
});
```

### Shuffle Mode
```javascript
// Fisher-Yates shuffle
for (let i = array.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [array[i], array[j]] = [array[j], array[i]];
}
```

## Master Script Flow

```
1. Load preferences, viewed galleries, favorites, history
2. Check if favorites mode is enabled
3. If favorites mode: play from favorites only
4. If normal mode: explore category
5. Shuffle galleries if shuffle mode enabled
6. Score and rank galleries
7. Select best unhearted gallery
8. Navigate and verify not hearted
9. Click first image (handle ppc-layer)
10. Enter fullscreen
11. Heart the gallery
12. Find and click play button
13. View slideshow with smart timing
14. Mark as viewed
15. Add to history
16. Update preferences
17. Find related galleries
18. Repeat from step 8
```

## Scripts Available

- `master-viewer.js` - Complete automated system
- `viewed-galleries.json` - Tracks all viewed galleries
- `preferences.json` - User preferences and settings
- `favorites.json` - Saved favorite galleries
- `history.json` - Recently viewed galleries
- `gallery-ratings.json` - Gallery ratings (1-5 stars)
- `saved-images.json` - Downloaded images tracking

## Usage

```bash
node master-viewer.js
```

## Keyboard Controls

- `s` or `n` - Skip current gallery
- `i` - Skip current image only
- `q` - Quit
- `space` - Pause/Resume slideshow
- `+` - Speed up slideshow
- `-` - Slow down slideshow
- `f` - Toggle fullscreen
- `h` - Add to favorites
- `p` - Play from favorites only
- `r` - View history (recently viewed)
- `c` - Change category
- `u` - Toggle shuffle mode
- `l` - Toggle loop mode
- `o` - Toggle random image order
- `k` - Toggle category-only mode
- `z` - Toggle auto-skip low quality
- `d` - Download current image
- `1-5` - Rate current gallery (1-5 stars)
- `b` - Decrease brightness
- `B` - Increase brightness
- `t` - Decrease contrast
- `T` - Increase contrast
- `→` - Next image (manual)
- `←` - Previous image (manual)

## Remember

- NEVER open hearted galleries
- NEVER repeat galleries
- Click first image to get controls to appear
- Heart button: `.gall-info-favorite`
- Play button: `.pswp__button--slideshow-button`
- Controls only appear after clicking an image
- Play button starts automatic slideshow
- First and last images get extended viewing time
- Favorites are saved to favorites.json
- History is saved to history.json