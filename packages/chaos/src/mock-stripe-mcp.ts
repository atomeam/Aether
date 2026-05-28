/**
 * Mock Stripe MCP for Convene Demo Fallback
 * 
 * Returns a Stripe-shaped vote without requiring live Stripe MCP.
 * Used when live Stripe MCP is unreachable or returns no payment scope vote.
 */

export interface MockStripeVote {
  assistantName: string;
  scope: string;
  vote: 'approve' | 'reject' | 'abstain';
  confidence: number;
  rationale: string;
  timestamp: number;
}

/**
 * Generate a mock Stripe vote based on context.
 * 
 * Logic: Approve if retry attempts < 5, otherwise reject.
 * This simulates what a real Stripe assistant would decide.
 */
export function generateMockStripeVote(context: Record<string, unknown>): MockStripeVote {
  const chargeId = (context.chargeId as string) || (context.invoiceId as string) || 'ch_unknown';
  const retryAttempt = (context.retryAttempt as number) || 0;
  const error = (context.error as string) || 'unknown';
  
  // Logic: Approve if retries < 5, else reject
  const vote: 'approve' | 'reject' = retryAttempt >= 5 ? 'reject' : 'approve';
  const confidence = vote === 'approve' ? 0.92 : 0.78;
  
  let rationale: string;
  if (vote === 'approve') {
    if (error === 'ECONNREFUSED') {
      rationale = `Charge ${chargeId} shows gateway timeout on retry ${retryAttempt}. Transient failure pattern detected — recommend retry with exponential backoff.`;
    } else {
      rationale = `Charge ${chargeId} shows ${error}. Precedent analysis suggests high retry success — recommend approval.`;
    }
  } else {
    rationale = `Charge ${chargeId} shows ${retryAttempt} failed retry attempts. Gateway consistently failing — recommend escalation to human for refund.`;
  }
  
  return {
    assistantName: 'stripe-mcp',
    scope: 'payments',
    vote,
    confidence,
    rationale,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

/**
 * Inject mock vote into session if no payment scope vote exists.
 * Returns updated votes array.
 */
export function injectMockStripeVoteIfNeeded(
  votes: Array<{ scope: string }>,
  context: Record<string, unknown>
): Array<{ assistantName: string; scope: string; vote: string; confidence: number; rationale: string; timestamp: number }> {
  const hasPaymentVote = votes.some(v => v.scope === 'payments');
  
  if (!hasPaymentVote) {
    const mock = generateMockStripeVote(context);
    // Convert to string type for ConveneResponse compatibility
    return [{
      assistantName: mock.assistantName,
      scope: mock.scope,
      vote: mock.vote,
      confidence: mock.confidence,
      rationale: mock.rationale,
      timestamp: mock.timestamp,
    }];
  }
  
  return [];
}