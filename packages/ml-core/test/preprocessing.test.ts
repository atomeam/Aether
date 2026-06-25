/**
 * Tests for data preprocessing utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validatePreprocessingConfig,
  createDefaultPreprocessingConfig,
  calculateStatistics,
  scaleData,
  imputeMissing,
  handleOutliers,
  preprocessData,
  validateDataPoint,
  validateDataset,
} from '../src/preprocessing';
import { DataPoint } from '../src/types';

describe('Preprocessing Utilities', () => {
  describe('validatePreprocessingConfig', () => {
    it('should validate a valid config', () => {
      const config = {
        scaling: 'standard' as const,
        encoding: 'one-hot' as const,
        imputation: 'mean' as const,
      };
      const result = validatePreprocessingConfig(config);
      expect(result).toEqual(config);
    });

    it('should throw on invalid config', () => {
      const config = {
        scaling: 'invalid',
        encoding: 'invalid',
      };
      expect(() => validatePreprocessingConfig(config)).toThrow();
    });
  });

  describe('createDefaultPreprocessingConfig', () => {
    it('should create default config', () => {
      const config = createDefaultPreprocessingConfig();
      expect(config.scaling).toBe('standard');
      expect(config.encoding).toBe('one-hot');
      expect(config.imputation).toBe('mean');
      expect(config.handleMissing).toBe(true);
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate statistics for valid data', () => {
      const data = [1, 2, 3, 4, 5];
      const stats = calculateStatistics(data);
      
      expect(stats.mean[0]).toBe(3);
      expect(stats.min[0]).toBe(1);
      expect(stats.max[0]).toBe(5);
      expect(stats.median[0]).toBe(3);
    });

    it('should handle empty data', () => {
      const stats = calculateStatistics([]);
      expect(stats.mean[0]).toBe(0);
      expect(stats.missingCount[0]).toBe(0);
    });

    it('should handle missing values', () => {
      const data = [1, 2, NaN, 4, null as unknown as number];
      const stats = calculateStatistics(data);
      
      expect(stats.missingCount[0]).toBe(2);
      expect(stats.missingPercentage[0]).toBe(0.4);
    });
  });

  describe('scaleData', () => {
    it('should apply standard scaling', () => {
      const data = [[1, 2], [3, 4], [5, 6]];
      const { scaled, state } = scaleData(data, 'standard');
      
      expect(scaled.length).toBe(3);
      expect(state.method).toBe('standard');
      expect(state.mean).toBeDefined();
      expect(state.std).toBeDefined();
    });

    it('should apply minmax scaling', () => {
      const data = [[1, 2], [3, 4], [5, 6]];
      const { scaled, state } = scaleData(data, 'minmax');
      
      expect(scaled.length).toBe(3);
      expect(state.method).toBe('minmax');
      expect(scaled[0][0]).toBeCloseTo(0);
      expect(scaled[2][0]).toBeCloseTo(1);
    });

    it('should use existing scaler state', () => {
      const data = [[1, 2], [3, 4]];
      const { state } = scaleData(data, 'standard');
      
      const newData = [[2, 3], [4, 5]];
      const { scaled } = scaleData(newData, 'standard', state);
      
      expect(scaled.length).toBe(2);
    });

    it('should handle empty data', () => {
      const { scaled, state } = scaleData([], 'standard');
      expect(scaled).toEqual([]);
      expect(state.method).toBe('standard');
    });
  });

  describe('imputeMissing', () => {
    it('should impute with mean', () => {
      const data = [[1, 2], [NaN, 4], [5, NaN]];
      const imputed = imputeMissing(data, 'mean');
      
      expect(imputed[1][0]).toBeCloseTo(3);
      expect(imputed[2][1]).toBeCloseTo(3);
    });

    it('should impute with median', () => {
      const data = [[1, 2], [NaN, 4], [5, NaN]];
      const imputed = imputeMissing(data, 'median');
      
      expect(imputed[1][0]).toBeCloseTo(3);
      expect(imputed[2][1]).toBeCloseTo(3);
    });

    it('should impute with constant value', () => {
      const data = [[1, 2], [NaN, 4], [5, NaN]];
      const imputed = imputeMissing(data, 'constant', 0);
      
      expect(imputed[1][0]).toBe(0);
      expect(imputed[2][1]).toBe(0);
    });
  });

  describe('handleOutliers', () => {
    it('should detect outliers using IQR', () => {
      const data = [[1], [2], [3], [4], [100]];
      const processed = handleOutliers(data, 'iqr', 1.5, 'clip');
      
      expect(processed.length).toBe(5);
      expect(processed[4][0]).toBeLessThan(100);
    });

    it('should detect outliers using z-score', () => {
      const data = [[1], [2], [3], [4], [100]];
      const processed = handleOutliers(data, 'zscore', 2, 'clip');
      
      expect(processed.length).toBe(5);
      expect(processed[4][0]).toBeLessThan(100);
    });

    it('should replace outliers with median', () => {
      const data = [[1], [2], [3], [4], [100]];
      const processed = handleOutliers(data, 'iqr', 1.5, 'replace');
      
      expect(processed[4][0]).toBeCloseTo(3);
    });
  });

  describe('preprocessData', () => {
    it('should apply full preprocessing pipeline', () => {
      const data: DataPoint[] = [
        { features: [1, 2], label: 0 },
        { features: [3, 4], label: 1 },
        { features: [5, 6], label: 1 },
      ];
      
      const config = createDefaultPreprocessingConfig();
      const result = preprocessData(data, config);
      
      expect(result.processedData.length).toBe(3);
      expect(result.scaler).toBeDefined();
      expect(result.statistics).toBeDefined();
    });

    it('should handle missing values', () => {
      const data: DataPoint[] = [
        { features: [1, 2], label: 0 },
        { features: [NaN as unknown as number, 4], label: 1 },
        { features: [5, NaN as unknown as number], label: 1 },
      ];
      
      const config = { ...createDefaultPreprocessingConfig(), handleMissing: true };
      const result = preprocessData(data, config);
      
      expect(result.processedData[1].features[0]).not.toBeNaN();
      expect(result.processedData[2].features[1]).not.toBeNaN();
    });
  });

  describe('validateDataPoint', () => {
    it('should validate a valid data point', () => {
      const dataPoint = { features: [1, 2, 3], label: 0 };
      const result = validateDataPoint(dataPoint);
      expect(result).toEqual(dataPoint);
    });

    it('should throw on invalid data point', () => {
      const dataPoint = { features: 'invalid' as unknown as number[] };
      expect(() => validateDataPoint(dataPoint)).toThrow();
    });
  });

  describe('validateDataset', () => {
    it('should validate a valid dataset', () => {
      const dataset = {
        data: [{ features: [1, 2], label: 0 }],
        shape: [1, 2] as [number, number],
      };
      const result = validateDataset(dataset);
      expect(result).toEqual(dataset);
    });

    it('should throw on invalid dataset', () => {
      const dataset = {
        data: [],
        shape: [-1, 2] as [number, number],
      };
      expect(() => validateDataset(dataset)).toThrow();
    });
  });
});
