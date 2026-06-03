import fs from "fs"
import path from "path"

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
const LEDGER_PATH = path.resolve(process.cwd(), "../../logs/proposals-outcomes.jsonl")

/**
 * Reads records from the ledger since a given timestamp.
 * Used by Evaluator to analyze patterns.
 * NOTE: Uses fs - not compatible with Workers. Needs R2 migration.
 */
export function readRecords(since: number = 3600000): ProposalRecord[] {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      return [];
    }

    const content = fs.readFileSync(LEDGER_PATH, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const cutoff = Date.now() - since;

    return lines
      .map(line => JSON.parse(line) as ProposalRecord)
      .filter(record => new Date(record.timestamp).getTime() > cutoff);
  } catch (err) {
    console.error("TELEMETRY ERROR: Failed to read from ledger:", err);
    return [];
  }
}

/**
 * Commits a generative proposal transaction safely to the historical ledger.
 * Fail-soft: telemetry errors don't drop client requests.
 * NOTE: Uses fs - not compatible with Workers. Needs R2 migration.
 */
export function commitToLedger(record: Omit<ProposalRecord, "timestamp">): void {
  const fullRecord: ProposalRecord = {
    timestamp: new Date().toISOString(),
    ...record,
  }

  try {
    const dir = path.dirname(LEDGER_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.appendFileSync(LEDGER_PATH, JSON.stringify(fullRecord) + "\n", "utf8")
  } catch (err) {
    // Fail-soft on telemetry recording so it doesn't drop client requests
    console.error("TELEMETRY ERROR: Failed to commit transaction to ledger:", err)
  }
}