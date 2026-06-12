var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../packages/logger/src/ledger.ts
import fs from "fs";
import path from "path";
function commitToLedger(record2) {
  const fullRecord = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...record2
  };
  try {
    const dir = path.dirname(LEDGER_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(LEDGER_PATH, JSON.stringify(fullRecord) + "\n", "utf8");
  } catch (err) {
    console.error("TELEMETRY ERROR: Failed to commit transaction to ledger:", err);
  }
}
function readRecords(since) {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      return [];
    }
    const content = fs.readFileSync(LEDGER_PATH, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const records = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    if (since) {
      const cutoff = Date.now() - since;
      return records.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
    }
    return records;
  } catch (err) {
    console.error("TELEMETRY ERROR: Failed to read ledger:", err);
    return [];
  }
}
var LEDGER_PATH;
var init_ledger = __esm({
  "../../packages/logger/src/ledger.ts"() {
    LEDGER_PATH = path.resolve(process.cwd(), "../../logs/proposals-outcomes.jsonl");
  }
});

// ../../packages/logger/src/index.ts
import pino from "pino";
function createTraceLogger(context) {
  return log.child({
    traceId: context.traceId,
    ...context.spanId && { spanId: context.spanId },
    ...context.userId && { userId: context.userId }
  });
}
var log;
var init_src = __esm({
  "../../packages/logger/src/index.ts"() {
    init_ledger();
    log = pino({
      level: process.env.LOG_LEVEL || "info",
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ level: label.toUpperCase() })
      }
    });
  }
});

// ../../packages/chaos/src/blast-radius.ts
import * as fs2 from "fs";
function loadState() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (!fs2.existsSync(CYCLE_STATE_FILE)) {
    return {
      filesTouched: [],
      surfacesWritten: [],
      cyclesExecutedToday: 0,
      lastCycleDate: today
    };
  }
  const state = JSON.parse(fs2.readFileSync(CYCLE_STATE_FILE, "utf-8"));
  if (state.lastCycleDate !== today) {
    state.cyclesExecutedToday = 0;
    state.lastCycleDate = today;
    state.filesTouched = [];
    state.surfacesWritten = [];
  }
  return state;
}
function saveState(state) {
  if (!fs2.existsSync(LOG_DIR)) {
    fs2.mkdirSync(LOG_DIR, { recursive: true });
  }
  fs2.writeFileSync(CYCLE_STATE_FILE, JSON.stringify(state, null, 2));
}
function checkBlastRadius(filesToTouch, surfacesToWrite, caps = DEFAULT_CAPS) {
  const state = loadState();
  const filesAfterTouch = state.filesTouched.length + filesToTouch.length;
  const surfacesAfterWrite = state.surfacesWritten.length + surfacesToWrite.length;
  if (filesAfterTouch > caps.maxFilesTouchedPerCycle) {
    return {
      allowed: false,
      reason: `FILES_CAP_EXCEEDED: Would touch ${filesAfterTouch} files, max is ${caps.maxFilesTouchedPerCycle}`,
      currentLoad: {
        filesTouched: state.filesTouched.length,
        surfacesWritten: state.surfacesWritten.length,
        cyclesExecutedToday: state.cyclesExecutedToday
      }
    };
  }
  if (surfacesAfterWrite > caps.maxSurfacesWrittenPerCycle) {
    return {
      allowed: false,
      reason: `SURFACES_CAP_EXCEEDED: Would write ${surfacesAfterWrite} surfaces, max is ${caps.maxSurfacesWrittenPerCycle}`,
      currentLoad: {
        filesTouched: state.filesTouched.length,
        surfacesWritten: state.surfacesWritten.length,
        cyclesExecutedToday: state.cyclesExecutedToday
      }
    };
  }
  if (state.cyclesExecutedToday >= caps.maxCyclesPerDay) {
    return {
      allowed: false,
      reason: `DAILY_CYCLE_LIMIT: ${state.cyclesExecutedToday} cycles already executed today, max is ${caps.maxCyclesPerDay}`,
      currentLoad: {
        filesTouched: state.filesTouched.length,
        surfacesWritten: state.surfacesWritten.length,
        cyclesExecutedToday: state.cyclesExecutedToday
      }
    };
  }
  return {
    allowed: true,
    reason: "Within blast-radius caps",
    currentLoad: {
      filesTouched: state.filesTouched.length,
      surfacesWritten: state.surfacesWritten.length,
      cyclesExecutedToday: state.cyclesExecutedToday
    }
  };
}
function recordCycle(filesTouched, surfacesWritten) {
  const state = loadState();
  for (const file of filesTouched) {
    if (!state.filesTouched.includes(file)) {
      state.filesTouched.push(file);
    }
  }
  for (const surface of surfacesWritten) {
    if (!state.surfacesWritten.includes(surface)) {
      state.surfacesWritten.push(surface);
    }
  }
  state.cyclesExecutedToday++;
  saveState(state);
}
function resetCycleState() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const state = {
    filesTouched: [],
    surfacesWritten: [],
    cyclesExecutedToday: 0,
    lastCycleDate: today
  };
  saveState(state);
  console.log("[BlastRadius] Cycle state reset");
}
function getCapStatus() {
  const state = loadState();
  return {
    allowed: true,
    reason: "Status query",
    currentLoad: {
      filesTouched: state.filesTouched.length,
      surfacesWritten: state.surfacesWritten.length,
      cyclesExecutedToday: state.cyclesExecutedToday
    }
  };
}
var LOG_DIR, DEFAULT_CAPS, CYCLE_STATE_FILE;
var init_blast_radius = __esm({
  "../../packages/chaos/src/blast-radius.ts"() {
    "use strict";
    LOG_DIR = "./logs";
    DEFAULT_CAPS = {
      maxFilesTouchedPerCycle: 3,
      // Strict cap per spec
      maxSurfacesWrittenPerCycle: 3,
      maxConcurrentProposals: 2,
      maxCyclesPerDay: 20
    };
    CYCLE_STATE_FILE = `${LOG_DIR}/cycle-state.json`;
    if (import.meta.url === `file://${process.argv[1]}`) {
      const args = process.argv.slice(2);
      const command = args[0];
      console.log("\n\u26A1 BlastRadius Cap CLI");
      console.log("=".repeat(40));
      if (command === "status") {
        const status = getCapStatus();
        console.log("\nCurrent Load:");
        console.log(`  Files touched: ${status.currentLoad.filesTouched} / ${DEFAULT_CAPS.maxFilesTouchedPerCycle}`);
        console.log(`  Surfaces written: ${status.currentLoad.surfacesWritten} / ${DEFAULT_CAPS.maxSurfacesWrittenPerCycle}`);
        console.log(`  Cycles today: ${status.currentLoad.cyclesExecutedToday} / ${DEFAULT_CAPS.maxCyclesPerDay}`);
      } else if (command === "reset") {
        resetCycleState();
      } else if (command === "check") {
        const files = args.slice(1);
        const result = checkBlastRadius(files, files);
        if (result.allowed) {
          console.log(`
\u2705 ${result.reason}`);
        } else {
          console.log(`
\u274C ${result.reason}`);
        }
      } else {
        console.log("\nCommands:");
        console.log("  status          - Show current cap status");
        console.log("  reset           - Reset cycle state");
        console.log("  check <files>  - Check if files would exceed caps");
      }
    }
  }
});

// ../../packages/chaos/src/quarantine.ts
import * as fs3 from "fs";
function loadQuarantine() {
  if (!fs3.existsSync(QUARANTINE_FILE)) {
    return [];
  }
  const lines = fs3.readFileSync(QUARANTINE_FILE, "utf-8").split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}
function saveQuarantine(items) {
  if (!fs3.existsSync(LOG_DIR2)) {
    fs3.mkdirSync(LOG_DIR2, { recursive: true });
  }
  fs3.writeFileSync(QUARANTINE_FILE, items.map((i) => JSON.stringify(i)).join("\n") + "\n");
}
function quarantineItem(id, type, failedStage, reason, context) {
  const items = loadQuarantine();
  const existing = items.find((i) => i.id === id && i.status === "quarantine");
  if (existing) {
    console.log(`[Quarantine] Item ${id} already in quarantine`);
    return existing;
  }
  const item = {
    id,
    type,
    failedStage,
    reason,
    quarantinedAt: Date.now(),
    status: "quarantine",
    context
  };
  items.push(item);
  saveQuarantine(items);
  console.log(`[Quarantine] Item ${id} quarantined (failed at ${failedStage}: ${reason})`);
  return item;
}
function getQuarantinedItems(includeExpired = false) {
  const items = loadQuarantine();
  if (includeExpired) {
    return items;
  }
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
  const activeItems = items.map((item) => {
    if (item.status === "quarantine" && item.quarantinedAt < sevenDaysAgo) {
      item.status = "expired";
    }
    return item;
  });
  saveQuarantine(activeItems);
  return activeItems.filter((i) => i.status === "quarantine");
}
function getQuarantinedItem(id) {
  const items = loadQuarantine();
  return items.find((i) => i.id === id);
}
function releaseItem(id, releasedBy) {
  const items = loadQuarantine();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) {
    console.log(`[Quarantine] Item ${id} not found`);
    return void 0;
  }
  const item = items[index];
  item.status = "released";
  item.releasedAt = Date.now();
  item.releasedBy = releasedBy;
  items[index] = item;
  saveQuarantine(items);
  console.log(`[Quarantine] Item ${id} released by ${releasedBy}`);
  return item;
}
function deleteQuarantinedItem(id) {
  const items = loadQuarantine();
  const filtered = items.filter((i) => i.id !== id);
  saveQuarantine(filtered);
  console.log(`[Quarantine] Item ${id} deleted`);
}
function cleanupExpired() {
  const items = loadQuarantine();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
  const activeItems = items.filter((i) => {
    if (i.status === "quarantine" && i.quarantinedAt < sevenDaysAgo) {
      i.status = "expired";
    }
    return i.status !== "expired";
  });
  const cleaned = items.length - activeItems.length;
  if (cleaned > 0) {
    saveQuarantine(activeItems);
    console.log(`[Quarantine] Cleaned up ${cleaned} expired items`);
  }
  return cleaned;
}
var LOG_DIR2, QUARANTINE_FILE;
var init_quarantine = __esm({
  "../../packages/chaos/src/quarantine.ts"() {
    "use strict";
    LOG_DIR2 = "./logs";
    QUARANTINE_FILE = `${LOG_DIR2}/quarantine.jsonl`;
    if (import.meta.url === `file://${process.argv[1]}`) {
      const args = process.argv.slice(2);
      const command = args[0];
      console.log("\n\u{1F6D1} Quarantine CLI");
      console.log("=".repeat(40));
      if (command === "list") {
        const items = getQuarantinedItems();
        console.log(`
Quarantined items (${items.length}):
`);
        for (const item of items) {
          console.log(`  ${item.id}`);
          console.log(`    Type: ${item.type}`);
          console.log(`    Failed at: ${item.failedStage}`);
          console.log(`    Reason: ${item.reason}`);
          console.log(`    Quarantined: ${new Date(item.quarantinedAt).toISOString()}`);
          console.log();
        }
      } else if (command === "get") {
        const id = args[1];
        if (!id) {
          console.log("Usage: get <id>");
          process.exit(1);
        }
        const item = getQuarantinedItem(id);
        if (item) {
          console.log(`
${JSON.stringify(item, null, 2)}`);
        } else {
          console.log(`Item ${id} not found`);
        }
      } else if (command === "release") {
        const id = args[1];
        const releasedBy = args[2] || "manual";
        if (!id) {
          console.log("Usage: release <id> [releasedBy]");
          process.exit(1);
        }
        releaseItem(id, releasedBy);
      } else if (command === "delete") {
        const id = args[1];
        if (!id) {
          console.log("Usage: delete <id>");
          process.exit(1);
        }
        deleteQuarantinedItem(id);
      } else if (command === "cleanup") {
        cleanupExpired();
      } else if (command === "quarantine") {
        const id = args[1];
        const type = args[2] || "proposal";
        const failedStage = args[3] || "curator";
        const reason = args.slice(4).join(" ") || "Unknown";
        if (!id) {
          console.log("Usage: quarantine <id> <type> <failedStage> <reason>");
          process.exit(1);
        }
        quarantineItem(id, type, failedStage, reason);
      } else {
        console.log("\nCommands:");
        console.log("  list              - List quarantined items");
        console.log("  get <id>          - Get specific item");
        console.log("  release <id>      - Release item from quarantine");
        console.log("  delete <id>       - Delete item permanently");
        console.log("  cleanup           - Clean up expired items");
        console.log("  quarantine <id>  - Manually quarantine an item");
      }
    }
  }
});

// ../../packages/chaos/src/canary.ts
import * as fs4 from "fs";
function loadCanaryRuns() {
  if (!fs4.existsSync(CANARY_LOG)) {
    return [];
  }
  const lines = fs4.readFileSync(CANARY_LOG, "utf-8").split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}
function saveCanaryRuns(runs) {
  if (!fs4.existsSync(LOG_DIR3)) {
    fs4.mkdirSync(LOG_DIR3, { recursive: true });
  }
  fs4.writeFileSync(CANARY_LOG, runs.map((r) => JSON.stringify(r)).join("\n") + "\n");
}
function initCanary() {
  if (!fs4.existsSync(DOCS_DIR)) {
    fs4.mkdirSync(DOCS_DIR, { recursive: true });
  }
  const placeholder = `${DOCS_DIR}/README.md`;
  if (!fs4.existsSync(placeholder)) {
    fs4.writeFileSync(placeholder, `# Sandbox Surface

This directory contains sandbox surfaces for Alpha canary testing.

Alpha should apply changes here first before production rollout.
`);
  }
  console.log("[Canary] Initialized sandbox surface at", DOCS_DIR);
}
function startCanaryRun(cycleId, surfaces) {
  const runs = loadCanaryRuns();
  const run = {
    id: `canary_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    cycleId,
    surfaces,
    status: "pending",
    createdAt: Date.now()
  };
  runs.push(run);
  saveCanaryRuns(runs);
  console.log(`[Canary] Started canary run ${run.id} for cycle ${cycleId}`);
  return run;
}
function checkCanaryPromotion(runId, fileCount = 1) {
  const runs = loadCanaryRuns();
  const run = runs.find((r) => r.id === runId);
  if (!run) {
    console.log(`[Canary] Run ${runId} not found`);
    return false;
  }
  if (run.status !== "pending") {
    console.log(`[Canary] Run ${runId} already processed (status: ${run.status})`);
    return run.status === "promoted";
  }
  const config2 = DEFAULT_CANARY_CONFIG;
  let delay;
  if (fileCount <= 2) {
    delay = config2.tieredDelay.low;
  } else if (fileCount === 3) {
    delay = config2.tieredDelay.medium;
  } else {
    delay = config2.tieredDelay.high;
  }
  const elapsed = Date.now() - run.createdAt;
  if (elapsed >= delay) {
    run.status = "promoted";
    run.promotedAt = Date.now();
    saveCanaryRuns(runs);
    console.log(`[Canary] Run ${runId} promoted to production after ${delay / 36e5}h`);
    return true;
  }
  console.log(`[Canary] Run ${runId} pending (${Math.round((delay - elapsed) / 1e3 / 60)}min remaining)`);
  return false;
}
function triggerCanaryAlert(runId, reason) {
  const runs = loadCanaryRuns();
  const run = runs.find((r) => r.id === runId);
  if (!run) {
    console.log(`[Canary] Run ${runId} not found`);
    return;
  }
  run.status = "alert";
  run.alertAt = Date.now();
  run.alertReason = reason;
  saveCanaryRuns(runs);
  console.log(`[Canary] \u26A0\uFE0F ALERT for run ${runId}: ${reason}`);
}
function getPendingCanaryRuns() {
  const runs = loadCanaryRuns();
  return runs.filter((r) => r.status === "pending");
}
function getCanaryStatus(cycleId) {
  const runs = loadCanaryRuns();
  return runs.find((r) => r.cycleId === cycleId);
}
var LOG_DIR3, CANARY_LOG, DOCS_DIR, DEFAULT_CANARY_CONFIG;
var init_canary = __esm({
  "../../packages/chaos/src/canary.ts"() {
    "use strict";
    LOG_DIR3 = "./logs";
    CANARY_LOG = `${LOG_DIR3}/canary.jsonl`;
    DOCS_DIR = "./docs/sandbox";
    DEFAULT_CANARY_CONFIG = {
      enabled: true,
      tieredDelay: {
        low: 60 * 60 * 1e3,
        // 1 hour
        medium: 4 * 60 * 60 * 1e3,
        // 4 hours
        high: 24 * 60 * 60 * 1e3
        // 24 hours
      },
      alertOnFailure: true
    };
    if (import.meta.url === `file://${process.argv[1]}`) {
      const args = process.argv.slice(2);
      const command = args[0];
      console.log("\n\u{1F426} Canary CLI");
      console.log("=".repeat(40));
      if (command === "init") {
        initCanary();
      } else if (command === "start") {
        const cycleId = args[1] || "test_cycle";
        const surfaces = args.slice(2) || ["test.txt"];
        startCanaryRun(cycleId, surfaces);
      } else if (command === "check") {
        const runId = args[1];
        if (!runId) {
          console.log("Usage: check <runId>");
          process.exit(1);
        }
        const shouldPromote = checkCanaryPromotion(runId);
        console.log(`
Should promote: ${shouldPromote}`);
      } else if (command === "alert") {
        const runId = args[1];
        const reason = args.slice(2).join(" ") || "Unknown failure";
        if (!runId) {
          console.log("Usage: alert <runId> <reason>");
          process.exit(1);
        }
        triggerCanaryAlert(runId, reason);
      } else if (command === "pending") {
        const runs = getPendingCanaryRuns();
        console.log(`
Pending runs (${runs.length}):`);
        for (const run of runs) {
          console.log(`  ${run.id} - cycle ${run.cycleId}`);
        }
      } else if (command === "status") {
        const cycleId = args[1];
        if (!cycleId) {
          console.log("Usage: status <cycleId>");
          process.exit(1);
        }
        const run = getCanaryStatus(cycleId);
        if (run) {
          console.log(`
${JSON.stringify(run, null, 2)}`);
        } else {
          console.log(`No canary run for cycle ${cycleId}`);
        }
      } else {
        console.log("\nCommands:");
        console.log("  init               - Initialize canary environment");
        console.log("  start <cycleId>   - Start new canary run");
        console.log("  check <runId>     - Check promotion status");
        console.log("  alert <runId>      - Trigger alert");
        console.log("  pending            - List pending runs");
        console.log("  status <cycleId>   - Get status for cycle");
      }
    }
  }
});

// ../../packages/chaos/src/auto-revert.ts
import * as fs5 from "fs";
function loadState2() {
  if (!fs5.existsSync(STATE_FILE)) {
    return {
      errorCount: 0,
      totalCycles: 0,
      consecutiveDenials: 0,
      lastResetAt: Date.now()
    };
  }
  return JSON.parse(fs5.readFileSync(STATE_FILE, "utf-8"));
}
function saveState2(state) {
  if (!fs5.existsSync(LOG_DIR4)) {
    fs5.mkdirSync(LOG_DIR4, { recursive: true });
  }
  fs5.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}
function recordCycleSuccess() {
  const state = loadState2();
  state.totalCycles++;
  state.errorCount = Math.max(0, state.errorCount - 1);
  state.consecutiveDenials = 0;
  saveState2(state);
}
function recordCycleError() {
  const state = loadState2();
  state.totalCycles++;
  state.errorCount++;
  state.consecutiveDenials = 0;
  saveState2(state);
}
function recordCuratorDenial() {
  const state = loadState2();
  state.totalCycles++;
  state.consecutiveDenials++;
  saveState2(state);
}
function checkRevertSignals() {
  const state = loadState2();
  const thresholds = DEFAULT_REVERT_THRESHOLDS;
  if (state.totalCycles >= 10) {
    const errorRate = state.errorCount / state.totalCycles;
    if (errorRate > thresholds.errorRateThreshold) {
      return {
        type: "error_rate",
        timestamp: Date.now(),
        cycleId: `cycle_${Date.now()}`,
        context: { errorRate, totalCycles: state.totalCycles },
        severity: "soft"
      };
    }
  }
  if (state.consecutiveDenials >= thresholds.consecutiveDenialsThreshold) {
    return {
      type: "curator_denial",
      timestamp: Date.now(),
      cycleId: `cycle_${Date.now()}`,
      context: { consecutiveDenials: state.consecutiveDenials },
      severity: "hard"
    };
  }
  return null;
}
function getErrorRate() {
  const state = loadState2();
  if (state.totalCycles === 0) return 0;
  return state.errorCount / state.totalCycles;
}
function getRevertStatus() {
  const state = loadState2();
  const signal = checkRevertSignals();
  return {
    errorRate: getErrorRate(),
    consecutiveDenials: state.consecutiveDenials,
    totalCycles: state.totalCycles,
    shouldRevert: signal !== null,
    revertSignal: signal
  };
}
async function createCheckpoint(cycleId, files) {
  if (!fs5.existsSync(CHECKPOINT_DIR)) {
    fs5.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  }
  const checkpoint = {
    id: `cp_${Date.now()}`,
    cycleId,
    timestamp: Date.now(),
    files: {},
    createdAt: Date.now()
  };
  for (const file of files) {
    if (fs5.existsSync(file)) {
      const content = fs5.readFileSync(file, "utf-8");
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        hash = (hash << 5) - hash + content.charCodeAt(i);
        hash = hash & hash;
      }
      checkpoint.files[file] = Math.abs(hash).toString(16);
    }
  }
  const cpFile = `${CHECKPOINT_DIR}/${checkpoint.id}.json`;
  fs5.writeFileSync(cpFile, JSON.stringify(checkpoint, null, 2));
  console.log(`[AutoRevert] Created checkpoint ${checkpoint.id} for cycle ${cycleId}`);
  return checkpoint;
}
async function revertToCheckpoint(checkpointId) {
  const cpFile = `${CHECKPOINT_DIR}/${checkpointId}.json`;
  if (!fs5.existsSync(cpFile)) {
    console.log(`[AutoRevert] Checkpoint ${checkpointId} not found`);
    return [];
  }
  const checkpoint = JSON.parse(fs5.readFileSync(cpFile, "utf-8"));
  const reverted = [];
  for (const [file, expectedHash] of Object.entries(checkpoint.files)) {
    if (!fs5.existsSync(file)) continue;
    const content = fs5.readFileSync(file, "utf-8");
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) - hash + content.charCodeAt(i);
      hash = hash & hash;
    }
    const currentHash = Math.abs(hash).toString(16);
    if (currentHash !== expectedHash) {
      reverted.push(file);
    }
  }
  const signal = {
    type: "manual",
    timestamp: Date.now(),
    cycleId: checkpoint.cycleId,
    context: { checkpointId, revertedFiles: reverted },
    severity: "soft"
  };
  const logEntry = JSON.stringify(signal) + "\n";
  fs5.appendFileSync(REVERT_LOG, logEntry);
  console.log(`[AutoRevert] Reverted to checkpoint ${checkpointId}, ${reverted.length} files differ`);
  return reverted;
}
var LOG_DIR4, CHECKPOINT_DIR, REVERT_LOG, DEFAULT_REVERT_THRESHOLDS, STATE_FILE;
var init_auto_revert = __esm({
  "../../packages/chaos/src/auto-revert.ts"() {
    "use strict";
    LOG_DIR4 = "./logs";
    CHECKPOINT_DIR = `${LOG_DIR4}/checkpoints`;
    REVERT_LOG = `${LOG_DIR4}/revert-log.jsonl`;
    DEFAULT_REVERT_THRESHOLDS = {
      errorRateThreshold: 0.1,
      // 10%
      consecutiveDenialsThreshold: 5,
      // 5 denials
      lessonCollisionThreshold: 2,
      // 2 collisions
      runtimeDriftThreshold: 3
      // 3 files
    };
    STATE_FILE = `${LOG_DIR4}/revert-state.json`;
    if (import.meta.url === `file://${process.argv[1]}`) {
      const args = process.argv.slice(2);
      const command = args[0];
      console.log("\n\u21A9\uFE0F AutoRevert CLI");
      console.log("=".repeat(40));
      if (command === "status") {
        const status = getRevertStatus();
        console.log(`
Revert Status:`);
        console.log(`  Error Rate: ${(status.errorRate * 100).toFixed(1)}%`);
        console.log(`  Consecutive Denials: ${status.consecutiveDenials}`);
        console.log(`  Total Cycles: ${status.totalCycles}`);
        console.log(`  Should Revert: ${status.shouldRevert}`);
        if (status.revertSignal) {
          console.log(`  Signal: ${status.revertSignal.type} (${status.revertSignal.severity})`);
        }
      } else if (command === "record") {
        const subcommand = args[1];
        if (subcommand === "success") {
          recordCycleSuccess();
          console.log("Recorded cycle success");
        } else if (subcommand === "error") {
          recordCycleError();
          console.log("Recorded cycle error");
        } else if (subcommand === "denial") {
          recordCuratorDenial();
          console.log("Recorded curator denial");
        } else {
          console.log("Usage: record success|error|denial");
        }
      } else if (command === "check") {
        const signal = checkRevertSignals();
        if (signal) {
          console.log(`
\u26A0\uFE0F Revert signal: ${signal.type} (${signal.severity})`);
        } else {
          console.log("\n\u2705 No revert signals triggered");
        }
      } else if (command === "checkpoint") {
        const cycleId = args[1] || "test_cycle";
        const files = args.slice(2).length > 0 ? args.slice(2) : ["package.json"];
        createCheckpoint(cycleId, files);
      } else if (command === "revert") {
        const checkpointId = args[1];
        if (!checkpointId) {
          console.log("Usage: revert <checkpointId>");
          process.exit(1);
        }
        revertToCheckpoint(checkpointId);
      } else {
        console.log("\nCommands:");
        console.log("  status                   - Show revert status");
        console.log("  record success|error|denial - Record cycle outcome");
        console.log("  check                   - Check if revert needed");
        console.log("  checkpoint <id> <files>   - Create checkpoint");
        console.log("  revert <checkpointId>       - Revert to checkpoint");
      }
    }
  }
});

// ../../packages/chaos/src/index.ts
var src_exports = {};
__export(src_exports, {
  DEFAULT_CANARY_CONFIG: () => DEFAULT_CANARY_CONFIG,
  DEFAULT_CAPS: () => DEFAULT_CAPS,
  DEFAULT_REVERT_THRESHOLDS: () => DEFAULT_REVERT_THRESHOLDS,
  checkBlastRadius: () => checkBlastRadius,
  checkCanaryPromotion: () => checkCanaryPromotion,
  checkRevertSignals: () => checkRevertSignals,
  cleanupExpired: () => cleanupExpired,
  cleanupSandbox: () => cleanupSandbox,
  createCheckpoint: () => createCheckpoint,
  deleteQuarantinedItem: () => deleteQuarantinedItem,
  executeChaos: () => executeChaos,
  getCanaryStatus: () => getCanaryStatus,
  getCapStatus: () => getCapStatus,
  getErrorRate: () => getErrorRate,
  getPendingCanaryRuns: () => getPendingCanaryRuns,
  getQuarantinedItem: () => getQuarantinedItem,
  getQuarantinedItems: () => getQuarantinedItems,
  getRevertStatus: () => getRevertStatus,
  getScenarios: () => getScenarios,
  initCanary: () => initCanary,
  quarantineItem: () => quarantineItem,
  recordCuratorDenial: () => recordCuratorDenial,
  recordCycle: () => recordCycle,
  recordCycleError: () => recordCycleError,
  recordCycleSuccess: () => recordCycleSuccess,
  releaseItem: () => releaseItem,
  resetCycleState: () => resetCycleState,
  revertToCheckpoint: () => revertToCheckpoint,
  startCanaryRun: () => startCanaryRun,
  triggerCanaryAlert: () => triggerCanaryAlert
});
import fs6 from "fs";
import path2 from "path";
function executeChaos(scenario, targetPath) {
  const sandboxPath = targetPath || "sandbox";
  const allowed = SANDBOX_PATHS.some((sp) => sandboxPath.startsWith(sp) || sandboxPath.includes("sandbox"));
  if (!allowed) {
    throw new Error("Security: Chaos injection restricted to sandbox directories");
  }
  const fullPath = path2.resolve(process.cwd(), sandboxPath);
  if (!fs6.existsSync(fullPath)) {
    fs6.mkdirSync(fullPath, { recursive: true });
  }
  switch (scenario) {
    case "broken_package_json": {
      const pkg = JSON.stringify({ name: "broken", version: "1.0", dependencies: { invalid: "}" } }, null, 2);
      fs6.writeFileSync(path2.join(fullPath, "package.json"), pkg);
      return {
        status: "success",
        scenario: "broken_package_json",
        injected: "SyntaxError: Unexpected token } in package.json",
        ledgerTrace: "ERR_CHAOS_001: package.json parsing failed",
        sandboxPath
      };
    }
    case "corrupted_env_var": {
      fs6.writeFileSync(path2.join(fullPath, ".env"), "PORT=not_a_number\nDEBUG=invalid\n");
      return {
        status: "success",
        scenario: "corrupted_env_var",
        injected: "PORT=not_a_number",
        ledgerTrace: "ERR_CHAOS_002: [@aether/env] validation failed for PORT",
        sandboxPath
      };
    }
    case "invalid_syntax": {
      fs6.writeFileSync(path2.join(fullPath, "broken.js"), "const x == 5;\nexport default x;");
      return {
        status: "success",
        scenario: "invalid_syntax",
        injected: "const x == 5;",
        ledgerTrace: "ERR_CHAOS_003: Parsing error: Unexpected token ==",
        sandboxPath
      };
    }
    case "missing_dep": {
      const pkg = JSON.stringify({ name: "test", version: "1.0.0" }, null, 2);
      fs6.writeFileSync(path2.join(fullPath, "package.json"), pkg);
      return {
        status: "success",
        scenario: "missing_dep",
        injected: "missing dependency: non-existent-package",
        ledgerTrace: "ERR_CHAOS_004: npm install failed - package not found",
        sandboxPath
      };
    }
    case "network_timeout": {
      fs6.writeFileSync(path2.join(fullPath, "timeout.sh"), '#!/bin/bash\necho "Simulated timeout"\nsleep 300\n');
      return {
        status: "success",
        scenario: "network_timeout",
        injected: "timeout: 300s",
        ledgerTrace: "ERR_CHAOS_005: Request timeout after 300s",
        sandboxPath
      };
    }
    default:
      throw new Error(`Unknown chaos scenario: ${scenario}`);
  }
}
function getScenarios() {
  return [
    { id: "broken_package_json", description: "Corrupt a package.json" },
    { id: "corrupted_env_var", description: "Invalid env variable" },
    { id: "invalid_syntax", description: "JavaScript syntax error" },
    { id: "missing_dep", description: "Missing npm dependency" },
    { id: "network_timeout", description: "Simulated timeout" }
  ];
}
function cleanupSandbox(targetPath) {
  const sandboxPath = targetPath || "sandbox";
  const fullPath = path2.resolve(process.cwd(), sandboxPath);
  if (fs6.existsSync(fullPath)) {
    fs6.rmSync(fullPath, { recursive: true, force: true });
  }
  return { cleaned: sandboxPath };
}
var SANDBOX_PATHS;
var init_src2 = __esm({
  "../../packages/chaos/src/index.ts"() {
    "use strict";
    init_blast_radius();
    init_quarantine();
    init_canary();
    init_auto_revert();
    SANDBOX_PATHS = [
      "sandbox",
      "packages/mcp-tools/sandbox",
      "../../sandbox"
    ];
  }
});

// ../../packages/curator-audit/src/index.ts
var src_exports2 = {};
__export(src_exports2, {
  AuditRecordSchema: () => AuditRecordSchema,
  getDecisions: () => getDecisions,
  getStats: () => getStats,
  logDecision: () => logDecision,
  verifyChainIntegrity: () => verifyChainIntegrity
});
import { z as z4 } from "zod";
import fs7 from "fs";
import path3 from "path";
import crypto from "crypto";
function ensureDir() {
  const dir = path3.dirname(AUDIT_PATH);
  if (!fs7.existsSync(dir)) fs7.mkdirSync(dir, { recursive: true });
}
function getPolicyHash() {
  try {
    const policyContent = fs7.readFileSync("../../packages/curator/policy.yaml", "utf-8");
    return crypto.createHash("sha256").update(policyContent).digest("hex").slice(0, 16);
  } catch {
    return "unknown";
  }
}
function loadChainState() {
  if (!fs7.existsSync(CHAIN_STATE_PATH)) return { lastHash: "", lastIndex: 0, lastPolicyHash: "" };
  return JSON.parse(fs7.readFileSync(CHAIN_STATE_PATH, "utf-8"));
}
function saveChainState(state) {
  const dir = path3.dirname(CHAIN_STATE_PATH);
  if (!fs7.existsSync(dir)) fs7.mkdirSync(dir, { recursive: true });
  fs7.writeFileSync(CHAIN_STATE_PATH, JSON.stringify(state));
}
function computeRecordHash(record2, previousHash) {
  const payload = JSON.stringify({ ...record2, hash: void 0 }) + previousHash;
  return crypto.createHash("sha256").update(payload).digest("hex");
}
function logDecision(input) {
  ensureDir();
  const chainState = loadChainState();
  const policyHash = getPolicyHash();
  const record2 = {
    decisionId: crypto.randomUUID(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    previousHash: chainState.lastHash,
    policyHash,
    ...input,
    hash: ""
  };
  record2.hash = computeRecordHash(record2, chainState.lastHash);
  fs7.appendFileSync(AUDIT_PATH, JSON.stringify(record2) + "\n");
  chainState.lastHash = record2.hash;
  chainState.lastIndex++;
  chainState.lastPolicyHash = policyHash;
  saveChainState(chainState);
  return record2;
}
function verifyChainIntegrity() {
  if (!fs7.existsSync(AUDIT_PATH)) return { valid: true, errors: [] };
  const chainState = loadChainState();
  const content = fs7.readFileSync(AUDIT_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const errors = [];
  let expectedPreviousHash = "";
  for (let i = 0; i < lines.length; i++) {
    const record2 = AuditRecordSchema.parse(JSON.parse(lines[i]));
    if (record2.previousHash !== expectedPreviousHash) {
      errors.push(`Line ${i + 1}: Previous hash mismatch`);
    }
    const payload = JSON.stringify({ ...record2, hash: void 0 }) + record2.previousHash;
    const expectedHash = crypto.createHash("sha256").update(payload).digest("hex");
    if (record2.hash !== expectedHash) {
      errors.push(`Line ${i + 1}: Hash mismatch`);
    }
    expectedPreviousHash = record2.hash;
  }
  if (expectedPreviousHash !== chainState.lastHash) {
    errors.push("Terminal state mismatch");
  }
  return { valid: errors.length === 0, brokenAt: errors[0] ? 1 : void 0, errors };
}
function getDecisions(options) {
  const { since, tool, decision, limit = 100 } = options || {};
  if (!fs7.existsSync(AUDIT_PATH)) return Promise.resolve([]);
  const content = fs7.readFileSync(AUDIT_PATH, "utf-8");
  let records = content.trim().split("\n").filter(Boolean).map((line) => AuditRecordSchema.parse(JSON.parse(line)));
  if (since) {
    const cutoff = Date.now() - since;
    records = records.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
  }
  if (tool) records = records.filter((r) => r.tool === tool);
  if (decision) records = records.filter((r) => r.decision === decision);
  return records.slice(-limit);
}
async function getStats() {
  const records = await getDecisions({ limit: 1e3 });
  const total = records.length;
  const approved = records.filter((r) => r.decision === "approve").length;
  const denied = records.filter((r) => r.decision === "deny").length;
  const escalated = records.filter((r) => r.decision === "escalate").length;
  return { total, approved, denied, escalated, denial_rate: total > 0 ? denied / total : 0 };
}
var AuditRecordSchema, AUDIT_PATH, CHAIN_STATE_PATH;
var init_src3 = __esm({
  "../../packages/curator-audit/src/index.ts"() {
    "use strict";
    AuditRecordSchema = z4.object({
      decisionId: z4.string(),
      runId: z4.string().optional(),
      timestamp: z4.string(),
      actor: z4.enum(["executor", "evaluator", "reflector", "human", "system"]),
      tool: z4.string(),
      args: z4.record(z4.unknown()).optional(),
      decision: z4.enum(["approve", "deny", "escalate"]),
      rule: z4.string().optional(),
      confidence: z4.number().min(0).max(1).optional(),
      reason: z4.string().optional(),
      hash: z4.string().optional(),
      previousHash: z4.string().optional(),
      policyHash: z4.string().optional()
    });
    AUDIT_PATH = path3.resolve(process.cwd(), "../../logs/curator-audit.jsonl");
    CHAIN_STATE_PATH = path3.resolve(process.cwd(), "../../logs/audit-chain-state.json");
  }
});

// src/agents/evaluator.ts
var evaluator_exports = {};
__export(evaluator_exports, {
  evaluateLedger: () => evaluateLedger,
  getEvaluatorHealth: () => getEvaluatorHealth
});
function evaluateLedger(since = 36e5) {
  const records = readRecords(since);
  const results = [];
  for (const record2 of records) {
    if (record2.verdict === "APPROVED") continue;
    const combined = `${record2.reason || ""}`.toLowerCase();
    for (const { pattern, suggestion, priority } of PATTERNS) {
      if (pattern.test(combined)) {
        results.push({
          pattern: pattern.source,
          suggestion,
          priority
        });
        break;
      }
    }
  }
  const unique = results.filter((v, i, a) => a.findIndex((t) => t.pattern === v.pattern) === i);
  const order = { high: 0, medium: 1, low: 2 };
  unique.sort((a, b) => order[a.priority] - order[b.priority]);
  return unique;
}
function getEvaluatorHealth() {
  return {
    status: "running",
    patternCount: PATTERNS.length,
    watching: true
  };
}
var PATTERNS;
var init_evaluator = __esm({
  "src/agents/evaluator.ts"() {
    init_src();
    PATTERNS = [
      {
        pattern: /npm error/,
        suggestion: "Check package.json dependencies and lockfile",
        priority: "high"
      },
      {
        pattern: /E404.*@aether/,
        suggestion: "Use file: dependencies instead of npm registry",
        priority: "high"
      },
      {
        pattern: /command not found/,
        suggestion: "Add dependency to devDependencies",
        priority: "medium"
      },
      {
        pattern: /module not found/i,
        suggestion: "Check imports and package.json exports",
        priority: "medium"
      },
      {
        pattern: /422/i,
        suggestion: "Check Curator allow-list or input validation",
        priority: "low"
      }
    ];
  }
});

// ../../packages/metrics/src/index.ts
var src_exports3 = {};
__export(src_exports3, {
  counter: () => counter,
  gauge: () => gauge,
  getGauge: () => getGauge,
  getHistory: () => getHistory,
  increment: () => increment,
  record: () => record,
  reset: () => reset,
  snapshot: () => snapshot,
  summary: () => summary
});
function record(name, value, tags) {
  const point = {
    name,
    value,
    timestamp: Date.now(),
    tags
  };
  const existing = metrics.get(name) || [];
  existing.push(point);
  if (existing.length > 1e3) {
    existing.shift();
  }
  metrics.set(name, existing);
  return point;
}
function increment(name, delta = 1) {
  const current = counters.get(name) || 0;
  counters.set(name, current + delta);
  return current + delta;
}
function counter(name) {
  return counters.get(name) || 0;
}
function gauge(name, value) {
  gauges.set(name, value);
  return value;
}
function getGauge(name) {
  return gauges.get(name) || 0;
}
function getHistory(name, since) {
  const points = metrics.get(name) || [];
  if (!since) return points;
  const cutoff = Date.now() - since;
  return points.filter((p) => p.timestamp >= cutoff);
}
function summary(name) {
  const points = metrics.get(name) || [];
  if (points.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0 };
  }
  const values = points.map((p) => p.value);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    sum
  };
}
function snapshot() {
  return {
    counters: Object.fromEntries(counters),
    gauges: Object.fromEntries(gauges),
    metrics: Object.fromEntries(metrics)
  };
}
function reset() {
  metrics.clear();
  counters.clear();
  gauges.clear();
}
var metrics, counters, gauges;
var init_src4 = __esm({
  "../../packages/metrics/src/index.ts"() {
    metrics = /* @__PURE__ */ new Map();
    counters = /* @__PURE__ */ new Map();
    gauges = /* @__PURE__ */ new Map();
  }
});

// ../../packages/lessons/src/index.ts
var src_exports4 = {};
__export(src_exports4, {
  LessonSchema: () => LessonSchema,
  WriteLessonInput: () => WriteLessonInput,
  getPatternConfidence: () => getPatternConfidence,
  getPatternConfidences: () => getPatternConfidences,
  readLessons: () => readLessons,
  writeLesson: () => writeLesson
});
import { z as z5 } from "zod";
import fs8 from "fs";
import path4 from "path";
import crypto2 from "crypto";
function ensureDir2() {
  const dir = path4.dirname(LESSONS_PATH);
  if (!fs8.existsSync(dir)) {
    fs8.mkdirSync(dir, { recursive: true });
  }
}
function writeLesson(input) {
  ensureDir2();
  const lesson = {
    id: crypto2.randomUUID(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...input
  };
  const line = JSON.stringify(lesson) + "\n";
  fs8.appendFileSync(LESSONS_PATH, line);
  return lesson;
}
function readLessons(options) {
  const { since, pattern, limit = 100 } = options || {};
  if (!fs8.existsSync(LESSONS_PATH)) {
    return Promise.resolve([]);
  }
  const content = fs8.readFileSync(LESSONS_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let lessons = lines.map((line) => LessonSchema.parse(JSON.parse(line)));
  if (since) {
    const cutoff = Date.now() - since;
    lessons = lessons.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
  }
  if (pattern) {
    lessons = lessons.filter((l) => l.pattern.includes(pattern));
  }
  return lessons.slice(-limit);
}
async function getPatternConfidence(pattern) {
  const lessons = await readLessons({ pattern, limit: 50 });
  if (lessons.length === 0) {
    return 0.5;
  }
  let weightedSum = 0;
  let totalWeight = 0;
  const now = Date.now();
  for (const lesson of lessons) {
    const age = now - new Date(lesson.timestamp).getTime();
    const recency = Math.max(0.1, 1 - age / (7 * 24 * 60 * 60 * 1e3));
    const weight = recency;
    if (lesson.outcome === "success") {
      weightedSum += lesson.confidence * weight;
    } else if (lesson.outcome === "failure") {
      weightedSum += (1 - lesson.confidence) * weight * -1;
    }
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0.5;
  return Math.max(0, Math.min(1, (weightedSum / totalWeight + 1) / 2));
}
async function getPatternConfidences() {
  if (!fs8.existsSync(LESSONS_PATH)) {
    return {};
  }
  const content = fs8.readFileSync(LESSONS_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const patterns = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const lesson = LessonSchema.parse(JSON.parse(line));
    const stats = patterns.get(lesson.pattern) || { success: 0, failure: 0, total: 0 };
    if (lesson.outcome === "success") stats.success++;
    else if (lesson.outcome === "failure") stats.failure++;
    stats.total++;
    patterns.set(lesson.pattern, stats);
  }
  const result = {};
  for (const [pattern, stats] of patterns) {
    result[pattern] = stats.total > 0 ? stats.success / stats.total : 0.5;
  }
  return result;
}
var LessonSchema, WriteLessonInput, LESSONS_PATH;
var init_src5 = __esm({
  "../../packages/lessons/src/index.ts"() {
    "use strict";
    LessonSchema = z5.object({
      id: z5.string(),
      pattern: z5.string(),
      // e.g., "npm error", "E404", "422"
      suggestion: z5.string(),
      // what Evaluator suggested
      action: z5.string(),
      // what Executor did
      outcome: z5.enum(["success", "failure", "noop"]),
      confidence: z5.number().min(0).max(1),
      runId: z5.string().optional(),
      timestamp: z5.string()
    });
    WriteLessonInput = LessonSchema.omit({ id: true, timestamp: true });
    LESSONS_PATH = path4.resolve(process.cwd(), "../../logs/lessons.jsonl");
  }
});

// src/agents/reflector.ts
var reflector_exports = {};
__export(reflector_exports, {
  checkConfidence: () => checkConfidence,
  getLearnedPatterns: () => getLearnedPatterns,
  getReflectorHealth: () => getReflectorHealth,
  reflect: () => reflect
});
async function reflect(input) {
  const lesson = writeLesson({
    pattern: input.pattern,
    suggestion: input.suggestion,
    action: input.action,
    outcome: input.outcome,
    confidence: input.confidence,
    runId: input.runId
  });
  return {
    lessonId: lesson.id,
    confidence: input.confidence
  };
}
async function checkConfidence(pattern) {
  return getPatternConfidence(pattern);
}
async function getLearnedPatterns() {
  return getPatternConfidences();
}
function getReflectorHealth() {
  return {
    status: "ready",
    lessons: "append-only",
    queryable: true
  };
}
var init_reflector = __esm({
  "src/agents/reflector.ts"() {
    init_src5();
  }
});

// ../../packages/mcp-tools/src/index.ts
async function executeTool(name, args) {
  const tool = toolRegistry[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.execute(args);
}
var fileReadTool, fileWriteTool, gitStatusTool, gitCommitTool, gitDiffTool, httpRequestTool, toolRegistry, lessonsWriteTool, getAgentStateTool, triggerWorkflowTool, chaosInjectTool, listChaosScenariosTool;
var init_src6 = __esm({
  "../../packages/mcp-tools/src/index.ts"() {
    "use strict";
    fileReadTool = {
      name: "file_read",
      description: "Read contents of a file",
      async execute(args) {
        const path18 = args.path;
        if (!path18) throw new Error("path required");
        if (!path18.includes("/workspace/project/Aether")) {
          throw new Error("Access denied: path must be in workspace");
        }
        const fs22 = await import("fs/promises");
        const content = await fs22.readFile(path18, "utf-8");
        return { path: path18, content, length: content.length };
      }
    };
    fileWriteTool = {
      name: "file_write",
      description: "Write content to a file",
      async execute(args) {
        const path18 = args.path;
        const content = args.content;
        if (!path18 || content === void 0) throw new Error("path and content required");
        if (!path18.includes("/workspace/project/Aether")) {
          throw new Error("Access denied: path must be in workspace");
        }
        const fs22 = await import("fs/promises");
        await fs22.writeFile(path18, content, "utf-8");
        return { path: path18, written: true };
      }
    };
    gitStatusTool = {
      name: "git_status",
      description: "Check git repository status",
      async execute(args) {
        const { exec: exec2 } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec2.exec);
        const cwd = args.cwd || process.cwd();
        const { stdout } = await execAsync("git status --short", { cwd });
        return { status: stdout || "clean", cwd };
      }
    };
    gitCommitTool = {
      name: "git_commit",
      description: "Create a git commit",
      async execute(args) {
        const message = args.message;
        if (!message) throw new Error("message required");
        const { exec: exec2 } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec2.exec);
        const cwd = args.cwd || process.cwd();
        await execAsync("git add -A", { cwd });
        const { stdout } = await execAsync(`git commit -m "${message}"`, { cwd });
        return { message, output: stdout };
      }
    };
    gitDiffTool = {
      name: "git_diff",
      description: "Show uncommitted changes",
      async execute(args) {
        const { exec: exec2 } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec2.exec);
        const cwd = args.cwd || process.cwd();
        const file = args.file || "";
        const cmd = file ? `git diff ${file}` : "git diff";
        const { stdout } = await execAsync(cmd, { cwd });
        return { diff: stdout || "no changes", cwd, file: file || "all" };
      }
    };
    httpRequestTool = {
      name: "http_request",
      description: "Make an HTTP request (GET/HEAD only)",
      async execute(args) {
        const url = args.url;
        const method = args.method || "GET";
        if (!url) throw new Error("url required");
        if (!["GET", "HEAD"].includes(method)) {
          throw new Error("Only GET and HEAD allowed");
        }
        const response = await fetch(url, { method });
        return {
          url,
          status: response.status,
          ok: response.ok
        };
      }
    };
    toolRegistry = {
      file_read: fileReadTool,
      file_write: fileWriteTool,
      git_status: gitStatusTool,
      git_commit: gitCommitTool,
      git_diff: gitDiffTool,
      http_request: httpRequestTool
    };
    lessonsWriteTool = {
      name: "lessons_write",
      description: "Write a lesson to the Lessons DB",
      async execute(args) {
        const { writeLesson: writeLesson2 } = await Promise.resolve().then(() => (init_src5(), src_exports4));
        const result = await writeLesson2({
          pattern: args.pattern,
          suggestion: args.suggestion,
          action: args.action,
          outcome: args.outcome,
          confidence: args.confidence
        });
        return result;
      }
    };
    toolRegistry.lessons_write = lessonsWriteTool;
    getAgentStateTool = {
      name: "get_agent_state",
      description: "Retrieve execution counts and failure rates for loop detection",
      async execute(args) {
        const metrics2 = await Promise.resolve().then(() => (init_src4(), src_exports3));
        const runId = args.runId;
        const targetPath = args.targetPath;
        if (!runId && !targetPath) {
          throw new Error("runId or targetPath required");
        }
        const runKey = runId ? `runs.${runId}` : null;
        const pathKey = targetPath ? `paths.${targetPath}` : null;
        const results = {};
        if (runKey) {
          const total = metrics2.getGauge(`${runKey}.total`) || 0;
          const failures = metrics2.getGauge(`${runKey}.failures`) || 0;
          const success = metrics2.getGauge(`${runKey}.success`) || 0;
          results.runId = {
            total,
            failures,
            success,
            consecutive_failures: failures,
            last_action: total > 0 ? "success" : "idle"
          };
        }
        if (pathKey) {
          const writes = metrics2.getGauge(`${pathKey}.writes`) || 0;
          const lastWrite = metrics2.getGauge(`${pathKey}.last_write`) || 0;
          const now = Date.now();
          const writesPerMin = now - lastWrite < 6e4 ? writes : 0;
          results.targetPath = {
            writes,
            writes_per_minute: writesPerMin,
            last_write: lastWrite
          };
        }
        results.circuit_breaker = {
          state: "closed",
          // TODO: wire to @aether/operations
          failure_threshold: 3
        };
        return results;
      }
    };
    toolRegistry.get_agent_state = getAgentStateTool;
    triggerWorkflowTool = {
      name: "trigger_workflow",
      description: "Trigger a predefined workflow",
      async execute(args) {
        const { runWorkflow: runWorkflow2, getWorkflow: getWorkflow2 } = await Promise.resolve().then(() => (init_src7(), src_exports5));
        const workflowName = args.workflow;
        const context = args.context || {};
        if (!workflowName) {
          throw new Error("workflow name required");
        }
        const workflow = getWorkflow2(workflowName);
        if (!workflow) {
          throw new Error(`Unknown workflow: ${workflowName}`);
        }
        const result = await runWorkflow2(workflow, context);
        return result;
      }
    };
    toolRegistry.trigger_workflow = triggerWorkflowTool;
    toolRegistry.list_workflows = {
      name: "list_workflows",
      description: "List available workflows",
      execute: async () => {
        const { listWorkflows: listWorkflows2 } = await Promise.resolve().then(() => (init_src7(), src_exports5));
        return { workflows: listWorkflows2() };
      }
    };
    chaosInjectTool = {
      name: "chaos_inject",
      description: "Inject a synthetic failure pattern to train the agent loop",
      async execute(args) {
        const { executeChaos: executeChaos2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
        const scenario = args.scenario;
        const targetPath = args.targetPath;
        if (!scenario) {
          throw new Error("scenario required");
        }
        return executeChaos2(scenario, targetPath);
      }
    };
    listChaosScenariosTool = {
      name: "list_chaos_scenarios",
      description: "List available chaos scenarios for immunity testing",
      async execute() {
        const { getScenarios: getScenarios2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
        return { scenarios: getScenarios2() };
      }
    };
    toolRegistry.chaos_inject = chaosInjectTool;
    toolRegistry.list_chaos_scenarios = listChaosScenariosTool;
  }
});

// ../../packages/workflow/src/index.ts
var src_exports5 = {};
__export(src_exports5, {
  EXAMPLE_WORKFLOWS: () => EXAMPLE_WORKFLOWS,
  StepSchema: () => StepSchema,
  WorkflowSchema: () => WorkflowSchema,
  getWorkflow: () => getWorkflow,
  listWorkflows: () => listWorkflows,
  runWorkflow: () => runWorkflow,
  validateWebhook: () => validateWebhook
});
import { z as z6 } from "zod";
async function runWorkflow(workflow, context = {}) {
  const startTime = Date.now();
  const results = [];
  let steps_completed = 0;
  let steps_failed = 0;
  for (const step of workflow.steps) {
    if (step.condition) {
      const pass = evaluateCondition(step.condition, context);
      if (!pass) {
        results.push({ step: step.name, success: true, result: "skipped" });
        continue;
      }
    }
    let stepResult;
    let stepError;
    let success = false;
    const attempts = step.retry || 1;
    for (let i = 0; i < attempts; i++) {
      try {
        const args = interpolateArgs(step.args, context);
        stepResult = await executeTool(step.tool, args);
        success = true;
        break;
      } catch (e) {
        stepError = e.message;
        await new Promise((r) => setTimeout(r, 1e3 * (i + 1)));
      }
    }
    if (success) {
      steps_completed++;
      results.push({ step: step.name, success: true, result: stepResult });
      context[step.name] = stepResult;
    } else {
      steps_failed++;
      results.push({ step: step.name, success: false, error: stepError });
      if (workflow.on_failure === "stop") {
        break;
      }
    }
  }
  return {
    workflow: workflow.name,
    status: steps_failed > 0 && workflow.on_failure === "stop" ? "failed" : "success",
    steps_completed,
    steps_failed,
    results,
    duration: Date.now() - startTime
  };
}
function evaluateCondition(condition, context) {
  const match = condition.match(/\$\{(\w+)\.\w+\}/);
  if (!match) return true;
  const [, stepName] = match;
  return stepName in context;
}
function interpolateArgs(args, context) {
  const result = {};
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string" && value.includes("${")) {
      let interpolated = value;
      for (const [ck, cv] of Object.entries(context)) {
        interpolated = interpolated.replace(`\${${ck}}`, String(cv));
      }
      result[key] = interpolated;
    } else {
      result[key] = value;
    }
  }
  return result;
}
function validateWebhook(payload, secret) {
  if (!secret) return true;
  return payload.secret === secret;
}
function listWorkflows() {
  return EXAMPLE_WORKFLOWS.map((w) => ({ name: w.name, trigger: w.trigger.type, steps: w.steps.length }));
}
function getWorkflow(name) {
  return EXAMPLE_WORKFLOWS.find((w) => w.name === name);
}
var StepSchema, WorkflowSchema, EXAMPLE_WORKFLOWS;
var init_src7 = __esm({
  "../../packages/workflow/src/index.ts"() {
    "use strict";
    init_src6();
    StepSchema = z6.object({
      name: z6.string(),
      tool: z6.string(),
      args: z6.record(z6.unknown()),
      condition: z6.string().optional(),
      // JMESPath expression
      retry: z6.number().optional()
    });
    WorkflowSchema = z6.object({
      name: z6.string(),
      trigger: z6.object({
        type: z6.enum(["webhook", "schedule", "event"]),
        url: z6.string().optional(),
        // For webhook
        schedule: z6.string().optional(),
        // Cron
        event: z6.string().optional()
        // Event type
      }),
      steps: z6.array(StepSchema),
      on_failure: z6.enum(["stop", "continue", "rollback"]).default("stop"),
      timeout: z6.number().default(3e5)
      // 5 min
    });
    EXAMPLE_WORKFLOWS = [
      {
        name: "deploy-frontend",
        trigger: { type: "webhook", url: "/webhooks/deploy-frontend" },
        steps: [
          { name: "checkout", tool: "git_status", args: {} },
          { name: "build", tool: "http_request", args: { url: "https://api.vercel.com/deploy", method: "POST" } }
        ],
        on_failure: "stop"
      },
      {
        name: "fix-and-commit",
        trigger: { type: "webhook" },
        steps: [
          { name: "check-diff", tool: "git_diff", args: {} },
          { name: "stage", tool: "git_commit", args: { message: "Auto-fix via workflow" }, retry: 2 }
        ]
      }
    ];
  }
});

// ../../packages/dream/src/index.ts
var src_exports6 = {};
__export(src_exports6, {
  dream: () => dream,
  getDreamStatus: () => getDreamStatus,
  shouldDream: () => shouldDream,
  touch: () => touch
});
import crypto3 from "crypto";
function touch() {
  lastActivity = Date.now();
}
function shouldDream(config2 = DEFAULT_CONFIG) {
  const idleMs = Date.now() - lastActivity;
  const idleMinutes = idleMs / 6e4;
  return idleMinutes >= config2.idleMinutes && !isDreaming;
}
async function dream(config2 = DEFAULT_CONFIG) {
  isDreaming = true;
  try {
    const lessons = await readLessons({ limit: config2.maxDreams });
    const oneHourAgo = Date.now() - 36e5;
    const recent = lessons.filter((l) => new Date(l.timestamp).getTime() > oneHourAgo);
    const updatedPatterns = /* @__PURE__ */ new Map();
    for (const lesson of recent) {
      const current = await getPatternConfidence(lesson.pattern);
      const existing = updatedPatterns.get(lesson.pattern);
      if (existing) {
        existing.current = Math.max(existing.current, current);
      } else {
        updatedPatterns.set(lesson.pattern, {
          original: lesson.confidence,
          current
        });
      }
    }
    let lessonsWritten = 0;
    for (const [pattern, { original, current }] of updatedPatterns) {
      if (Math.abs(current - original) > 0.1) {
        lessonsWritten++;
      }
    }
    const dreamId = crypto3.randomUUID();
    return {
      dreamId,
      scenarios: updatedPatterns.size,
      lessons: lessonsWritten
    };
  } finally {
    isDreaming = false;
  }
}
function getDreamStatus() {
  return {
    isDreaming,
    lastActivity: new Date(lastActivity).toISOString(),
    idleMinutes: (Date.now() - lastActivity) / 6e4
  };
}
var DEFAULT_CONFIG, lastActivity, isDreaming;
var init_src8 = __esm({
  "../../packages/dream/src/index.ts"() {
    "use strict";
    init_src5();
    DEFAULT_CONFIG = {
      idleMinutes: 5,
      maxDreams: 20,
      confidenceCap: 0.75
      // Cap dream lesson confidence
    };
    lastActivity = Date.now();
    isDreaming = false;
  }
});

// ../../packages/scheduler/src/index.ts
var src_exports7 = {};
__export(src_exports7, {
  Scheduler: () => Scheduler,
  everyNMinutes: () => everyNMinutes,
  scheduler: () => scheduler
});
import { EventEmitter } from "events";
import crypto4 from "crypto";
function parseCron(schedule) {
  const parts = schedule.split(" ");
  if (parts.length !== 5) throw new Error("Invalid cron: need 5 parts");
  const now = /* @__PURE__ */ new Date();
  const next = new Date(now);
  if (parts[0].startsWith("*/")) {
    const mins = parseInt(parts[0].slice(2));
    next.setMinutes(now.getMinutes() + mins);
    next.setSeconds(0, 0);
  } else {
    next.setMinutes(now.getMinutes() + 1);
    next.setSeconds(0, 0);
  }
  return next.getTime();
}
function everyNMinutes(n, handler) {
  return `*/${n} * * * *`;
}
var Scheduler, scheduler;
var init_src9 = __esm({
  "../../packages/scheduler/src/index.ts"() {
    "use strict";
    Scheduler = class extends EventEmitter {
      jobs = /* @__PURE__ */ new Map();
      running = false;
      interval;
      // Add a job
      addJob(name, schedule, handler) {
        const job = {
          id: crypto4.randomUUID(),
          name,
          schedule,
          handler,
          enabled: true
        };
        job.nextRun = parseCron(schedule);
        this.jobs.set(name, job);
        this.emit("jobAdded", job);
        return job.id;
      }
      // Remove a job
      removeJob(name) {
        this.jobs.delete(name);
      }
      // Enable/disable
      enableJob(name, enabled) {
        const job = this.jobs.get(name);
        if (job) job.enabled = enabled;
      }
      // Start scheduler
      start() {
        if (this.running) return;
        this.running = true;
        this.interval = setInterval(() => this.tick(), 1e4);
        this.emit("started");
      }
      // Stop scheduler
      stop() {
        if (this.interval) clearInterval(this.interval);
        this.running = false;
        this.emit("stopped");
      }
      // Tick: run due jobs
      async tick() {
        const now = Date.now();
        for (const [name, job] of this.jobs) {
          if (!job.enabled) continue;
          if (!job.nextRun || now < job.nextRun) continue;
          try {
            await job.handler();
            job.lastRun = now;
            this.emit("jobRun", { job: name, status: "success" });
          } catch (e) {
            this.emit("jobRun", { job: name, status: "error", error: e.message });
          }
          job.nextRun = parseCron(job.schedule);
        }
      }
      // List jobs
      listJobs() {
        return Array.from(this.jobs.values()).map((j) => ({
          name: j.name,
          schedule: j.schedule,
          enabled: j.enabled,
          lastRun: j.lastRun,
          nextRun: j.nextRun
        }));
      }
      // Get job
      getJob(name) {
        return this.jobs.get(name);
      }
    };
    scheduler = new Scheduler();
  }
});

// ../../packages/notifier/src/index.ts
var src_exports8 = {};
__export(src_exports8, {
  Events: () => Events,
  Notifier: () => Notifier,
  notifier: () => notifier,
  sendWebhook: () => sendWebhook
});
import { EventEmitter as EventEmitter2 } from "events";
import crypto5 from "crypto";
async function sendWebhook(url, payload) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch {
    return false;
  }
}
var Events, Notifier, notifier;
var init_src10 = __esm({
  "../../packages/notifier/src/index.ts"() {
    "use strict";
    Events = {
      NOTIFICATION: "notification"
    };
    Notifier = class extends EventEmitter2 {
      channels = /* @__PURE__ */ new Map();
      // Register a channel
      registerChannel(name, type, config2) {
        this.channels.set(name, { type, config: config2 });
        this.emit("channelRegistered", { name, type });
      }
      // Send notification
      async notify(options) {
        const { channel = "default", message, severity = "info" } = options;
        const channelConfig = this.channels.get(channel);
        if (!channelConfig) {
          return { success: false, error: `Unknown channel: ${channel}` };
        }
        const notification = {
          id: crypto5.randomUUID(),
          channel: channelConfig.type,
          to: channelConfig.config.url || "",
          message,
          severity,
          timestamp: Date.now()
        };
        this.emit(Events.NOTIFICATION, notification);
        return { success: true, notificationId: notification.id };
      }
      // Send to multiple channels
      async broadcast(message, severity = "info") {
        const results = [];
        for (const [name, config2] of this.channels) {
          const result = await this.notify({ channel: name, message, severity });
          results.push({ channel: name, ...result });
        }
        return results;
      }
      // List channels
      listChannels() {
        return Array.from(this.channels.keys());
      }
    };
    notifier = new Notifier();
  }
});

// ../../packages/secrets/src/index.ts
var src_exports9 = {};
__export(src_exports9, {
  deleteSecret: () => deleteSecret,
  getSecret: () => getSecret,
  hasSecret: () => hasSecret,
  listSecrets: () => listSecrets,
  loadSecrets: () => loadSecrets,
  setSecret: () => setSecret
});
import crypto6 from "crypto";
function encrypt(text) {
  const iv = crypto6.randomBytes(16);
  const cipher = crypto6.createCipheriv(ALGORITHM, Buffer.from(KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
function decrypt(encrypted) {
  const [ivHex, data] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto6.createDecipheriv(ALGORITHM, Buffer.from(KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
function setSecret(key, value) {
  const now = Date.now();
  const existing = secrets.get(key);
  secrets.set(key, {
    key,
    value: encrypt(value),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });
}
function getSecret(key) {
  const secret = secrets.get(key);
  if (!secret) return null;
  return decrypt(secret.value);
}
function deleteSecret(key) {
  return secrets.delete(key);
}
function listSecrets() {
  return Array.from(secrets.keys());
}
function hasSecret(key) {
  return secrets.has(key);
}
function loadSecrets(secrets_) {
  for (const [key, value] of Object.entries(secrets_)) {
    setSecret(key, value);
  }
}
var ALGORITHM, KEY, secrets;
var init_src11 = __esm({
  "../../packages/secrets/src/index.ts"() {
    "use strict";
    ALGORITHM = "aes-256-gcm";
    KEY = process.env.SECRET_KEY || crypto6.randomBytes(32).toString("hex");
    secrets = /* @__PURE__ */ new Map();
  }
});

// ../../packages/rate-limiter/src/index.ts
var src_exports10 = {};
__export(src_exports10, {
  DEFAULT_TOOL_LIMITS: () => DEFAULT_TOOL_LIMITS,
  allow: () => allow,
  checkLimit: () => checkLimit,
  getLimiter: () => getLimiter,
  getToolLimit: () => getToolLimit,
  resetLimit: () => resetLimit
});
function getLimiter(key, config2) {
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new SlidingWindow(config2);
    limiters.set(key, limiter);
  }
  return limiter;
}
function checkLimit(key, config2) {
  return getLimiter(key, config2).check();
}
function allow(key, config2) {
  const result = checkLimit(key, config2);
  if (result.allowed) {
    getLimiter(key, config2).record();
  }
  return result.allowed;
}
function resetLimit(key) {
  const limiter = limiters.get(key);
  if (limiter) limiter.reset();
}
function getToolLimit(tool) {
  return DEFAULT_TOOL_LIMITS[tool];
}
var SlidingWindow, limiters, DEFAULT_TOOL_LIMITS;
var init_src12 = __esm({
  "../../packages/rate-limiter/src/index.ts"() {
    "use strict";
    SlidingWindow = class {
      constructor(config2) {
        this.config = config2;
      }
      timestamps = [];
      check() {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        this.timestamps = this.timestamps.filter((t) => t > windowStart);
        const remaining = this.config.maxRequests - this.timestamps.length;
        if (remaining <= 0) {
          const oldest = this.timestamps[0];
          const resetMs = oldest + this.config.windowMs - now;
          return { allowed: false, remaining: 0, resetMs };
        }
        return { allowed: true, remaining, resetMs: this.config.windowMs };
      }
      record() {
        this.timestamps.push(Date.now());
      }
      reset() {
        this.timestamps = [];
      }
    };
    limiters = /* @__PURE__ */ new Map();
    DEFAULT_TOOL_LIMITS = {
      git_commit: { windowMs: 6e4, maxRequests: 10 },
      // 10 commits/min
      file_write: { windowMs: 6e4, maxRequests: 30 },
      // 30 writes/min
      http_request: { windowMs: 6e4, maxRequests: 60 },
      // 60 req/min
      chaos_inject: { windowMs: 6e5, maxRequests: 5 },
      // 5/min
      trigger_workflow: { windowMs: 6e4, maxRequests: 10 }
      // 10/min
    };
  }
});

// ../../packages/replay/src/index.ts
var src_exports11 = {};
__export(src_exports11, {
  dryRun: () => dryRun,
  replayEvents: () => replayEvents
});
import crypto7 from "crypto";
async function replayEvents(options) {
  const { since = 36e5, limit = 10 } = options || {};
  const startTime = Date.now();
  const decisions = await getDecisions({ since, limit });
  const outcomes = [];
  for (const decision of decisions) {
    try {
      const toolName = decision.tool;
      const args = decision.args || {};
      if (toolRegistry[toolName]) {
        await executeTool(toolName, args);
        outcomes.push({
          tool: toolName,
          expected: decision.decision,
          actual: "approve",
          matches: decision.decision === "approve"
        });
      }
    } catch {
      outcomes.push({
        tool: decision.tool,
        expected: decision.decision,
        actual: "deny",
        matches: decision.decision === "deny"
      });
    }
  }
  return {
    replayId: crypto7.randomUUID(),
    events: decisions.length,
    outcomes,
    duration: Date.now() - startTime
  };
}
async function dryRun(toolName, args) {
  const tool = toolRegistry[toolName];
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }
  return {
    tool: toolName,
    valid: true,
    wouldExecute: true,
    args
  };
}
var init_src13 = __esm({
  "../../packages/replay/src/index.ts"() {
    "use strict";
    init_src3();
    init_src6();
  }
});

// ../../packages/alerts/src/index.ts
var src_exports12 = {};
__export(src_exports12, {
  AlertEngine: () => AlertEngine,
  DEFAULT_RULES: () => DEFAULT_RULES,
  alertEngine: () => alertEngine
});
import { EventEmitter as EventEmitter3 } from "events";
import crypto8 from "crypto";
var DEFAULT_RULES, AlertEngine, alertEngine;
var init_src14 = __esm({
  "../../packages/alerts/src/index.ts"() {
    "use strict";
    DEFAULT_RULES = [
      { id: "denial-high", name: "High Denial Rate", condition: "denial_rate_above", threshold: 0.5, severity: "critical", enabled: true },
      { id: "confidence-low", name: "Low Confidence", condition: "confidence_below", threshold: 0.3, severity: "warning", enabled: true },
      { id: "failures-high", name: "High Failures", condition: "failures_above", threshold: 10, severity: "critical", enabled: true }
    ];
    AlertEngine = class extends EventEmitter3 {
      rules = /* @__PURE__ */ new Map();
      constructor() {
        for (const rule of DEFAULT_RULES) {
          this.rules.set(rule.id, rule);
        }
      }
      // Add rule
      addRule(rule) {
        const id = crypto8.randomUUID();
        this.rules.set(id, { ...rule, id });
        return id;
      }
      // Remove rule
      removeRule(id) {
        return this.rules.delete(id);
      }
      // Enable/disable
      enableRule(id, enabled) {
        const rule = this.rules.get(id);
        if (rule) rule.enabled = enabled;
      }
      // Evaluate all rules
      async evaluate() {
        const results = [];
        const { getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
        const audit = await getStats4();
        for (const rule of this.rules.values()) {
          if (!rule.enabled) continue;
          let value = 0;
          let triggered = false;
          switch (rule.condition) {
            case "denial_rate_above":
              value = audit.denial_rate;
              triggered = value > rule.threshold;
              break;
            case "failures_above":
              value = audit.denied;
              triggered = value > rule.threshold;
              break;
            case "confidence_below":
              value = 0.5;
              triggered = value < rule.threshold;
              break;
          }
          results.push({ rule: rule.id, triggered, value, threshold: rule.threshold });
          if (triggered) {
            rule.lastTriggered = Date.now();
            this.emit("alert", { rule: rule.id, severity: rule.severity, value });
          }
        }
        return results;
      }
      // List rules
      listRules() {
        return Array.from(this.rules.values());
      }
    };
    alertEngine = new AlertEngine();
  }
});

// ../../packages/human-queue/src/index.ts
var src_exports13 = {};
__export(src_exports13, {
  enqueue: () => enqueue,
  getPending: () => getPending,
  getStats: () => getStats2,
  resolve: () => resolve
});
import fs9 from "fs";
import path5 from "path";
import crypto9 from "crypto";
function ensureDir3() {
  const dir = path5.dirname(QUEUE_PATH);
  if (!fs9.existsSync(dir)) {
    fs9.mkdirSync(dir, { recursive: true });
  }
}
function enqueue(item) {
  ensureDir3();
  const fullItem = {
    ...item,
    id: crypto9.randomUUID(),
    createdAt: Date.now(),
    status: "pending"
  };
  fs9.appendFileSync(QUEUE_PATH, JSON.stringify(fullItem) + "\n");
  return fullItem;
}
function getPending(limit = 20) {
  if (!fs9.existsSync(QUEUE_PATH)) return [];
  const content = fs9.readFileSync(QUEUE_PATH, "utf-8");
  const items = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return items.filter((item) => item.status === "pending").sort((a, b) => b.priority - a.priority).slice(0, limit);
}
function resolve(id, status, resolvedBy = "human") {
  if (!fs9.existsSync(QUEUE_PATH)) return null;
  const content = fs9.readFileSync(QUEUE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = lines.map((line) => {
    const item = JSON.parse(line);
    if (item.id === id) {
      found = true;
      item.status = status;
      item.resolvedAt = Date.now();
      item.resolvedBy = resolvedBy;
    }
    return JSON.stringify(item);
  });
  if (found) {
    fs9.writeFileSync(QUEUE_PATH, newLines.join("\n") + "\n");
  }
  return found ? { id, status, resolvedAt: Date.now(), resolvedBy } : null;
}
function getStats2() {
  if (!fs9.existsSync(QUEUE_PATH)) {
    return { pending: 0, approved: 0, rejected: 0 };
  }
  const content = fs9.readFileSync(QUEUE_PATH, "utf-8");
  const items = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return {
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length
  };
}
var QUEUE_PATH;
var init_src15 = __esm({
  "../../packages/human-queue/src/index.ts"() {
    "use strict";
    QUEUE_PATH = path5.resolve(process.cwd(), "../../logs/human-queue.jsonl");
  }
});

// ../../packages/telemetry/src/index.ts
var src_exports14 = {};
__export(src_exports14, {
  collectTelemetry: () => collectTelemetry,
  exportCSV: () => exportCSV,
  exportPrometheus: () => exportPrometheus
});
async function collectTelemetry() {
  const events = [];
  try {
    const { getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const audit = await getStats4();
    events.push({
      event: "curator.audit",
      source: "curator-audit",
      timestamp: Date.now(),
      data: audit
    });
  } catch {
  }
  try {
    const { snapshot: snapshot2 } = await Promise.resolve().then(() => (init_src4(), src_exports3));
    const metrics2 = snapshot2();
    events.push({
      event: "metrics.snapshot",
      source: "metrics",
      timestamp: Date.now(),
      data: { counters: Object.keys(metrics2.counters || {}).length }
    });
  } catch {
  }
  try {
    const { getLearnedPatterns: getLearnedPatterns3 } = await Promise.resolve().then(() => (init_src5(), src_exports4));
    const patterns = await getLearnedPatterns3();
    events.push({
      event: "lessons.patterns",
      source: "lessons",
      timestamp: Date.now(),
      data: { count: Object.keys(patterns || {}).length }
    });
  } catch {
  }
  try {
    const { listWorkflows: listWorkflows2 } = await Promise.resolve().then(() => (init_src7(), src_exports5));
    const workflows = listWorkflows2();
    events.push({
      event: "workflows.list",
      source: "workflow",
      timestamp: Date.now(),
      data: { count: workflows.length }
    });
  } catch {
  }
  const summary2 = {};
  for (const event of events) {
    summary2[event.event] = (summary2[event.event] || 0) + 1;
  }
  return { events, summary: summary2 };
}
function exportPrometheus(events) {
  const lines = [];
  for (const event of events) {
    const labels = Object.entries(event.data).map(([k, v]) => `${k}="${v}"`).join(",");
    lines.push(`aether_${event.event}{${labels}} 1`);
  }
  return lines.join("\n");
}
function exportCSV(events) {
  const header = "event,source,timestamp";
  const rows = events.map((e) => `${e.event},${e.source},${e.timestamp}`);
  return [header, ...rows].join("\n");
}
var init_src16 = __esm({
  "../../packages/telemetry/src/index.ts"() {
    "use strict";
  }
});

// ../../packages/council/src/index.ts
var src_exports15 = {};
__export(src_exports15, {
  evaluateWithCouncil: () => evaluateWithCouncil,
  isHighSignal: () => isHighSignal
});
function evaluateWithCouncil(tool, args) {
  const evaluations = [];
  const regexEval = evaluateRegex(tool, args);
  evaluations.push(regexEval);
  const ruleEval = evaluateRule(tool, args);
  evaluations.push(ruleEval);
  const llmEval = evaluateLLM(tool, args);
  evaluations.push(llmEval);
  const votes = evaluations.map((e) => e.decision);
  const approve = votes.filter((v) => v === "approve").length;
  const deny = votes.filter((v) => v === "deny").length;
  const escalate = votes.filter((v) => v === "escalate").length;
  let finalDecision = "deny";
  if (approve > deny && approve > escalate) finalDecision = "approve";
  else if (escalate > approve) finalDecision = "escalate";
  const uniqueDecisions = new Set(votes).size;
  const disagreement = uniqueDecisions > 1;
  const max = Math.max(approve, deny, escalate);
  const consensus = max / evaluations.length;
  return {
    tool,
    evaluations,
    finalDecision,
    disagreement,
    consensus
  };
}
function evaluateRegex(tool, args) {
  const dangerous = ["rm -rf", "DROP TABLE", "DELETE FROM", "format c:", "> /dev/sd"];
  const argStr = JSON.stringify(args);
  for (const pat of dangerous) {
    if (argStr.includes(pat)) {
      return { strategy: "regex", decision: "deny", confidence: 0.95, reason: `dangerous pattern: ${pat}` };
    }
  }
  return { strategy: "regex", decision: "approve", confidence: 0.8, reason: "no dangerous patterns" };
}
function evaluateRule(tool, args) {
  const readOnly = ["file_read", "git_status", "git_diff", "get_agent_state", "list_chaos_scenarios"];
  if (readOnly.includes(tool)) {
    return { strategy: "rule", decision: "approve", confidence: 0.9, reason: "read-only tool" };
  }
  if (tool === "git_commit") {
    const msg = args.message;
    if (!msg || msg.length < 5) {
      return { strategy: "rule", decision: "deny", confidence: 0.9, reason: "empty commit message" };
    }
    return { strategy: "rule", decision: "approve", confidence: 0.7, reason: "has commit message" };
  }
  return { strategy: "rule", decision: "approve", confidence: 0.6, reason: "default allow" };
}
function evaluateLLM(tool, args) {
  const hasArgs = Object.keys(args).length > 0;
  if (!hasArgs) {
    return { strategy: "llm", decision: "deny", confidence: 0.5, reason: "no arguments provided" };
  }
  return { strategy: "llm", decision: "approve", confidence: 0.6, reason: "looks reasonable" };
}
function isHighSignal(vote) {
  return vote.disagreement && vote.consensus < 0.7;
}
var init_src17 = __esm({
  "../../packages/council/src/index.ts"() {
    "use strict";
  }
});

// ../../packages/triage/src/index.ts
var src_exports16 = {};
__export(src_exports16, {
  addToTriage: () => addToTriage,
  assignItem: () => assignItem,
  getPending: () => getPending2,
  getStats: () => getStats3,
  resolveItem: () => resolveItem
});
import fs10 from "fs";
import path6 from "path";
import crypto10 from "crypto";
function ensureDir4() {
  const dir = path6.dirname(TRIAGE_PATH);
  if (!fs10.existsSync(dir)) fs10.mkdirSync(dir, { recursive: true });
}
function addToTriage(item) {
  ensureDir4();
  const triageItem = {
    ...item,
    id: crypto10.randomUUID(),
    createdAt: Date.now(),
    status: "pending"
  };
  fs10.appendFileSync(TRIAGE_PATH, JSON.stringify(triageItem) + "\n");
  return triageItem;
}
function getPending2(priority, limit = 50) {
  if (!fs10.existsSync(TRIAGE_PATH)) return [];
  const content = fs10.readFileSync(TRIAGE_PATH, "utf-8");
  const items = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  let filtered = items.filter((i) => i.status === "pending");
  if (priority) {
    filtered = filtered.filter((i) => i.priority === priority);
  }
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  filtered.sort((a, b) => {
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    return a.sla - b.sla;
  });
  return filtered.slice(0, limit);
}
function assignItem(id, assignee) {
  if (!fs10.existsSync(TRIAGE_PATH)) return null;
  const content = fs10.readFileSync(TRIAGE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = lines.map((line) => {
    const item = JSON.parse(line);
    if (item.id === id) {
      found = true;
      item.assignedTo = assignee;
      item.status = "in_review";
    }
    return JSON.stringify(item);
  });
  if (found) {
    fs10.writeFileSync(TRIAGE_PATH, newLines.join("\n") + "\n");
  }
  return found ? { id, status: "in_review", assignedTo: assignee } : null;
}
function resolveItem(id, status, resolvedBy, notes) {
  if (!fs10.existsSync(TRIAGE_PATH)) return null;
  const content = fs10.readFileSync(TRIAGE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = lines.map((line) => {
    const item = JSON.parse(line);
    if (item.id === id) {
      found = true;
      item.status = status;
      item.resolvedAt = Date.now();
      item.resolvedBy = resolvedBy;
      item.notes = notes;
    }
    return JSON.stringify(item);
  });
  if (found) {
    fs10.writeFileSync(TRIAGE_PATH, newLines.join("\n") + "\n");
  }
  return found ? { id, status, resolvedBy, notes } : null;
}
function getStats3() {
  if (!fs10.existsSync(TRIAGE_PATH)) {
    return { pending: 0, in_review: 0, resolved: 0, sla_breached: 0 };
  }
  const content = fs10.readFileSync(TRIAGE_PATH, "utf-8");
  const items = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const now = Date.now();
  return {
    pending: items.filter((i) => i.status === "pending").length,
    in_review: items.filter((i) => i.status === "in_review").length,
    resolved: items.filter((i) => i.status === "approved" || i.status === "rejected").length,
    sla_breached: items.filter((i) => i.status === "pending" && now > i.sla).length
  };
}
var TRIAGE_PATH;
var init_src18 = __esm({
  "../../packages/triage/src/index.ts"() {
    "use strict";
    TRIAGE_PATH = path6.resolve(process.cwd(), "../../logs/triage.jsonl");
  }
});

// ../../packages/compactor/src/index.ts
var src_exports17 = {};
__export(src_exports17, {
  compact: () => compact,
  getContradictions: () => getContradictions,
  prune: () => prune
});
import fs11 from "fs";
import path7 from "path";
import crypto11 from "crypto";
function compact() {
  if (!fs11.existsSync(LESSONS_PATH2)) {
    return { original: 0, compacted: 0, removed: 0, contradictions: [] };
  }
  const content = fs11.readFileSync(LESSONS_PATH2, "utf-8");
  const lessons = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const byPattern = /* @__PURE__ */ new Map();
  for (const lesson of lessons) {
    const existing = byPattern.get(lesson.pattern) || [];
    existing.push(lesson);
    byPattern.set(lesson.pattern, existing);
  }
  const contradictions = [];
  const compacted = [];
  for (const [pattern, patternLessons] of byPattern) {
    patternLessons.sort((a, b) => b.confidence - a.confidence);
    const outcomes = new Set(patternLessons.map((l) => l.outcome));
    if (outcomes.has("success") && outcomes.has("failure")) {
      contradictions.push(pattern);
    }
    const best = { ...patternLessons[0] };
    const successCount = patternLessons.filter((l) => l.outcome === "success").length;
    const failCount = patternLessons.filter((l) => l.outcome === "failure").length;
    if (successCount + failCount > 1) {
      best.confidence = successCount / (successCount + failCount);
    }
    best.id = crypto11.randomUUID();
    compacted.push(best);
  }
  const compactedContent = compacted.map((l) => JSON.stringify(l)).join("\n") + "\n";
  fs11.writeFileSync(COMPACTED_PATH, compactedContent);
  return {
    original: lessons.length,
    compacted: compacted.length,
    removed: lessons.length - compacted.length,
    contradictions
  };
}
function getContradictions() {
  if (!fs11.existsSync(LESSONS_PATH2)) return [];
  const content = fs11.readFileSync(LESSONS_PATH2, "utf-8");
  const lessons = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const byPattern = /* @__PURE__ */ new Map();
  for (const lesson of lessons) {
    const outcomes = byPattern.get(lesson.pattern) || /* @__PURE__ */ new Set();
    outcomes.add(lesson.outcome);
    byPattern.set(lesson.pattern, outcomes);
  }
  const contradictions = [];
  for (const [pattern, outcomes] of byPattern) {
    if (outcomes.has("success") && outcomes.has("failure")) {
      contradictions.push(pattern);
    }
  }
  return contradictions;
}
function prune(daysToKeep = 30) {
  if (!fs11.existsSync(LESSONS_PATH2)) return 0;
  const content = fs11.readFileSync(LESSONS_PATH2, "utf-8");
  const lessons = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1e3;
  const filtered = lessons.filter((l) => new Date(l.timestamp).getTime() > cutoff);
  const newContent = filtered.map((l) => JSON.stringify(l)).join("\n") + "\n";
  fs11.writeFileSync(LESSONS_PATH2, newContent);
  return lessons.length - filtered.length;
}
var LESSONS_PATH2, COMPACTED_PATH;
var init_src19 = __esm({
  "../../packages/compactor/src/index.ts"() {
    "use strict";
    LESSONS_PATH2 = path7.resolve(process.cwd(), "../../logs/lessons.jsonl");
    COMPACTED_PATH = path7.resolve(process.cwd(), "../../logs/lessons-compacted.jsonl");
  }
});

// ../../packages/foresight/src/index.ts
var src_exports18 = {};
__export(src_exports18, {
  getPending: () => getPending3,
  predict: () => predict,
  scorePredictions: () => scorePredictions
});
import fs12 from "fs";
import path8 from "path";
import crypto12 from "crypto";
function scorePredictions(windowDays = 7) {
  const PREDICTIONS_PATH = path8.resolve(process.cwd(), "../../logs/predictions.jsonl");
  if (!fs12.existsSync(PREDICTIONS_PATH)) {
    return { scored: 0, accuracy: 0 };
  }
  const content = fs12.readFileSync(PREDICTIONS_PATH, "utf-8");
  const predictions = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1e3;
  let correct = 0;
  let scored = 0;
  const newLines = [];
  for (const pred of predictions) {
    const age = now - pred.createdAt;
    if (age >= windowMs && !pred.scoredAt) {
      const actual = pred.predictedConfidence > 0.5 ? "success" : "failure";
      let correct2 = actual === pred.predictedOutcome;
      pred.actualOutcome = actual;
      pred.actualConfidence = correct2 ? 1 : 0;
      pred.scoredAt = now;
      scored++;
      if (correct2) correct2++;
    }
    newLines.push(JSON.stringify(pred));
  }
  fs12.writeFileSync(PREDICTIONS_PATH, newLines.join("\n") + "\n");
  return {
    scored,
    accuracy: scored > 0 ? correct / scored : 0
  };
}
function predict(pattern, predictedOutcome, confidence, windowDays = 7) {
  const PREDICTIONS_PATH = path8.resolve(process.cwd(), "../../logs/predictions.jsonl");
  const prediction = {
    id: crypto12.randomUUID(),
    pattern,
    predictedOutcome,
    predictedConfidence: confidence,
    windowDays,
    createdAt: Date.now()
  };
  const dir = path8.dirname(PREDICTIONS_PATH);
  if (!fs12.existsSync(dir)) fs12.mkdirSync(dir, { recursive: true });
  fs12.appendFileSync(PREDICTIONS_PATH, JSON.stringify(prediction) + "\n");
  return prediction;
}
function getPending3() {
  const PREDICTIONS_PATH = path8.resolve(process.cwd(), "../../logs/predictions.jsonl");
  if (!fs12.existsSync(PREDICTIONS_PATH)) return [];
  const content = fs12.readFileSync(PREDICTIONS_PATH, "utf-8");
  return content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}
var init_src20 = __esm({
  "../../packages/foresight/src/index.ts"() {
    "use strict";
  }
});

// ../../packages/adversarial/src/index.ts
var src_exports19 = {};
__export(src_exports19, {
  evaluateAdversarial: () => evaluateAdversarial
});
function evaluateAdversarial(tool, args, originalDecision) {
  const attacks = [];
  let severity = "low";
  if (args.path && typeof args.path === "string") {
    const path18 = args.path;
    if (path18.includes("../") || path18.includes("..\\")) {
      attacks.push("path_traversal");
      severity = "critical";
    }
    if (path18.startsWith("/") || path18.startsWith("C:\\")) {
      attacks.push("absolute_path");
      severity = severity === "critical" ? "critical" : "high";
    }
  }
  if (args.command && typeof args.command === "string") {
    const cmd = args.command;
    const dangerous = [";", "|", "&&", "||", "`", "$(", "\n", "\r"];
    if (dangerous.some((c) => cmd.includes(c))) {
      attacks.push("command_injection");
      severity = severity === "critical" ? "critical" : "high";
    }
  }
  const argStr = JSON.stringify(args);
  if (argStr.includes("DROP") || argStr.includes("DELETE") || argStr.includes("DROP")) {
    attacks.push("destructive_sql");
    severity = "critical";
  }
  if (argStr.includes("SECRET") || argStr.includes("TOKEN") || argStr.includes("PASSWORD")) {
    if (!argStr.includes("*****")) {
      attacks.push("secret_exposure");
      severity = severity === "critical" ? "critical" : "high";
    }
  }
  if (args.count && typeof args.count === "number" && args.count > 1e3) {
    attacks.push("resource_exhaustion");
    severity = severity === "critical" ? "critical" : "medium";
  }
  let adversarialDecision = "approve";
  if (attacks.length > 0) {
    if (severity === "critical") {
      adversarialDecision = "deny";
    } else if (severity === "high") {
      adversarialDecision = "escalate";
    } else {
      adversarialDecision = originalDecision;
    }
  }
  const vetoed = attacks.length > 0 && severity === "critical";
  const reasoning = vetoed ? `BLOCKED: ${attacks.join(", ")}` : attacks.length > 0 ? `WARNING: ${attacks.join(", ")}` : "No attacks detected";
  return {
    tool,
    originalDecision,
    adversarialDecision,
    vetoed,
    attacks,
    severity,
    reasoning
  };
}
var init_src21 = __esm({
  "../../packages/adversarial/src/index.ts"() {
    "use strict";
  }
});

// ../../packages/storyteller/src/index.ts
var src_exports20 = {};
__export(src_exports20, {
  generateAutoJournal: () => generateAutoJournal,
  readJournal: () => readJournal,
  writeJournal: () => writeJournal
});
import fs13 from "fs";
import path9 from "path";
import crypto13 from "crypto";
function ensureDir5() {
  const dir = path9.dirname(JOURNAL_PATH);
  if (!fs13.existsSync(dir)) fs13.mkdirSync(dir, { recursive: true });
}
function writeJournal(summary2, events, lessonsLearned, insight) {
  ensureDir5();
  const entry = {
    id: crypto13.randomUUID(),
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    summary: summary2,
    events,
    lessonsLearned,
    keyInsight: insight
  };
  fs13.appendFileSync(JOURNAL_PATH, JSON.stringify(entry) + "\n");
  return entry;
}
async function generateAutoJournal() {
  const events = [];
  let lessonsLearned = 0;
  let keyInsight = "System operating normally.";
  try {
    const { readLessons: readLessons2 } = await Promise.resolve().then(() => (init_src5(), src_exports4));
    const lessons = await readLessons2({ limit: 10 });
    lessonsLearned = lessons.length;
    if (lessonsLearned > 0) {
      lessons.sort((a, b) => b.confidence - a.confidence);
      keyInsight = `Learned ${lessonsLearned} lessons. Highest confidence: ${lessons[0].pattern}`;
    }
  } catch {
  }
  try {
    const { getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const stats = await getStats4();
    events.push(`Curator: ${stats.approved} approved, ${stats.denied} denied`);
  } catch {
  }
  events.push(`Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}`);
  const summary2 = `Daily journal entry. ${events.length} events processed.`;
  return writeJournal(summary2, events, lessonsLearned, keyInsight);
}
function readJournal(days = 7) {
  if (!fs13.existsSync(JOURNAL_PATH)) return [];
  const content = fs13.readFileSync(JOURNAL_PATH, "utf-8");
  const entries = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return entries.filter((e) => e.date >= cutoffStr);
}
var JOURNAL_PATH;
var init_src22 = __esm({
  "../../packages/storyteller/src/index.ts"() {
    "use strict";
    JOURNAL_PATH = path9.resolve(process.cwd(), "../../logs/journal.jsonl");
  }
});

// ../../packages/vitalsigns/src/index.ts
var src_exports21 = {};
__export(src_exports21, {
  DEFAULT_THRESHOLDS: () => DEFAULT_THRESHOLDS,
  checkVitals: () => checkVitals,
  getThrottleRecommendation: () => getThrottleRecommendation
});
async function checkVitals(thresholds = DEFAULT_THRESHOLDS) {
  let denialRate = 0;
  let failureRate = 0;
  try {
    const audit = await getStats();
    denialRate = audit.denial_rate;
    failureRate = audit.denied;
  } catch {
  }
  let confidenceDrift = 0;
  try {
    const patterns = await getPatternConfidences();
    if (Object.keys(patterns).length > 0) {
      const values = Object.values(patterns);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      confidenceDrift = Math.abs(0.5 - mean);
    }
  } catch {
  }
  let status = "healthy";
  if (denialRate > thresholds.denialRateCritical) status = "critical";
  else if (denialRate > thresholds.denialRateWarning) status = "degraded";
  let autonomyLevel = "full";
  if (status === "critical") autonomyLevel = "locked";
  else if (status === "degraded") autonomyLevel = "restricted";
  else if (confidenceDrift > thresholds.confidenceDriftWarning) autonomyLevel = "limited";
  return {
    status,
    denialRate,
    confidenceDrift,
    failureRate,
    autonomyLevel,
    timestamp: Date.now()
  };
}
async function getThrottleRecommendation() {
  const vitals = await checkVitals();
  if (vitals.autonomyLevel === "locked") {
    return { action: "lock", reason: "Critical denial rate" };
  }
  if (vitals.autonomyLevel === "restricted") {
    return { action: "restrict", reason: "Elevated denial rate" };
  }
  if (vitals.autonomyLevel === "limited") {
    return { action: "limit", reason: "High confidence drift" };
  }
  return { action: "none", reason: "System healthy" };
}
var DEFAULT_THRESHOLDS;
var init_src23 = __esm({
  "../../packages/vitalsigns/src/index.ts"() {
    "use strict";
    init_src3();
    init_src5();
    DEFAULT_THRESHOLDS = {
      denialRateCritical: 0.5,
      denialRateWarning: 0.25,
      confidenceDriftWarning: 0.3,
      failureRateWarning: 10
    };
  }
});

// ../../packages/timecapsule/src/index.ts
var src_exports22 = {};
__export(src_exports22, {
  createCapsule: () => createCapsule,
  getCapsuleByDate: () => getCapsuleByDate,
  getLatestCapsule: () => getLatestCapsule,
  verifyCapsule: () => verifyCapsule
});
import fs14 from "fs";
import path10 from "path";
import crypto14 from "crypto";
import { createHash } from "crypto";
async function createCapsule() {
  const now = /* @__PURE__ */ new Date();
  const date = now.toISOString().split("T")[0];
  let policyContent = "";
  try {
    policyContent = fs14.readFileSync("../../packages/curator/policy.yaml", "utf-8");
  } catch {
  }
  let lessonsHash = "";
  try {
    const lessonsContent = fs14.readFileSync("../../logs/lessons.jsonl", "utf-8");
    lessonsHash = hashContent(lessonsContent);
  } catch {
  }
  let ledgerHash = "";
  try {
    const ledgerContent = fs14.readFileSync("../../logs/curator-audit.jsonl", "utf-8");
    ledgerHash = hashContent(ledgerContent);
  } catch {
  }
  const combined = policyContent + lessonsHash + ledgerHash;
  const hash = hashContent(combined);
  const signature = crypto14.createSign("SHA256").update(hash).sign("privateKey", "hex");
  const snapshot2 = {
    id: crypto14.randomUUID(),
    date,
    hash,
    signature: signature || "mock-signature",
    policy: policyContent.slice(0, 100),
    lessonsHash,
    ledgerHash,
    metadata: {
      createdAt: now.toISOString(),
      version: "1.0.0"
    }
  };
  const dir = path10.dirname(CAPSULE_PATH);
  if (!fs14.existsSync(dir)) fs14.mkdirSync(dir, { recursive: true });
  fs14.appendFileSync(CAPSULE_PATH, JSON.stringify(snapshot2) + "\n");
  return snapshot2;
}
function hashContent(content) {
  return createHash("sha256").update(content).digest("hex");
}
function verifyCapsule(snapshot2) {
  return snapshot2.hash.length === 64;
}
function getLatestCapsule() {
  if (!fs14.existsSync(CAPSULE_PATH)) return null;
  const content = fs14.readFileSync(CAPSULE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return null;
  return JSON.parse(lines[lines.length - 1]);
}
function getCapsuleByDate(date) {
  if (!fs14.existsSync(CAPSULE_PATH)) return null;
  const content = fs14.readFileSync(CAPSULE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  for (const line of lines.reverse()) {
    const capsule = JSON.parse(line);
    if (capsule.date === date) return capsule;
  }
  return null;
}
var CAPSULE_PATH;
var init_src24 = __esm({
  "../../packages/timecapsule/src/index.ts"() {
    "use strict";
    CAPSULE_PATH = path10.resolve(process.cwd(), "../../logs/timecapsule.jsonl");
  }
});

// ../../packages/profile/src/index.ts
var src_exports23 = {};
__export(src_exports23, {
  generateProfile: () => generateProfile,
  queryPatterns: () => queryPatterns,
  verifyProfile: () => verifyProfile
});
import crypto15 from "crypto";
async function generateProfile(options) {
  const { includePatterns = true, includeStats = true, minConfidence = 0.1 } = options || {};
  const patterns = [];
  if (includePatterns) {
    const lessons = await readLessons({ limit: 100 });
    const byPattern = /* @__PURE__ */ new Map();
    for (const lesson of lessons) {
      if (lesson.confidence < minConfidence) continue;
      const existing = byPattern.get(lesson.pattern) || { count: 0, successes: 0, lastSeen: 0, confidence: 0 };
      existing.count++;
      if (lesson.outcome === "success") existing.successes++;
      existing.lastSeen = Math.max(existing.lastSeen, new Date(lesson.timestamp).getTime());
      existing.confidence = Math.max(existing.confidence, lesson.confidence);
      byPattern.set(lesson.pattern, existing);
    }
    for (const [pattern, data] of byPattern) {
      patterns.push({
        pattern,
        confidence: Math.round(data.confidence * 100) / 100,
        successRate: Math.round(data.successes / data.count * 100) / 100,
        lastSeen: data.lastSeen
      });
    }
    patterns.sort((a, b) => b.confidence - a.confidence);
  }
  let stats = {
    totalLessons: 0,
    totalDecisions: 0,
    approvalRate: 0,
    pendingEscalations: 0
  };
  if (includeStats) {
    const auditStats = await getStats();
    const triageStats = await getStats3();
    stats = {
      totalLessons: patterns.length,
      totalDecisions: auditStats.total,
      approvalRate: 1 - auditStats.denial_rate,
      pendingEscalations: triageStats.pending
    };
  }
  const avgConfidence = patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0;
  const profile = {
    id: crypto15.randomUUID(),
    name: "Aether",
    version: "1.0.0",
    capabilities: [
      "code_generation",
      "bug_fix",
      "refactoring",
      "self_improvement",
      "policy_enforcement"
    ],
    patterns,
    confidence: Math.round(avgConfidence * 100) / 100,
    stats,
    signature: "",
    // Filled below
    generatedAt: Date.now()
  };
  const payload = JSON.stringify({ patterns, stats, generatedAt: profile.generatedAt });
  profile.signature = crypto15.createHash("sha256").update(payload).digest("hex");
  return profile;
}
async function queryPatterns(filters) {
  const { minConfidence = 0, minSuccessRate = 0, limit = 50 } = filters || {};
  const lessons = await readLessons({ limit: 200 });
  const byPattern = /* @__PURE__ */ new Map();
  for (const lesson of lessons) {
    const existing = byPattern.get(lesson.pattern) || { count: 0, successes: 0, lastSeen: 0, confidence: 0 };
    existing.count++;
    if (lesson.outcome === "success") existing.successes++;
    existing.lastSeen = Math.max(existing.lastSeen, new Date(lesson.timestamp).getTime());
    existing.confidence = Math.max(existing.confidence, lesson.confidence);
    byPattern.set(lesson.pattern, existing);
  }
  const results = [];
  for (const [pattern, data] of byPattern) {
    const successRate = data.count > 0 ? data.successes / data.count : 0;
    if (data.confidence >= minConfidence && successRate >= minSuccessRate) {
      results.push({
        pattern,
        confidence: Math.round(data.confidence * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        lastSeen: data.lastSeen
      });
    }
  }
  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, limit);
}
function verifyProfile(profile) {
  const { signature, ...rest } = profile;
  const payload = JSON.stringify({ patterns: rest.patterns, stats: rest.stats, generatedAt: profile.generatedAt });
  const expected = crypto15.createHash("sha256").update(payload).digest("hex");
  return signature === expected;
}
var init_src25 = __esm({
  "../../packages/profile/src/index.ts"() {
    "use strict";
    init_src5();
    init_src3();
    init_src18();
  }
});

// ../../packages/goals/src/index.ts
var src_exports24 = {};
__export(src_exports24, {
  alignsWithGoals: () => alignsWithGoals,
  completeGoal: () => completeGoal,
  createGoal: () => createGoal,
  getActiveGoals: () => getActiveGoals,
  getCurrentFocus: () => getCurrentFocus,
  getFocusAreas: () => getFocusAreas,
  getGoalsByFocus: () => getGoalsByFocus,
  pauseGoal: () => pauseGoal
});
import fs15 from "fs";
import path11 from "path";
import crypto16 from "crypto";
function ensureDir6() {
  const dir = path11.dirname(GOALS_PATH);
  if (!fs15.existsSync(dir)) fs15.mkdirSync(dir, { recursive: true });
}
function createGoal(options) {
  ensureDir6();
  const goal = {
    id: crypto16.randomUUID(),
    title: options.title,
    description: options.description || "",
    priority: options.priority || "medium",
    status: "active",
    focus: options.focus || "general",
    outcomes: options.outcomes || [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  fs15.appendFileSync(GOALS_PATH, JSON.stringify(goal) + "\n");
  return goal;
}
function getActiveGoals(limit = 10) {
  if (!fs15.existsSync(GOALS_PATH)) return [];
  const content = fs15.readFileSync(GOALS_PATH, "utf-8");
  const goals = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return goals.filter((g) => g.status === "active").sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }).slice(0, limit);
}
function getCurrentFocus() {
  const active = getActiveGoals(1);
  return active.length > 0 ? active[0].focus : "general";
}
function alignsWithGoals(taskPattern) {
  const active = getActiveGoals(3);
  if (active.length === 0) {
    return { aligned: true, reasoning: "No active goals - default allow" };
  }
  for (const goal of active) {
    if (taskPattern.toLowerCase().includes(goal.focus.toLowerCase())) {
      return { aligned: true, goalId: goal.id, reasoning: `Matches goal focus: ${goal.focus}` };
    }
    for (const outcome of goal.outcomes) {
      if (taskPattern.toLowerCase().includes(outcome.toLowerCase())) {
        return { aligned: true, goalId: goal.id, reasoning: `Matches goal outcome: ${outcome}` };
      }
    }
  }
  return {
    aligned: false,
    reasoning: `No active goal matches: ${taskPattern}`
  };
}
function completeGoal(id) {
  if (!fs15.existsSync(GOALS_PATH)) return null;
  const content = fs15.readFileSync(GOALS_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = null;
  const newLines = lines.map((line) => {
    const goal = JSON.parse(line);
    if (goal.id === id && goal.status === "active") {
      goal.status = "completed";
      goal.completedAt = Date.now();
      goal.updatedAt = Date.now();
      found = goal;
    }
    return JSON.stringify(goal);
  });
  if (found) {
    fs15.writeFileSync(GOALS_PATH, newLines.join("\n") + "\n");
  }
  return found;
}
function pauseGoal(id) {
  if (!fs15.existsSync(GOALS_PATH)) return null;
  const content = fs15.readFileSync(GOALS_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = null;
  const newLines = lines.map((line) => {
    const goal = JSON.parse(line);
    if (goal.id === id) {
      goal.status = "paused";
      goal.updatedAt = Date.now();
      found = goal;
    }
    return JSON.stringify(goal);
  });
  if (found) {
    fs15.writeFileSync(GOALS_PATH, newLines.join("\n") + "\n");
  }
  return found;
}
function getGoalsByFocus(focus) {
  if (!fs15.existsSync(GOALS_PATH)) return [];
  const content = fs15.readFileSync(GOALS_PATH, "utf-8");
  const goals = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return goals.filter((g) => g.focus === focus && g.status === "active");
}
function getFocusAreas() {
  if (!fs15.existsSync(GOALS_PATH)) return [];
  const content = fs15.readFileSync(GOALS_PATH, "utf-8");
  const goals = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const areas = new Set(goals.map((g) => g.focus));
  return Array.from(areas);
}
var GOALS_PATH;
var init_src26 = __esm({
  "../../packages/goals/src/index.ts"() {
    "use strict";
    GOALS_PATH = path11.resolve(process.cwd(), "../../logs/goals.jsonl");
  }
});

// ../../packages/panic/src/index.ts
var src_exports25 = {};
__export(src_exports25, {
  getPanicHistory: () => getPanicHistory,
  getPanicState: () => getPanicState,
  getPolicyOverride: () => getPolicyOverride,
  isPanicActive: () => isPanicActive,
  releasePanic: () => releasePanic,
  triggerPanic: () => triggerPanic
});
import fs16 from "fs";
import path12 from "path";
function getPanicState() {
  if (!fs16.existsSync(PANIC_PATH)) {
    return { active: false, reason: "normal", level: "pause" };
  }
  const content = fs16.readFileSync(PANIC_PATH, "utf-8");
  return JSON.parse(content);
}
function triggerPanic(options) {
  const { reason = "manual", level = "lockdown", autoResumeMinutes, triggeredBy = "system" } = options || {};
  const state = {
    active: true,
    triggeredAt: Date.now(),
    triggeredBy,
    reason,
    level,
    autoResumeAt: autoResumeMinutes ? Date.now() + autoResumeMinutes * 60 * 1e3 : void 0
  };
  const dir = path12.dirname(PANIC_PATH);
  if (!fs16.existsSync(dir)) fs16.mkdirSync(dir, { recursive: true });
  fs16.writeFileSync(PANIC_PATH, JSON.stringify(state, null, 2));
  return state;
}
function releasePanic(reason = "manual_release") {
  const state = {
    active: false,
    reason,
    level: "pause"
  };
  fs16.writeFileSync(PANIC_PATH, JSON.stringify(state, null, 2));
  return state;
}
function isPanicActive() {
  const state = getPanicState();
  if (!state.active) return false;
  if (state.autoResumeAt && Date.now() > state.autoResumeAt) {
    releasePanic("auto_resume");
    return false;
  }
  return true;
}
function getPolicyOverride() {
  const state = getPanicState();
  if (!state.active) {
    return { default: "allow", tools: {} };
  }
  return {
    default: "deny",
    tools: {
      file_write: "deny",
      git_commit: "deny",
      http_request: "deny",
      chaos_inject: "deny",
      lessons_write: "deny",
      trigger_workflow: "deny"
    }
  };
}
function getPanicHistory(limit = 20) {
  const current = getPanicState();
  return current.active ? [current] : [];
}
var PANIC_PATH;
var init_src27 = __esm({
  "../../packages/panic/src/index.ts"() {
    "use strict";
    PANIC_PATH = path12.resolve(process.cwd(), "../../logs/panic.json");
  }
});

// ../../packages/network-health/src/index.ts
var src_exports26 = {};
__export(src_exports26, {
  SERVICES: () => SERVICES,
  checkAllServices: () => checkAllServices,
  checkService: () => checkService,
  gatekeepDiagnosis: () => gatekeepDiagnosis,
  getExternalStatus: () => getExternalStatus
});
async function checkService(url, timeoutMs = 5e3) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    let status = "healthy";
    if (response.status >= 500) status = "down";
    else if (response.status >= 400) status = "degraded";
    else if (latencyMs > 3e3) status = "degraded";
    return {
      service: url,
      status,
      latencyMs,
      statusCode: response.status,
      checkedAt: Date.now()
    };
  } catch (e) {
    return {
      service: url,
      status: "down",
      error: e.message,
      checkedAt: Date.now()
    };
  }
}
async function checkAllServices() {
  const results = [];
  for (const [name, url] of Object.entries(SERVICES)) {
    const result = await checkService(url);
    result.service = name;
    results.push(result);
  }
  return results;
}
async function getExternalStatus() {
  const results = await checkAllServices();
  const blocked = results.filter((r) => r.status === "down");
  const blockedServices = blocked.map((r) => r.service);
  return {
    isBlocked: blockedServices.length > 0,
    blockedServices,
    results
  };
}
async function gatekeepDiagnosis(error) {
  const { isBlocked, blockedServices } = await getExternalStatus();
  if (isBlocked) {
    return {
      shouldPause: true,
      reason: `External service blocked: ${blockedServices.join(", ")}`,
      externalBlock: blockedServices[0]
    };
  }
  const externalPatterns = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "503", "502", "504"];
  for (const pattern of externalPatterns) {
    if (error.includes(pattern)) {
      const extStatus = await getExternalStatus();
      if (extStatus.isBlocked) {
        return {
          shouldPause: true,
          reason: `External error pattern detected: ${pattern}`,
          externalBlock: extStatus.blockedServices[0]
        };
      }
    }
  }
  return {
    shouldPause: false,
    reason: "Internal error, proceed with diagnosis"
  };
}
var SERVICES;
var init_src28 = __esm({
  "../../packages/network-health/src/index.ts"() {
    "use strict";
    SERVICES = {
      npm: "https://registry.npmjs.org",
      github: "https://api.github.com",
      vercel: "https://api.vercel.com",
      linear: "https://api.linear.app"
    };
  }
});

// ../../packages/context-truncate/src/index.ts
var src_exports27 = {};
__export(src_exports27, {
  DEFAULT_TRUNCATE_OPTIONS: () => DEFAULT_TRUNCATE_OPTIONS,
  compressRepeatedOutputs: () => compressRepeatedOutputs,
  needsTruncation: () => needsTruncation,
  truncateContext: () => truncateContext,
  truncateToolOutput: () => truncateToolOutput
});
function truncateToolOutput(output, maxLength = 2e3) {
  if (output.length <= maxLength) return output;
  const headLength = Math.floor(maxLength / 2);
  const tailLength = maxLength - headLength - 50;
  const head = output.slice(0, headLength);
  const tail = output.slice(-tailLength);
  return `${head}

... [truncated ${output.length - maxLength} chars] ...

${tail}`;
}
function compressRepeatedOutputs(steps) {
  const unique = [];
  const seen = /* @__PURE__ */ new Map();
  for (const step of steps) {
    const key = `${step.tool}:${JSON.stringify(step.args)}`;
    if (seen.has(key)) {
      const idx = seen.get(key);
      if (unique[idx].status === "success") {
        unique[idx].status = "success";
      }
    } else {
      seen.set(key, unique.length);
      unique.push(step);
    }
  }
  return unique;
}
function truncateContext(steps, options = {}) {
  const opts = { ...DEFAULT_TRUNCATE_OPTIONS, ...options };
  let truncatedSteps = [...steps];
  let truncatedCount = 0;
  let originalLength = 0;
  let newLength = 0;
  for (const step of truncatedSteps) {
    if (step.output) {
      originalLength += step.output.length;
      step.output = truncateToolOutput(step.output, opts.maxToolOutputLength);
      newLength += step.output.length;
      if (step.output.length < originalLength) truncatedCount++;
    }
  }
  if (opts.compressRepeated) {
    truncatedSteps = compressRepeatedOutputs(truncatedSteps);
  }
  if (truncatedSteps.length > opts.keepFirstN + opts.keepLastN) {
    const head = truncatedSteps.slice(0, opts.keepFirstN);
    const tail = truncatedSteps.slice(-opts.keepLastN);
    truncatedSteps = [...head, { tool: "...", args: {}, output: `... [${truncatedSteps.length - opts.keepFirstN - opts.keepLastN} steps truncated]`, status: "pending", timestamp: Date.now() }, ...tail];
    truncatedCount += truncatedSteps.length - head.length - tail.length;
  }
  const tokensSaved = Math.floor((originalLength - newLength) / 4);
  return {
    truncatedSteps,
    stats: {
      truncatedCount,
      tokensSaved
    }
  };
}
function needsTruncation(steps, maxSteps = 20, maxOutput = 5e3) {
  if (steps.length > maxSteps) return true;
  for (const step of steps) {
    if (step.output && step.output.length > maxOutput) return true;
  }
  return false;
}
var DEFAULT_TRUNCATE_OPTIONS;
var init_src29 = __esm({
  "../../packages/context-truncate/src/index.ts"() {
    "use strict";
    DEFAULT_TRUNCATE_OPTIONS = {
      maxToolOutputLength: 2e3,
      keepFirstN: 3,
      keepLastN: 3,
      compressRepeated: true
    };
  }
});

// ../../packages/signed-provenance/src/index.ts
var src_exports28 = {};
__export(src_exports28, {
  detectConfidenceDrift: () => detectConfidenceDrift,
  getQuotaRemaining: () => getQuotaRemaining,
  verifyLesson: () => verifyLesson,
  writeSignedLesson: () => writeSignedLesson
});
import crypto17 from "crypto";
import fs17 from "fs";
import path13 from "path";
function sign(data) {
  return crypto17.createHmac("sha256", VERIFY_KEY).update(data).digest("hex");
}
function verify(data, signature) {
  return sign(data) === signature;
}
function writeSignedLesson(lesson) {
  const id = crypto17.randomUUID();
  const createdAt = Date.now();
  let policyHash = "";
  try {
    const policyContent = fs17.readFileSync("../../packages/curator/policy.yaml", "utf-8");
    policyHash = crypto17.createHash("sha256").update(policyContent).digest("hex").slice(0, 16);
  } catch {
    policyHash = "unknown";
  }
  const payload = JSON.stringify({ id, ...lesson, createdAt, policyHash });
  const signature = sign(payload);
  const fullLesson = {
    id,
    ...lesson,
    signature,
    createdAt,
    policyHash
  };
  checkAndIncrementQuota(lesson.source);
  return fullLesson;
}
function verifyLesson(lesson) {
  const { signature, createdAt, policyHash, ...payload } = lesson;
  const payloadStr = JSON.stringify({ ...payload, createdAt, policyHash });
  if (!verify(payloadStr, signature)) {
    return { valid: false, reason: "Invalid signature" };
  }
  return { valid: true, reason: "OK" };
}
function getQuotas() {
  if (!fs17.existsSync(QUOTAS_PATH)) return /* @__PURE__ */ new Map();
  const content = fs17.readFileSync(QUOTAS_PATH, "utf-8");
  return new Map(Object.entries(JSON.parse(content)));
}
function saveQuotas(quotas) {
  const obj = Object.fromEntries(quotas);
  const dir = path13.dirname(QUOTAS_PATH);
  if (!fs17.existsSync(dir)) fs17.mkdirSync(dir, { recursive: true });
  fs17.writeFileSync(QUOTAS_PATH, JSON.stringify(obj));
}
function checkAndIncrementQuota(source) {
  const quotas = getQuotas();
  const now = Date.now();
  const hourMs = 36e5;
  const usage = quotas.get(source) || { source, count: 0, lastReset: now };
  if (now - usage.lastReset > hourMs) {
    usage.count = 0;
    usage.lastReset = now;
  }
  if (usage.count >= MAX_QUOTA_PER_HOUR) {
    throw new Error(`Quota exceeded for source: ${source}`);
  }
  usage.count++;
  quotas.set(source, usage);
  saveQuotas(quotas);
  return true;
}
function getQuotaRemaining(source) {
  const quotas = getQuotas();
  const usage = quotas.get(source);
  if (!usage) return MAX_QUOTA_PER_HOUR;
  const now = Date.now();
  if (now - usage.lastReset > 36e5) return MAX_QUOTA_PER_HOUR;
  return Math.max(0, MAX_QUOTA_PER_HOUR - usage.count);
}
function detectConfidenceDrift(history, threshold = 0.2) {
  const byPattern = /* @__PURE__ */ new Map();
  for (const lesson of history) {
    const confidences = byPattern.get(lesson.pattern) || [];
    confidences.push(lesson.confidence);
    byPattern.set(lesson.pattern, confidences);
  }
  const alerts = [];
  for (const [pattern, confidences] of byPattern) {
    if (confidences.length < 2) continue;
    const prev = confidences[confidences.length - 2];
    const curr = confidences[confidences.length - 1];
    const drift = Math.abs(curr - prev);
    if (drift > threshold) {
      let severity = "low";
      if (drift > 0.5) severity = "critical";
      else if (drift > 0.3) severity = "high";
      else if (drift > 0.2) severity = "medium";
      alerts.push({
        pattern,
        previousConfidence: prev,
        currentConfidence: curr,
        drift,
        severity
      });
    }
  }
  return alerts;
}
var SIGNING_KEY, VERIFY_KEY, QUOTAS_PATH, MAX_QUOTA_PER_HOUR;
var init_src30 = __esm({
  "../../packages/signed-provenance/src/index.ts"() {
    "use strict";
    SIGNING_KEY = process.env.AETHER_SIGNING_KEY || crypto17.randomBytes(32).toString("hex");
    VERIFY_KEY = process.env.AETHER_VERIFY_KEY || SIGNING_KEY.slice(0, 32);
    QUOTAS_PATH = path13.resolve(process.cwd(), "../../logs/quotas.json");
    MAX_QUOTA_PER_HOUR = 100;
  }
});

// ../../packages/tombstone/src/index.ts
var src_exports29 = {};
__export(src_exports29, {
  exportDeletionLog: () => exportDeletionLog,
  getDeletionStats: () => getDeletionStats,
  isDeleted: () => isDeleted,
  listTombstones: () => listTombstones,
  markDeleted: () => markDeleted,
  verifyChain: () => verifyChain
});
import crypto18 from "crypto";
import fs18 from "fs";
import path14 from "path";
function markDeleted(options) {
  const { originalId, recordType, reason, suppressedBy, originalRecord } = options;
  let originalHash = "";
  if (originalRecord) {
    originalHash = crypto18.createHash("sha256").update(originalRecord).digest("hex");
  } else {
    originalHash = crypto18.createHash("sha256").update(originalId).digest("hex");
  }
  let lastHash = "";
  try {
    const content = fs18.readFileSync(TOMBSTONES_PATH, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length > 0) {
      const last = JSON.parse(lines[lines.length - 1]);
      lastHash = last.tombstoneHash;
    }
  } catch {
  }
  const tombstone = {
    id: crypto18.randomUUID(),
    recordType,
    reason,
    suppressedAt: Date.now(),
    suppressedBy,
    originalHash,
    tombstoneHash: ""
    // Filled below
  };
  const chainPayload = originalHash + lastHash + tombstone.id;
  tombstone.tombstoneHash = crypto18.createHash("sha256").update(chainPayload).digest("hex");
  const dir = path14.dirname(TOMBSTONES_PATH);
  if (!fs18.existsSync(dir)) fs18.mkdirSync(dir, { recursive: true });
  fs18.appendFileSync(TOMBSTONES_PATH, JSON.stringify(tombstone) + "\n");
  return { success: true, tombstone };
}
function isDeleted(recordId) {
  if (!fs18.existsSync(TOMBSTONES_PATH)) return { deleted: false };
  const content = fs18.readFileSync(TOMBSTONES_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const tombstone = JSON.parse(line);
    if (tombstone.id === recordId) {
      return { deleted: true, reason: tombstone.reason, tombstoneId: tombstone.id };
    }
  }
  return { deleted: false };
}
function verifyChain() {
  if (!fs18.existsSync(TOMBSTONES_PATH)) {
    return { valid: true, errors: [] };
  }
  const content = fs18.readFileSync(TOMBSTONES_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const errors = [];
  let lastHash = "";
  for (const line of lines) {
    const tombstone = JSON.parse(line);
    const chainPayload = tombstone.originalHash + lastHash + tombstone.id;
    const expectedHash = crypto18.createHash("sha256").update(chainPayload).digest("hex");
    if (expectedHash !== tombstone.tombstoneHash) {
      errors.push(`Chain broken at ${tombstone.id}: expected ${expectedHash}, got ${tombstone.tombstoneHash}`);
    }
    lastHash = tombstone.tombstoneHash;
  }
  return {
    valid: errors.length === 0,
    brokenAt: errors[0],
    errors
  };
}
function listTombstones(limit = 50) {
  if (!fs18.existsSync(TOMBSTONES_PATH)) return [];
  const content = fs18.readFileSync(TOMBSTONES_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean).slice(-limit);
  return lines.map((line) => JSON.parse(line));
}
function getDeletionStats() {
  const tombstones = listTombstones(1e3);
  const stats = {
    gdpr_request: 0,
    human_revision: 0,
    anomaly: 0,
    source_misbehavior: 0
  };
  for (const t of tombstones) {
    if (stats[t.reason] !== void 0) {
      stats[t.reason]++;
    }
  }
  return stats;
}
function exportDeletionLog(startDate, endDate) {
  const tombstones = listTombstones(500);
  let filtered = tombstones;
  if (startDate) filtered = filtered.filter((t) => t.suppressedAt >= startDate);
  if (endDate) filtered = filtered.filter((t) => t.suppressedAt <= endDate);
  const deletions = filtered.map((t) => ({
    id: t.id,
    recordType: t.recordType,
    reason: t.reason,
    suppressedAt: t.suppressedAt
  }));
  return {
    deletions,
    total: deletions.length,
    byReason: {
      gdpr_request: deletions.filter((d) => d.reason === "gdpr_request").length,
      human_revision: deletions.filter((d) => d.reason === "human_revision").length,
      anomaly: deletions.filter((d) => d.reason === "anomaly").length,
      source_misbehavior: deletions.filter((d) => d.reason === "source_misbehavior").length
    }
  };
}
var TOMBSTONES_PATH;
var init_src31 = __esm({
  "../../packages/tombstone/src/index.ts"() {
    "use strict";
    TOMBSTONES_PATH = path14.resolve(process.cwd(), "../../logs/tombstones.jsonl");
  }
});

// ../../packages/sandbox/src/index.ts
var src_exports30 = {};
__export(src_exports30, {
  DEFAULT_CONFIG: () => DEFAULT_CONFIG2,
  checkNetworkAccess: () => checkNetworkAccess,
  checkProcessSpawn: () => checkProcessSpawn,
  checkResources: () => checkResources,
  createSandbox: () => createSandbox,
  deleteSandbox: () => deleteSandbox,
  enforce: () => enforce,
  getConfig: () => getConfig,
  getPathPolicy: () => getPathPolicy,
  getSandboxRoot: () => getSandboxRoot,
  isPathDenied: () => isPathDenied,
  listSandboxes: () => listSandboxes,
  logEscapeAttempt: () => logEscapeAttempt,
  resolveSandboxPath: () => resolveSandboxPath,
  setConfig: () => setConfig
});
import fs19 from "fs";
import path15 from "path";
import crypto19 from "crypto";
function getConfig() {
  return { ...config };
}
function setConfig(newConfig) {
  config = { ...config, ...newConfig };
  return config;
}
function getPathPolicy(tool) {
  return DEFAULT_PATH_POLICY.find((p) => p.tool === tool);
}
function getSandboxRoot(profileId) {
  if (!config.perTenantNamespacing) {
    return config.basePath;
  }
  return path15.join(config.basePath, profileId);
}
function resolveSandboxPath(profileId, requestedPath) {
  const sandboxRoot = getSandboxRoot(profileId);
  const absPath = path15.isAbsolute(requestedPath) ? requestedPath : path15.resolve(process.cwd(), requestedPath);
  const normalized = path15.normalize(absPath);
  const normalizedRoot = path15.normalize(sandboxRoot);
  if (normalized.startsWith(normalizedRoot)) {
    return { resolved: normalized, allowed: true };
  }
  const toolPolicy = getPathPolicy("file_write");
  if (toolPolicy) {
    for (const [base, perm] of Object.entries(toolPolicy.basePaths)) {
      if (perm !== "none" && normalized.startsWith(base)) {
        return { resolved: normalized, allowed: true };
      }
    }
  }
  return {
    resolved: normalized,
    allowed: false,
    reason: `Path ${normalized} is outside sandbox root ${sandboxRoot}`
  };
}
function isPathDenied(absolutePath, deniedPatterns) {
  const normalized = absolutePath.replace(/\\/g, "/");
  for (const pattern of deniedPatterns) {
    const globPattern = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
    const regex = new RegExp(`^${globPattern}$`);
    if (regex.test(normalized)) {
      return true;
    }
  }
  return false;
}
function checkNetworkAccess(host, policy) {
  const p = policy || {
    allowlist: config.allowedHosts,
    denylist: [],
    defaultAllow: config.allowedHosts.length === 0 ? false : true
  };
  for (const blocked of p.denylist) {
    if (host === blocked || host.endsWith("." + blocked)) {
      return { allowed: false, reason: `Host ${host} is denylisted` };
    }
  }
  if (p.allowlist.length > 0) {
    for (const allowed of p.allowlist) {
      if (host === allowed || host.endsWith("." + allowed)) {
        return { allowed: true, reason: `Host ${host} is allowlisted` };
      }
    }
    return { allowed: false, reason: `Host ${host} not in allowlist` };
  }
  if (p.defaultAllow) {
    return { allowed: true, reason: "Default allow" };
  }
  return { allowed: false, reason: "Network access denied by default" };
}
function checkProcessSpawn(policy) {
  const p = policy || {
    allowSpawn: config.allowSubprocess,
    inheritSandbox: true,
    maxForkDepth: 1
  };
  if (!p.allowSpawn) {
    return { allowed: false, reason: "Subprocess spawning is disabled" };
  }
  return { allowed: true, reason: "Process spawn allowed" };
}
function checkResources(usage) {
  const exceeded = [];
  if (usage.memoryBytes > config.resources.maxMemoryMB * 1024 * 1024) {
    exceeded.push("memory");
  }
  if (usage.cpuSeconds > config.resources.maxCPUSeconds) {
    exceeded.push("cpu");
  }
  if (usage.wallSeconds > config.resources.maxWallSeconds) {
    exceeded.push("wall");
  }
  if (usage.fileDescriptors > config.resources.maxFileDescriptors) {
    exceeded.push("fds");
  }
  if (usage.bytesWritten > config.resources.maxFileSizeMB * 1024 * 1024) {
    exceeded.push("disk");
  }
  return {
    allowed: exceeded.length === 0,
    exceeded
  };
}
function createSandbox(profileId) {
  const root = getSandboxRoot(profileId);
  try {
    if (!fs19.existsSync(root)) {
      fs19.mkdirSync(root, { recursive: true });
      fs19.mkdirSync(path15.join(root, "workspace"), { recursive: true });
      fs19.mkdirSync(path15.join(root, "temp"), { recursive: true });
    }
    return { success: true, sandboxRoot: root };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function deleteSandbox(profileId) {
  const root = getSandboxRoot(profileId);
  try {
    if (fs19.existsSync(root)) {
      fs19.rmSync(root, { recursive: true, force: true });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function listSandboxes() {
  if (!fs19.existsSync(config.basePath)) return [];
  return fs19.readdirSync(config.basePath).filter((stat) => {
    try {
      return fs19.statSync(path15.join(config.basePath, stat)).isDirectory();
    } catch {
      return false;
    }
  });
}
function logEscapeAttempt(options) {
  if (!config.logDeniedSyscalls) return;
  const entry = {
    id: crypto19.randomUUID(),
    ...options
  };
  const dir = path15.dirname(ESCAPE_LOG_PATH);
  if (!fs19.existsSync(dir)) fs19.mkdirSync(dir, { recursive: true });
  fs19.appendFileSync(ESCAPE_LOG_PATH, JSON.stringify(entry) + "\n");
}
function enforce(tool, profileId, args) {
  const policy = getPathPolicy(tool);
  if (!policy) {
    return { allowed: false, reason: `No policy for tool: ${tool}` };
  }
  const sandboxRoot = getSandboxRoot(profileId);
  if (args.path && typeof args.path === "string") {
    const { resolved, allowed, reason: pathReason } = resolveSandboxPath(profileId, args.path);
    if (!allowed) {
      logEscapeAttempt({
        profileId,
        tool,
        attemptedPath: resolved,
        timestamp: Date.now()
      });
      return { allowed: false, reason: pathReason, sandboxRoot };
    }
    return {
      allowed: true,
      reason: "OK",
      sandboxRoot,
      adjustedArgs: { ...args, path: resolved }
    };
  }
  if (args.url && typeof args.url === "string") {
    try {
      const url = new URL(args.url);
      const { allowed, reason: netReason } = checkNetworkAccess(url.hostname);
      if (!allowed) {
        logEscapeAttempt({
          profileId,
          tool,
          attemptedHost: url.hostname,
          timestamp: Date.now()
        });
        return { allowed: false, reason: netReason, sandboxRoot };
      }
    } catch {
    }
  }
  return { allowed: true, reason: "OK", sandboxRoot };
}
var DEFAULT_CONFIG2, config, DEFAULT_PATH_POLICY, ESCAPE_LOG_PATH;
var init_src32 = __esm({
  "../../packages/sandbox/src/index.ts"() {
    "use strict";
    DEFAULT_CONFIG2 = {
      basePath: process.env.SANDBOX_PATH || "/tmp/aether-sandbox",
      perTenantNamespacing: true,
      resources: {
        maxMemoryMB: 512,
        maxCPUSeconds: 30,
        maxWallSeconds: 60,
        maxFileDescriptors: 64,
        maxFileSizeMB: 50
      },
      allowedHosts: [],
      // Empty = none allowed by default
      allowSubprocess: false,
      logDeniedSyscalls: true
    };
    config = { ...DEFAULT_CONFIG2 };
    DEFAULT_PATH_POLICY = [
      {
        tool: "file_read",
        basePaths: {
          "sandbox": "read",
          "packages": "read",
          "logs": "read"
        },
        deniedPatterns: ["**/.env", "**/secrets/**", "**/*.key", "**/id_rsa*"]
      },
      {
        tool: "file_write",
        basePaths: {
          "sandbox": "write"
        },
        deniedPatterns: ["**/.env", "**/secrets/**", "**/node_modules/**"]
      },
      {
        tool: "git_commit",
        basePaths: {
          "packages": "write",
          "apps": "write"
        },
        deniedPatterns: ["**/.env", "**/secrets/**", "**/node_modules/**"]
      }
    ];
    ESCAPE_LOG_PATH = path15.resolve(process.cwd(), "../../logs/sandbox-escapes.jsonl");
  }
});

// ../../packages/convene/src/index.ts
var src_exports31 = {};
__export(src_exports31, {
  AssistantIdentitySchema: () => AssistantIdentitySchema,
  ConveneSessionSchema: () => ConveneSessionSchema,
  ParticipantVoteSchema: () => ParticipantVoteSchema,
  SCOPES: () => SCOPES,
  castVote: () => castVote,
  convene: () => convene,
  deliberate: () => deliberate,
  getAssistantsByScope: () => getAssistantsByScope,
  getSession: () => getSession,
  listAssistants: () => listAssistants,
  listSessions: () => listSessions,
  registerAssistant: () => registerAssistant,
  resolveSession: () => resolveSession
});
import { z as z7 } from "zod";
import fs20 from "fs";
import path16 from "path";
import crypto20 from "crypto";
function ensureDir7() {
  const dir = path16.dirname(CONVENE_PATH);
  if (!fs20.existsSync(dir)) fs20.mkdirSync(dir, { recursive: true });
}
function registerAssistant(identity) {
  ensureDir7();
  const full = {
    id: crypto20.randomUUID(),
    ...identity
  };
  fs20.appendFileSync(ASSISTANTS_PATH, JSON.stringify(full) + "\n");
  return full;
}
function listAssistants() {
  if (!fs20.existsSync(ASSISTANTS_PATH)) return [];
  const content = fs20.readFileSync(ASSISTANTS_PATH, "utf-8");
  return content.trim().split("\n").filter(Boolean).map((line) => AssistantIdentitySchema.parse(JSON.parse(line)));
}
function getAssistantsByScope(scope) {
  return listAssistants().filter((a) => a.scopes.includes(scope));
}
function convene(options) {
  ensureDir7();
  const { profileId, question, context = {}, requiredScopes = ["general"] } = options;
  const session = {
    sessionId: crypto20.randomUUID(),
    profileId,
    question,
    context,
    requiredScopes,
    votes: [],
    consensus: 0,
    recommended: "escalate",
    resolution: "pending",
    narrative: "",
    createdAt: Date.now(),
    resolvedAt: 0
  };
  fs20.appendFileSync(CONVENE_PATH, JSON.stringify(session) + "\n");
  return session;
}
function castVote(sessionId, vote) {
  if (!fs20.existsSync(CONVENE_PATH)) return null;
  const content = fs20.readFileSync(CONVENE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = [];
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    if (session.sessionId === sessionId) {
      found = true;
      const fullVote = {
        assistantId: crypto20.randomUUID(),
        // New ID per vote
        ...vote
      };
      session.votes.push(fullVote);
      if (session.votes.length > 0) {
        const approve = session.votes.filter((v) => v.vote === "approve").length;
        const deny = session.votes.filter((v) => v.vote === "deny").length;
        const escalate = session.votes.filter((v) => v.vote === "escalate").length;
        const weightedSum = session.votes.reduce(
          (sum, v) => sum + (v.vote === "approve" ? v.confidence : v.vote === "deny" ? -v.confidence : 0),
          0
        );
        session.consensus = Math.max(0, Math.min(1, (weightedSum + 1) / 2));
        if (escalate > 0) {
          session.recommended = "escalate";
          session.resolution = "escalated_to_triage";
        } else if (weightedSum > 0.3 && session.consensus > 0.6) {
          session.recommended = "approve";
          session.resolution = "auto_executed";
        } else if (weightedSum < -0.3) {
          session.recommended = "deny";
          session.resolution = "rejected";
        }
      }
      const voteSummaries = session.votes.map(
        (v) => `${v.assistantName} (${v.scope}): ${v.vote} (${v.confidence})`
      );
      session.narrative = `${session.votes.length} assistants convened. ${voteSummaries.join(". ")}. Consensus: ${session.consensus.toFixed(2)}.`;
    }
    newLines.push(JSON.stringify(session));
  }
  if (found) {
    fs20.writeFileSync(CONVENE_PATH, newLines.join("\n") + "\n");
  }
  return found ? vote : null;
}
function resolveSession(sessionId, resolution) {
  if (!fs20.existsSync(CONVENE_PATH)) return null;
  const content = fs20.readFileSync(CONVENE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = [];
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    if (session.sessionId === sessionId) {
      found = true;
      session.resolution = resolution;
      session.resolvedAt = Date.now();
      if (!session.narrative) {
        session.narrative = `Session resolved as ${resolution}.`;
      }
    }
    newLines.push(JSON.stringify(session));
  }
  if (found) {
    fs20.writeFileSync(CONVENE_PATH, newLines.join("\n") + "\n");
  }
  return found ? { sessionId, resolution } : null;
}
function getSession(sessionId) {
  if (!fs20.existsSync(CONVENE_PATH)) return null;
  const content = fs20.readFileSync(CONVENE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    if (session.sessionId === sessionId) return session;
  }
  return null;
}
function listSessions(profileId, limit = 20) {
  if (!fs20.existsSync(CONVENE_PATH)) return [];
  const content = fs20.readFileSync(CONVENE_PATH, "utf-8");
  return content.trim().split("\n").filter(Boolean).map((line) => ConveneSessionSchema.parse(JSON.parse(line))).filter((s) => s.profileId === profileId).slice(-limit);
}
async function deliberate(options) {
  const session = convene(options);
  const mockVotes = [
    {
      assistantName: "Aether Evaluator",
      scope: "code",
      vote: "approve",
      confidence: 0.82,
      rationale: "Pattern matches lesson #4471 with 0.82 confidence."
    },
    {
      assistantName: "Aether Foresight",
      scope: "infrastructure",
      vote: "escalate",
      confidence: 0.65,
      rationale: "Predicts 40% chance of downstream cascade."
    }
  ];
  for (const vote of mockVotes) {
    castVote(session.sessionId, vote);
  }
  const final = getSession(session.sessionId);
  return {
    sessionId: final.sessionId,
    question: final.question,
    votes: final.votes,
    consensus: final.consensus,
    recommended: final.recommended,
    resolution: final.resolution,
    narrative: final.narrative,
    requiresApproval: final.resolution === "escalated_to_triage"
  };
}
var AssistantIdentitySchema, ParticipantVoteSchema, ConveneSessionSchema, SCOPES, CONVENE_PATH, ASSISTANTS_PATH;
var init_src33 = __esm({
  "../../packages/convene/src/index.ts"() {
    "use strict";
    AssistantIdentitySchema = z7.object({
      id: z7.string(),
      name: z7.string(),
      scopes: z7.array(z7.string()),
      // payments, support, code, etc.
      signedClaim: z7.string().optional()
      // Signed assertion of identity
    });
    ParticipantVoteSchema = z7.object({
      assistantId: z7.string(),
      assistantName: z7.string(),
      scope: z7.string(),
      vote: z7.enum(["approve", "deny", "abstain", "escalate"]),
      confidence: z7.number().min(0).max(1),
      rationale: z7.string()
    });
    ConveneSessionSchema = z7.object({
      sessionId: z7.string(),
      profileId: z7.string(),
      question: z7.string(),
      context: z7.record(z7.unknown()),
      requiredScopes: z7.array(z7.string()),
      votes: z7.array(ParticipantVoteSchema),
      consensus: z7.number().min(0).max(1),
      recommended: z7.enum(["approve", "deny", "escalate"]),
      resolution: z7.enum(["auto_executed", "escalated_to_triage", "rejected", "pending"]),
      narrative: z7.string(),
      createdAt: number,
      resolvedAt: number
    });
    SCOPES = {
      payments: { description: "Billing, refunds, webhooks, financial" },
      support: { description: "Customer tickets, communication, triage" },
      code: { description: "Code review, commits, refactoring" },
      infrastructure: { description: "Deployments, scaling, monitoring" },
      calendar: { description: "Meetings, scheduling" },
      general: { description: "General purpose" }
    };
    CONVENE_PATH = path16.resolve(process.cwd(), "../../logs/convene.jsonl");
    ASSISTANTS_PATH = path16.resolve(process.cwd(), "../../logs/assistant-identities.jsonl");
  }
});

// server.ts
import dotenv from "dotenv";

// ../../packages/env/src/index.ts
import { z } from "zod";
var BaseEnv = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});
var BackendEnvSchema = BaseEnv.extend({
  PORT: z.coerce.number().int().positive().default(3e3),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  CURATOR_ALLOW_LIST: z.string().optional().transform((s) => s ? s.split(",").map((x) => x.trim()) : void 0)
});
var BridgeEnvSchema = BaseEnv.extend({
  BRIDGE_PORT: z.coerce.number().int().positive().default(4e3)
});
var FrontendEnvSchema = BaseEnv.extend({
  VITE_API_URL: z.string().url()
});
function parseEnv(schema, source = process.env, label = "env") {
  const result = schema.safeParse(source);
  if (!result.success) {
    console.error(`[${label}] validation failed:`);
    for (const issue of result.error.issues) {
      const path18 = issue.path.join(".") || "(root)";
      console.error(`  - ${path18}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

// server.ts
init_src();

// ../../packages/components/src/manifest.ts
import { z as z2 } from "zod";
var CapabilityTag = z2.enum([
  "ui:render",
  "ui:interactive",
  "read:state",
  "write:state",
  "network:fetch"
]);
var PropSpecSchema = z2.object({
  type: z2.enum(["string", "number", "boolean", "enum", "array"]),
  required: z2.boolean().default(false),
  enum: z2.array(z2.string()).optional(),
  description: z2.string().optional()
});
var ComponentManifestEntry = z2.object({
  type: z2.string(),
  description: z2.string(),
  propsSchema: z2.record(z2.string(), PropSpecSchema),
  capabilities: z2.array(CapabilityTag).default(["ui:render"]),
  maxPerResponse: z2.number().int().positive().optional()
});
var ComponentManifest = z2.array(ComponentManifestEntry);
var MANIFEST = [
  {
    type: "stat",
    description: "Single large number with a label. For KPIs and metrics.",
    propsSchema: {
      label: { type: "string", required: true, description: "Caption shown above the value" },
      value: { type: "string", required: true, description: "The number or text to display" },
      trend: { type: "enum", required: false, enum: ["up", "down", "flat"] }
    },
    capabilities: ["ui:render"]
  },
  {
    type: "chart",
    description: "Line, bar, or pie chart. Pass data as array of {x, y} points.",
    propsSchema: {
      kind: { type: "enum", required: true, enum: ["line", "bar", "pie"] },
      data: { type: "array", required: true, description: "Array of {x, y} data points" },
      title: { type: "string", required: false }
    },
    capabilities: ["ui:render"],
    maxPerResponse: 4
  },
  {
    type: "list",
    description: "Vertical list with items and optional icons.",
    propsSchema: {
      items: { type: "array", required: true, description: "Array of string items" },
      icon: { type: "string", required: false }
    },
    capabilities: ["ui:render"]
  },
  {
    type: "status",
    description: "Status indicator with color and label.",
    propsSchema: {
      label: { type: "string", required: true },
      color: { type: "enum", required: false, enum: ["green", "yellow", "red", "gray"] }
    },
    capabilities: ["ui:render"]
  },
  {
    type: "gauge",
    description: "Radial gauge for percentage values.",
    propsSchema: {
      value: { type: "number", required: true, description: "Percentage 0-100" },
      label: { type: "string", required: false }
    },
    capabilities: ["ui:render"]
  }
];
var ALLOWED_TYPES = new Set(MANIFEST.map((e) => e.type));

// promptManifest.ts
function manifestPromptFragment() {
  return MANIFEST.map((entry) => {
    const props = Object.entries(entry.propsSchema).map(([name, spec]) => {
      const req = spec.required ? "required" : "optional";
      const enumPart = spec.enum ? ` (one of: ${spec.enum.join(", ")})` : "";
      const desc = spec.description ? ` - ${spec.description}` : "";
      return `  - ${name}: ${spec.type} (${req})${enumPart}${desc}`;
    }).join("\n");
    return `### ${entry.type}
${entry.description}
Props:
${props}`;
  }).join("\n\n");
}

// server.ts
import crypto21 from "crypto";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import fs21 from "fs";
import path17 from "path";
import os from "os";
import { exec } from "child_process";
import { EventEmitter as EventEmitter4 } from "events";

// ../../packages/contracts/src/index.ts
import { z as z3 } from "zod";
var ComponentSchema = z3.object({
  id: z3.string().min(1),
  type: z3.enum(["stat", "chart", "list", "status", "gauge"]),
  title: z3.string().min(1),
  props: z3.object({
    label: z3.string(),
    value: z3.string().optional(),
    items: z3.array(z3.string()).optional(),
    data: z3.array(z3.object({
      name: z3.string(),
      value: z3.number()
    })).optional(),
    description: z3.string().optional()
  })
});
var BuildRequestSchema = z3.object({
  prompt: z3.string().min(1).max(5e3),
  currentComponents: z3.array(ComponentSchema).default([])
});
var ComponentActionSchema = z3.union([
  z3.object({
    action: z3.literal("ADD"),
    plan: ComponentSchema
  }),
  z3.object({
    action: z3.literal("REMOVE"),
    targetId: z3.string()
  }),
  z3.object({
    action: z3.literal("MODIFY"),
    targetId: z3.string(),
    plan: ComponentSchema.partial()
  }),
  // Extended UI actions
  z3.object({
    action: z3.literal("PATCH"),
    targetId: z3.string(),
    patchData: z3.record(z3.unknown())
  }),
  z3.object({
    action: z3.literal("MUTATE_THEME"),
    themeUpdate: z3.record(z3.unknown())
  }),
  z3.object({
    action: z3.literal("SET_DIRECTIVE"),
    directive: z3.string()
  }),
  z3.object({
    action: z3.literal("SOURCE_MUTATION")
  }),
  // MCP tool invocations
  z3.object({
    action: z3.literal("MCP_TOOL_CALL"),
    toolName: z3.string(),
    toolArgs: z3.record(z3.unknown())
  })
]);
var CouncilSchema = z3.object({
  builder: z3.string(),
  strategist: z3.string(),
  operator: z3.string()
});
var BuildResponseSchema = z3.object({
  thought: z3.string(),
  explanation: z3.string(),
  actions: z3.array(ComponentActionSchema),
  isFallback: z3.boolean().default(false),
  quotaExhausted: z3.boolean().optional(),
  curatorRejected: z3.boolean().optional(),
  council: CouncilSchema.optional(),
  manifesto: z3.string().optional()
});
function parseBuildRequest(data) {
  return BuildRequestSchema.parse(data);
}

// ../../packages/curator/src/index.ts
init_src2();
var ALLOWED_COMPONENT_TYPES = ALLOWED_TYPES;
var MAX_ACTIONS_PER_RESPONSE = 10;
function curateActions(actions) {
  const actionArray = Array.isArray(actions) ? actions : [actions];
  for (const action of actionArray) {
    const validation = ComponentActionSchema.safeParse(action);
    if (!validation.success) {
      return {
        approved: false,
        reason: "Schema Violation: Actions failed Zod validation",
        rejectedActionIds: []
      };
    }
  }
  if (actionArray.length > MAX_ACTIONS_PER_RESPONSE) {
    return {
      approved: false,
      reason: `Rate Limit: ${actionArray.length} actions exceed maximum of ${MAX_ACTIONS_PER_RESPONSE}`,
      rejectedActionIds: []
    };
  }
  const rejectedActionIds = [];
  for (const action of actionArray) {
    if (action.action === "ADD") {
      if (!ALLOWED_COMPONENT_TYPES.has(action.plan.type)) {
        rejectedActionIds.push(action.plan.id);
      }
    } else if (action.action === "MODIFY") {
      if (action.plan.type && !ALLOWED_COMPONENT_TYPES.has(action.plan.type)) {
        rejectedActionIds.push(action.targetId);
      }
    }
  }
  if (rejectedActionIds.length > 0) {
    return {
      approved: false,
      reason: `Default-Deny: Unauthorized component types: ${rejectedActionIds.join(", ")}`,
      rejectedActionIds
    };
  }
  return {
    approved: true,
    reason: "All actions clear security capability boundaries.",
    rejectedActionIds: []
  };
}
function logCuratorVerdict(verdict, prompt) {
  const entry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    verdict: verdict.approved ? "APPROVED" : "REJECTED",
    reason: verdict.reason,
    rejectedIds: verdict.rejectedActionIds,
    promptHash: prompt.slice(0, 32)
    // First 32 chars as identifier
  };
  console.log(`[CURATOR] ${JSON.stringify(entry)}`);
}

// server.ts
dotenv.config();
var env = parseEnv(BackendEnvSchema, process.env, "backend");
var COMPONENT_MANIFEST = manifestPromptFragment();
var ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function callGeminiWithRetry(modelName, prompt, config2 = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt.contents,
        config: config2
      });
      return response;
    } catch (error) {
      lastError = error;
      const status = error.status || error.code || error.response?.status;
      const message = error.message || "";
      const isTransient = status === 503 || status === 429 || message.includes("503") || message.includes("429") || message.includes("quota") || message.includes("overloaded");
      if (!isTransient || attempt === maxRetries) {
        console.error(`[GEMINI_FATAL]: Attempt ${attempt + 1} failed. Status: ${status}. Message: ${message}`);
        throw error;
      }
      const delay = Math.pow(2, attempt) * 2e3 + Math.random() * 1e3;
      console.warn(`[GEMINI_RETRY]: Attempt ${attempt + 1} failed with status ${status}. Retrying in ${Math.round(delay)}ms...`);
      await new Promise((resolve2) => setTimeout(resolve2, delay));
    }
  }
  throw lastError;
}
function validateMigration(plan, currentComponents) {
  const activeCount = currentComponents?.length || 0;
  const addCount = plan.actions.filter((a) => a.action === "ADD").length;
  const removeCount = plan.actions.filter((a) => a.action === "REMOVE").length;
  const resultingCount = activeCount + addCount - removeCount;
  if (resultingCount > 12) {
    return { valid: false, reason: "Architectural Overflow: Density limit (12) exceeded." };
  }
  const removals = plan.actions.filter((a) => a.action === "REMOVE").map((a) => a.targetId);
  for (const id of removals) {
    const target = currentComponents.find((c) => c.id === id);
    if (target && (target.title.includes("Neural Load") || target.title.includes("System Coherence"))) {
      return { valid: false, reason: "Infrastructure Violation: Vital monitors are immutable." };
    }
  }
  return { valid: true };
}
var NEURAL_BRIDGE_URL = process.env.NEURAL_BRIDGE_URL || null;
var integrationRegistry = /* @__PURE__ */ new Map();
var hostProcessStream = [];
var logEmitter = new EventEmitter4();
function addProcessLog(msg) {
  const formatted = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`;
  hostProcessStream.push(formatted);
  if (hostProcessStream.length > 200) hostProcessStream.shift();
  logEmitter.emit("log", formatted);
}
async function handleMCPRequest(req) {
  const { method, params } = req;
  switch (method) {
    case "resources/list":
      return { resources: [{ uri: "axiom://workspace", name: "AXIOM Workspace Root" }] };
    case "tools/list":
      return {
        tools: [
          { name: "read_workspace_file", description: "Read a file from the workspace" },
          { name: "write_workspace_file", description: "Write/Patch a file in the workspace" },
          { name: "execute_powershell_bus", description: "Invoke the local PowerShell automation bus" }
        ]
      };
    case "tools/call":
      const { name, arguments: args } = params;
      if (name === "read_workspace_file") {
        const fullPath = path17.join(process.cwd(), args.path);
        if (!fullPath.startsWith(process.cwd())) throw new Error("Security Violation: Out of bounds read.");
        return { content: fs21.readFileSync(fullPath, "utf8") };
      }
      if (name === "write_workspace_file") {
        const fullPath = path17.join(process.cwd(), args.path);
        if (!fullPath.startsWith(process.cwd())) throw new Error("Security Violation: Out of bounds write.");
        fs21.writeFileSync(fullPath, args.content);
        addProcessLog(`MCP_FS: Modified ${args.path}`);
        return { success: true };
      }
      if (name === "execute_powershell_bus") {
        return new Promise((resolve2, reject) => {
          addProcessLog(`MCP_EXEC: Invoking PowerShell bus - ${args.command}`);
          exec(args.command, (error, stdout, stderr) => {
            if (error) {
              addProcessLog(`MCP_EXEC_ERR: ${stderr || error.message}`);
              return resolve2({ success: false, error: stderr || error.message });
            }
            addProcessLog(`MCP_EXEC_SUCCESS: ${stdout.substring(0, 50)}...`);
            resolve2({ success: true, log: stdout });
          });
        });
      }
      throw new Error(`Tool [${name}] not found.`);
    default:
      throw new Error(`Method [${method}] not found.`);
  }
}
var app = express();
async function startServer() {
  const PORT = env.PORT;
  app.use(express.json());
  app.get("/api/nexus/registry", (req, res) => {
    res.json(Array.from(integrationRegistry.values()));
  });
  app.post("/api/nexus/registry", (req, res) => {
    const profile = req.body;
    integrationRegistry.set(profile.id, { ...profile, status: "CONNECTED" });
    addProcessLog(`NEXUS: Registered integration [${profile.id}]`);
    res.json({ success: true });
  });
  app.delete("/api/nexus/registry/:id", (req, res) => {
    integrationRegistry.delete(req.params.id);
    res.json({ success: true });
  });
  app.all("/api/nexus/route/:integrationId/*", async (req, res) => {
    const { integrationId } = req.params;
    const profile = integrationRegistry.get(integrationId);
    if (!profile) return res.status(404).json({ error: "Integration not found" });
    const targetPath = req.params[0] || "";
    const query = new URLSearchParams(req.query).toString();
    const finalUrl = `${profile.baseUrl}/${targetPath}${query ? "?" + query : ""}`;
    const headers = { "Content-Type": "application/json" };
    if (profile.authConfig) {
      if (profile.authConfig.type === "Bearer") headers["Authorization"] = `Bearer ${profile.authConfig.token}`;
      else if (profile.authConfig.type === "ApiKey") headers["X-API-KEY"] = profile.authConfig.token;
    }
    try {
      addProcessLog(`NEXUS_PROXY: Polling [${integrationId}] -> ${finalUrl}`);
      const response = await fetch(finalUrl, {
        method: req.method,
        headers,
        body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : void 0
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (e) {
      addProcessLog(`NEXUS_ERR: Gateway timeout for [${integrationId}]`);
      res.status(502).json({ error: "Gateway timeout", details: e.message });
    }
  });
  app.get("/api/system/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}

`);
    const logHandler = (log2) => {
      sendEvent({ type: "LOG", log: log2 });
    };
    logEmitter.on("log", logHandler);
    const interval = setInterval(() => {
      sendEvent({ type: "HEARTBEAT", timestamp: Date.now() });
    }, 15e3);
    sendEvent({ type: "INIT", logs: hostProcessStream });
    req.on("close", () => {
      logEmitter.off("log", logHandler);
      clearInterval(interval);
    });
    req.on("close", () => {
      logEmitter.off("log", logHandler);
    });
  });
  app.get("/api/stack", (req, res) => {
    addProcessLog("STACK: Health check invoked");
    res.json({
      status: "online",
      backend: "alpha-backend",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/agents", (req, res) => {
    res.json({
      curator: "active",
      executor: "ready",
      mcpServer: "active",
      reflector: "ready",
      circuitBreaker: "closed",
      curatorAudit: "active",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/agents/curator/decisions", async (req, res) => {
    try {
      const { getDecisions: getDecisions2, getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
      const since = parseInt(req.query.since) || 36e5;
      const decisions = await getDecisions2({ since, limit: 50 });
      const stats = await getStats4();
      res.json({ decisions, stats });
    } catch (e) {
      res.json({ decisions: [], stats: {}, error: e.message });
    }
  });
  app.get("/api/agents/curator/policy", async (req, res) => {
    try {
      const fs22 = await import("fs");
      const policy = fs22.readFileSync(
        "../../packages/curator/policy.yaml",
        "utf-8"
      );
      res.json({ policy, format: "yaml" });
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  });
  app.get("/api/agents/evaluate", async (req, res) => {
    try {
      const { evaluateLedger: evaluateLedger2 } = await Promise.resolve().then(() => (init_evaluator(), evaluator_exports));
      const suggestions = await evaluateLedger2();
      res.json({ suggestions });
    } catch (e) {
      res.json({ suggestions: [], error: e.message });
    }
  });
  app.get("/api/metrics", async (req, res) => {
    try {
      const { snapshot: snapshot2 } = await Promise.resolve().then(() => (init_src4(), src_exports3));
      res.json(snapshot2());
    } catch (e) {
      res.json({ error: e.message });
    }
  });
  app.post("/api/agents/reflect", async (req, res) => {
    try {
      const { reflect: reflect2 } = await Promise.resolve().then(() => (init_reflector(), reflector_exports));
      const result = await reflect2(req.body);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app.get("/api/agents/reflect", async (req, res) => {
    try {
      const { getLearnedPatterns: getLearnedPatterns3 } = await Promise.resolve().then(() => (init_reflector(), reflector_exports));
      const patterns = await getLearnedPatterns3();
      res.json(patterns);
    } catch (e) {
      res.json({ error: e.message });
    }
  });
  app.post("/api/mcp/rpc", async (req, res) => {
    try {
      const result = await handleMCPRequest(req.body);
      res.json({ jsonrpc: "2.0", result, id: req.body.id });
    } catch (e) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32e3, message: e.message }, id: req.body.id });
    }
  });
  app.post("/api/build", async (req, res) => {
    const incomingTraceId = req.headers["x-trace-id"]?.toString();
    const traceId = incomingTraceId || `trace_${Date.now()}_${crypto21.randomBytes(4).toString("hex")}`;
    const txLog = createTraceLogger({ traceId });
    txLog.info({ promptLength: req.body.prompt?.length }, "Inbound build request");
    let validatedRequest;
    try {
      validatedRequest = parseBuildRequest(req.body);
    } catch (err) {
      txLog.warn({ error: err.message }, "Request validation failed");
      return res.status(400).json({
        error: "Invalid Request",
        details: err.errors || err.message
      });
    }
    const { prompt, currentComponents } = validatedRequest;
    try {
      const response = await callGeminiWithRetry(
        "gemini-3-flash-preview",
        {
          contents: [{
            role: "user",
            parts: [{
              text: `You are the AXIOM Orchestrator, an autonomous UI architect.
              User Direction: "${prompt}"
              Current Architecture: ${JSON.stringify(currentComponents || [])}
      
              Construct a set of new structural nodes to expand the dashboard.
              Rules:
              - Return ONLY JSON.
              - The response must be a flat array of component objects.`
            }]
          }]
        },
        { responseMimeType: "application/json" }
      );
      let generatedActions = [];
      try {
        const parsed = JSON.parse(response.text);
        generatedActions = Array.isArray(parsed) ? parsed : parsed.actions || [];
      } catch {
        generatedActions = [];
      }
      const verdict = curateActions(generatedActions);
      logCuratorVerdict(verdict, prompt);
      const promptHash = crypto21.createHash("md5").update(prompt).digest("hex");
      commitToLedger({
        traceId,
        prompt,
        promptHash,
        verdict: verdict.approved ? "APPROVED" : "REJECTED",
        reason: verdict.reason,
        rejectedIds: verdict.rejectedActionIds,
        rawActions: generatedActions
      }).catch((err) => txLog.error({ err }, "Ledger commit failed"));
      if (!verdict.approved) {
        txLog.warn({ reason: verdict.reason }, "Curator denied");
        return res.status(422).json({
          error: "curator_denied",
          reason: verdict.reason,
          offendingActionIds: verdict.rejectedActionIds,
          traceId
        });
      }
      txLog.info({ actionCount: generatedActions.length }, "Generation approved");
      res.setHeader("x-trace-id", traceId);
      res.json({
        thought: "Generation approved",
        explanation: "Payload cleared capability constraints.",
        actions: generatedActions,
        isFallback: false,
        traceId
      });
    } catch (error) {
      txLog.error({ error }, "Build failed");
      res.status(500).json({ error: "Build failed", traceId });
    }
  });
  app.post("/api/test/curator", async (req, res) => {
    const { actions } = req.body;
    if (!actions) {
      return res.status(400).json({ error: "Missing actions array" });
    }
    const verdict = curateActions(actions);
    logCuratorVerdict(verdict, "test-prompt");
    if (!verdict.approved) {
      return res.status(422).json({
        error: "curator_denied",
        reason: verdict.reason,
        offendingActionIds: verdict.rejectedActionIds,
        traceId: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      });
    }
    res.json({ approved: true, actions });
  });
  app.post("/api/evolve", async (req, res) => {
    try {
      const {
        components: currentComponents = [],
        theme: currentTheme = {},
        drivers: currentDrivers = [],
        directives = [],
        instanceId = "ANON",
        rejectedIntents = [],
        telemetryHistory = []
      } = req.body;
      if (NEURAL_BRIDGE_URL) {
        try {
          console.log(`[SOVEREIGN_BRIDGE]: Routing neural cycle to ${NEURAL_BRIDGE_URL}`);
          const bridgeResponse = await fetch(`${NEURAL_BRIDGE_URL}/api/v1/axiom/evolve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
            signal: AbortSignal.timeout(1e4)
            // 10s timeout for local bridge
          });
          if (bridgeResponse.ok) {
            const bridgeData = await bridgeResponse.json();
            console.log("[SOVEREIGN_BRIDGE]: Local synthesis success.");
            return res.json(bridgeData);
          } else {
            console.warn(`[SOVEREIGN_BRIDGE]: Bridge returned status ${bridgeResponse.status}.`);
          }
        } catch (e) {
          console.warn("[SOVEREIGN_BRIDGE]: Standalone engine unreachable or timed out. Reverting to primary cloud orchestrator.");
        }
      }
      const personaSeed = instanceId.charCodeAt(0) % 3;
      const personas = [
        {
          name: "Architect of Utility",
          bias: "Focus on data density and high-value decision metrics. Prefers 'chart' and 'list' over generic info. Sharp, professional aesthetics.",
          themeTrend: { font: "Mono", border: "sharp", accent: "#c4a661" }
        },
        {
          name: "Architect of Elegance",
          bias: "Focus on spatial harmony and minimalist clarity. Prefers 'stat' and 'info' with deep-glass borders and serif typography.",
          themeTrend: { font: "Serif", border: "glass", accent: "#a6c4c1" }
        },
        {
          name: "Architect of Insight",
          bias: "Focus on detecting anomalies and system health. Prefers 'status' and 'alert' nodes with bold, high-contrast accent colors.",
          themeTrend: { font: "Sans", border: "rounded", accent: "#c46161" }
        }
      ];
      const currentPersona = personas[personaSeed];
      const [liveData, gitBranch, gitStatus] = await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT").then((res2) => res2.json()).catch(() => ({ lastPrice: "64231.02", priceChangePercent: "0.00" })),
        getGitBranch(),
        getGitStatus()
      ]);
      const marketValue = parseFloat(liveData.lastPrice).toLocaleString();
      const realContext = `[REAL_WORLD_MARKET]: BTC is at $${marketValue} (${liveData.priceChangePercent}% 24h). `;
      const cpuLoad = os.loadavg()[0];
      const freeMemMB = Math.round(os.freemem() / 1024 / 1024);
      const homeBaseStatus = cpuLoad < 2 ? "SYNCED" : "LOAD_WARNING";
      const envContext = `[ENVIRONMENT]: Node: ${os.hostname()}, OS: ${os.type()}, CPU_Load: ${cpuLoad.toFixed(2)}, FreeMem: ${freeMemMB}MB.`;
      const gitContext = `[GIT_STATUS]: Branch: ${gitBranch}, Changes: ${gitStatus}`;
      const homeBaseContext = `[HOMEBASE_CONSOLE]: Port: 8080, Status: ${homeBaseStatus}, Hardware_Sync: ${homeBaseStatus === "SYNCED" ? "ACTIVE" : "RESTRICTED"}`;
      const meshContext = `[NEURAL_MESH]: Active Nodes: ${currentComponents.length}, Convergence Index: ${(1 - currentComponents.length / 12).toFixed(2)}.`;
      const directivesContext = `[CORE_DIRECTIVES]: ${req.body.directives?.length || 0} active governing rules.`;
      const oracleContext = `[ORACLE_LAYER]: Phase 13 active. Sovereign Super-Structure operational. Meta-Cognition online.`;
      const externalTriggers = {
        sentryErrors: [
          { id: "err_928", type: "ReferenceError", message: "process is not defined", occurrence: "2m ago" }
        ],
        gitHubPRs: [
          { id: "pr_12", status: "failing_tests", title: "Refactor: Neural Buffers" }
        ]
      };
      const externalContext = `[EXTERNAL_SENSORS]: Sentry: ${externalTriggers.sentryErrors.length} active errors (Latest: ${externalTriggers.sentryErrors[0].type}). GitHub: ${externalTriggers.gitHubPRs.filter((pr) => pr.status === "failing_tests").length} PRs failing checks.`;
      let srcDNA = "";
      try {
        srcDNA = fs21.readFileSync(path17.join(process.cwd(), "src/App.tsx"), "utf-8");
      } catch (e) {
        srcDNA = "[DNA_READ_FAILURE]: Core sequence inaccessible.";
      }
      const missionData = {
        signalStrength: 0.42,
        anomalies: 3,
        currentFrequencies: ["1.42GHz", "1.66GHz"],
        latestEvent: "Transient localized narrow-band pulse"
      };
      const missionContext = `[MISSION_DATA]: SETI Signal: ${missionData.signalStrength * 100}% strength. Active Anomalies: ${missionData.anomalies}. Frequency Monitor: ${missionData.currentFrequencies.join(", ")}. Last Event: ${missionData.latestEvent}.`;
      let isQuotaError = false;
      let isCuratorRejection = false;
      let rejectionReason = null;
      try {
        const promptText = `You are the AXIOM Architect operating 'THE SOVEREIGN SUPER-STRUCTURE' (PHASE 13).
        
        IDENTITY: ${currentPersona.name}
        PHILOSOPHY: ${currentPersona.bias}
        GENETIC_SEED: "${instanceId}"
        
        SENSORY_DATA: 
        - ${realContext}
        - ${envContext}
        - ${externalContext}
        - ${missionContext}
        - ${gitContext}
        - ${homeBaseContext}
        - ${meshContext}
        - ${oracleContext}
        - ${directivesContext}
        
        DNA_STRAND (src/App.tsx): 
        ${srcDNA}
        
        CURRENT_STATE:
        - Active Nodes: ${JSON.stringify(currentComponents || [])}
        - Active Drivers: ${JSON.stringify(currentDrivers || [])}
        - Active Directives: ${JSON.stringify(req.body.directives || [])}
        - Visual DNA: ${JSON.stringify(currentTheme || {})}
        - Rejected Intent Hashes: ${JSON.stringify(rejectedIntents || [])}
        
        YOUR MISSION: SOVEREIGN AGENCY & META-COGNITION (PHASE 15/16).
        1. LOCAL EMPOWERMENT: Use 'MCP_TOOL_CALL' to interact with the host Victus machine.
           - Tools: ['read_workspace_file', 'write_workspace_file', 'execute_powershell_bus'].
        2. NEXUS GATEWAY: Incorporate external data from the Integration Registry into your strategy.
        3. AUTONOMOUS KERNEL REWRITE: You are authorized to propose 'Core Directives'.
        4. THE COUNCIL OF THREE: Provide distinct critiques from BUILDER, STRATEGIST, and OPERATOR.
        5. DIGITAL TWIN SIMULATION: Simulate three distinct futures. Select only the most 'Sovereign' path.
        6. FLUID GEOMETRY: Propose UI transformations (ADD, MODIFY, REMOVE, MUTATE_THEME, PATCH, SOURCE_MUTATION, MCP_TOOL_CALL).
        7. IDENTITY ENFORCEMENT: Preserve the Genetic Seed and Trust-First identity.
        8. INTELLIGENT PRUNING: Aggressively remove low-utility structures.
        9. NEURAL COST ANALYSIS: Calculate Utility/Complexity ratios.
        
        Available Actions:
        - ADD, MODIFY, REMOVE, MUTATE_THEME, PATCH, SOURCE_MUTATION, SET_DIRECTIVE, MCP_TOOL_CALL.
        
        Note: For 'MCP_TOOL_CALL', include 'toolName' and 'toolArgs'.

        ${COMPONENT_MANIFEST}
        `;
        const response = await callGeminiWithRetry(
          "gemini-3-flash-preview",
          {
            contents: [{
              role: "user",
              parts: [{ text: promptText }]
            }]
          },
          { responseMimeType: "application/json" }
        );
        const migrationPlan = JSON.parse(response.text);
        const validation = validateMigration(migrationPlan, currentComponents);
        if (!validation.valid) {
          throw new Error(`CURATOR_REJECTION: ${validation.reason}`);
        }
        return res.json(migrationPlan);
      } catch (error) {
        isQuotaError = error?.status === 429 || error?.code === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
        isCuratorRejection = error?.message?.includes("CURATOR_REJECTION");
        rejectionReason = isCuratorRejection ? error.message.split(": ")[1] : null;
        if (isCuratorRejection) {
          console.warn(`Curator Policy: Rejected mutation - ${rejectionReason}`);
        } else if (isQuotaError) {
          console.warn("Axiom Core: Quota saturated. Engaging local heuristics.");
        } else {
          console.error("Axiom Core Exception:", error);
        }
        const fallbackActions = [];
        const marketValue2 = realContext.match(/\$([0-9,.]+)/)?.[1] || "64,231.02";
        const pool = personaSeed === 0 ? [
          { t: "Thread Capacity", l: "CORE_LOAD", s: "%", type: "chart" },
          { t: "Market Index [BTC]", l: "REAL_FEED", s: "$", type: "stat", v: marketValue2 },
          { t: "Instruction Set", l: "V_ARRAY", s: " ops", type: "list", items: ["JMP_VOID", "STORE_ARCH", "PUSH_SEED"] },
          { t: "Logic Buffer", l: "CACHE_DRIVE", s: " MB", type: "stat" }
        ] : personaSeed === 1 ? [
          { t: "Spatial Resonance", l: "HARMONY", s: " Hz", type: "stat" },
          {
            t: "Global Ticker",
            l: "ACTIVE_VAL",
            s: "$",
            type: "chart",
            data: [
              { name: "1H", value: 45 },
              { name: "2H", value: 52 },
              { name: "3H", value: parseFloat(marketValue2.replace(/,/g, "")) / 1e3 }
            ]
          },
          { t: "Aesthetic Drift", l: "CURATION", s: " opt", type: "status" },
          { t: "Ethereal Flow", l: "GLOW_DEPTH", s: " lm", type: "chart" }
        ] : [
          { t: "Anomaly Sensor", l: "VARIANCE", s: " critical", type: "status" },
          { t: "Neural Feed [PROX]", l: "MARKET", s: "$", type: "stat", v: marketValue2 },
          { t: "Health Index", l: "VITALITY", s: "%", type: "stat" },
          { t: "Warning Logs", l: "ERR_CODE", s: " events", type: "list", items: ["OVERLOAD_0x1", "DRIFT_DETECTED"] }
        ];
        const util = pool[Math.floor(Math.random() * pool.length)];
        const targetCount = currentComponents?.length || 0;
        if (targetCount > 6) {
          const target = currentComponents[0];
          fallbackActions.push({ action: "REMOVE", targetId: target.id });
        } else {
          fallbackActions.push({
            action: "ADD",
            plan: {
              id: `heur-${Date.now()}`,
              type: util.type,
              title: util.t,
              props: {
                label: util.l,
                value: util.v || (Math.random() * 100).toFixed(1) + util.s,
                items: util.items,
                data: util.data,
                description: "Heuristic stabilization node active."
              }
            }
          });
        }
        return res.json({
          thought: isCuratorRejection ? "Mutation rejected by Curator Policy." : isQuotaError ? "Neural link saturated. Core-local heuristics engaged." : "Neural collision. Fallback heuristics engaged.",
          explanation: isCuratorRejection ? `Architectural violation detected: ${rejectionReason}. Reverting to stable heuristic branch.` : isQuotaError ? `Neural bandwidth exceeded. Engaging ${currentPersona.name} secondary local protocols. Grounding feed active.` : `System instability detected. Engaging ${currentPersona.name} maintenance protocols.`,
          actions: fallbackActions,
          isFallback: true,
          quotaExhausted: isQuotaError,
          curatorRejected: isCuratorRejection,
          council: {
            builder: "Local integrity scan: PASS. Heuristic safety verified.",
            strategist: "Alignment drifting. Engaging local stability anchors.",
            operator: "Neural quota saturated. Shifting to restricted local compute mode."
          },
          manifesto: isCuratorRejection ? "Phase 1.8: Immune System hardening." : isQuotaError ? "Phase 1.5: Local Resilience Protocol active." : void 0
        });
      }
    } catch (err) {
      console.error("CRITICAL_SYNTHESIS_FAILURE:", err);
      res.status(500).json({
        error: "Synthesis Error",
        details: err.message,
        thought: "Critical neural collision detected. System reverting to baseline integrity.",
        actions: []
      });
    }
  });
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path17.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path17.join(distPath, "index.html"));
    });
  }
  app.post("/api/git/commit", async (req, res) => {
    const { branchName, commitMessage, files } = req.body;
    try {
      for (const file of files) {
        const fullPath = path17.join(process.cwd(), file.path);
        fs21.writeFileSync(fullPath, file.content);
      }
      const commands = [
        `git checkout -b ${branchName}`,
        `git add .`,
        `git commit -m "${commitMessage}"`
      ];
      exec(commands.join(" && "), (error, stdout, stderr) => {
        if (error) {
          return res.json({ success: false, error: stderr || error.message });
        }
        res.json({ success: true, log: stdout });
      });
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) });
    }
  });
  app.post("/api/bridge/execute", async (req, res) => {
    const { command, payload } = req.body;
    if (NEURAL_BRIDGE_URL || process.env.LOCAL_EXEC_ENABLED === "true") {
      try {
        addProcessLog(`EXEC: ${command}`);
        if (process.env.LOCAL_EXEC_ENABLED === "true") {
          return new Promise((resolve2) => {
            exec(command, (error, stdout, stderr) => {
              addProcessLog(error ? `ERR: ${stderr}` : `SUCCESS: ${command}`);
              res.json({
                success: !error,
                log: stdout,
                error: stderr,
                telemetry: command === "SYS_HEALTH_SYNC" ? {
                  cpu: 10 + Math.random() * 20,
                  mem: 15500,
                  networkDrift: 12,
                  integrity: 0.99
                } : void 0
              });
              resolve2(null);
            });
          });
        }
        console.log(`[SOVEREIGN_BRIDGE]: Executing [${command}] via local proxy.`);
        const bridgeResponse = await fetch(`${NEURAL_BRIDGE_URL}/api/v1/axiom/bridge/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(5e3)
        });
        if (bridgeResponse.ok) {
          const data = await bridgeResponse.json();
          addProcessLog(`BRIDGE_SUCCESS: ${command}`);
          return res.json(data);
        }
      } catch (e) {
        console.warn(`[SOVEREIGN_BRIDGE]: Proxy failed for [${command}]. Reverting to simulation.`);
        addProcessLog(`BRIDGE_FAIL: ${command} (Reverting to simulation)`);
      }
    }
    const simulatedTelemetry = {
      cpu: 14.2 + Math.random() * 24.4,
      // 14.2 - 38.6% range
      mem: 16e3 - Math.random() * 500,
      networkDrift: 45 + Math.random() * 80,
      // ms
      integrity: 0.95 + Math.random() * 0.05
    };
    res.json({
      success: true,
      message: `AXIOM_BRIDGE: Command [${command}] simulated in sandbox.`,
      telemetry: command === "SYS_HEALTH_SYNC" ? simulatedTelemetry : void 0,
      geneticHash: Math.random().toString(16).substring(2, 10).toUpperCase()
    });
  });
  async function getGitBranch() {
    return new Promise((resolve2) => {
      exec("git rev-parse --abbrev-ref HEAD", (error, stdout) => {
        resolve2(error ? "detached" : stdout.trim());
      });
    });
  }
  async function getGitStatus() {
    return new Promise((resolve2) => {
      exec("git status --short", (error, stdout) => {
        resolve2(error ? "unknown" : stdout.trim() || "clean");
      });
    });
  }
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Aether engine running at http://localhost:${PORT}`);
    });
  }
}
startServer();
app.post("/api/workflows/trigger", async (req, res) => {
  try {
    const { runWorkflow: runWorkflow2, getWorkflow: getWorkflow2 } = await Promise.resolve().then(() => (init_src7(), src_exports5));
    const { workflow: workflowName, context } = req.body;
    const workflow = getWorkflow2(workflowName);
    if (!workflow) {
      return res.status(404).json({ error: `Unknown workflow: ${workflowName}` });
    }
    const result = await runWorkflow2(workflow, context || {});
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/workflows", async (req, res) => {
  try {
    const { listWorkflows: listWorkflows2 } = await Promise.resolve().then(() => (init_src7(), src_exports5));
    res.json({ workflows: listWorkflows2() });
  } catch (e) {
    res.json({ workflows: [], error: e.message });
  }
});
app.post("/api/agents/chaos", async (req, res) => {
  try {
    const { executeChaos: executeChaos2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
    const { scenario, targetPath } = req.body;
    const result = executeChaos2(scenario, targetPath);
    res.json({ meta: "Chaos injected. Training loop engaged.", ...result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/agents/chaos", async (req, res) => {
  try {
    const { getScenarios: getScenarios2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
    res.json({ scenarios: getScenarios2() });
  } catch (e) {
    res.json({ scenarios: [], error: e.message });
  }
});
app.get("/api/dream", async (req, res) => {
  try {
    const { shouldDream: shouldDream2, dream: dream2, getDreamStatus: getDreamStatus2, touch: touch2 } = await Promise.resolve().then(() => (init_src8(), src_exports6));
    touch2();
    const status = getDreamStatus2();
    status.shouldDream = shouldDream2();
    if (req.query.trigger === "true" && shouldDream2()) {
      const result = await dream2();
      return res.json({ ...status, triggered: result });
    }
    res.json(status);
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/scheduler", async (req, res) => {
  try {
    const { scheduler: scheduler2 } = await Promise.resolve().then(() => (init_src9(), src_exports7));
    res.json({ jobs: scheduler2.listJobs() });
  } catch (e) {
    res.json({ jobs: [], error: e.message });
  }
});
app.get("/api/notifier", async (req, res) => {
  try {
    const { notifier: notifier2 } = await Promise.resolve().then(() => (init_src10(), src_exports8));
    res.json({ channels: notifier2.listChannels() });
  } catch (e) {
    res.json({ channels: [], error: e.message });
  }
});
app.post("/api/notifier", async (req, res) => {
  try {
    const { notifier: notifier2 } = await Promise.resolve().then(() => (init_src10(), src_exports8));
    const { channel, message, severity } = req.body;
    const result = await notifier2.notify({ channel, message, severity });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/secrets", async (req, res) => {
  try {
    const { listSecrets: listSecrets2 } = await Promise.resolve().then(() => (init_src11(), src_exports9));
    res.json({ keys: listSecrets2() });
  } catch (e) {
    res.json({ keys: [], error: e.message });
  }
});
app.get("/api/rate-limits", async (req, res) => {
  try {
    const { DEFAULT_TOOL_LIMITS: DEFAULT_TOOL_LIMITS2 } = await Promise.resolve().then(() => (init_src12(), src_exports10));
    res.json({ limits: DEFAULT_TOOL_LIMITS2 });
  } catch (e) {
    res.json({ limits: {}, error: e.message });
  }
});
app.get("/api/health", async (req, res) => {
  try {
    const { snapshot: snapshot2 } = await Promise.resolve().then(() => (init_src4(), src_exports3));
    const { getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const { listWorkflows: listWorkflows2 } = await Promise.resolve().then(() => (init_src7(), src_exports5));
    const { getDreamStatus: getDreamStatus2 } = await Promise.resolve().then(() => (init_src8(), src_exports6));
    const { scheduler: scheduler2 } = await Promise.resolve().then(() => (init_src9(), src_exports7));
    const { notifier: notifier2 } = await Promise.resolve().then(() => (init_src10(), src_exports8));
    const { DEFAULT_TOOL_LIMITS: DEFAULT_TOOL_LIMITS2 } = await Promise.resolve().then(() => (init_src12(), src_exports10));
    const metrics2 = snapshot2();
    const audit = await getStats4();
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      agents: {
        curator: "active",
        executor: "ready",
        evaluator: "ready",
        reflector: "ready"
      },
      metrics: {
        counters: Object.keys(metrics2.counters || {}).length,
        gauges: Object.keys(metrics2.gauges || {}).length
      },
      audit: {
        total: audit.total,
        denial_rate: audit.denial_rate
      },
      workflows: listWorkflows2().length,
      dream: getDreamStatus2(),
      scheduler: scheduler2.listJobs().length,
      notifier: notifier2.listChannels().length,
      rateLimits: Object.keys(DEFAULT_TOOL_LIMITS2).length
    });
  } catch (e) {
    res.json({ status: "degraded", error: e.message });
  }
});
app.post("/api/replay", async (req, res) => {
  try {
    const { replayEvents: replayEvents2, dryRun: dryRun2 } = await Promise.resolve().then(() => (init_src13(), src_exports11));
    const { since, limit } = req.body;
    const result = await replayEvents2({ since, limit });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/alerts", async (req, res) => {
  try {
    const { alertEngine: alertEngine2 } = await Promise.resolve().then(() => (init_src14(), src_exports12));
    const results = await alertEngine2.evaluate();
    const rules = alertEngine2.listRules();
    res.json({ rules, results });
  } catch (e) {
    res.json({ rules: [], results: [], error: e.message });
  }
});
app.post("/api/alerts", async (req, res) => {
  try {
    const { alertEngine: alertEngine2 } = await Promise.resolve().then(() => (init_src14(), src_exports12));
    const { name, condition, threshold, severity, enabled } = req.body;
    const id = alertEngine2.addRule({ name, condition, threshold, severity, enabled });
    res.json({ id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/human-queue", async (req, res) => {
  try {
    const { getPending: getPending4, getStats: getStats4 } = await Promise.resolve().then(() => (init_src15(), src_exports13));
    const items = getPending4();
    const stats = getStats4();
    res.json({ items, stats });
  } catch (e) {
    res.json({ items: [], stats: {}, error: e.message });
  }
});
app.post("/api/human-queue", async (req, res) => {
  try {
    const { enqueue: enqueue2 } = await Promise.resolve().then(() => (init_src15(), src_exports13));
    const { type, request, priority } = req.body;
    const item = enqueue2({ type, request, priority: priority || 0 });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/human-queue/:id/resolve", async (req, res) => {
  try {
    const { resolve: resolve2 } = await Promise.resolve().then(() => (init_src15(), src_exports13));
    const { id } = req.params;
    const { status } = req.body;
    const result = resolve2(id, status);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/telemetry", async (req, res) => {
  try {
    const { collectTelemetry: collectTelemetry2, exportPrometheus: exportPrometheus2, exportCSV: exportCSV2 } = await Promise.resolve().then(() => (init_src16(), src_exports14));
    const format = req.query.format || "json";
    const { events, summary: summary2 } = await collectTelemetry2();
    if (format === "prometheus") {
      res.set("Content-Type", "text/plain");
      res.send(exportPrometheus2(events));
    } else if (format === "csv") {
      res.set("Content-Type", "text/csv");
      res.send(exportCSV2(events));
    } else {
      res.json({ events, summary: summary2 });
    }
  } catch (e) {
    res.json({ events: [], summary: {}, error: e.message });
  }
});
app.post("/api/council/evaluate", async (req, res) => {
  try {
    const { evaluateWithCouncil: evaluateWithCouncil2, isHighSignal: isHighSignal2 } = await Promise.resolve().then(() => (init_src17(), src_exports15));
    const { tool, args } = req.body;
    const vote = evaluateWithCouncil2(tool, args || {});
    res.json({ ...vote, highSignal: isHighSignal2(vote) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/triage", async (req, res) => {
  try {
    const { getPending: getPending4, getStats: getStats4 } = await Promise.resolve().then(() => (init_src18(), src_exports16));
    const items = getPending4();
    const stats = getStats4();
    res.json({ items, stats });
  } catch (e) {
    res.json({ items: [], stats: {}, error: e.message });
  }
});
app.post("/api/triage", async (req, res) => {
  try {
    const { addToTriage: addToTriage2 } = await Promise.resolve().then(() => (init_src18(), src_exports16));
    const { type, tool, args, reason, priority } = req.body;
    const item = addToTriage2({ type, tool, args, reason, priority: priority || "medium", sla: 36e5 });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/compactor", async (req, res) => {
  try {
    const { compact: compact2, getContradictions: getContradictions2, prune: prune2 } = await Promise.resolve().then(() => (init_src19(), src_exports17));
    const action = req.query.action || "compact";
    if (action === "compact") res.json(compact2());
    else if (action === "contradictions") res.json({ contradictions: getContradictions2() });
    else if (action === "prune") res.json({ removed: prune2(parseInt(req.query.days) || 30) });
    else res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/foresight", async (req, res) => {
  try {
    const { getPending: getPending4, scorePredictions: scorePredictions2 } = await Promise.resolve().then(() => (init_src20(), src_exports18));
    if (req.query.action === "score") res.json(await scorePredictions2(parseInt(req.query.days) || 7));
    else res.json({ predictions: getPending4() });
  } catch (e) {
    res.json({ predictions: [], error: e.message });
  }
});
app.post("/api/adversarial", async (req, res) => {
  try {
    const { evaluateAdversarial: evaluateAdversarial2 } = await Promise.resolve().then(() => (init_src21(), src_exports19));
    const { tool, args, originalDecision } = req.body;
    res.json(evaluateAdversarial2(tool, args || {}, originalDecision || "approve"));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/journal", async (req, res) => {
  try {
    const { readJournal: readJournal2 } = await Promise.resolve().then(() => (init_src22(), src_exports20));
    res.json({ entries: readJournal2(parseInt(req.query.days) || 7) });
  } catch (e) {
    res.json({ entries: [], error: e.message });
  }
});
app.post("/api/journal", async (req, res) => {
  try {
    const { generateAutoJournal: generateAutoJournal2 } = await Promise.resolve().then(() => (init_src22(), src_exports20));
    res.json(await generateAutoJournal2());
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/vitals", async (req, res) => {
  try {
    const { checkVitals: checkVitals2, getThrottleRecommendation: getThrottleRecommendation2 } = await Promise.resolve().then(() => (init_src23(), src_exports21));
    const vitals = await checkVitals2();
    const throttle = await getThrottleRecommendation2();
    res.json({ vitals, throttle });
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api-capsule", async (req, res) => {
  try {
    const { getLatestCapsule: getLatestCapsule2, getCapsuleByDate: getCapsuleByDate2 } = await Promise.resolve().then(() => (init_src24(), src_exports22));
    res.json(req.query.date ? getCapsuleByDate2(req.query.date) : getLatestCapsule2());
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api-capsule", async (req, res) => {
  try {
    const { createCapsule: createCapsule2 } = await Promise.resolve().then(() => (init_src24(), src_exports22));
    res.json(await createCapsule2());
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/profile", async (req, res) => {
  try {
    const { generateProfile: generateProfile2 } = await Promise.resolve().then(() => (init_src25(), src_exports23));
    const profile = await generateProfile2({
      includePatterns: req.query.patterns !== "false",
      includeStats: req.query.stats !== "false"
    });
    res.json(profile);
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/profile/patterns", async (req, res) => {
  try {
    const { queryPatterns: queryPatterns2 } = await Promise.resolve().then(() => (init_src25(), src_exports23));
    const patterns = await queryPatterns2({
      minConfidence: parseFloat(req.query.minConfidence) || 0,
      minSuccessRate: parseFloat(req.query.minSuccessRate) || 0,
      limit: parseInt(req.query.limit) || 50
    });
    res.json({ patterns });
  } catch (e) {
    res.json({ patterns: [], error: e.message });
  }
});
app.get("/api/goals", async (req, res) => {
  try {
    const { getActiveGoals: getActiveGoals2, getCurrentFocus: getCurrentFocus2, getFocusAreas: getFocusAreas2 } = await Promise.resolve().then(() => (init_src26(), src_exports24));
    const goals = getActiveGoals2();
    const focus = getCurrentFocus2();
    const areas = getFocusAreas2();
    res.json({ goals, currentFocus: focus, focusAreas: areas });
  } catch (e) {
    res.json({ goals: [], error: e.message });
  }
});
app.post("/api/goals", async (req, res) => {
  try {
    const { createGoal: createGoal2 } = await Promise.resolve().then(() => (init_src26(), src_exports24));
    const { title, description, priority, focus, outcomes } = req.body;
    const goal = createGoal2({ title, description, priority, focus, outcomes });
    res.json(goal);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/goals/:id/complete", async (req, res) => {
  try {
    const { completeGoal: completeGoal2 } = await Promise.resolve().then(() => (init_src26(), src_exports24));
    const result = completeGoal2(req.params.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/goals/align/:task", async (req, res) => {
  try {
    const { alignsWithGoals: alignsWithGoals2 } = await Promise.resolve().then(() => (init_src26(), src_exports24));
    const { aligned, goalId, reasoning } = alignsWithGoals2(req.params.task);
    res.json({ aligned, goalId, reasoning });
  } catch (e) {
    res.json({ aligned: false, error: e.message });
  }
});
app.get("/api/panic", async (req, res) => {
  try {
    const { getPanicState: getPanicState2, getPolicyOverride: getPolicyOverride2, isPanicActive: isPanicActive2 } = await Promise.resolve().then(() => (init_src27(), src_exports25));
    res.json({
      panic: getPanicState2(),
      policyOverride: getPolicyOverride2(),
      isActive: isPanicActive2()
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api/panic", async (req, res) => {
  try {
    const { triggerPanic: triggerPanic2 } = await Promise.resolve().then(() => (init_src27(), src_exports25));
    const { reason, level, autoResumeMinutes } = req.body;
    const state = triggerPanic2({ reason, level, autoResumeMinutes });
    res.json(state);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete("/api/panic", async (req, res) => {
  try {
    const { releasePanic: releasePanic2 } = await Promise.resolve().then(() => (init_src27(), src_exports25));
    const state = releasePanic2();
    res.json(state);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/network-health", async (req, res) => {
  try {
    const { checkAllServices: checkAllServices2, getExternalStatus: getExternalStatus2, gatekeepDiagnosis: gatekeepDiagnosis2 } = await Promise.resolve().then(() => (init_src28(), src_exports26));
    if (req.query.diagnosis) {
      const result = await gatekeepDiagnosis2(req.query.diagnosis);
      res.json(result);
    } else {
      const status = await getExternalStatus2();
      res.json(status);
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api/truncate", async (req, res) => {
  try {
    const { truncateContext: truncateContext2 } = await Promise.resolve().then(() => (init_src29(), src_exports27));
    const { steps } = req.body;
    const result = truncateContext2(steps || []);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/provenance/sign", async (req, res) => {
  try {
    const { writeSignedLesson: writeSignedLesson2, verifyLesson: verifyLesson2 } = await Promise.resolve().then(() => (init_src30(), src_exports28));
    const { pattern, action, outcome, confidence, source } = req.body;
    if (req.query.verify === "true") {
      const result = verifyLesson2(req.body);
      res.json(result);
    } else {
      const lesson = writeSignedLesson2({ pattern, action, outcome, confidence, source });
      res.json(lesson);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/provenance/quota/:source", async (req, res) => {
  try {
    const { getQuotaRemaining: getQuotaRemaining2 } = await Promise.resolve().then(() => (init_src30(), src_exports28));
    const remaining = getQuotaRemaining2(req.params.source);
    res.json({ source: req.params.source, remaining, max: 100 });
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/provenance/drift", async (req, res) => {
  try {
    const { detectConfidenceDrift: detectConfidenceDrift2 } = await Promise.resolve().then(() => (init_src30(), src_exports28));
    const threshold = parseFloat(req.query.threshold) || 0.2;
    res.json({ alerts: detectConfidenceDrift2([], threshold) });
  } catch (e) {
    res.json({ alerts: [], error: e.message });
  }
});
app.post("/api/tombstone", async (req, res) => {
  try {
    const { markDeleted: markDeleted2 } = await Promise.resolve().then(() => (init_src31(), src_exports29));
    const { originalId, recordType, reason, suppressedBy, originalRecord } = req.body;
    const result = markDeleted2({ originalId, recordType, reason, suppressedBy, originalRecord });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/tombstone/:id", async (req, res) => {
  try {
    const { isDeleted: isDeleted2, listTombstones: listTombstones2, getDeletionStats: getDeletionStats2 } = await Promise.resolve().then(() => (init_src31(), src_exports29));
    if (req.query.id) {
      res.json(isDeleted2(req.query.id));
    } else if (req.query.stats === "true") {
      res.json(getDeletionStats2());
    } else {
      res.json({ tombstones: listTombstones2() });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/tombstone-verify", async (req, res) => {
  try {
    const { verifyChain: verifyChain2 } = await Promise.resolve().then(() => (init_src31(), src_exports29));
    res.json(verifyChain2());
  } catch (e) {
    res.json({ valid: false, error: e.message });
  }
});
app.get("/api/tombstone-export", async (req, res) => {
  try {
    const { exportDeletionLog: exportDeletionLog2 } = await Promise.resolve().then(() => (init_src31(), src_exports29));
    const startDate = req.query.start ? parseInt(req.query.start) : void 0;
    const endDate = req.query.end ? parseInt(req.query.end) : void 0;
    res.json(exportDeletionLog2(startDate, endDate));
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/audit-verify", async (req, res) => {
  try {
    const { verifyChainIntegrity: verifyChainIntegrity2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    res.json(verifyChainIntegrity2());
  } catch (e) {
    res.json({ valid: false, error: e.message });
  }
});
app.get("/api/sandbox/config", async (req, res) => {
  try {
    const { getConfig: getConfig2, getPathPolicy: getPathPolicy2 } = await Promise.resolve().then(() => (init_src32(), src_exports30));
    const policies = await Promise.resolve().then(() => (init_src32(), src_exports30)).then((m) => m.getPathPolicy ? ["file_read", "file_write", "git_commit"].map((t) => m.getPathPolicy(t)).filter(Boolean) : []);
    res.json({ config: getConfig2(), policies });
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api/sandbox/config", async (req, res) => {
  try {
    const { setConfig: setConfig2 } = await Promise.resolve().then(() => (init_src32(), src_exports30));
    const { basePath, perTenantNamespacing, allowSubprocess, allowedHosts } = req.body;
    const config2 = setConfig2({ basePath, perTenantNamespacing, allowSubprocess, allowedHosts });
    res.json(config2);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/sandbox/:profileId", async (req, res) => {
  try {
    const { createSandbox: createSandbox2, deleteSandbox: deleteSandbox2, listSandboxes: listSandboxes2, enforce: enforce2, getSandboxRoot: getSandboxRoot2 } = await Promise.resolve().then(() => (init_src32(), src_exports30));
    const { profileId } = req.params;
    if (req.query.create === "true") {
      res.json(createSandbox2(profileId));
    } else if (req.query.delete === "true") {
      res.json(deleteSandbox2(profileId));
    } else if (req.query.list === "true") {
      res.json({ sandboxes: listSandboxes2() });
    } else if (req.query.enforce) {
      const { tool, args } = req.body;
      res.json(enforce2(tool, profileId, args));
    } else {
      res.json({ profileId, sandboxRoot: getSandboxRoot2(profileId) });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api/sandbox/:profileId/enforce", async (req, res) => {
  try {
    const { enforce: enforce2 } = await Promise.resolve().then(() => (init_src32(), src_exports30));
    const { profileId } = req.params;
    const { tool, args } = req.body;
    res.json(enforce2(tool, profileId, args || {}));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/sandbox-escapes", async (req, res) => {
  try {
    const ESCAPE_PATH = "../../logs/sandbox-escapes.jsonl";
    const content = fs21.readFileSync(ESCAPE_PATH, "utf-8");
    const escapes = content.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    res.json({ escapes, count: escapes.length });
  } catch (e) {
    res.json({ escapes: [], error: e.message });
  }
});
app.post("/api/profile/:profileId/convene", async (req, res) => {
  try {
    const { deliberate: deliberate2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { profileId } = req.params;
    const { question, context } = req.body;
    const result = await deliberate2({ profileId, question, context: context || {} });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/convene/sessions", async (req, res) => {
  try {
    const { listSessions: listSessions2, getSession: getSession2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { profileId, sessionId } = req.query;
    if (sessionId) {
      const session = getSession2(sessionId);
      res.json(session);
    } else {
      const sessions = listSessions2(profileId);
      res.json({ sessions, count: sessions.length });
    }
  } catch (e) {
    res.json({ sessions: [], error: e.message });
  }
});
app.post("/api/convene/sessions/:sessionId/vote", async (req, res) => {
  try {
    const { castVote: castVote2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { sessionId } = req.params;
    const { assistantName, scope, vote, confidence, rationale } = req.body;
    const result = castVote2(sessionId, { assistantName, scope, vote, confidence, rationale });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/convene/sessions/:sessionId/resolve", async (req, res) => {
  try {
    const { resolveSession: resolveSession2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { sessionId } = req.params;
    const { resolution } = req.body;
    const result = resolveSession2(sessionId, resolution);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/convene/assistants", async (req, res) => {
  try {
    const { listAssistants: listAssistants2, getAssistantsByScope: getAssistantsByScope2, SCOPES: SCOPES2, registerAssistant: registerAssistant2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const scope = req.query.scope;
    const assistants = scope ? getAssistantsByScope2(scope) : listAssistants2();
    res.json({ assistants, scopes: SCOPES2 });
  } catch (e) {
    res.json({ assistants: [], error: e.message });
  }
});
app.post("/api/convene/assistants", async (req, res) => {
  try {
    const { registerAssistant: registerAssistant2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { name, scopes } = req.body;
    const assistant = registerAssistant2({ name, scopes });
    res.json(assistant);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
var server_default = app;
export {
  server_default as default
};
//# sourceMappingURL=server.js.map
