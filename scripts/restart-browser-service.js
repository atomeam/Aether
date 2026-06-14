/**
 * Restart Persistent Browser Service
 * Closes existing service and starts a new one
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function restartService() {
  try {
    console.log('🔄 Closing existing service...');
    
    // Try to close existing service
    http.get('http://localhost:3456/close', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Service closed');
        
        // Wait a moment
        setTimeout(() => {
          console.log('🚀 Starting new service...');
          const servicePath = path.join(__dirname, 'persistent-browser-service.js');
          const service = spawn('node', [servicePath], {
            detached: true,
            stdio: 'ignore',
          });
          service.unref();
          console.log('✅ New service started');
        }, 2000);
      });
    }).on('error', (error) => {
      console.log('⚠️  Service not running, starting new one...');
      const servicePath = path.join(__dirname, 'persistent-browser-service.js');
      const service = spawn('node', [servicePath], {
        detached: true,
        stdio: 'ignore',
      });
      service.unref();
      console.log('✅ New service started');
    });
    
  } catch (error) {
    console.error('❌ Error restarting service:', error.message);
  }
}

restartService().catch(console.error);
