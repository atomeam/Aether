import fs from 'fs';
import path from 'path';

const root = process.cwd();
const contractPath = process.argv[2] ? path.join(root, process.argv[2]) : path.join(root, 'infra', 'strategy-metrics.contract.json');

console.log('Starting Strategy Metrics Verification...');

// 1. Contract Authority Verification
if (!fs.existsSync(contractPath)) {
  console.error('❌ Verification Failed: Strategy metrics contract file is missing.');
  console.error(`   Expected at: ${contractPath}`);
  process.exit(1);
}

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
console.log('✅ Loaded strategy metrics contract.');

// 2. Verify Returns File Exists
const returnsPath = path.join(root, contract.data.outputPath);
if (!fs.existsSync(returnsPath)) {
  console.error('❌ Verification Failed: Returns file not found.');
  console.error(`   Expected at: ${returnsPath}`);
  console.error('   Run the backtest script first to generate returns.');
  process.exit(1);
}

console.log('✅ Returns file found.');

// 3. Parse Returns CSV
const returnsContent = fs.readFileSync(returnsPath, 'utf-8');
const lines = returnsContent.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim());

const timestampIndex = headers.indexOf('timestamp');
const returnIndex = headers.indexOf('return');

if (timestampIndex === -1 || returnIndex === -1) {
  console.error('❌ Verification Failed: Returns CSV must have "timestamp" and "return" columns.');
  process.exit(1);
}

const returns = [];
for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',').map(v => v.trim());
  const ret = parseFloat(values[returnIndex]);
  if (isNaN(ret)) {
    console.error(`❌ Verification Failed: Invalid return value at line ${i + 1}: ${values[returnIndex]}`);
    process.exit(1);
  }
  returns.push(ret);
}

console.log(`✅ Parsed ${returns.length} return values.`);

// 4. Validate Minimum Data Points
if (returns.length < contract.evaluation.minDataPoints) {
  console.error(`❌ Verification Failed: Insufficient data points.`);
  console.error(`   Required: ${contract.evaluation.minDataPoints}, Found: ${returns.length}`);
  process.exit(1);
}

console.log(`✅ Data points meet minimum requirement (${returns.length} >= ${contract.evaluation.minDataPoints}).`);

// 5. Calculate Sharpe Ratio
const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
const stdDev = Math.sqrt(variance);

const tradingDaysPerYear = contract.metrics.tradingDaysPerYear;
const sharpe = (mean / stdDev) * Math.sqrt(tradingDaysPerYear);

console.log(`   Mean return: ${mean.toFixed(6)}`);
console.log(`   Std dev: ${stdDev.toFixed(6)}`);
console.log(`   Sharpe ratio: ${sharpe.toFixed(4)}`);

if (sharpe < contract.metrics.sharpeMin) {
  console.error(`❌ Verification Failed: Sharpe ratio below threshold.`);
  console.error(`   Required: ${contract.metrics.sharpeMin}, Calculated: ${sharpe.toFixed(4)}`);
  process.exit(1);
}

console.log(`✅ Sharpe ratio meets threshold (${sharpe.toFixed(4)} >= ${contract.metrics.sharpeMin}).`);

// 6. Bootstrap Test for Statistical Significance
const seed = contract.bootstrap.seed;
const samples = contract.bootstrap.samples;
const pValueMax = contract.bootstrap.pValueMax;

// Simple seeded RNG (Linear Congruential Generator)
let rngState = seed;
const seededRandom = () => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
};

// Bootstrap test for null hypothesis: mean <= 0
// Center the data at 0 (subtract observed mean) to simulate null distribution
const centeredReturns = returns.map(r => r - mean);

const bootstrapMeans = [];
for (let i = 0; i < samples; i++) {
  // Resample with replacement from centered data
  const resampled = [];
  for (let j = 0; j < centeredReturns.length; j++) {
    const idx = Math.floor(seededRandom() * centeredReturns.length);
    resampled.push(centeredReturns[idx]);
  }
  const resampledMean = resampled.reduce((a, b) => a + b, 0) / resampled.length;
  bootstrapMeans.push(resampledMean);
}

// Calculate p-value: proportion of bootstrap means >= observed mean
const extremeCount = bootstrapMeans.filter(m => m >= mean).length;
const pValue = extremeCount / samples;

console.log(`   Bootstrap samples: ${samples}`);
console.log(`   P-value: ${pValue.toFixed(6)}`);

if (pValue > pValueMax) {
  console.error(`❌ Verification Failed: P-value exceeds threshold.`);
  console.error(`   Required: <= ${pValueMax}, Calculated: ${pValue.toFixed(6)}`);
  console.error(`   Null hypothesis: ${contract.bootstrap.nullDescription}`);
  process.exit(1);
}

console.log(`✅ P-value meets threshold (${pValue.toFixed(6)} <= ${pValueMax}).`);
console.log(`✅ Null hypothesis rejected: ${contract.bootstrap.nullDescription}`);

console.log('\n🚀 Strategy Metrics Verification Passed: All gates satisfied.');
console.log(`   Sharpe: ${sharpe.toFixed(4)} (min: ${contract.metrics.sharpeMin})`);
console.log(`   P-value: ${pValue.toFixed(6)} (max: ${pValueMax})`);
