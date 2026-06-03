/**
 * 0 Lies Mode: VerifiedData Contract
 *
 * Non-negotiable: The site must never display fabricated metrics, fabricated activity, or fabricated social proof.
 * All displayed data must pass this contract before rendering.
 */

export interface VerifiedData<T = number | string> {
  /** Whether the data has been verified against a real data source */
  verified: boolean;

  /** The actual metric value (only displayed if verified=true) */
  value: T;

  /** Exact source of truth (e.g., "D1: users table", "Notion: Profit Metrics database") */
  source: string;

  /** When this data was last computed/fetched */
  computed_at: string;

  /** Optional: Link to view raw data (admin-only) */
  raw_url?: string;

  /** Optional: Demo mode flag - if true, data is clearly marked as demo */
  is_demo?: boolean;

  /** Optional: Definition of how this metric is calculated (for financial data) */
  definition?: string;
}

export type VerifiedMetric = VerifiedData<number>;
export type VerifiedString = VerifiedData<string>;

/**
 * Payment calculation details for real money tracking
 */
export interface PaymentCalculation {
  /** Total payments captured from Stripe */
  gross_payments: number;

  /** Total refunds from Stripe */
  refunds: number;

  /** Total Stripe fees */
  fees: number;

  /** Net cash received (gross - refunds - fees) */
  net_cash_received: number;

  /** Date range for calculation */
  date_range: {
    start: string;
    end: string;
  };

  /** Stripe query parameters used */
  query_params: {
    currency?: string;
    status?: string;
  };

  /** Idempotency key to prevent double-counting */
  idempotency_key: string;
}

/**
 * Helper to create verified data from API responses
 */
export function createVerifiedData<T>(
  value: T,
  source: string,
  options?: {
    computed_at?: string;
    raw_url?: string;
    is_demo?: boolean;
    definition?: string;
  }
): VerifiedData<T> {
  return {
    verified: true,
    value,
    source,
    computed_at: options?.computed_at || new Date().toISOString(),
    raw_url: options?.raw_url,
    is_demo: options?.is_demo || false,
    definition: options?.definition,
  };
}

/**
 * Helper to create verified payment data with calculation details
 */
export function createVerifiedPaymentData(
  calculation: PaymentCalculation,
  source: string
): VerifiedData<number> {
  return {
    verified: true,
    value: calculation.net_cash_received,
    source,
    computed_at: new Date().toISOString(),
    definition: `Net cash received = Stripe payments captured (${calculation.gross_payments.toLocaleString()}) - refunds (${calculation.refunds.toLocaleString()}) - fees (${calculation.fees.toLocaleString()})`,
  };
}

/**
 * Helper to create unverified data (shows "Not connected" state)
 */
export function createUnverifiedData<T>(
  placeholder: T,
  requiredSource: string
): VerifiedData<T> {
  return {
    verified: false,
    value: placeholder,
    source: `Not connected: ${requiredSource}`,
    computed_at: new Date().toISOString(),
  };
}

/**
 * Helper to create demo data (clearly marked as demo)
 */
export function createDemoData<T>(
  value: T,
  source: string
): VerifiedData<T> {
  return {
    verified: true,
    value,
    source: `DEMO: ${source}`,
    computed_at: new Date().toISOString(),
    is_demo: true,
  };
}
