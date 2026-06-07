#!/usr/bin/env node

/**
 * Create API key using gcloud authentication
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating API key using authenticated gcloud...');

// Use gcloud to create API key with proper syntax
console.log('Creating API key for project: gen-lang-client-0612944687');

// Try using the regular gcloud services api-keys command
exec('gcloud services api-keys create --project=gen-lang-client-0612944687 --display-name="Aether Gemini Key"', (error, stdout, stderr) => {
  if (error) {
    console.log('Regular command failed, trying alternative...');
    console.log('Error:', error.message);
    
    // Try using the REST API with gcloud auth print-access-token
    exec('gcloud auth print-access-token', (tokenError, tokenStdout) => {
      if (!tokenError && tokenStdout.trim()) {
        const token = tokenStdout.trim();
        console.log('Got access token');
        
        // Use the token to create API key via REST API
        createApiKeyViaREST(token);
      } else {
        console.log('Could not get access token');
      }
    });
  } else {
    console.log('API key created successfully');
    console.log('Output:', stdout);
    
    // Try to extract the key from the output
    const keyMatch = stdout.match(/AIza[0-9A-Za-z\-_]{35}/);
    if (keyMatch) {
      console.log('🎉 API Key:', keyMatch[0]);
      saveApiKey(keyMatch[0]);
    } else {
      console.log('Could not extract API key from output');
    }
  }
});

function createApiKeyViaREST(token) {
  const https = require('https');
  
  const options = {
    hostname: 'apikeys.googleapis.com',
    port: 443,
    path: '/v2/projects/gen-lang-client-0612944687/keys',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  };

  const keyData = JSON.stringify({
    displayName: 'Aether Gemini Key',
    restrictions: {
      androidRestrictions: {},
      browserRestrictions: {},
      iosRestrictions: {},
      serverRestrictions: {}
    }
  });

  const req = https.request(options, (res) => {
    console.log(`API key creation status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('API key creation response:', data);
      
      if (res.statusCode === 200) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.keyString) {
            console.log('🎉 SUCCESS! API Key:', parsed.keyString);
            saveApiKey(parsed.keyString);
          } else if (parsed.name) {
            console.log('API key created, getting key string...');
            // Need to get the key string separately
            getApiKeyString(parsed.name, token);
          }
        } catch (e) {
          console.log('Could not parse API key response');
        }
      } else {
        console.log('Failed to create API key');
      }
    });
  });

  req.on('error', (error) => {
    console.error('API key creation error:', error.message);
  });

  req.write(keyData);
  req.end();
}

function getApiKeyString(keyName, token) {
  const https = require('https');
  
  const options = {
    hostname: 'apikeys.googleapis.com',
    port: 443,
    path: `/v2/projects/gen-lang-client-0612944687/keys/${keyName}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Get key string status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Get key string response:', data);
      
      if (res.statusCode === 200) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.keyString) {
            console.log('🎉 SUCCESS! API Key:', parsed.keyString);
            saveApiKey(parsed.keyString);
          }
        } catch (e) {
          console.log('Could not parse key string response');
        }
      }
    });
  });

  req.on('error', (error) => {
    console.error('Get key string error:', error.message);
  });

  req.end();
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
  console.log('🎉 COMPLETE! Your Aether system is now fully configured!');
  console.log('You can now run: pnpm dev:backend');
}
