/**
 * @aether/payments - Payment Processing Package
 * 
 * Comprehensive payment processing with Stripe and PayPal integration,
 * subscription management, invoice generation, payment reconciliation,
 * and refund processing.
 * 
 * @version 1.0.0
 * 
 * @example
 * ```ts
 * import { StripeService, InvoiceService, RefundService } from '@aether/payments';
 * 
 * const stripe = new StripeService({ apiKey: 'sk_test_...' });
 * const invoiceService = new InvoiceService({ defaultCurrency: 'USD' });
 * const refundService = new RefundService({ defaultProvider: 'stripe' });
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

export * from './types/index.js';

// =============================================================================
// SCHEMAS
// =============================================================================

export * from './schemas/index.js';

// =============================================================================
// SERVICES
// =============================================================================

export { StripeService } from './stripe/index.js';
export type { StripeConfig } from './stripe/index.js';

export { PayPalService } from './paypal/index.js';
export type { PayPalConfig } from './paypal/index.js';

export { SubscriptionPaymentService } from './subscriptions/index.js';
export type { 
  SubscriptionPaymentConfig, 
  CreateSubscriptionPaymentParams, 
  RetryPaymentParams 
} from './subscriptions/index.js';

export { InvoiceService } from './invoices/index.js';
export type { InvoiceConfig, CreateInvoiceParams, AddLineItemParams } from './invoices/index.js';

export { ReconciliationService } from './reconciliation/index.js';
export type { ReconciliationConfig, ReconciliationParams, DiscrepancyDetectionParams } from './reconciliation/index.js';

export { RefundService } from './refunds/index.js';
export type { RefundConfig, CreateRefundParams, RefundValidationResult } from './refunds/index.js';

// =============================================================================
// PACKAGE INFO
// =============================================================================

export const PACKAGE_NAME = '@aether/payments';
export const PACKAGE_VERSION = '1.0.0';
