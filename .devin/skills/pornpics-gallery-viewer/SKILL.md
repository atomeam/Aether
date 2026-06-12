# PornPics Gallery Viewer Skill

## Overview

Skill to view PornPics gallery images at high resolution by clicking them, then use heart and play controls. **NEVER open hearted or viewed galleries - always fresh content.**

## How It Works

1. Check if gallery is already hearted (skip if yes)
2. Check if gallery was already viewed (skip if yes)
3. Navigate to gallery URL
4. Click first image to open fullscreen view
5. Heart button and pause/play button appear at top
6. Click heart to add to favorites
7. Click play to start slideshow
8. View all images automatically
9. Mark gallery as viewed

## Key Points

- **NEVER open hearted galleries** - Check heart status first
- **NEVER repeat galleries** - Track viewed galleries
- **Click first image** - Opens fullscreen view with controls
- **Heart button** - `.favorite-button.btn-frameless` class
- **Play button** - Located to the right of heart button
- **Controls appear** - Only visible after clicking an image
- **Slideshow mode** - Play button auto-advances through images
- **Track viewed** - Save to viewed-galleries.json

## Implementation Plan

### Step 0: Check Heart Status
```javascript
// Check if gallery is already hearted
const isHearted = await page.$('.favorite-button.btn-frameless.active, .favorite-button.btn-frameless.added');
if (isHearted) {
  console.log('Already hearted, skipping');
  return;
}
```

### Step 1: Check Viewed Status
```javascript
// Load viewed galleries from file
const viewedFile = 'viewed-galleries.json';
let viewedGalleries = [];
if (fs.existsSync(viewedFile)) {
  viewedGalleries = JSON.parse(fs.readFileSync(viewedFile, 'utf-8'));
}

// Check if already viewed
if (viewedGalleries.includes(galleryUrl)) {
  console.log('Already viewed, skipping');
  return;
}
```

### Step 2: Navigate to Gallery
```javascript
await page.goto(galleryUrl);
await page.waitForTimeout(3000);
```

### Step 3: Click First Image
```javascript
const firstImage = await page.$('img[src*="cdni"]');
await firstImage.click();
await page.waitForTimeout(3000);
```

### Step 4: Click Heart
```javascript
const heartButton = await page.$('.favorite-button.btn-frameless');
await heartButton.click();
await page.waitForTimeout(2000);
```

### Step 5: Click Play
```javascript
const playButton = await page.$('.favorite-button.btn-frameless + button');
await playButton.click();
await page.waitForTimeout(2000);
```

### Step 6: View Slideshow
```javascript
await page.waitForTimeout(300000);
```

### Step 7: Mark as Viewed
```javascript
viewedGalleries.push(galleryUrl);
fs.writeFileSync(viewedFile, JSON.stringify(viewedGalleries, null, 2));
```

## Scripts Available

- `click-first-heart-play.js` - Click first image, heart, and play
- `viewed-galleries.json` - Tracks all viewed galleries

## Usage

```bash
node click-first-heart-play.js
```

## Remember

- **NEVER open hearted galleries** - Check heart status first
- **NEVER repeat galleries** - Track viewed galleries
- Click first image to get controls to appear
- Heart button: `.favorite-button.btn-frameless`
- Play button is to the right of heart
- Controls only appear after clicking an image
- Play button starts automatic slideshow
