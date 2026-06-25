/**
 * @aether/payments - Core Types
 * 
 * TypeScript types for payment processing, invoices, refunds, and reconciliation
 * 
 * @version 1.0.0
 */

// =============================================================================
// PAYMENT PROVIDER TYPES
// =============================================================================

export type PaymentProvider = 'stripe' | 'paypal' | 'manual';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod =
  | 'card'
  | 'bank_account'
  | 'paypal'
  | 'sepa_debit'
  | 'ideal'
  | 'sofort'
  | 'bancontact'
  | 'giropay'
  | 'eps'
  | 'p24'
  | 'alipay'
  | 'wechat_pay'
  | 'klarna'
  | 'affirm'
  | 'afterpay_clearpay'
  | 'grabpay'
  | 'oxxo'
  | 'boleto'
  | 'link'
  | 'us_bank_account';

export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'jcb'
  | 'unionpay'
  | 'diners_club'
  | 'unknown';

export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CHF'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'HRK'
  | 'RUB'
  | 'TRY'
  | 'BRL'
  | 'MXN'
  | 'COP'
  | 'CLP'
  | 'PEN'
  | 'ARS'
  | 'INR'
  | 'SGD'
  | 'HKD'
  | 'CNY'
  | 'TWD'
  | 'KRW'
  | 'THB'
  | 'IDR'
  | 'MYR'
  | 'PHP'
  | 'VND'
  | 'ZAR'
  | 'NGN'
  | 'EGP'
  | 'AED'
  | 'SAR'
  | 'ILS'
  | 'NZD';

// =============================================================================
// PAYMENT TYPES
// =============================================================================

export interface PaymentIntent {
  id: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  customerId: string;
  paymentMethodId?: string;
  paymentMethod?: PaymentMethodInfo;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failureCode?: string;
  failureMessage?: string;
}

export interface PaymentMethodInfo {
  id: string;
  type: PaymentMethod;
  card?: CardInfo;
  bankAccount?: BankAccountInfo;
  paypal?: PayPalInfo;
  isDefault: boolean;
  createdAt: Date;
}

export interface CardInfo {
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  fingerprint?: string;
  country?: string;
  funding?: 'credit' | 'debit' | 'prepaid' | 'unknown';
}

export interface BankAccountInfo {
  bankName?: string;
  last4: string;
  country?: string;
  currency?: Currency;
  routingNumber?: string;
}

export interface PayPalInfo {
  email?: string;
  payerId?: string;
}

export interface PaymentTransaction {
  id: string;
  paymentIntentId: string;
  provider: PaymentProvider;
  providerTransactionId?: string;
  type: 'charge' | 'refund' | 'capture' | 'void';
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  metadata?: Record<string, string>;
  createdAt: Date;
  processedAt?: Date;
}

// =============================================================================
// INVOICE TYPES
// =============================================================================

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export type InvoiceType = 'subscription' | 'one_time' | 'usage_based' | 'manual';

export interface Invoice {
  id: string;
  number: string;
  customerId: string;
  subscriptionId?: string;
  type: InvoiceType;
  status: InvoiceStatus;
  currency: Currency;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  lineItems: InvoiceLineItem[];
  dueDate?: Date;
  paidAt?: Date;
  voidedAt?: Date;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  period?: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, string>;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  paymentIntentId: string;
  amount: number;
  currency: Currency;
  createdAt: Date;
}

// =============================================================================
// REFUND TYPES
// =============================================================================

export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';

export type RefundReason =
  | 'duplicate'
  | 'fraudulent'
  | 'requested_by_customer'
  | 'expired_uncaptured_charge'
  | 'product_unacceptable'
  | 'service_unacceptable'
  | 'other';

export interface Refund {
  id: string;
  provider: PaymentProvider;
  providerRefundId?: string;
  paymentIntentId: string;
  paymentTransactionId?: string;
  amount: number;
  currency: Currency;
  status: RefundStatus;
  reason: RefundReason;
  reasonDescription?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  processedAt?: Date;
  failureCode?: string;
  failureMessage?: string;
}

export interface PartialRefund extends Refund {
  originalAmount: number;
  remainingAmount: number;
}

// =============================================================================
// RECONCILIATION TYPES
// =============================================================================

export type ReconciliationStatus = 'pending' | 'matched' | 'unmatched' | 'discrepancy';

export interface ReconciliationReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  provider: PaymentProvider;
  status: ReconciliationStatus;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  discrepancyAmount: number;
  discrepancies: ReconciliationDiscrepancy[];
  generatedAt: Date;
  completedAt?: Date;
}

export interface ReconciliationDiscrepancy {
  id: string;
  type: 'missing' | 'amount_mismatch' | 'currency_mismatch' | 'status_mismatch' | 'duplicate';
  transactionId?: string;
  providerTransactionId?: string;
  expectedAmount?: number;
  actualAmount?: number;
  expectedCurrency?: Currency;
  actualCurrency?: Currency;
  expectedStatus?: PaymentStatus;
  actualStatus?: PaymentStatus;
  description: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export interface ReconciliationRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: 'flag' | 'auto_resolve' | 'manual_review';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SUBSCRIPTION PAYMENT TYPES
// =============================================================================

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  paymentIntentId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  period: {
    start: Date;
    end: Date;
  };
  createdAt: Date;
}

export interface PaymentMethodSetup {
  id: string;
  customerId: string;
  paymentMethodId: string;
  provider: PaymentProvider;
  providerSetupId?: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  failureCode?: string;
  failureMessage?: string;
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

export interface WebhookEvent {
  id: string;
  provider: PaymentProvider;
  type: string;
  data: unknown;
  createdAt: Date;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

export interface WebhookConfig {
  id: string;
  provider: PaymentProvider;
  endpoint: string;
  secret: string;
  events: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
