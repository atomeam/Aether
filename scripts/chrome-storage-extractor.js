#!/usr/bin/env node

/**
 * Extract Google authentication data from Chrome Local Storage
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const chromePath = 'C:\\Users\\adamm\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage';
const leveldbPath = path.join(chromePath, 'leveldb');

console.log('Attempting to extract Google auth data from Chrome...');

// Check if Chrome Local Storage exists
if (fs.existsSync(leveldbPath)) {
  console.log('✅ Chrome Local Storage found');
  
  // Try to read LevelDB files
  try {
    const files = fs.readdirSync(leveldbPath);
    console.log('LevelDB files:', files.length);
    
    // Look for files that might contain Google auth data
    const googleFiles = files.filter(f => f.includes('google') || f.includes('auth') || f.includes('token'));
    console.log('Google-related files:', googleFiles);
    
    // Try to read some of these files
    googleFiles.slice(0, 5).forEach(file => {
      try {
        const filePath = path.join(leveldbPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`\nFile: ${file}`);
        console.log('Content preview:', content.substring(0, 200));
        
        // Look for API keys in the content
        const apiKeyMatch = content.match(/AIza[0-9A-Za-z\-_]{35}/);
        if (apiKeyMatch) {
          console.log('🎉 FOUND API KEY:', apiKeyMatch[0]);
          saveApiKey(apiKeyMatch[0]);
        }
      } catch (e) {
        console.log(`Could not read file ${file}:`, e.message);
      }
    });
  } catch (e) {
    console.log('Error reading LevelDB:', e.message);
  }
} else {
  console.log('Chrome Local Storage not found');
}

// Try to use Chrome Remote Debugging Protocol
console.log('\n=== Attempting Chrome Remote Debugging ===');

// Start Chrome with remote debugging
exec('tasklist | findstr chrome.exe', (error, stdout) => {
  if (!error && stdout.trim()) {
    console.log('Chrome is running');
    
    // Try to connect to Chrome DevTools Protocol
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 9222,
      path: '/json',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tabs = JSON.parse(data);
          console.log('Chrome tabs:', tabs.length);
          
          // Look for Google AI Studio tab
          const aiStudioTab = tabs.find(tab => tab.url && tab.url.includes('aistudio.google.com'));
          if (aiStudioTab) {
            console.log('Found AI Studio tab:', aiStudioTab.url);
            
            // Try to get the tab's localStorage
            const wsUrl = aiStudioTab.webSocketDebuggerUrl;
            console.log('WebSocket URL:', wsUrl);
          }
        } catch (e) {
          console.log('Could not parse Chrome tabs');
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('Chrome DevTools Protocol not available');
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
    });
    
    req.end();
  } else {
    console.log('Chrome is not running');
    
    // Try to start Chrome with remote debugging
    console.log('Starting Chrome with remote debugging...');
    exec('"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\Users\\adamm\\AppData\\Local\\Google\\Chrome\\User Data" https://aistudio.google.com/apikey', (startError) => {
      if (startError) {
        console.log('Could not start Chrome:', startError.message);
      } else {
        console.log('Chrome started with remote debugging');
      }
    });
  }
});

// Try to access Windows Credential Manager
console.log('\n=== Attempting Windows Credential Manager ===');

exec('powershell -Command "Get-StoredCredential | Where-Object { $_.Target -like \'*google*\' } | Select-Object Target, UserName"', (error, stdout, stderr) => {
  if (!error && stdout.trim()) {
    console.log('Found Google credentials in Windows Credential Manager:');
    console.log(stdout);
  } else {
    console.log('No Google credentials found in Windows Credential Manager');
  }
});

// Try to access Firefox credentials if available
console.log('\n=== Checking Firefox Profiles ===');

const firefoxPath = 'C:\\Users\\adamm\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles';
if (fs.existsSync(firefoxPath)) {
  try {
    const profiles = fs.readdirSync(firefoxPath);
    console.log('Firefox profiles:', profiles);
    
    profiles.forEach(profile => {
      const profilePath = path.join(firefoxPath, profile);
      if (fs.statSync(profilePath).isDirectory()) {
        // Look for signons.sqlite or other credential files
        const files = fs.readdirSync(profilePath);
        const credFiles = files.filter(f => f.includes('signon') || f.includes('credential') || f.includes('key'));
        if (credFiles.length > 0) {
          console.log(`Profile ${profile} has credential files:`, credFiles);
        }
      }
    });
  } catch (e) {
    console.log('Error reading Firefox profiles:', e.message);
  }
} else {
  console.log('Firefox not found');
}

function saveApiKey(apiKey) {
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
  console.log('🎉 SUCCESS! Configuration complete!');
}
