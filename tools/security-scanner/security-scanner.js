/**
 * Automated Security Scanning Pipeline
 * Scans codebase for security vulnerabilities, secrets, and compliance issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Security Scanner
// ============================================================================

class SecurityScanner {
  constructor() {
    this.scanResults = [];
    this.severityLevels = ['critical', 'high', 'medium', 'low', 'info'];
    this.scanPath = path.resolve(__dirname, '../../');
    this.resultsPath = path.resolve(__dirname, 'security-scan-results.json');
    this.loadResults();
  }

  // Scan for leaked secrets in code
  scanForSecrets() {
    console.log('🔍 Scanning for leaked secrets...');
    
    const secretPatterns = [
      { pattern: /sk-[a-zA-Z0-9]{20,}/g, name: 'Stripe API Key', severity: 'critical' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Token', severity: 'critical' },
      { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key', severity: 'critical' },
      { pattern: /AIza[0-9A-Za-z\-_]{35}/g, name: 'Google API Key', severity: 'critical' },
      { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded Password', severity: 'high' },
      { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded API Key', severity: 'high' },
      { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded Secret', severity: 'high' }
    ];

    const findings = [];
    
    // Scan common file types
    const fileExtensions = ['.js', '.ts', '.json', '.yml', '.yaml', '.env', '.md'];
    
    for (const ext of fileExtensions) {
      try {
        const command = `cd ${this.scanPath} && Get-ChildItem -Recurse -Filter "*${ext}" -Exclude node_modules,dist,build,.git | Select-Object -First 100 | ForEach-Object { $_.FullName }`;
        const files = execSync(command, { encoding: 'utf8', shell: 'powershell' }).trim().split('\n');
        
        for (const file of files) {
          if (!file || file.includes('node_modules') || file.includes('dist') || file.includes('.git')) continue;
          
          try {
            const content = fs.readFileSync(file.trim(), 'utf8');
            
            for (const { pattern, name, severity } of secretPatterns) {
              const matches = content.match(pattern);
              if (matches) {
                findings.push({
                  type: 'secret-leak',
                  name,
                  severity,
                  file: file.trim(),
                  matches: matches.length,
                  timestamp: new Date().toISOString()
                });
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      } catch (error) {
        console.log(`  Skipped ${ext}: ${error.message}`);
      }
    }
    
    return findings;
  }

  // Scan for dependency vulnerabilities
  scanDependencies() {
    console.log('🔍 Scanning dependencies for vulnerabilities...');
    
    const findings = [];
    
    try {
      // Check if npm audit is available
      const command = 'cd ' + this.scanPath + ' && npm audit --json';
      const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
      
      try {
        const auditData = JSON.parse(output);
        
        if (auditData.vulnerabilities) {
          for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
            findings.push({
              type: 'dependency-vulnerability',
              name: packageName,
              severity: vulnData.severity,
              version: vulnData.via[0].url ? vulnData.via[0].url : 'unknown',
              recommendation: vulnData.fixAvailable ? vulnData.fixAvailable[0].version : 'No fix available',
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, check for vulnerability count in output
        if (output.includes('vulnerabilities')) {
          findings.push({
            type: 'dependency-vulnerability',
            name: 'General',
            severity: 'medium',
            version: 'Multiple packages',
            recommendation: 'Run npm audit fix',
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.log(`  Dependency scan skipped: ${error.message}`);
    }
    
    return findings;
  }

  // Scan for security misconfigurations
  scanConfigurations() {
    console.log('🔍 Scanning for security misconfigurations...');
    
    const findings = [];
    
    // Check .gitignore
    const gitignorePath = path.join(this.scanPath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      
      if (!gitignore.includes('.env')) {
        findings.push({
          type: 'config-misconfiguration',
          name: 'Missing .env in .gitignore',
          severity: 'high',
          recommendation: 'Add .env to .gitignore to prevent committing secrets',
          timestamp: new Date().toISOString()
        });
      }
      
      if (!gitignore.includes('node_modules')) {
        findings.push({
          type: 'config-misconfiguration',
          name: 'Missing node_modules in .gitignore',
          severity: 'medium',
          recommendation: 'Add node_modules to .gitignore',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      findings.push({
        type: 'config-misconfiguration',
        name: 'Missing .gitignore',
        severity: 'high',
        recommendation: 'Create .gitignore file',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check for exposed API endpoints
    const workerFiles = ['apps/bridge/src/worker.ts', 'apps/aether/src/worker.ts'];
    for (const workerFile of workerFiles) {
      const filePath = path.join(this.scanPath, workerFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('export const') && content.includes('handler')) {
          findings.push({
            type: 'security-concern',
            name: 'Potential exposed handler',
            severity: 'info',
            file: workerFile,
            recommendation: 'Review handler exposure',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return findings;
  }

  // Run full security scan
  async runFullScan() {
    console.log('🔒 Starting full security scan...\n');
    
    const startTime = Date.now();
    
    const secretFindings = this.scanForSecrets();
    const dependencyFindings = this.scanDependencies();
    const configFindings = this.scanConfigurations();
    
    const allFindings = [
      ...secretFindings,
      ...dependencyFindings,
      ...configFindings
    ];
    
    const scanDuration = Date.now() - startTime;
    
    const scanResult = {
      timestamp: new Date().toISOString(),
      duration: scanDuration,
      totalFindings: allFindings.length,
      findings: allFindings,
      summary: this.generateSummary(allFindings)
    };
    
    this.scanResults.push(scanResult);
    this.saveResults();
    
    console.log(`\n✅ Scan complete in ${scanDuration}ms`);
    console.log(`📊 Total findings: ${allFindings.length}`);
    console.log(JSON.stringify(scanResult.summary, null, 2));
    
    return scanResult;
  }

  generateSummary(findings) {
    const summary = {
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      byType: {}
    };
    
    findings.forEach(finding => {
      const severity = finding.severity || 'info';
      if (summary.bySeverity[severity] !== undefined) {
        summary.bySeverity[severity]++;
      }
      
      const type = finding.type || 'unknown';
      if (!summary.byType[type]) {
        summary.byType[type] = 0;
      }
      summary.byType[type]++;
    });
    
    return summary;
  }

  loadResults() {
    if (fs.existsSync(this.resultsPath)) {
      const data = fs.readFileSync(this.resultsPath, 'utf8');
      this.scanResults = JSON.parse(data);
    }
  }

  saveResults() {
    // Keep only last 50 scan results
    if (this.scanResults.length > 50) {
      this.scanResults = this.scanResults.slice(-50);
    }
    fs.writeFileSync(this.resultsPath, JSON.stringify(this.scanResults, null, 2));
  }

  getLatestResults() {
    return this.scanResults.length > 0 ? this.scanResults[this.scanResults.length - 1] : null;
  }

  getResultsHistory() {
    return this.scanResults;
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const scanner = new SecurityScanner();

  switch (command) {
    case 'scan':
      const result = await scanner.runFullScan();
      console.log('\n📋 Full scan results saved to security-scan-results.json');
      break;

    case 'secrets':
      const secretFindings = scanner.scanForSecrets();
      console.log('🔐 Secret Leak Findings:');
      console.log(JSON.stringify(secretFindings, null, 2));
      break;

    case 'dependencies':
      const depFindings = scanner.scanDependencies();
      console.log('📦 Dependency Vulnerability Findings:');
      console.log(JSON.stringify(depFindings, null, 2));
      break;

    case 'config':
      const configFindings = scanner.scanConfigurations();
      console.log('⚙️  Configuration Findings:');
      console.log(JSON.stringify(configFindings, null, 2));
      break;

    case 'latest':
      const latest = scanner.getLatestResults();
      console.log('📊 Latest Scan Results:');
      console.log(JSON.stringify(latest, null, 2));
      break;

    case 'history':
      const history = scanner.getResultsHistory();
      console.log('📜 Scan History:');
      console.log(JSON.stringify(history, null, 2));
      break;

    default:
      console.log('🔒 Automated Security Scanning Pipeline');
      console.log('');
      console.log('Commands:');
      console.log('  scan          - Run full security scan');
      console.log('  secrets       - Scan for leaked secrets only');
      console.log('  dependencies  - Scan for dependency vulnerabilities');
      console.log('  config        - Scan for configuration issues');
      console.log('  latest        - Show latest scan results');
      console.log('  history       - Show scan history');
      console.log('');
      console.log('Examples:');
      console.log('  node security-scanner.js scan');
      console.log('  node security-scanner.js secrets');
      console.log('  node security-scanner.js latest');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  SecurityScanner
};
