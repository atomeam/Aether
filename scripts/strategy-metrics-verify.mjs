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

// 2. Verify Strategy Returns File Exists
const strategyReturnsPath = path.join(root, contract.data.strategyReturnsPath);
if (!fs.existsSync(strategyReturnsPath)) {
  console.error('❌ Verification Failed: Strategy returns file not found.');
  console.error(`   Expected at: ${strategyReturnsPath}`);
  console.error('   Run the backtest script first to generate returns.');
  process.exit(1);
}

console.log('✅ Strategy returns file found.');

// 3. Verify Shadow Returns File Exists
const shadowReturnsPath = path.join(root, contract.data.shadowReturnsPath);
if (!fs.existsSync(shadowReturnsPath)) {
  console.error('❌ Verification Failed: Shadow returns file not found.');
  console.error(`   Expected at: ${shadowReturnsPath}`);
  console.error('   Run the backtest script first to generate shadow returns.');
  process.exit(1);
}

console.log('✅ Shadow returns file found.');

// 4. Parse Strategy Returns CSV
const parseReturnsCSV = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const timestampIndex = headers.indexOf('timestamp');
  const returnIndex = headers.indexOf('return');

  if (timestampIndex === -1 || returnIndex === -1) {
    console.error(`❌ Verification Failed: CSV must have "timestamp" and "return" columns in ${filePath}`);
    process.exit(1);
  }

  const returns = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const ret = parseFloat(values[returnIndex]);
    if (isNaN(ret)) {
      console.error(`❌ Verification Failed: Invalid return value at line ${i + 1} in ${filePath}: ${values[returnIndex]}`);
      process.exit(1);
    }
    returns.push(ret);
  }

  return returns;
};

const strategyReturns = parseReturnsCSV(strategyReturnsPath);
const shadowReturns = parseReturnsCSV(shadowReturnsPath);

console.log(`✅ Parsed ${strategyReturns.length} strategy return values.`);
console.log(`✅ Parsed ${shadowReturns.length} shadow return values.`);

// 5. Validate Paired Data Length
if (strategyReturns.length !== shadowReturns.length) {
  console.error('❌ Verification Failed: Strategy and shadow returns must have same length for paired test.');
  console.error(`   Strategy: ${strategyReturns.length}, Shadow: ${shadowReturns.length}`);
  process.exit(1);
}

// 6. Validate Minimum Data Points
if (strategyReturns.length < contract.evaluation.minDataPoints) {
  console.error(`❌ Verification Failed: Insufficient data points.`);
  console.error(`   Required: ${contract.evaluation.minDataPoints}, Found: ${strategyReturns.length}`);
  process.exit(1);
}

console.log(`✅ Data points meet minimum requirement (${strategyReturns.length} >= ${contract.evaluation.minDataPoints}).`);

// 7. Calculate Sharpe Ratio for Strategy
const mean = strategyReturns.reduce((a, b) => a + b, 0) / strategyReturns.length;
const variance = strategyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / strategyReturns.length;
const stdDev = Math.sqrt(variance);

const tradingDaysPerYear = contract.metrics.tradingDaysPerYear;
const sharpe = (mean / stdDev) * Math.sqrt(tradingDaysPerYear);

console.log(`   Strategy mean return: ${mean.toFixed(6)}`);
console.log(`   Strategy std dev: ${stdDev.toFixed(6)}`);
console.log(`   Strategy Sharpe ratio: ${sharpe.toFixed(4)}`);

if (sharpe < contract.metrics.sharpeMin) {
  console.error(`❌ Verification Failed: Sharpe ratio below threshold.`);
  console.error(`   Required: ${contract.metrics.sharpeMin}, Calculated: ${sharpe.toFixed(4)}`);
  process.exit(1);
}

console.log(`✅ Sharpe ratio meets threshold (${sharpe.toFixed(4)} >= ${contract.metrics.sharpeMin}).`);

// 8. Paired Bootstrap Test for Statistical Significance
const seed = contract.bootstrap.seed;
const samples = contract.bootstrap.samples;
const pValueMax = contract.bootstrap.pValueMax;

// Simple seeded RNG (Linear Congruential Generator)
let rngState = seed;
const seededRandom = () => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
};

// Calculate observed difference in means
const shadowMean = shadowReturns.reduce((a, b) => a + b, 0) / shadowReturns.length;
const observedDiff = mean - shadowMean;

console.log(`   Shadow mean return: ${shadowMean.toFixed(6)}`);
console.log(`   Observed strategy-shadow difference: ${observedDiff.toFixed(6)}`);

// Paired bootstrap: resample paired differences
const pairedDiffs = strategyReturns.map((s, i) => s - shadowReturns[i]);

const bootstrapDiffs = [];
for (let i = 0; i < samples; i++) {
  // Resample paired differences with replacement
  const resampled = [];
  for (let j = 0; j < pairedDiffs.length; j++) {
    const idx = Math.floor(seededRandom() * pairedDiffs.length);
    resampled.push(pairedDiffs[idx]);
  }
  const resampledMean = resampled.reduce((a, b) => a + b, 0) / resampled.length;
  bootstrapDiffs.push(resampledMean);
}

// Calculate p-value: proportion of bootstrap differences <= 0 (null: strategy not better than shadow)
const extremeCount = bootstrapDiffs.filter(d => d <= 0).length;
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
console.log(`   Strategy-shadow difference: ${observedDiff.toFixed(6)}`);
