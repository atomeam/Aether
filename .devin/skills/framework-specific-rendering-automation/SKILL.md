# Framework-Specific Rendering (React/Vue/Angular) Automation

## Overview

This skill teaches how to automate React/Vue/Angular applications that use overlay/portal containers for dropdowns, menus, and modals.

## Problem

Modern frontend frameworks (React, Vue, Angular) often render dropdowns, menus, and modals in overlay/portal containers outside the main component tree. These are typically appended to `document.body` and may not be accessible via standard DOM queries.

## Research Findings

### Overlay Container Selectors

Common overlay container selectors for React/Vue/Angular:

```javascript
const overlaySelectors = [
  '.cdk-overlay-container',      // Angular CDK
  '.cdk-overlay-pane',           // Angular CDK
  '[role="menu"]',               // ARIA menu
  '[role="listbox"]',            // ARIA listbox
  '.dropdown-menu',              // Bootstrap
  '.popover',                   // Bootstrap
  '.portal',                    // React Portal
  '[data-radix-portal]',        // Radix UI
  '[data-state="open"]',        // Radix UI
];
```

### RapidAPI Specific Findings

After clicking the settings icon:
- **Overlay found**: `[role="menu"]`
- **Content**: Only "Notifications" text, no Edit API option
- **Infinite scroll**: Menu uses infinite scroll component
- **Empty scroll area**: The scroll area is empty (no menu items)

**Conclusion**: The settings icon we're clicking opens a **notifications menu**, not a settings menu. The actual settings menu may be:
- A different icon
- In a different location
- Not accessible via the current approach
- Rendered differently

## Solutions

### 1. Polling for Overlay Container

Poll for overlay container to appear after click:

```javascript
let found = false;
let overlaySelector = null;

for (let i = 0; i < 20; i++) {
  await new Promise(resolve => setTimeout(resolve, 250));
  
  const checkCode = `
    (function() {
      const overlaySelectors = [
        '.cdk-overlay-container',
        '.cdk-overlay-pane',
        '[role="menu"]',
        '[role="listbox"]',
        '.dropdown-menu',
        '.popover',
        '.portal',
        '[data-radix-portal]',
        '[data-state="open"]',
      ];
      
      for (const selector of overlaySelectors) {
        const element = document.querySelector(selector);
        if (element && element.offsetParent !== null) {
          return { found: true, selector };
        }
      }
      return { found: false };
    })()
  `;
  
  const checkResult = await client.executeJavaScript(checkCode);
  
  if (checkResult.result.found) {
    found = true;
    overlaySelector = checkResult.result.selector;
    break;
  }
}
```

### 2. Deep Inspection of Overlay

Inspect overlay container even if elements appear hidden:

```javascript
const inspectCode = `
  (function() {
    const overlay = document.querySelector('[role="menu"]');
    if (!overlay) return { found: false };
    
    const allChildren = overlay.querySelectorAll('*');
    const elements = [];
    
    for (const el of allChildren) {
      const text = el.textContent?.trim() || '';
      const tag = el.tagName;
      const visible = el.offsetParent !== null;
      const display = window.getComputedStyle(el).display;
      const opacity = window.getComputedStyle(el).opacity;
      
      elements.push({
        tag,
        text: text.substring(0, 50),
        visible,
        display,
        opacity,
        class: el.className?.substring(0, 50)
      });
    }
    
    return { 
      found: true, 
      innerHTML: overlay.innerHTML.substring(0, 1000),
      elementCount: elements.length,
      elements: elements.slice(0, 20)
    };
  })()
`;
```

### 3. Try All SVG Icons

Try clicking each SVG icon to find the correct settings menu:

```javascript
const findCode = `
  (function() {
    const icons = [];
    const allElements = document.querySelectorAll('*');
    
    for (const el of allElements) {
      if (el.querySelector('svg') || el.tagName === 'svg') {
        const parent = el.closest('button, a, div[role="button"]');
        if (parent) {
          const text = parent.textContent?.trim() || '';
          const ariaLabel = parent.getAttribute('aria-label') || '';
          const title = parent.getAttribute('title') || '';
          const visible = parent.offsetParent !== null;
          
          if (visible) {
            icons.push({
              tag: parent.tagName,
              text: text.substring(0, 50),
              ariaLabel,
              title,
              class: parent.className?.substring(0, 50)
            });
          }
        }
      }
    }
    return icons;
  })()
`;
```

### 4. Angular Material Specific

For Angular Material components:

```javascript
// mat-select
await page.getByRole('combobox', { name: 'Theme' }).click();
await page.getByRole('option', { name: 'Dark' }).click();

// mat-autocomplete
await page.getByRole('combobox', { name: 'Role' }).fill('adm');
await page.getByRole('option', { name: 'Admin' }).click();

// MatDialog
const dialog = page.getByRole('dialog');
await expect(dialog.getByText('Are you sure?')).toBeVisible();
await dialog.getByRole('button', { name: 'Cancel' }).click();
```

### 5. React Portal Specific

For React Portal components:

```javascript
// Wait for portal to appear
await page.waitForSelector('[data-radix-portal]');

// Interact with portal content
const portal = page.locator('[data-radix-portal]');
await portal.getByRole('option', { name: 'Option' }).click();
```

## Best Practices

### 1. Use ARIA Roles

Always use ARIA roles instead of CSS classes:

```javascript
// ✅ GOOD
await page.getByRole('menu').getByRole('menuitem', { name: 'Edit' }).click();

// ❌ BAD
await page.locator('.cdk-overlay-pane .menu-item').click();
```

### 2. Wait for Overlay

Always wait for overlay to appear:

```javascript
await page.waitForSelector('[role="menu"]');
await page.waitForSelector('.cdk-overlay-container');
```

### 3. Handle Infinite Scroll

For menus with infinite scroll:

```javascript
// Scroll to load more items
const scrollArea = page.locator('.infinite-scroll-component');
await scrollArea.evaluate(el => el.scrollTop = el.scrollHeight);
```

### 4. Use Semantic Locators

Use semantic locators instead of framework-specific attributes:

```javascript
// ✅ GOOD
await page.getByRole('button', { name: 'Edit API' }).click();

// ❌ BAD
await page.locator('[_ngcontent-xyz]').click();
```

## Common Patterns

### Angular CDK Overlay

```javascript
// Wait for overlay container
await page.waitForSelector('.cdk-overlay-container');

// Interact with overlay content
const overlay = page.locator('.cdk-overlay-pane');
await overlay.getByRole('menuitem').click();
```

### React Portal

```javascript
// Wait for portal
await page.waitForSelector('[data-radix-portal]');

// Interact with portal content
const portal = page.locator('[data-radix-portal]');
await portal.getByRole('option').click();
```

### Vue Portal

```javascript
// Wait for portal
await page.waitForSelector('.portal');

// Interact with portal content
const portal = page.locator('.portal');
await portal.getByRole('menuitem').click();
```

## Limitations

### 1. Framework-Specific Internals
- React fiber may be inaccessible
- Vue reactivity system may be complex
- Angular Zone.js may interfere

### 2. Shadow DOM
- Elements in shadow DOM may not be accessible
- May need to access shadowRoot

### 3. Virtual Scrolling
- Only visible items are in DOM
- May need to scroll to load more items

### 4. Event Listeners
- Custom event listeners may not trigger
- May need to dispatch custom events

### 5. Security Restrictions
- Some sites block JavaScript execution
- CSP may prevent certain operations

## Scripts Created

- `blocker2-click-edit-api-overlay.js` - Overlay container polling approach
- `blocker2-click-edit-api-deep.js` - Deep inspection of overlay
- `blocker2-click-edit-api-all-icons.js` - Try all SVG icons

## Key Learnings

1. **Overlay containers** - Frameworks render dropdowns in overlay containers
2. **Polling** - Poll for overlay to appear after click
3. **Deep inspection** - Inspect overlay even if elements appear hidden
4. **Try all icons** - Try clicking each SVG icon to find correct menu
5. **ARIA roles** - Use ARIA roles instead of CSS classes
6. **Infinite scroll** - Handle infinite scroll components
7. **Semantic locators** - Use semantic locators over framework-specific attributes

## Conclusion

Framework-specific rendering (React/Vue/Angular) adds complexity to automation, but can be solved by:
- Understanding overlay/portal container patterns
- Polling for overlay appearance
- Deep inspection of overlay content
- Trying all possible trigger elements
- Using ARIA roles and semantic locators

**For RapidAPI specifically**, the settings icon we're clicking opens a notifications menu, not a settings menu. The actual settings menu may be a different icon or in a different location.
