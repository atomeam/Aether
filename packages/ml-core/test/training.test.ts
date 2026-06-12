/**
 * Tests for model training utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validateTrainingConfig,
  createDefaultTrainingConfig,
  trainModel,
  createCheckpoint,
  validateTrainingProgress,
  getLearningRate,
  clipGradients,
  getBatchIndices,
  trainValidationSplit,
} from '../src/training';
import { TrainingConfigSchema, TrainingProgressSchema } from '../src/schemas';

describe('Training Utilities', () => {
  describe('validateTrainingConfig', () => {
    it('should validate a valid training config', () => {
      const config = {
        modelType: 'classification' as const,
        epochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam' as const,
        lossFunction: 'cross-entropy' as const,
      };
      const result = validateTrainingConfig(config);
      expect(result).toEqual(config);
    });

    it('should throw on invalid config', () => {
      const config = {
        modelType: 'invalid',
        epochs: -1,
        batchSize: 0,
        learningRate: -0.001,
      };
      expect(() => validateTrainingConfig(config)).toThrow();
    });
  });

  describe('createDefaultTrainingConfig', () => {
    it('should create default config for classification', () => {
      const config = createDefaultTrainingConfig('classification');
      expect(config.modelType).toBe('classification');
      expect(config.lossFunction).toBe('cross-entropy');
      expect(config.epochs).toBe(100);
      expect(config.batchSize).toBe(32);
    });

    it('should create default config for regression', () => {
      const config = createDefaultTrainingConfig('regression');
      expect(config.modelType).toBe('regression');
      expect(config.lossFunction).toBe('mse');
    });
  });

  describe('trainModel', () => {
    it('should train a model and return results', async () => {
      const config = createDefaultTrainingConfig('classification');
      const data = Array.from({ length: 100 }, () => [Math.random(), Math.random()]);
      
      const result = await trainModel(config, data);
      
      expect(result.modelId).toBeDefined();
      expect(result.epochsTrained).toBeGreaterThan(0);
      expect(result.finalLoss).toBeGreaterThanOrEqual(0);
      expect(result.history.length).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
    });

    it('should respect early stopping', async () => {
      const config = createDefaultTrainingConfig('classification');
      config.earlyStopping = true;
      config.earlyStoppingPatience = 5;
      config.epochs = 1000;
      
      const data = Array.from({ length: 100 }, () => [Math.random(), Math.random()]);
      const result = await trainModel(config, data);
      
      expect(result.epochsTrained).toBeLessThan(config.epochs);
    });
  });

  describe('createCheckpoint', () => {
    it('should create a valid checkpoint', () => {
      const checkpoint = createCheckpoint(
        10,
        { weights: [1, 2, 3] },
        { momentum: [0.1, 0.2] },
        { accuracy: 0.9 }
      );
      
      expect(checkpoint.epoch).toBe(10);
      expect(checkpoint.modelState).toBeDefined();
      expect(checkpoint.optimizerState).toBeDefined();
      expect(checkpoint.metrics).toBeDefined();
    });
  });

  describe('validateTrainingProgress', () => {
    it('should validate valid progress', () => {
      const progress = {
        epoch: 10,
        loss: 0.5,
        accuracy: 0.9,
        learningRate: 0.001,
        timestamp: new Date(),
      };
      const result = validateTrainingProgress(progress);
      expect(result).toEqual(progress);
    });

    it('should throw on invalid progress', () => {
      const progress = {
        epoch: -1,
        loss: -0.5,
        accuracy: 1.5,
      };
      expect(() => validateTrainingProgress(progress)).toThrow();
    });
  });

  describe('getLearningRate', () => {
    it('should return constant learning rate', () => {
      const lr = getLearningRate(0.001, 10, 'constant');
      expect(lr).toBe(0.001);
    });

    it('should apply step decay', () => {
      const lr = getLearningRate(0.001, 20, 'step', 0.1, 10);
      expect(lr).toBeCloseTo(0.0001);
    });

    it('should apply exponential decay', () => {
      const lr = getLearningRate(0.001, 10, 'exponential', 0.95);
      expect(lr).toBeLessThan(0.001);
    });

    it('should apply cosine decay', () => {
      const lr = getLearningRate(0.001, 50, 'cosine', undefined, 100);
      expect(lr).toBeLessThanOrEqual(0.001);
    });
  });

  describe('clipGradients', () => {
    it('should not clip small gradients', () => {
      const gradients = [0.1, 0.2, 0.3];
      const clipped = clipGradients(gradients, 1.0);
      expect(clipped).toEqual(gradients);
    });

    it('should clip large gradients', () => {
      const gradients = [10, 20, 30];
      const clipped = clipGradients(gradients, 1.0);
      const norm = Math.sqrt(clipped.reduce((sum, g) => sum + g * g, 0));
      expect(norm).toBeLessThanOrEqual(1.0);
    });
  });

  describe('getBatchIndices', () => {
    it('should create batches without shuffling', () => {
      const batches = getBatchIndices(100, 32, 0, false);
      expect(batches.length).toBeGreaterThan(0);
      expect(batches[0]).toEqual([0, 1, 2]);
    });

    it('should create batches with shuffling', () => {
      const batches = getBatchIndices(100, 32, 0, true);
      expect(batches.length).toBeGreaterThan(0);
      expect(batches[0]).not.toEqual([0, 1, 2]);
    });

    it('should handle last batch correctly', () => {
      const batches = getBatchIndices(10, 3, 0, false);
      expect(batches[batches.length - 1].length).toBeLessThanOrEqual(3);
    });
  });

  describe('trainValidationSplit', () => {
    it('should split data correctly', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const { train, validation } = trainValidationSplit(data, 0.2, false);
      
      expect(train.length).toBe(80);
      expect(validation.length).toBe(20);
    });

    it('should shuffle when requested', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const { train } = trainValidationSplit(data, 0.2, true);
      
      expect(train).not.toEqual(data.slice(0, 80));
    });
  });
});
