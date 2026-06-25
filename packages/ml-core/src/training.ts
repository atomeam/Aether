/**
 * Model training utilities
 */

import type {
  TrainingConfig,
  TrainingProgress,
  TrainingResult,
  ModelCheckpoint,
  ModelMetrics,
} from './types';
import {
  TrainingConfigSchema,
  TrainingProgressSchema,
  TrainingResultSchema,
  ModelCheckpointSchema,
  ModelMetricsSchema,
} from './schemas';

/**
 * Validates training configuration
 */
export function validateTrainingConfig(config: unknown): TrainingConfig {
  return TrainingConfigSchema.parse(config);
}

/**
 * Creates a default training configuration
 */
export function createDefaultTrainingConfig(
  modelType: TrainingConfig['modelType'] = 'classification'
): TrainingConfig {
  return {
    modelType,
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    optimizer: 'adam',
    lossFunction: modelType === 'classification' ? 'cross-entropy' : 'mse',
    regularization: 'l2',
    regularizationStrength: 0.01,
    earlyStopping: true,
    earlyStoppingPatience: 10,
    validationSplit: 0.2,
    shuffle: true,
    seed: 42,
  };
}

/**
 * Simulates model training (placeholder for actual implementation)
 * In a real implementation, this would interface with ML frameworks like TensorFlow.js
 */
export async function trainModel(
  config: TrainingConfig,
  data: unknown[]
): Promise<TrainingResult> {
  const startTime = Date.now();
  const history: TrainingProgress[] = [];
  let bestLoss = Infinity;
  let patienceCounter = 0;

  for (let epoch = 0; epoch < config.epochs; epoch++) {
    // Simulate training progress
    const loss = Math.max(0.1, 1 - epoch / config.epochs + Math.random() * 0.1);
    const accuracy = Math.min(0.95, epoch / config.epochs + Math.random() * 0.05);
    const validationLoss = loss + Math.random() * 0.1;
    const validationAccuracy = accuracy - Math.random() * 0.1;

    const progress: TrainingProgress = {
      epoch,
      loss,
      accuracy: config.modelType === 'classification' ? accuracy : undefined,
      validationLoss,
      validationAccuracy: config.modelType === 'classification' ? validationAccuracy : undefined,
      learningRate: config.learningRate,
      timestamp: new Date(),
    };

    history.push(progress);

    // Early stopping check
    if (config.earlyStopping && validationLoss < bestLoss) {
      bestLoss = validationLoss;
      patienceCounter = 0;
    } else if (config.earlyStopping) {
      patienceCounter++;
      if (patienceCounter >= (config.earlyStoppingPatience || 10)) {
        break;
      }
    }
  }

  const trainingTime = Date.now() - startTime;
  const finalProgress = history[history.length - 1];

  const metrics: ModelMetrics = {
    accuracy: finalProgress.accuracy,
    mse: finalProgress.loss,
  };

  return {
    modelId: crypto.randomUUID(),
    finalLoss: finalProgress.loss,
    finalAccuracy: finalProgress.accuracy,
    epochsTrained: history.length,
    trainingTime,
    history,
    metrics,
  };
}

/**
 * Creates a model checkpoint
 */
export function createCheckpoint(
  epoch: number,
  modelState: unknown,
  optimizerState: unknown,
  metrics: ModelMetrics
): ModelCheckpoint {
  const checkpoint = {
    epoch,
    modelState,
    optimizerState,
    metrics,
  };
  return ModelCheckpointSchema.parse(checkpoint);
}

/**
 * Validates training progress
 */
export function validateTrainingProgress(progress: unknown): TrainingProgress {
  return TrainingProgressSchema.parse(progress);
}

/**
 * Calculates learning rate schedule
 */
export function getLearningRate(
  initialRate: number,
  epoch: number,
  schedule: 'constant' | 'step' | 'exponential' | 'cosine' = 'constant',
  decayRate?: number,
  decaySteps?: number
): number {
  switch (schedule) {
    case 'constant':
      return initialRate;
    case 'step':
      const steps = Math.floor(epoch / (decaySteps || 10));
      return initialRate * Math.pow(decayRate || 0.1, steps);
    case 'exponential':
      return initialRate * Math.pow(decayRate || 0.95, epoch);
    case 'cosine':
      return initialRate * 0.5 * (1 + Math.cos((Math.PI * epoch) / (decaySteps || 100)));
    default:
      return initialRate;
  }
}

/**
 * Applies gradient clipping
 */
export function clipGradients(gradients: number[], maxNorm: number): number[] {
  const norm = Math.sqrt(gradients.reduce((sum, g) => sum + g * g, 0));
  if (norm > maxNorm) {
    const scale = maxNorm / norm;
    return gradients.map(g => g * scale);
  }
  return gradients;
}

/**
 * Calculates batch indices for training
 */
export function getBatchIndices(
  dataSize: number,
  batchSize: number,
  epoch: number,
  shuffle: boolean = true
): number[][] {
  const indices = Array.from({ length: dataSize }, (_, i) => i);
  
  if (shuffle) {
    // Simple shuffle using seeded random
    const seed = epoch * 12345;
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor((seed * (i + 1)) % (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }

  const batches: number[][] = [];
  for (let i = 0; i < indices.length; i += batchSize) {
    batches.push(indices.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Splits data into train and validation sets
 */
export function trainValidationSplit<T>(
  data: T[],
  validationSplit: number,
  shuffle: boolean = true,
  seed: number = 42
): { train: T[]; validation: T[] } {
  const indices = Array.from({ length: data.length }, (_, i) => i);
  
  if (shuffle) {
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor((seed * (i + 1)) % (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }

  const splitIndex = Math.floor(data.length * (1 - validationSplit));
  const trainIndices = indices.slice(0, splitIndex);
  const validationIndices = indices.slice(splitIndex);

  return {
    train: trainIndices.map(i => data[i]),
    validation: validationIndices.map(i => data[i]),
  };
}
