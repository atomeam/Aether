# PornPics Gallery Viewer Skill

## Overview

Skill to view PornPics gallery images at high resolution by clicking them, then use heart and play controls.

## How It Works

1. Navigate to gallery URL
2. Click first image to open fullscreen view
3. Heart button and pause/play button appear at top
4. Click heart to add to favorites
5. Click play to start slideshow
6. View all images automatically

## Key Points

- **Click first image** - Opens fullscreen view with controls
- **Heart button** - `.favorite-button.btn-frameless` class
- **Play button** - Located to the right of heart button
- **Controls appear** - Only visible after clicking an image
- **Slideshow mode** - Play button auto-advances through images

## Implementation Plan

### Step 1: Navigate to Gallery
```javascript
await page.goto(galleryUrl);
await page.waitForTimeout(3000);
```

### Step 2: Click First Image
```javascript
// Find and click first image
const firstImage = await page.$('img[src*="cdni"]');
await firstImage.click();
await page.waitForTimeout(3000);
```

### Step 3: Click Heart
```javascript
// Heart button appears after clicking image
const heartButton = await page.$('.favorite-button.btn-frameless');
await heartButton.click();
await page.waitForTimeout(2000);
```

### Step 4: Click Play
```javascript
// Play button is to the right of heart
const playButton = await page.$('.favorite-button.btn-frameless + button, button:has-text("Play")');
await playButton.click();
await page.waitForTimeout(2000);
```

### Step 5: View Slideshow
```javascript
// Slideshow auto-advances, just wait
await page.waitForTimeout(300000); // 5 minutes for full slideshow
```

## Scripts Available

- `click-first-heart-play.js` - Click first image, heart, and play

## Usage

```bash
node click-first-heart-play.js
```

## Remember

- Click first image to get controls to appear
- Heart button: `.favorite-button.btn-frameless`
- Play button is to the right of heart
- Controls only appear after clicking an image
- Play button starts automatic slideshow
