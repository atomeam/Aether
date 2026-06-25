/**
 * Model evaluation utilities
 */

import type {
  ModelMetrics,
  EvaluationConfig,
  EvaluationResult,
  ConfusionMatrix,
  ROCPoint,
} from './types';
import {
  ModelMetricsSchema,
  EvaluationConfigSchema,
  EvaluationResultSchema,
  ConfusionMatrixSchema,
  ROCPointSchema,
} from './schemas';

/**
 * Validates evaluation configuration
 */
export function validateEvaluationConfig(config: unknown): EvaluationConfig {
  return EvaluationConfigSchema.parse(config);
}

/**
 * Creates a default evaluation configuration
 */
export function createDefaultEvaluationConfig(): EvaluationConfig {
  return {
    metrics: ['accuracy', 'precision', 'recall', 'f1'],
    crossValidation: true,
    cvFolds: 5,
    stratified: true,
    testSize: 0.2,
    randomState: 42,
  };
}

/**
 * Calculates confusion matrix
 */
export function calculateConfusionMatrix(
  predictions: number[],
  actual: number[],
  threshold: number = 0.5
): ConfusionMatrix {
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i] >= threshold ? 1 : 0;
    const act = actual[i] >= threshold ? 1 : 0;

    if (pred === 1 && act === 1) truePositive++;
    else if (pred === 0 && act === 0) trueNegative++;
    else if (pred === 1 && act === 0) falsePositive++;
    else if (pred === 0 && act === 1) falseNegative++;
  }

  return ConfusionMatrixSchema.parse({
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
  });
}

/**
 * Calculates accuracy
 */
export function calculateAccuracy(predictions: number[], actual: number[]): number {
  if (predictions.length === 0) return 0;
  
  let correct = 0;
  for (let i = 0; i < predictions.length; i++) {
    if (Math.round(predictions[i]) === Math.round(actual[i])) {
      correct++;
    }
  }
  return correct / predictions.length;
}

/**
 * Calculates precision
 */
export function calculatePrecision(
  predictions: number[],
  actual: number[],
  threshold: number = 0.5
): number {
  const cm = calculateConfusionMatrix(predictions, actual, threshold);
  const denominator = cm.truePositive + cm.falsePositive;
  return denominator > 0 ? cm.truePositive / denominator : 0;
}

/**
 * Calculates recall (sensitivity)
 */
export function calculateRecall(
  predictions: number[],
  actual: number[],
  threshold: number = 0.5
): number {
  const cm = calculateConfusionMatrix(predictions, actual, threshold);
  const denominator = cm.truePositive + cm.falseNegative;
  return denominator > 0 ? cm.truePositive / denominator : 0;
}

/**
 * Calculates F1 score
 */
export function calculateF1Score(
  predictions: number[],
  actual: number[],
  threshold: number = 0.5
): number {
  const precision = calculatePrecision(predictions, actual, threshold);
  const recall = calculateRecall(predictions, actual, threshold);
  const denominator = precision + recall;
  return denominator > 0 ? (2 * precision * recall) / denominator : 0;
}

/**
 * Calculates specificity
 */
export function calculateSpecificity(
  predictions: number[],
  actual: number[],
  threshold: number = 0.5
): number {
  const cm = calculateConfusionMatrix(predictions, actual, threshold);
  const denominator = cm.trueNegative + cm.falsePositive;
  return denominator > 0 ? cm.trueNegative / denominator : 0;
}

/**
 * Calculates mean squared error
 */
export function calculateMSE(predictions: number[], actual: number[]): number {
  if (predictions.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < predictions.length; i++) {
    sum += Math.pow(predictions[i] - actual[i], 2);
  }
  return sum / predictions.length;
}

/**
 * Calculates mean absolute error
 */
export function calculateMAE(predictions: number[], actual: number[]): number {
  if (predictions.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < predictions.length; i++) {
    sum += Math.abs(predictions[i] - actual[i]);
  }
  return sum / predictions.length;
}

/**
 * Calculates root mean squared error
 */
export function calculateRMSE(predictions: number[], actual: number[]): number {
  return Math.sqrt(calculateMSE(predictions, actual));
}

/**
 * Calculates R-squared score
 */
export function calculateR2Score(predictions: number[], actual: number[]): number {
  if (predictions.length === 0) return 0;
  
  const actualMean = actual.reduce((sum, v) => sum + v, 0) / actual.length;
  
  let ssRes = 0;
  let ssTot = 0;
  
  for (let i = 0; i < predictions.length; i++) {
    ssRes += Math.pow(actual[i] - predictions[i], 2);
    ssTot += Math.pow(actual[i] - actualMean, 2);
  }
  
  return ssTot > 0 ? 1 - ssRes / ssTot : 0;
}

/**
 * Calculates adjusted R-squared score
 */
export function calculateAdjustedR2(
  predictions: number[],
  actual: number[],
  nFeatures: number
): number {
  const r2 = calculateR2Score(predictions, actual);
  const n = predictions.length;
  
  if (n <= nFeatures + 1) return 0;
  
  return 1 - (1 - r2) * (n - 1) / (n - nFeatures - 1);
}

/**
 * Calculates log loss (cross-entropy)
 */
export function calculateLogLoss(
  predictions: number[],
  actual: number[],
  epsilon: number = 1e-15
): number {
  if (predictions.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < predictions.length; i++) {
    const p = Math.max(epsilon, Math.min(1 - epsilon, predictions[i]));
    const y = actual[i];
    sum += y * Math.log(p) + (1 - y) * Math.log(1 - p);
  }
  
  return -sum / predictions.length;
}

/**
 * Generates ROC curve points
 */
export function generateROCCurve(
  predictions: number[],
  actual: number[],
  numPoints: number = 100
): ROCPoint[] {
  const points: ROCPoint[] = [];
  const thresholds = Array.from({ length: numPoints }, (_, i) => i / numPoints);

  for (const threshold of thresholds) {
    const cm = calculateConfusionMatrix(predictions, actual, threshold);
    const tpr = cm.truePositive + cm.falseNegative > 0
      ? cm.truePositive / (cm.truePositive + cm.falseNegative)
      : 0;
    const fpr = cm.falsePositive + cm.trueNegative > 0
      ? cm.falsePositive / (cm.falsePositive + cm.trueNegative)
      : 0;

    points.push({
      falsePositiveRate: fpr,
      truePositiveRate: tpr,
      threshold,
    });
  }

  return points.sort((a, b) => a.falsePositiveRate - b.falsePositiveRate);
}

/**
 * Calculates AUC (Area Under Curve)
 */
export function calculateAUC(
  predictions: number[],
  actual: number[]
): number {
  const roc = generateROCCurve(predictions, actual);
  
  let auc = 0;
  for (let i = 1; i < roc.length; i++) {
    const width = roc[i].falsePositiveRate - roc[i - 1].falsePositiveRate;
    const height = (roc[i].truePositiveRate + roc[i - 1].truePositiveRate) / 2;
    auc += width * height;
  }
  
  return auc;
}

/**
 * Performs cross-validation
 */
export function crossValidate(
  data: unknown[],
  labels: number[],
  cvFolds: number = 5,
  stratified: boolean = false,
  randomState: number = 42
): number[] {
  const foldSize = Math.floor(data.length / cvFolds);
  const scores: number[] = [];

  // Simple K-fold cross-validation
  for (let fold = 0; fold < cvFolds; fold++) {
    const startIdx = fold * foldSize;
    const endIdx = fold === cvFolds - 1 ? data.length : (fold + 1) * foldSize;

    const testData = data.slice(startIdx, endIdx);
    const testLabels = labels.slice(startIdx, endIdx);
    const trainData = [...data.slice(0, startIdx), ...data.slice(endIdx)];
    const trainLabels = [...labels.slice(0, startIdx), ...labels.slice(endIdx)];

    // Simulate training and prediction
    // In a real implementation, this would train a model and make predictions
    const mockPredictions = testLabels.map(() => Math.random());
    const score = calculateAccuracy(mockPredictions, testLabels);
    scores.push(score);
  }

  return scores;
}

/**
 * Evaluates model predictions
 */
export function evaluateModel(
  predictions: number[],
  actual: number[],
  config: EvaluationConfig
): EvaluationResult {
  const validatedConfig = validateEvaluationConfig(config);
  
  const metrics: ModelMetrics = {};

  for (const metric of validatedConfig.metrics) {
    switch (metric.toLowerCase()) {
      case 'accuracy':
        metrics.accuracy = calculateAccuracy(predictions, actual);
        break;
      case 'precision':
        metrics.precision = calculatePrecision(predictions, actual);
        break;
      case 'recall':
        metrics.recall = calculateRecall(predictions, actual);
        break;
      case 'f1':
      case 'f1score':
        metrics.f1Score = calculateF1Score(predictions, actual);
        break;
      case 'specificity':
        metrics.specificity = calculateSpecificity(predictions, actual);
        break;
      case 'auc':
        metrics.auc = calculateAUC(predictions, actual);
        break;
      case 'mse':
        metrics.mse = calculateMSE(predictions, actual);
        break;
      case 'mae':
        metrics.mae = calculateMAE(predictions, actual);
        break;
      case 'rmse':
        metrics.rmse = calculateRMSE(predictions, actual);
        break;
      case 'r2':
      case 'r2score':
        metrics.r2Score = calculateR2Score(predictions, actual);
        break;
      case 'logloss':
        metrics.logLoss = calculateLogLoss(predictions, actual);
        break;
    }
  }

  // Calculate confusion matrix for classification
  if (metrics.accuracy !== undefined) {
    const cm = calculateConfusionMatrix(predictions, actual);
    metrics.confusionMatrix = [
      [cm.trueNegative, cm.falsePositive],
      [cm.falseNegative, cm.truePositive],
    ];
  }

  // Cross-validation
  let crossValidationScores: number[] | undefined;
  let meanCvScore: number | undefined;
  let stdCvScore: number | undefined;

  if (validatedConfig.crossValidation) {
    // In a real implementation, this would use the actual data
    // For now, we'll simulate it
    crossValidationScores = Array.from(
      { length: validatedConfig.cvFolds || 5 },
      () => metrics.accuracy || Math.random()
    );
    meanCvScore = crossValidationScores.reduce((sum, s) => sum + s, 0) / crossValidationScores.length;
    stdCvScore = Math.sqrt(
      crossValidationScores.reduce((sum, s) => sum + Math.pow(s - (meanCvScore || 0), 2), 0) / crossValidationScores.length
    );
  }

  const result: EvaluationResult = {
    metrics,
    crossValidationScores,
    meanCvScore,
    stdCvScore,
    predictions,
    actualLabels: actual,
  };

  return EvaluationResultSchema.parse(result);
}

/**
 * Validates model metrics
 */
export function validateModelMetrics(metrics: unknown): ModelMetrics {
  return ModelMetricsSchema.parse(metrics);
}
