/**
 * Close Ultimate Browser Service
 */

const http = require('http');

http.get('http://localhost:3456/close', (res) => {
  console.log('🔒 Closing ultimate browser service...');
  console.log('✅ Service closed');
}).on('error', (err) => {
  console.log('⚠️  Service not running or already closed');
});
