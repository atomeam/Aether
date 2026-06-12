# PornPics Gallery Viewer Skill

## Overview

Simple skill to view PornPics gallery images at high resolution by clicking them.

## How It Works

1. Navigate to gallery URL
2. Find all image elements (`a img`)
3. Click each image to open at high resolution
4. View for 15 seconds
5. Go back to gallery
6. Repeat for all images
7. Heart the gallery (`.gall-info-favorite`)
8. Find related galleries

## Key Points

- **Click images directly** - This opens them at high resolution/fullscreen
- **No screenshots** - Just click and view
- **15 seconds per image** - Proper viewing time
- **Heart after viewing** - Add to favorites
- **Find related** - Navigate to next gallery

## Implementation

```javascript
// Find all images
const images = await page.$$('a img');

// Click each image
for (let i = 0; i < images.length; i++) {
  await images[i].click();
  await page.waitForTimeout(15000); // 15 seconds
  await page.goBack();
  await page.waitForTimeout(2000);
}

// Heart the gallery
const heartButton = await page.$('.gall-info-favorite');
await heartButton.click();
```

## Scripts Available

- `click-gallery-images.js` - Simple image clicker

## Usage

```bash
node click-gallery-images.js
```

## Remember

- Click images to get high resolution
- Don't navigate to URLs directly
- Heart after viewing all images
- Find related galleries for next viewing
