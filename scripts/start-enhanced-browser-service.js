/**
 * Start Enhanced Browser Service
 */

const { spawn } = require('child_process');
const path = require('path');

const servicePath = path.join(__dirname, 'enhanced-browser-service.js');
const service = spawn('node', [servicePath], {
  stdio: 'inherit',
  shell: true
});

service.on('error', (error) => {
  console.error('Failed to start service:', error);
});

service.on('exit', (code) => {
  console.log(`Service exited with code ${code}`);
});

console.log('🚀 Starting enhanced browser service...');
console.log('📡 Service will be available at http://localhost:3456');
