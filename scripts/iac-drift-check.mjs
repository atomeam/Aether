import fs from 'fs';
import path from 'path';

const root = process.cwd();
const changedFiles = process.env.CHANGED_PATHS ? process.env.CHANGED_PATHS.split('\n').filter(Boolean) : [];

console.log('Starting Contract-Driven IaC Drift Check...');

// 1. Contract Authority Verification
const contractPath = path.join(root, 'infra', 'contract.json');
if (!fs.existsSync(contractPath)) {
  console.error('❌ Drift Check Failed: Contract file infra/contract.json is missing.');
  process.exit(1);
}
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
console.log('✅ Loaded Aether infrastructure contract.');

// 2. Enforce Parity Across Distributed Workers
const registeredWorkers = new Set(contract.workers.map(w => w.name));
const externalWorkers = new Set(contract.external_workers?.map(w => w.name) || []);
const allKnownWorkers = new Set([...registeredWorkers, ...externalWorkers]);

contract.workers.forEach(worker => {
  const tomlPath = path.join(root, worker.path, 'wrangler.toml');
  
  if (!fs.existsSync(tomlPath)) {
    console.error(`❌ Drift Check Failed: Expected wrangler.toml at ${tomlPath} for worker '${worker.name}'.`);
    process.exit(1);
  }
  
  const toml = fs.readFileSync(tomlPath, 'utf-8');
  
  // Cross-App Service Binding Validation
  if (worker.service_bindings) {
    worker.service_bindings.forEach(target => {
      if (!allKnownWorkers.has(target)) {
        console.error(`❌ Drift Check Failed: '${worker.name}' binds to '${target}', but '${target}' is missing from the contract.`);
        process.exit(1);
      }
      if (!toml.includes(target)) {
         console.error(`❌ Drift Check Failed: Contract declares '${worker.name}' binds to '${target}', but it is missing from its wrangler.toml.`);
         process.exit(1);
      }
    });
  }

  // D1 Migrations Validation (only if has_d1 is explicitly true)
  if (worker.has_d1) {
    const migrationsDir = path.join(root, worker.path, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
       console.error(`❌ Drift Check Failed: D1 declared for '${worker.name}' but ./migrations folder is missing.`);
       process.exit(1);
    }
    const sqlFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    if (sqlFiles.length === 0) {
       console.error(`❌ Drift Check Failed: ./migrations folder in '${worker.name}' contains no .sql files.`);
       process.exit(1);
    }
  }
});

// 3. The Governance Hook (Default-Deny Validation)
const infraChanged = changedFiles.some(f => f.includes('wrangler.toml') || f.includes('infra/'));
const govChanged = changedFiles.some(f => f.startsWith('docs/governance/'));

// Only enforce governance hook if docs/governance/ directory exists
const govDir = path.join(root, 'docs', 'governance');
if (fs.existsSync(govDir)) {
  if (infraChanged && !govChanged) {
    console.error('\n❌ Drift Check Failed: Infrastructure was modified, but no corresponding update was found in docs/governance/.');
    console.error('   Access Denied: The Nucleus is the exclusive write-channel for project-level governance pages. Documentation must be synchronized with IaC changes.');
    process.exit(1);
  }

  if (infraChanged && govChanged) {
    console.log('✅ Governance hook satisfied: Directives updated alongside IaC.');
  }
}

console.log('\n🚀 IaC Drift Check Passed: All distributed workers and the contract are fully synchronized.');
