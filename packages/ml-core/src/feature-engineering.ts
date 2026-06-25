/**
 * Feature engineering utilities
 */

import type {
  Feature,
  FeatureConfig,
  FeatureEngineeringResult,
  DataPoint,
  FeatureType,
  PolynomialFeatures,
  BinningConfig,
} from './types';
import {
  FeatureSchema,
  FeatureConfigSchema,
  FeatureEngineeringResultSchema,
  DataPointSchema,
  PolynomialFeaturesSchema,
  BinningConfigSchema,
} from './schemas';

/**
 * Validates feature configuration
 */
export function validateFeatureConfig(config: unknown): FeatureConfig {
  return FeatureConfigSchema.parse(config);
}

/**
 * Creates a default feature configuration
 */
export function createDefaultFeatureConfig(): FeatureConfig {
  return {
    polynomialDegree: 2,
    interactionTerms: false,
    binning: false,
    binCount: 5,
    textFeatures: false,
    datetimeFeatures: false,
    featureSelection: false,
    maxFeatures: 10,
    selectionMethod: 'variance',
  };
}

/**
 * Generates polynomial features
 */
export function generatePolynomialFeatures(
  data: number[][],
  config: PolynomialFeatures
): number[][] {
  const { degree, includeBias, interactionOnly } = config;
  
  if (data.length === 0) return data;

  const nFeatures = data[0].length;
  const result: number[][] = [];

  for (const row of data) {
    const features: number[] = [];
    
    if (includeBias) {
      features.push(1);
    }

    // Add original features
    for (let i = 0; i < nFeatures; i++) {
      features.push(row[i]);
    }

    // Add polynomial terms
    for (let d = 2; d <= degree; d++) {
      for (let i = 0; i < nFeatures; i++) {
        if (!interactionOnly) {
          features.push(Math.pow(row[i], d));
        }
      }
    }

    // Add interaction terms
    if (!interactionOnly || degree >= 2) {
      for (let i = 0; i < nFeatures; i++) {
        for (let j = i + 1; j < nFeatures; j++) {
          features.push(row[i] * row[j]);
        }
      }
    }

    result.push(features);
  }

  return result;
}

/**
 * Applies binning to numerical features
 */
export function applyBinning(
  data: number[][],
  config: BinningConfig
): number[][] {
  const { strategy, bins, labels } = config;
  
  if (data.length === 0) return data;

  const nFeatures = data[0].length;
  const binEdges: number[][] = [];

  // Calculate bin edges for each feature
  for (let i = 0; i < nFeatures; i++) {
    const values = data.map(row => row[i]);
    const sorted = [...values].sort((a, b) => a - b);
    const edges: number[] = [sorted[0]];

    if (strategy === 'uniform') {
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const step = (max - min) / bins;
      for (let b = 1; b < bins; b++) {
        edges.push(min + b * step);
      }
    } else if (strategy === 'quantile') {
      for (let b = 1; b < bins; b++) {
        const index = Math.floor((b / bins) * sorted.length);
        edges.push(sorted[index]);
      }
    } else {
      // kmeans-like: use quantiles as approximation
      for (let b = 1; b < bins; b++) {
        const index = Math.floor((b / bins) * sorted.length);
        edges.push(sorted[index]);
      }
    }

    edges.push(sorted[sorted.length - 1]);
    binEdges.push(edges);
  }

  // Apply binning
  return data.map(row => {
    return row.map((value, i) => {
      const edges = binEdges[i];
      for (let b = 0; b < edges.length - 1; b++) {
        if (value >= edges[b] && value < edges[b + 1]) {
          return b;
        }
      }
      return bins - 1;
    });
  });
}

/**
 * Calculates feature importance using variance
 */
export function calculateVarianceImportance(data: number[][]): number[] {
  if (data.length === 0) return [];

  const nFeatures = data[0].length;
  const importances: number[] = [];

  for (let i = 0; i < nFeatures; i++) {
    const values = data.map(row => row[i]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    importances.push(variance);
  }

  // Normalize to [0, 1]
  const maxImp = Math.max(...importances);
  if (maxImp > 0) {
    return importances.map(imp => imp / maxImp);
  }
  return importances;
}

/**
 * Calculates feature importance using correlation
 */
export function calculateCorrelationImportance(
  data: number[][],
  labels: number[]
): number[] {
  if (data.length === 0 || data.length !== labels.length) return [];

  const nFeatures = data[0].length;
  const importances: number[] = [];

  const labelMean = labels.reduce((sum, v) => sum + v, 0) / labels.length;
  const labelStd = Math.sqrt(
    labels.reduce((sum, v) => sum + Math.pow(v - labelMean, 2), 0) / labels.length
  );

  for (let i = 0; i < nFeatures; i++) {
    const values = data.map(row => row[i]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );

    let covariance = 0;
    for (let j = 0; j < data.length; j++) {
      covariance += (values[j] - mean) * (labels[j] - labelMean);
    }
    covariance /= data.length;

    const correlation = std > 0 && labelStd > 0 ? covariance / (std * labelStd) : 0;
    importances.push(Math.abs(correlation));
  }

  // Normalize to [0, 1]
  const maxImp = Math.max(...importances);
  if (maxImp > 0) {
    return importances.map(imp => imp / maxImp);
  }
  return importances;
}

/**
 * Selects features based on importance
 */
export function selectFeatures(
  data: number[][],
  importance: number[],
  maxFeatures: number,
  featureNames?: string[]
): { selectedData: number[][]; selectedFeatures: string[]; selectedIndices: number[] } {
  if (data.length === 0) {
    return { selectedData: data, selectedFeatures: [], selectedIndices: [] };
  }

  const nFeatures = data[0].length;
  const actualMaxFeatures = Math.min(maxFeatures, nFeatures);

  // Get indices of top features
  const indexed = importance.map((imp, i) => ({ imp, i }));
  indexed.sort((a, b) => b.imp - a.imp);
  const selectedIndices = indexed.slice(0, actualMaxFeatures).map(x => x.i);

  // Select data
  const selectedData = data.map(row => 
    selectedIndices.map(i => row[i])
  );

  // Select feature names
  const selectedFeatures = featureNames
    ? selectedIndices.map(i => featureNames[i])
    : selectedIndices.map(i => `feature_${i}`);

  return { selectedData, selectedFeatures, selectedIndices };
}

/**
 * Applies feature engineering pipeline
 */
export function engineerFeatures(
  data: DataPoint[],
  config: FeatureConfig,
  labels?: number[]
): FeatureEngineeringResult {
  const validatedConfig = validateFeatureConfig(config);
  
  let features = data.map(dp => dp.features);
  const featureNames = data[0]?.features.map((_, i) => `feature_${i}`) || [];

  // Apply polynomial features
  if (validatedConfig.polynomialDegree && validatedConfig.polynomialDegree > 1) {
    features = generatePolynomialFeatures(features, {
      degree: validatedConfig.polynomialDegree,
      includeBias: false,
      interactionOnly: validatedConfig.interactionTerms || false,
    });
  }

  // Apply binning
  if (validatedConfig.binning && validatedConfig.binCount) {
    features = applyBinning(features, {
      strategy: 'quantile',
      bins: validatedConfig.binCount,
    });
  }

  // Calculate feature importance
  let featureImportance: number[] | undefined;
  let selectedFeatures: string[] | undefined;

  if (validatedConfig.featureSelection) {
    if (labels) {
      featureImportance = calculateCorrelationImportance(features, labels);
    } else {
      featureImportance = calculateVarianceImportance(features);
    }

    const maxFeatures = validatedConfig.maxFeatures || 10;
    const { selectedData, selectedFeatures: selectedFeatNames } = selectFeatures(
      features,
      featureImportance,
      maxFeatures,
      featureNames
    );
    
    features = selectedData;
    selectedFeatures = selectedFeatNames;
  }

  // Create feature objects
  const featuresList: Feature[] = features[0]?.map((_, i) => ({
    name: selectedFeatures?.[i] || `feature_${i}`,
    type: 'numerical',
    importance: featureImportance?.[i],
    selected: true,
  })) || [];

  // Create transformed data points
  const transformedData: DataPoint[] = data.map((dp, i) => ({
    ...dp,
    features: features[i],
  }));

  const result: FeatureEngineeringResult = {
    features: featuresList,
    transformedData,
    featureImportance,
    selectedFeatures,
  };

  return FeatureEngineeringResultSchema.parse(result);
}

/**
 * Validates feature
 */
export function validateFeature(feature: unknown): Feature {
  return FeatureSchema.parse(feature);
}

/**
 * Detects feature type from data
 */
export function detectFeatureType(values: unknown[]): FeatureType {
  const numericCount = values.filter(v => typeof v === 'number' && !isNaN(v)).length;
  const stringCount = values.filter(v => typeof v === 'string').length;
  const boolCount = values.filter(v => typeof v === 'boolean').length;
  const dateCount = values.filter(v => v instanceof Date).length;

  const total = values.length;

  if (boolCount / total > 0.8) return 'boolean';
  if (dateCount / total > 0.8) return 'datetime';
  if (numericCount / total > 0.8) return 'numerical';
  if (stringCount / total > 0.8) return 'text';
  
  // Check for categorical (low cardinality strings)
  const uniqueStrings = new Set(values.filter(v => typeof v === 'string')).size;
  if (uniqueStrings < total * 0.5 && uniqueStrings < 50) return 'categorical';

  return 'text';
}
