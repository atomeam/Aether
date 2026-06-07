#!/usr/bin/env node

/**
 * Aether Gemini API Setup Helper
 * 
 * This script helps you get a Google Gemini API key and configure it for Aether.
 * Run with: node scripts/setup-gemini.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         Aether Gemini API Key Setup Helper                      ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log();

console.log('📋 STEP 1: Get your free Gemini API Key');
console.log('─────────────────────────────────────────────────────────────────');
console.log('1. Go to: https://aistudio.google.com/apikey');
console.log('2. Sign in with your Google account');
console.log('3. Click "Get API key" in the left sidebar');
console.log('4. Click "Create API key"');
console.log('5. Copy the API key (it starts with "AIza")');
console.log();
console.log('💡 The free tier requires no credit card and includes:');
console.log('   - 15 requests per minute');
console.log('   - 1,500 requests per day');
console.log('   - 1M tokens per minute');
console.log();

rl.question('🔑 Paste your Gemini API key here: ', (apiKey) => {
  apiKey = apiKey.trim();
  
  if (!apiKey) {
    console.log('❌ No API key provided. Setup cancelled.');
    rl.close();
    process.exit(1);
  }
  
  if (!apiKey.startsWith('AIza')) {
    console.log('⚠️  Warning: API keys usually start with "AIza". Please verify your key.');
  }
  
  console.log();
  console.log('📝 STEP 2: Update your .env file');
  console.log('─────────────────────────────────────────────────────────────────');
  
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found. Please copy .env.example to .env first.');
    rl.close();
    process.exit(1);
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace the GEMINI_API_KEY line
  const newEnvContent = envContent.replace(
    /^GEMINI_API_KEY=.*$/m,
    `GEMINI_API_KEY=${apiKey}`
  );
  
  if (newEnvContent === envContent) {
    console.log('⚠️  Could not find GEMINI_API_KEY in .env file. Adding it...');
    envContent += `\nGEMINI_API_KEY=${apiKey}\n`;
  } else {
    fs.writeFileSync(envPath, newEnvContent);
  }
  
  console.log('✅ API key saved to .env file');
  console.log();
  console.log('🚀 STEP 3: Start the Aether backend');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('Run: pnpm dev:backend');
  console.log();
  console.log('Your Aether system is now ready to use AI features!');
  console.log();
  console.log('📚 For more information, see:');
  console.log('   - https://ai.google.dev/gemini-api/docs');
  console.log('   - https://aistudio.google.com');
  console.log();
  
  rl.close();
});
