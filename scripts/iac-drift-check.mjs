import fs from 'fs';
import path from 'path';

const root = process.cwd();
const changedFiles = process.env.CHANGED_PATHS ? process.env.CHANGED_PATHS.split('\n').filter(Boolean) : [];

console.log('Starting Strict Contract-Driven IaC Drift Check...');

// 1. Contract Authority Verification
const contractPath = path.join(root, 'infra', 'contract.json');
if (!fs.existsSync(contractPath)) {
  console.error('❌ Drift Check Failed: Contract file infra/contract.json is missing.');
  process.exit(1);
}
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
console.log('✅ Loaded Aether infrastructure contract.');

const registeredWorkers = new Set(contract.workers.map(w => w.name));

// 2. Enforce Parity Across Distributed Workers
contract.workers.forEach(worker => {
  // Skip validation for external workers
  if (worker.note) {
    console.log(`ℹ️  Skipping validation for external worker '${worker.name}'`);
    return;
  }

  const tomlPath = path.join(root, worker.wranglerToml);
  
  if (!fs.existsSync(tomlPath)) {
    console.error(`❌ Drift Check Failed: Expected wrangler.toml at ${tomlPath} for worker '${worker.name}'.`);
    process.exit(1);
  }
  
  const toml = fs.readFileSync(tomlPath, 'utf-8');
  
  // Cross-App Service Binding Validation (Regex Token Checks)
  if (worker.serviceBindings) {
    worker.serviceBindings.forEach(({ binding, worker: targetWorker }) => {
      if (!registeredWorkers.has(targetWorker)) {
        console.error(`❌ Drift Check Failed: '${worker.name}' binds to '${targetWorker}', but '${targetWorker}' is missing from the contract.`);
        process.exit(1);
      }
      
      // Ensures the specific binding name and target service exist as distinct tokens
      const bindingRegex = new RegExp(`(?:binding|name)\\s*=\\s*["']${binding}["']`);
      const serviceRegex = new RegExp(`service\\s*=\\s*["']${targetWorker}["']`);
      
      if (!bindingRegex.test(toml) || !serviceRegex.test(toml)) {
         console.error(`❌ Drift Check Failed: Contract declares '${worker.name}' binds to '${binding}' -> '${targetWorker}', but precise binding definitions are missing from its wrangler.toml.`);
         process.exit(1);
      }
    });
  }

  // D1 Migrations Validation (Sequencing Enforcement)
  if (worker.d1?.migrationsPath) {
    const migrationsDir = path.join(root, worker.d1.migrationsPath);
    if (!fs.existsSync(migrationsDir)) {
       console.error(`❌ Drift Check Failed: D1 declared for '${worker.name}' but folder ${worker.d1.migrationsPath} is missing.`);
       process.exit(1);
    }
    
    const sqlFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    if (sqlFiles.length === 0) {
       console.error(`❌ Drift Check Failed: ${worker.d1.migrationsPath} contains no .sql files.`);
       process.exit(1);
    }
    
    // Validate sortable prefix (e.g., 0001_name.sql or 202605_name.sql)
    sqlFiles.forEach(file => {
      if (!/^\d+[_|-]/.test(file)) {
        console.error(`❌ Drift Check Failed: Migration file '${file}' in ${worker.d1.migrationsPath} does not follow deterministic prefix naming (e.g., 0001_init.sql).`);
        process.exit(1);
      }
    });
  }
});

// 3. The Governance Hook (Default-Deny Validation)
const infraChanged = changedFiles.some(f => f.includes('wrangler.toml') || f.includes('infra/'));
const govChanged = changedFiles.some(f => f.startsWith('docs/governance/'));

if (infraChanged && !govChanged) {
  console.error('\n❌ Access Denied: Infrastructure was modified, but no corresponding update was found in docs/governance/.');
  console.error('   The Nucleus is the exclusive write-channel for project-level governance pages. Documentation must be synchronized with IaC changes.');
  process.exit(1);
}

if (infraChanged && govChanged) {
  console.log('✅ Governance hook satisfied: Directives updated alongside IaC.');
}

console.log('\n🚀 IaC Drift Check Passed: Aether infrastructure and contract are fully synchronized.');
