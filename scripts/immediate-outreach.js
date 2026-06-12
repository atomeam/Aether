#!/usr/bin/env node

const https = require('https');

// Direct payment link
const PAYMENT_URL = 'https://aether-pay.pages.dev';

// Message templates
const messages = [
  `I built a zero-config crypto payment system for my autonomous agent platform. No KYC, no signup, 0.5% fee, instant settlement. Try it: ${PAYMENT_URL}`,
  `Aether Pro Access is live - autonomous agent teams with crypto payments. $49 one-time. No KYC, instant settlement. ${PAYMENT_URL}`,
  `Built a payment system that eliminates Stripe friction. No KYC, no signup, 0.5% fee, instant settlement. ${PAYMENT_URL}`,
  `Crypto payments for AI agents - zero configuration, no account signup, instant settlement. ${PAYMENT_URL}`,
  `Autonomous agent teams with measurable output. Pay with crypto (Base USDC, ETH, Polygon USDC). ${PAYMENT_URL}`
];

// Function to post to a webhook (Discord, Slack, etc.)
function postToWebhook(url, message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ content: message });

    const options = {
      hostname: new URL(url).hostname,
      path: new URL(url).pathname + new URL(url).search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject({ success: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Function to post to an API endpoint
function postToAPI(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: new URL(url).hostname,
      path: new URL(url).pathname + new URL(url).search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode, body });
        } else {
          reject({ success: false, status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main execution
async function main() {
  console.log('🚀 Immediate Outreach for First Dollar');
  console.log('Payment URL:', PAYMENT_URL);
  console.log('');

  // Try Discord webhooks (if user provides them)
  const discordWebhooks = process.env.DISCORD_WEBHOOKS?.split(',') || [];
  for (const webhook of discordWebhooks) {
    try {
      const message = messages[Math.floor(Math.random() * messages.length)];
      await postToWebhook(webhook, message);
      console.log('✅ Posted to Discord webhook');
    } catch (error) {
      console.log('❌ Failed to post to Discord webhook:', error.message);
    }
  }

  // Try Slack webhooks (if user provides them)
  const slackWebhooks = process.env.SLACK_WEBHOOKS?.split(',') || [];
  for (const webhook of slackWebhooks) {
    try {
      const message = messages[Math.floor(Math.random() * messages.length)];
      await postToWebhook(webhook, JSON.stringify({ text: message }));
      console.log('✅ Posted to Slack webhook');
    } catch (error) {
      console.log('❌ Failed to post to Slack webhook:', error.message);
    }
  }

  // Try custom API endpoints (if user provides them)
  const apiEndpoints = process.env.API_ENDPOINTS?.split(',') || [];
  for (const endpoint of apiEndpoints) {
    try {
      const message = messages[Math.floor(Math.random() * messages.length)];
      await postToAPI(endpoint, { message, url: PAYMENT_URL });
      console.log('✅ Posted to API endpoint');
    } catch (error) {
      console.log('❌ Failed to post to API endpoint:', error.message);
    }
  }

  console.log('');
  console.log('📊 Outreach Summary');
  console.log('Discord webhooks:', discordWebhooks.length);
  console.log('Slack webhooks:', slackWebhooks.length);
  console.log('API endpoints:', apiEndpoints.length);
  console.log('');
  console.log('💡 To use this script, set environment variables:');
  console.log('   DISCORD_WEBHOOKS=webhook1,webhook2,...');
  console.log('   SLACK_WEBHOOKS=webhook1,webhook2,...');
  console.log('   API_ENDPOINTS=endpoint1,endpoint2,...');
  console.log('');
  console.log('🔗 Payment URL:', PAYMENT_URL);
  console.log('Share this link directly to get the first dollar!');
}

main().catch(console.error);
