/**
 * Start Persistent Browser Service
 * Starts the browser service in the background
 */

const { spawn } = require('child_process');
const path = require('path');

const servicePath = path.join(__dirname, 'persistent-browser-service.js');

console.log('🚀 Starting persistent browser service...');

const service = spawn('node', [servicePath], {
  detached: true,
  stdio: 'ignore',
});

service.unref();

console.log('✅ Persistent browser service started in background');
console.log('📡 Service listening on http://localhost:3456');
console.log('📝 Use client scripts to interact with the browser');
