#!/usr/bin/env node

/**
 * Aether IaC Drift Check
 * 
 * Validates that wrangler.toml files across the monorepo match the
 * central infrastructure contract in infra/contract.json.
 * 
 * This is a zero-dependency, offline validation that runs in CI
 * to ensure infrastructure consistency before deployment.
 */

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const contractPath = path.join(root, 'infra', 'contract.json');

console.log('🔍 Starting Aether IaC Drift Check...\n');

// Load contract
if (!fs.existsSync(contractPath)) {
  console.error('❌ Drift Check Failed: infra/contract.json is missing.');
  process.exit(1);
}

let contract;
try {
  contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
  console.log('✅ Loaded infrastructure contract');
} catch (error) {
  console.error('❌ Drift Check Failed: infra/contract.json is not valid JSON.');
  process.exit(1);
}

// Validate contract structure
if (!contract.workers || !Array.isArray(contract.workers)) {
  console.error('❌ Drift Check Failed: contract must have a "workers" array.');
  process.exit(1);
}

console.log(`✅ Contract defines ${contract.workers.length} workers\n`);

// Track all workers for service binding validation
const allWorkerNames = new Set(contract.workers.map(w => w.name));
let errors = [];

// Validate each worker in contract
for (const worker of contract.workers) {
  console.log(`🔧 Validating worker: ${worker.name}`);
  
  const wranglerPath = path.join(root, worker.wranglerToml);
  
  // 1. Check wrangler.toml exists
  if (!fs.existsSync(wranglerPath)) {
    errors.push(`Worker "${worker.name}": wrangler.toml not found at ${worker.wranglerToml}`);
    continue;
  }
  
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
  
  // 2. Verify worker name matches
  const nameMatch = wranglerContent.match(/^name\s*=\s*"([^"]+)"/m);
  if (!nameMatch) {
    errors.push(`Worker "${worker.name}": wrangler.toml missing name declaration`);
  } else if (nameMatch[1] !== worker.name) {
    errors.push(`Worker "${worker.name}": wrangler.toml name is "${nameMatch[1]}" (expected "${worker.name}")`);
  }
  
  // 3. Validate D1 databases and migrations
  if (worker.bindings.d1_databases) {
    for (const db of worker.bindings.d1_databases) {
      if (!wranglerContent.includes(`binding = "${db.binding}"`)) {
        errors.push(`Worker "${worker.name}": D1 binding "${db.binding}" not found in wrangler.toml`);
      }
      
      // Check migrations if specified
      if (db.migrations_dir) {
        const migrationsPath = path.join(root, db.migrations_dir);
        if (!fs.existsSync(migrationsPath)) {
          errors.push(`Worker "${worker.name}": migrations directory not found at ${db.migrations_dir}`);
        } else {
          const files = fs.readdirSync(migrationsPath);
          const sqlFiles = files.filter(f => f.endsWith('.sql'));
          if (sqlFiles.length === 0) {
            errors.push(`Worker "${worker.name}": migrations directory exists but contains no .sql files`);
          } else {
            console.log(`  ✅ D1 ${db.binding}: ${sqlFiles.length} migration files`);
          }
        }
      }
    }
  }
  
  // 4. Validate KV namespaces
  if (worker.bindings.kv_namespaces) {
    for (const kv of worker.bindings.kv_namespaces) {
      if (!wranglerContent.includes(`binding = "${kv.binding}"`)) {
        errors.push(`Worker "${worker.name}": KV binding "${kv.binding}" not found in wrangler.toml`);
      }
    }
  }
  
  // 5. Validate R2 buckets
  if (worker.bindings.r2_buckets) {
    for (const r2 of worker.bindings.r2_buckets) {
      if (!wranglerContent.includes(`binding = "${r2.binding}"`)) {
        errors.push(`Worker "${worker.name}": R2 binding "${r2.binding}" not found in wrangler.toml`);
      }
    }
  }
  
  // 6. Validate service bindings
  if (worker.bindings.services) {
    for (const svc of worker.bindings.services) {
      if (!wranglerContent.includes(`binding = "${svc.binding}"`)) {
        errors.push(`Worker "${worker.name}": Service binding "${svc.binding}" not found in wrangler.toml`);
      }
      
      // Verify target worker exists in contract (unless marked as external)
      const dep = contract.service_dependencies?.find(d => d.worker === worker.name);
      if (!dep?.note && !allWorkerNames.has(svc.service)) {
        errors.push(`Worker "${worker.name}": Service binding "${svc.binding}" references non-existent worker "${svc.service}"`);
      }
    }
  }
  
  // 7. Validate queues
  if (worker.bindings.queues) {
    for (const queue of worker.bindings.queues) {
      if (!wranglerContent.includes(`binding = "${queue.binding}"`)) {
        errors.push(`Worker "${worker.name}": Queue binding "${queue.binding}" not found in wrangler.toml`);
      }
    }
  }
  
  console.log(`  ✅ wrangler.toml validated\n`);
}

// Validate service dependencies
if (contract.service_dependencies) {
  console.log('🔗 Validating service dependencies...');
  for (const dep of contract.service_dependencies) {
    if (!allWorkerNames.has(dep.worker)) {
      errors.push(`Service dependency: worker "${dep.worker}" does not exist in contract`);
    }
    
    // Only validate required workers if not marked as external
    if (!dep.note) {
      for (const required of dep.requires) {
        if (!allWorkerNames.has(required)) {
          errors.push(`Service dependency: worker "${dep.worker}" requires non-existent worker "${required}"`);
        }
      }
    }
  }
  console.log('  ✅ Service dependencies validated\n');
}

// Validate shared resources consistency
if (contract.shared_resources) {
  console.log('🌐 Validating shared resources consistency...');
  
  const d1Ids = new Set();
  const kvIds = new Set();
  const r2Buckets = new Set();
  
  // Collect all unique resource IDs
  if (contract.shared_resources.d1_databases) {
    contract.shared_resources.d1_databases.forEach(db => d1Ids.add(db.database_id));
  }
  if (contract.shared_resources.kv_namespaces) {
    contract.shared_resources.kv_namespaces.forEach(kv => kvIds.add(kv.id));
  }
  if (contract.shared_resources.r2_buckets) {
    contract.shared_resources.r2_buckets.forEach(r2 => r2Buckets.add(r2.bucket_name));
  }
  
  // Check for duplicate IDs (should be unique across resources)
  const allIds = [...d1Ids, ...kvIds, ...r2Buckets];
  const uniqueIds = new Set(allIds);
  
  if (allIds.length !== uniqueIds.size) {
    errors.push('Shared resources: duplicate resource IDs detected across D1/KV/R2');
  }
  
  console.log(`  ✅ ${d1Ids.size} D1 databases, ${kvIds.size} KV namespaces, ${r2Buckets.size} R2 buckets\n`);
}

// Report results
if (errors.length > 0) {
  console.error('❌ Drift Check Failed:');
  errors.forEach(error => console.error(`  - ${error}`));
  console.error('\nPlease fix the above issues before merging.');
  process.exit(1);
}

console.log('🚀 IaC Drift Check Passed: Infrastructure state is consistent.\n');
console.log('Summary:');
console.log(`  - ${contract.workers.length} workers validated`);
console.log(`  - All wrangler.toml files match contract`);
console.log(`  - Service dependencies verified`);
console.log(`  - Shared resources consistent`);
