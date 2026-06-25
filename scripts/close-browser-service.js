/**
 * Close Persistent Browser Service
 * Closes the browser service
 */

const PersistentBrowserClient = require('./persistent-browser-client');

async function closeService() {
  const client = new PersistentBrowserClient();
  
  try {
    console.log('🔒 Closing persistent browser service...');
    await client.close();
    console.log('✅ Browser service closed');
  } catch (error) {
    console.error('❌ Error closing service:', error.message);
  }
}

closeService().catch(console.error);
