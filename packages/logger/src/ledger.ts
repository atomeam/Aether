// import fs from "fs"
// import path from "path"

export interface ProposalRecord {
  traceId: string
  timestamp: string
  prompt: string
  promptHash: string
  verdict: "APPROVED" | "REJECTED"
  reason: string
  rejectedIds: string[]
  rawActions: unknown[]
}

// Write transactions to a shared workspace analytics root
// const LEDGER_PATH = path.resolve(process.cwd(), "../../logs/proposals-outcomes.jsonl")

/**
 * Reads records from the ledger since a given timestamp.
 * Used by Evaluator to analyze patterns.
 * NOTE: fs and path not compatible with Workers
 * Ledger storage needs to use KV/R2 in Workers environment
 */
export function readRecords(since: number = 3600000): ProposalRecord[] {
  // NOTE: fs and path not compatible with Workers
  // Ledger storage needs to use KV/R2 in Workers environment
  return [];
}

/**
 * Commits a generative proposal transaction safely to the historical ledger.
 * Fail-soft: telemetry errors don't drop client requests.
 * NOTE: Uses fs - not compatible with Workers. Needs R2 migration.
 */
export function commitToLedger(record: Omit<ProposalRecord, "timestamp">): void {
  // NOTE: fs and path not compatible with Workers
  // Ledger storage needs to use KV/R2 in Workers environment
  // Fail-soft on telemetry recording so it doesn't drop client requests
  console.error("TELEMETRY ERROR: Ledger commit not available in Workers environment");
}