/**
 * Test Backend Environment Variables
 * Checks if the backend is loading the .env file correctly
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('Backend Environment Test');
console.log('========================================');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
console.log(`\n.env file path: ${envPath}`);
console.log(`.env file exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(`\n.env file size: ${envContent.length} bytes`);
  
  // Check for GEMINI_API_KEY
  const geminiKeyLine = envContent.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
  if (geminiKeyLine) {
    const key = geminiKeyLine.split('=')[1];
    console.log(`GEMINI_API_KEY found: ${key ? key.substring(0, 10) + '...' : 'EMPTY'}`);
  } else {
    console.log('GEMINI_API_KEY not found in .env file');
  }
  
  // Check for PORT
  const portLine = envContent.split('\n').find(line => line.startsWith('PORT='));
  if (portLine) {
    const port = portLine.split('=')[1];
    console.log(`PORT found: ${port}`);
  } else {
    console.log('PORT not found in .env file');
  }
} else {
  console.log('.env file does not exist');
}

// Check if backend .env.example exists
const backendEnvExamplePath = path.join(__dirname, 'apps', 'backend', '.env.example');
console.log(`\nBackend .env.example path: ${backendEnvExamplePath}`);
console.log(`Backend .env.example exists: ${fs.existsSync(backendEnvExamplePath)}`);

if (fs.existsSync(backendEnvExamplePath)) {
  const envExampleContent = fs.readFileSync(backendEnvExamplePath, 'utf8');
  console.log(`\nBackend .env.example content:\n${envExampleContent}`);
}
