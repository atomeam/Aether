#!/usr/bin/env node

/**
 * Automate browser to get Gemini API key from Google AI Studio
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log('Launching browser to get Gemini API key...');

(async () => {
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: false, // Show browser so we can see what's happening
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent to avoid detection
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Navigating to Google AI Studio...');
    
    // Navigate to Google AI Studio
    await page.goto('https://aistudio.google.com/apikey', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Page loaded, checking for sign-in...');

    // Wait a bit for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if we're on sign-in page
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('accounts.google.com')) {
      console.log('On sign-in page, waiting for user to authenticate...');
      console.log('Please sign in with your Google account in the browser window...');
      
      // Wait for navigation away from sign-in page
      await page.waitForFunction(() => {
        return !window.location.href.includes('accounts.google.com');
      }, { timeout: 120000 }); // Wait up to 2 minutes for user to sign in

      console.log('Authentication detected, continuing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Now we should be on the API key page
    console.log('Looking for API key creation button...');

    // Try to find and click the "Get API key" or "Create API key" button
    try {
      // Wait for the page to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Look for the API key creation button
      const createButtonSelectors = [
        'button:has-text("Create API key")',
        'button:has-text("Get API key")',
        '[data-testid="create-api-key"]',
        '[aria-label*="Create API key"]',
        'button[title*="Create API key"]',
        'mat-raised-button:has-text("Create API key")',
        'button:has-text("Create")'
      ];

      let buttonFound = false;
      for (const selector of createButtonSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log('Found button with selector:', selector);
          await page.click(selector);
          buttonFound = true;
          break;
        } catch (e) {
          // Try next selector
          continue;
        }
      }

      if (!buttonFound) {
        console.log('Could not find Create API key button, trying alternative approach...');
        
        // Try to look for existing API keys
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Look for existing API keys in the list
          const existingKeys = await page.evaluate(() => {
            const keys = [];
            const elements = document.querySelectorAll('[data-key], [data-api-key], .api-key, [class*="api-key"]');
            elements.forEach(el => {
              const text = el.textContent || el.value || '';
              if (text.includes('AIza')) {
                keys.push(text);
              }
            });
            return keys;
          });

          if (existingKeys.length > 0) {
            console.log('Found existing API keys:', existingKeys);
            const apiKey = existingKeys[0];
            console.log('🎉 SUCCESS! Using existing API key:', apiKey);
            await saveApiKey(apiKey);
            await browser.close();
            return;
          }
        } catch (e) {
          console.log('Could not find existing API keys');
        }

        // If no button found and no existing keys, try to find the API key directly in the page
        console.log('Looking for API key in page content...');
        
        const pageContent = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          const matches = bodyText.match(/AIza[0-9A-Za-z\-_]{35}/g);
          return matches || [];
        });

        if (pageContent.length > 0) {
          console.log('Found API key in page content:', pageContent[0]);
          await saveApiKey(pageContent[0]);
          await browser.close();
          return;
        }

        console.log('API key not found automatically, please check the browser window...');
        console.log('The browser will remain open for 60 seconds for manual intervention...');
        
        // Keep browser open for manual intervention
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        // Try one more time to find the key
        const finalContent = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          const matches = bodyText.match(/AIza[0-9A-Za-z\-_]{35}/g);
          return matches || [];
        });

        if (finalContent.length > 0) {
          console.log('Found API key after manual intervention:', finalContent[0]);
          await saveApiKey(finalContent[0]);
        } else {
          console.log('Still could not find API key automatically');
        }
      } else {
        console.log('Clicked Create API key button, waiting for key generation...');
        
        // Wait for the API key to appear
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Look for the generated API key
        const apiKeySelectors = [
          '[data-key]',
          '[data-api-key]',
          '.api-key',
          '[class*="api-key"]',
          'input[type="text"]',
          'code',
          'pre'
        ];

        let apiKey = null;
        for (const selector of apiKeySelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              const text = await page.evaluate(el => el.textContent || el.value, element);
              const match = text.match(/AIza[0-9A-Za-z\-_]{35}/);
              if (match) {
                apiKey = match[0];
                console.log('Found API key with selector:', selector);
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }

        if (apiKey) {
          console.log('🎉 SUCCESS! Generated API key:', apiKey);
          await saveApiKey(apiKey);
        } else {
          console.log('Could not find generated API key');
          
          // Try to get it from page content
          const finalContent = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const matches = bodyText.match(/AIza[0-9A-Za-z\-_]{35}/g);
            return matches || [];
          });

          if (finalContent.length > 0) {
            console.log('Found API key in page content:', finalContent[0]);
            await saveApiKey(finalContent[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error during automation:', error.message);
    }

    await browser.close();
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
})();

async function saveApiKey(apiKey) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const newEnvContent = envContent.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${apiKey}`);
  
  if (newEnvContent === envContent) {
    envContent += `\nGEMINI_API_KEY=${apiKey}\n`;
  } else {
    fs.writeFileSync(envPath, newEnvContent);
  }
  
  console.log('✅ API key saved to .env file');
  console.log('🎉 COMPLETE! Your Aether system is now fully configured!');
  console.log('You can now run: pnpm dev:backend');
}
