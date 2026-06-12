/**
 * Data preprocessing utilities
 */

import type {
  PreprocessingConfig,
  DataPoint,
  Dataset,
  PreprocessingResult,
  ScalerState,
  EncoderState,
  DataStatistics,
  ScalingMethod,
  EncodingMethod,
  ImputationStrategy,
} from './types';
import {
  PreprocessingConfigSchema,
  DataPointSchema,
  DatasetSchema,
  PreprocessingResultSchema,
  ScalerStateSchema,
  EncoderStateSchema,
  DataStatisticsSchema,
} from './schemas';

/**
 * Validates preprocessing configuration
 */
export function validatePreprocessingConfig(config: unknown): PreprocessingConfig {
  return PreprocessingConfigSchema.parse(config);
}

/**
 * Creates a default preprocessing configuration
 */
export function createDefaultPreprocessingConfig(): PreprocessingConfig {
  return {
    scaling: 'standard',
    encoding: 'one-hot',
    imputation: 'mean',
    handleMissing: true,
    handleOutliers: false,
  };
}

/**
 * Calculates data statistics
 */
export function calculateStatistics(data: number[]): DataStatistics {
  const validData = data.filter(v => !isNaN(v) && v !== null);
  const n = validData.length;
  
  if (n === 0) {
    return {
      mean: [0],
      std: [0],
      min: [0],
      max: [0],
      median: [0],
      missingCount: [data.length],
      missingPercentage: [1],
    };
  }

  const mean = validData.reduce((sum, v) => sum + v, 0) / n;
  const sorted = [...validData].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];
  
  const variance = validData.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  const missingCount = data.length - n;
  const missingPercentage = missingCount / data.length;

  return {
    mean: [mean],
    std: [std],
    min: [min],
    max: [max],
    median: [median],
    missingCount: [missingCount],
    missingPercentage: [missingPercentage],
  };
}

/**
 * Applies scaling to data
 */
export function scaleData(
  data: number[][],
  method: ScalingMethod = 'standard',
  scalerState?: ScalerState
): { scaled: number[][]; state: ScalerState } {
  if (data.length === 0 || data[0].length === 0) {
    return { scaled: data, state: { method } };
  }

  const featureCount = data[0].length;
  let state: ScalerState;

  if (scalerState) {
    state = scalerState;
  } else {
    // Calculate scaling parameters
    const means: number[] = [];
    const stds: number[] = [];
    const mins: number[] = [];
    const maxs: number[] = [];
    const medians: number[] = [];
    const q1s: number[] = [];
    const q3s: number[] = [];

    for (let i = 0; i < featureCount; i++) {
      const values = data.map(row => row[i]);
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      
      const mean = values.reduce((sum, v) => sum + v, 0) / n;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
      const std = Math.sqrt(variance);
      
      mins.push(sorted[0]);
      maxs.push(sorted[n - 1]);
      medians.push(n % 2 === 0 
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
        : sorted[Math.floor(n / 2)]);
      
      const q1Index = Math.floor(n * 0.25);
      const q3Index = Math.floor(n * 0.75);
      q1s.push(sorted[q1Index]);
      q3s.push(sorted[q3Index]);
      
      means.push(mean);
      stds.push(std);
    }

    state = {
      method,
      mean: means,
      std: stds,
      min: mins,
      max: maxs,
      median: medians,
      q1: q1s,
      q3: q3s,
    };
  }

  // Apply scaling
  const scaled = data.map(row => {
    return row.map((value, i) => {
      switch (method) {
        case 'standard':
          return state.std && state.std[i] > 0
            ? (value - (state.mean?.[i] || 0)) / state.std[i]
            : 0;
        case 'minmax':
          const range = (state.max?.[i] || 1) - (state.min?.[i] || 0);
          return range > 0
            ? (value - (state.min?.[i] || 0)) / range
            : 0;
        case 'robust':
          const iqr = (state.q3?.[i] || 1) - (state.q1?.[i] || 0);
          return iqr > 0
            ? (value - (state.median?.[i] || 0)) / iqr
            : 0;
        case 'normalizer':
          const norm = Math.sqrt(row.reduce((sum, v) => sum + v * v, 0));
          return norm > 0 ? value / norm : 0;
        default:
          return value;
      }
    });
  });

  return { scaled, state };
}

/**
 * Handles missing values with imputation
 */
export function imputeMissing(
  data: number[][],
  strategy: ImputationStrategy = 'mean',
  imputationValue?: number
): number[][] {
  if (data.length === 0) return data;

  const featureCount = data[0].length;
  const imputationValues: number[] = [];

  for (let i = 0; i < featureCount; i++) {
    const values = data.map(row => row[i]).filter(v => !isNaN(v) && v !== null);
    
    if (strategy === 'constant' && imputationValue !== undefined) {
      imputationValues.push(imputationValue);
    } else if (values.length === 0) {
      imputationValues.push(0);
    } else {
      switch (strategy) {
        case 'mean':
          imputationValues.push(values.reduce((sum, v) => sum + v, 0) / values.length);
          break;
        case 'median':
          const sorted = [...values].sort((a, b) => a - b);
          const n = sorted.length;
          imputationValues.push(n % 2 === 0 
            ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
            : sorted[Math.floor(n / 2)]);
          break;
        case 'mode':
          const counts = new Map<number, number>();
          values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
          imputationValues.push([...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]);
          break;
        default:
          imputationValues.push(0);
      }
    }
  }

  return data.map(row => 
    row.map((value, i) => (isNaN(value) || value === null ? imputationValues[i] : value))
  );
}

/**
 * Detects and handles outliers
 */
export function handleOutliers(
  data: number[][],
  method: 'iqr' | 'zscore' | 'isolation' = 'iqr',
  threshold: number = 1.5,
  action: 'remove' | 'clip' | 'replace' = 'clip'
): number[][] {
  if (data.length === 0) return data;

  const featureCount = data[0].length;
  const bounds: { lower: number; upper: number }[] = [];

  for (let i = 0; i < featureCount; i++) {
    const values = data.map(row => row[i]);
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    if (method === 'iqr') {
      const q1Index = Math.floor(n * 0.25);
      const q3Index = Math.floor(n * 0.75);
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      bounds.push({
        lower: q1 - threshold * iqr,
        upper: q3 + threshold * iqr,
      });
    } else {
      const mean = values.reduce((sum, v) => sum + v, 0) / n;
      const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n);
      bounds.push({
        lower: mean - threshold * std,
        upper: mean + threshold * std,
      });
    }
  }

  return data.map(row => {
    if (action === 'remove') {
      const isOutlier = row.some((value, i) => 
        value < bounds[i].lower || value > bounds[i].upper
      );
      return isOutlier ? null : row;
    } else {
      return row.map((value, i) => {
        if (value < bounds[i].lower || value > bounds[i].upper) {
          if (action === 'clip') {
            return Math.max(bounds[i].lower, Math.min(bounds[i].upper, value));
          } else {
            return (bounds[i].lower + bounds[i].upper) / 2;
          }
        }
        return value;
      });
    }
  }).filter(row => row !== null) as number[][];
}

/**
 * Applies preprocessing pipeline
 */
export function preprocessData(
  data: DataPoint[],
  config: PreprocessingConfig
): PreprocessingResult {
  const validatedConfig = validatePreprocessingConfig(config);
  
  // Extract features
  let features = data.map(dp => dp.features);
  
  // Handle missing values
  if (validatedConfig.handleMissing && validatedConfig.imputation) {
    features = imputeMissing(features, validatedConfig.imputation, validatedConfig.imputationValue as number);
  }

  // Handle outliers
  if (validatedConfig.handleOutliers) {
    features = handleOutliers(
      features,
      validatedConfig.outlierMethod || 'iqr',
      validatedConfig.outlierThreshold || 1.5
    );
  }

  // Apply scaling
  let scalerState: ScalerState | undefined;
  if (validatedConfig.scaling) {
    const { scaled, state } = scaleData(features, validatedConfig.scaling);
    features = scaled;
    scalerState = state;
  }

  // Calculate statistics
  const statistics = calculateStatistics(features.flat());

  // Create processed data points
  const processedData: DataPoint[] = data.map((dp, i) => ({
    ...dp,
    features: features[i],
  }));

  const result: PreprocessingResult = {
    processedData,
    scaler: scalerState,
    statistics,
  };

  return PreprocessingResultSchema.parse(result);
}

/**
 * Validates data point
 */
export function validateDataPoint(dataPoint: unknown): DataPoint {
  return DataPointSchema.parse(dataPoint);
}

/**
 * Validates dataset
 */
export function validateDataset(dataset: unknown): Dataset {
  return DatasetSchema.parse(dataset);
}
