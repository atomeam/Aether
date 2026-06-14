/**
 * Automated Sentinel Duty Testing System
 * Continuously monitors API endpoints for latency and payload validation
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SentinelDutyTester {
  constructor() {
    this.endpoints = [
      {
        name: 'a-to-mind-health',
        url: 'https://a-to-mind.com/api/health',
        method: 'GET',
        expectedFields: ['ok', 'worker', 'version', 'ts', 'bindings'],
        maxLatency: 1000 // 1 second
      },
      {
        name: 'reliability-health',
        url: 'https://a-to-mind.com/api/reliability/health',
        method: 'GET',
        expectedFields: ['ok', 'service', 'version', 'ts', 'health'],
        maxLatency: 1000
      }
    ];
    
    this.results = [];
  }

  async runTest(endpoint) {
    const startTime = Date.now();
    
    try {
      let command;
      if (endpoint.method === 'GET') {
        command = `curl -s "${endpoint.url}"`;
      } else {
        command = `curl -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify(endpoint.body)}' "${endpoint.url}"`;
      }
      
      const { stdout } = await execAsync(command);
      const latency = Date.now() - startTime;
      const data = JSON.parse(stdout);
      
      // Check for error response
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Validate payload
      const payloadValidation = this.validatePayload(data, endpoint.expectedFields);
      
      // Check latency
      const latencyCheck = latency <= endpoint.maxLatency;
      
      const result = {
        endpoint: endpoint.name,
        success: payloadValidation.valid && latencyCheck,
        status: 200,
        latency,
        maxLatency: endpoint.maxLatency,
        latencyCheck,
        payloadValidation,
        data,
        timestamp: new Date().toISOString()
      };
      
      this.results.push(result);
      
      console.log(`✅ ${endpoint.name}: ${result.success ? 'PASS' : 'FAIL'} (${latency}ms)`);
      
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      const result = {
        endpoint: endpoint.name,
        success: false,
        error: error.message,
        latency,
        maxLatency: endpoint.maxLatency,
        latencyCheck: false,
        payloadValidation: { valid: false, errors: ['Request failed'] },
        timestamp: new Date().toISOString()
      };
      
      this.results.push(result);
      
      console.log(`❌ ${endpoint.name}: FAIL (${error.message})`);
      
      return result;
    }
  }

  validatePayload(data, expectedFields) {
    const errors = [];
    const missing = [];
    
    for (const field of expectedFields) {
      if (!(field in data)) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      errors.push(`Missing fields: ${missing.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      missing
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Sentinel Duty Tests...');
    console.log(`Testing ${this.endpoints.length} endpoints\n`);
    
    for (const endpoint of this.endpoints) {
      await this.runTest(endpoint);
    }
    
    return this.generateReport();
  }

  generateReport() {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    const avgLatency = this.results.reduce((sum, r) => sum + r.latency, 0) / total;
    const maxLatency = Math.max(...this.results.map(r => r.latency));
    const minLatency = Math.min(...this.results.map(r => r.latency));
    
    const report = {
      summary: {
        total,
        passed,
        failed,
        passRate: ((passed / total) * 100).toFixed(2) + '%',
        avgLatency: avgLatency.toFixed(2) + 'ms',
        maxLatency: maxLatency + 'ms',
        minLatency: minLatency + 'ms'
      },
      results: this.results,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n📊 Sentinel Duty Report:');
    console.log(`Total: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`Avg Latency: ${report.summary.avgLatency}`);
    console.log(`Max Latency: ${report.summary.maxLatency}`);
    console.log(`Min Latency: ${report.summary.minLatency}`);
    
    // Detailed results
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.endpoint}: ${result.latency}ms`);
      if (!result.success) {
        console.log(`   Error: ${result.error || 'Payload validation failed'}`);
        if (result.payloadValidation && result.payloadValidation.errors.length > 0) {
          console.log(`   Payload errors: ${result.payloadValidation.errors.join(', ')}`);
        }
      }
    });
    
    return report;
  }

  async runScheduledTests(intervalMs = 60000) {
    console.log(`🔄 Starting scheduled tests every ${intervalMs}ms...`);
    
    while (true) {
      this.results = []; // Clear previous results
      await this.runAllTests();
      
      console.log(`\n⏰ Next test in ${intervalMs / 1000} seconds...\n`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const tester = new SentinelDutyTester();

  switch (command) {
    case 'test':
      await tester.runAllTests();
      break;
    
    case 'schedule':
      const interval = parseInt(args[1]) || 60000;
      await tester.runScheduledTests(interval);
      break;
    
    case 'single':
      const endpointName = args[1];
      const endpoint = tester.endpoints.find(e => e.name === endpointName);
      if (endpoint) {
        await tester.runTest(endpoint);
      } else {
        console.log(`❌ Endpoint not found: ${endpointName}`);
        console.log('Available endpoints:', tester.endpoints.map(e => e.name).join(', '));
      }
      break;
    
    default:
      console.log('🛡️  Sentinel Duty Automated Testing System');
      console.log('');
      console.log('Commands:');
      console.log('  test           - Run all tests once');
      console.log('  schedule [ms] - Run tests on schedule (default: 60000ms)');
      console.log('  single <name>  - Run single test by endpoint name');
      console.log('');
      console.log('Examples:');
      console.log('  node sentinel-duty-tester.js test');
      console.log('  node sentinel-duty-tester.js schedule 30000');
      console.log('  node sentinel-duty-tester.js single a-to-mind-health');
      console.log('');
      console.log('Available endpoints:');
      tester.endpoints.forEach(e => {
        console.log(`  - ${e.name} (${e.method} ${e.url})`);
      });
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  SentinelDutyTester
};
