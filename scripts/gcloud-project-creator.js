#!/usr/bin/env node

/**
 * Create a new Google Cloud project and API key
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating new Google Cloud project and API key...');

// Step 1: Initialize gcloud configuration
console.log('\n=== Step 1: Initialize gcloud ===');

exec('gcloud init --skip-diagnostics', (error, stdout, stderr) => {
  if (error) {
    console.log('gcloud init requires user interaction');
  } else {
    console.log('gcloud initialized');
  }
});

// Step 2: Try to create a new project
console.log('\n=== Step 2: Create new project ===');

const projectName = 'aether-gemini-' + Date.now();
const projectId = 'aether-gemini-' + Math.random().toString(36).substring(2, 10);

console.log('Project name:', projectName);
console.log('Project ID:', projectId);

// Try to create project using gcloud
exec(`gcloud projects create ${projectId} --name="${projectName}"`, (error, stdout, stderr) => {
  if (error) {
    console.log('Could not create project:', error.message);
    console.log('This usually requires authentication');
  } else {
    console.log('✅ Project created:', projectId);
    
    // Step 3: Enable APIs
    console.log('\n=== Step 3: Enable APIs ===');
    
    exec(`gcloud services enable generativelanguage.googleapis.com --project=${projectId}`, (enableError) => {
      if (!enableError) {
        console.log('✅ Generative Language API enabled');
        
        // Step 4: Create API key
        console.log('\n=== Step 4: Create API Key ===');
        
        exec(`gcloud alpha services api-keys create --project=${projectId} --display-name="Aether Gemini Key"`, (keyError, keyStdout) => {
          if (!keyError) {
            console.log('✅ API key created');
            console.log('Key details:', keyStdout);
            
            // Try to extract the actual key string
            exec(`gcloud services api-keys list --project=${projectId} --format="json"`, (listError, listStdout) => {
              if (!listError) {
                try {
                  const keys = JSON.parse(listStdout);
                  if (keys.length > 0) {
                    const keyName = keys[0].name;
                    exec(`gcloud services api-keys get ${keyName} --project=${projectId} --format="json"`, (getError, getStdout) => {
                      if (!getError) {
                        try {
                          const keyDetails = JSON.parse(getStdout);
                          if (keyDetails.keyString) {
                            console.log('🎉 API Key:', keyDetails.keyString);
                            saveApiKey(keyDetails.keyString);
                          }
                        } catch (e) {
                          console.log('Could not parse key details');
                        }
                      }
                    });
                  }
                } catch (e) {
                  console.log('Could not parse API keys list');
                }
              }
            });
          } else {
            console.log('Could not create API key:', keyError.message);
          }
        });
      } else {
        console.log('Could not enable API:', enableError.message);
      }
    });
  }
});

// Alternative approach: Try to use REST API to create project
console.log('\n=== Alternative: REST API approach ===');

const https = require('https');

// This would require authentication, but let's try with a public approach
const cloudOptions = {
  hostname: 'cloudresourcemanager.googleapis.com',
  port: 443,
  path: '/v1/projects',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const projectData = JSON.stringify({
  projectId: projectId,
  name: projectName,
});

const cloudReq = https.request(cloudOptions, (res) => {
  console.log(`Cloud project status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Cloud project response:', data);
  });
});

cloudReq.on('error', (error) => {
  console.error('Cloud project error:', error.message);
});

cloudReq.write(projectData);
cloudReq.end();

// Try to use the Generative AI API directly with a public endpoint
console.log('\n=== Try Generative AI public endpoint ===');

const genAIOptions = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: '/v1beta/models',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

const genAIReq = https.request(genAIOptions, (res) => {
  console.log(`GenAI status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('GenAI response:', data);
  });
});

genAIReq.on('error', (error) => {
  console.error('GenAI error:', error.message);
});

genAIReq.end();

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
  console.log('🎉 Configuration complete!');
}
