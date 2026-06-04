#!/usr/bin/env node
/**
 * strategy-metrics-verify.mjs
 * Validates that @aether/metrics exports all functions listed in
 * infra/strategy-metrics.json. Exits 1 on any missing export.
 */
import { readFileSync } from "node:fs";

const CONFIG_PATH = "infra/strategy-metrics.json";

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
const source = readFileSync(config.package, "utf-8");

let errors = 0;

console.log(`--- Strategy metrics verify: ${config.package} ---`);

// Check required function exports
for (const name of config.required_exports) {
  const pattern = new RegExp(
    `export\\s+(function|const|let|var)\\s+${name}\\b`
  );
  if (!pattern.test(source)) {
    console.log(`FAIL: missing required export '${name}'`);
    errors++;
  } else {
    console.log(`  OK: export '${name}'`);
  }
}

// Check required type exports
for (const name of config.required_types) {
  const pattern = new RegExp(
    `export\\s+(interface|type)\\s+${name}\\b`
  );
  if (!pattern.test(source)) {
    console.log(`FAIL: missing required type export '${name}'`);
    errors++;
  } else {
    console.log(`  OK: type '${name}'`);
  }
}

console.log("");
if (errors > 0) {
  console.log(`Strategy metrics verify FAILED with ${errors} error(s)`);
  process.exit(1);
} else {
  console.log("Strategy metrics verify PASSED — all required exports present");
  process.exit(0);
}
