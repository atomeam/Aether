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
  const tomlPath = worker.wranglerToml ? path.join(root, worker.wranglerToml) : path.join(root, worker.path, 'wrangler.toml');
  
  if (!fs.existsSync(tomlPath)) {
    console.error(`❌ Drift Check Failed: Expected wrangler.toml at ${tomlPath} for worker '${worker.name}'.`);
    process.exit(1);
  }
  
  const toml = fs.readFileSync(tomlPath, 'utf-8');
  
  // Cross-App Service Binding Validation (regex-based, not substring)
  if (worker.serviceBindings) {
    // Verify [[services]] block exists
    if (!toml.includes('[[services]]')) {
      console.error(`❌ Drift Check Failed: Contract declares service bindings for '${worker.name}' but wrangler.toml has no [[services]] block.`);
      process.exit(1);
    }
    
    worker.serviceBindings.forEach(sb => {
      // Verify target worker exists
      if (!allKnownWorkers.has(sb.worker)) {
        console.error(`❌ Drift Check Failed: '${worker.name}' binding '${sb.binding}' references non-existent worker '${sb.worker}'.`);
        process.exit(1);
      }
      
      // Verify binding exists in wrangler.toml with proper pattern
      // Look for: binding = "BINDING_NAME" followed by service = "WORKER_NAME"
      const bindingPattern = new RegExp(`binding\\s*=\\s*"${sb.binding}"`, 'm');
      const servicePattern = new RegExp(`service\\s*=\\s*"${sb.worker}"`, 'm');
      
      if (!bindingPattern.test(toml)) {
        console.error(`❌ Drift Check Failed: Contract declares binding '${sb.binding}' for '${worker.name}' but not found in wrangler.toml.`);
        process.exit(1);
      }
      
      if (!servicePattern.test(toml)) {
        console.error(`❌ Drift Check Failed: Contract declares service '${sb.worker}' for binding '${sb.binding}' but not found in wrangler.toml.`);
        process.exit(1);
      }
    });
  }

  // D1 Migrations Validation (explicit path from contract)
  if (worker.d1?.migrationsPath) {
    const migrationsDir = path.join(root, worker.d1.migrationsPath);
    if (!fs.existsSync(migrationsDir)) {
       console.error(`❌ Drift Check Failed: D1 declared for '${worker.name}' but migrations folder missing at ${worker.d1.migrationsPath}.`);
       process.exit(1);
    }
    const sqlFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    if (sqlFiles.length === 0) {
       console.error(`❌ Drift Check Failed: Migrations folder in '${worker.name}' contains no .sql files.`);
       process.exit(1);
    }
    
    // Validate migration naming convention (sortable prefix)
    const invalidNames = sqlFiles.filter(f => !/^\d{4}_/.test(f));
    if (invalidNames.length > 0) {
      console.error(`❌ Drift Check Failed: Migrations in '${worker.name}' must use sortable prefix (0001_, 0002_, etc). Invalid: ${invalidNames.join(', ')}`);
      process.exit(1);
    }
    
    // Validate migrations are sorted
    const sortedFiles = [...sqlFiles].sort();
    if (JSON.stringify(sqlFiles) !== JSON.stringify(sortedFiles)) {
      console.error(`❌ Drift Check Failed: Migrations in '${worker.name}' are not sorted. Expected order: ${sortedFiles.join(', ')}`);
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
