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
 * Commits a generative proposal transaction safely to the historical ledger.
 * Fail-soft: telemetry errors don't drop client requests.
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
/**
 * Reads ledger records newer than `since` ms ago. Fail-soft: returns [] on error.
 */
export async function readRecords(since: number = 3600000): Promise<Array<Record<string, unknown>>> {
  try {
    if (!fs.existsSync(LEDGER_PATH)) return []
    const cutoff = Date.now() - since
    return fs
      .readFileSync(LEDGER_PATH, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line) as Record<string, unknown> } catch { return null }
      })
      .filter((r): r is Record<string, unknown> => r !== null)
      .filter((r) => !r.timestamp || new Date(String(r.timestamp)).getTime() >= cutoff)
  } catch (err) {
    console.error("TELEMETRY ERROR: Failed to read ledger:", err)
    return []
  }
}
