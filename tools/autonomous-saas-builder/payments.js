/**
 * Payment Integration System
 * Sets up Stripe payments and subscription management
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

class PaymentIntegration {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
    this.integrations = [];
    this.dataPath = path.resolve(__dirname, 'payment-integrations.json');
    this.loadIntegrations();
  }

  // Create Stripe products and prices
  async createPaymentSetup(productSpec) {
    console.log(`💳 Setting up payments for: ${productSpec.name}`);
    
    const integrationId = this.generateIntegrationId(productSpec.name);
    
    try {
      // Create product
      const product = await this.stripe.products.create({
        name: productSpec.name,
        description: productSpec.description,
        metadata: {
          category: productSpec.category,
          generated_by: 'autonomous-saas-builder'
        }
      });
      
      // Create prices based on monetization strategy
      const prices = [];
      
      if (productSpec.monetization[0]?.type === 'subscription') {
        for (const tier of productSpec.monetization[0].tiers) {
          const price = await this.stripe.prices.create({
            product: product.id,
            unit_amount: tier.price * 100, // Convert to cents
            currency: 'usd',
            recurring: {
              interval: 'month'
            },
            metadata: {
              tier: tier.name
            }
          });
          prices.push({
            tier: tier.name,
            priceId: price.id,
            amount: tier.price,
            features: tier.features
          });
        }
      } else if (productSpec.monetization[0]?.type === 'freemium') {
        // Free tier
        const freePrice = await this.stripe.prices.create({
          product: product.id,
          unit_amount: 0,
          currency: 'usd',
          recurring: {
            interval: 'month'
          },
          metadata: {
            tier: 'free'
          }
        });
        
        // Paid tier
        const paidPrice = await this.stripe.prices.create({
          product: product.id,
          unit_amount: productSpec.monetization[0].paid.price * 100,
          currency: 'usd',
          recurring: {
            interval: 'month'
          },
          metadata: {
            tier: 'paid'
          }
        });
        
        prices.push(
          {
            tier: 'free',
            priceId: freePrice.id,
            amount: 0,
            features: productSpec.monetization[0].free.features
          },
          {
            tier: 'paid',
            priceId: paidPrice.id,
            amount: productSpec.moneturation[0].paid.price,
            features: productSpec.moneturation[0].paid.features
          }
        );
      }
      
      // Create webhook endpoint
      const webhookSecret = await this.createWebhookEndpoint();
      
      // Record integration
      const integration = {
        id: integrationId,
        productName: productSpec.name,
        productId: product.id,
        prices,
        webhookSecret,
        spec: productSpec,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      this.integrations.push(integration);
      this.saveIntegrations();
      
      console.log(`✅ Payment setup complete: ${integrationId}`);
      
      return integration;
    } catch (error) {
      console.error(`❌ Payment setup failed: ${error.message}`);
      throw error;
    }
  }

  // Create webhook endpoint
  async createWebhookEndpoint() {
    try {
      const webhook = await this.stripe.webhookEndpoints.create({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted'
        ]
      });
      
      return webhook.secret;
    } catch (error) {
      console.log('⚠️  Webhook creation failed, using placeholder');
      return 'whsec_placeholder';
    }
  }

  // Generate integration ID
  generateIntegrationId(productName) {
    return `payment-${productName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }

  // Load integrations
  loadIntegrations() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.integrations = JSON.parse(data);
    }
  }

  // Save integrations
  saveIntegrations() {
    if (this.integrations.length > 50) {
      this.integrations = this.integrations.slice(-50);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.integrations, null, 2));
  }

  // Get integrations
  getIntegrations() {
    return this.integrations;
  }

  // Get integration by ID
  getIntegrationById(id) {
    return this.integrations.find(i => i.id === id);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const payment = new PaymentIntegration();

  switch (command) {
    case 'setup':
      if (args[1]) {
        const productSpec = JSON.parse(args[1]);
        const integration = await payment.createPaymentSetup(productSpec);
        console.log('💳 Payment Integration:');
        console.log(JSON.stringify(integration, null, 2));
      } else {
        console.error('Usage: node payments.js setup <product-spec-json>');
      }
      break;

    case 'list':
      const integrations = payment.getIntegrations();
      console.log('💳 Payment Integrations:');
      console.log(JSON.stringify(integrations, null, 2));
      break;

    case 'get':
      if (args[1]) {
        const integration = payment.getIntegrationById(args[1]);
        if (integration) {
          console.log('💳 Integration Details:');
          console.log(JSON.stringify(integration, null, 2));
        } else {
          console.error('Integration not found');
        }
      } else {
        console.error('Usage: node payments.js get <integration-id>');
      }
      break;

    default:
      console.log('💳 Payment Integration System');
      console.log('');
      console.log('Commands:');
      console.log('  setup - Set up Stripe payments');
      console.log('  list  - List all payment integrations');
      console.log('  get   - Get integration by ID');
      console.log('');
      console.log('Examples:');
      console.log('  node payments.js setup \'{"name":"Test App"}\'');
      console.log('  node payments.js list');
      console.log('  node payments.js get payment-123');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  PaymentIntegration
};
