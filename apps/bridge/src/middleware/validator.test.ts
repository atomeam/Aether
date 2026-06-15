/**
 * Tests for MutationValidator Middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  validateMutation, 
  validateMutations,
  MalformedContractError,
  CoordinateOutOfBoundsError 
} from './validator';

// Mock environment
const mockEnv = {
  RELIABILITY_TRACING: {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        run: vi.fn(() => Promise.resolve())
      }))
    }))
  }
} as any;

describe('MutationValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Contract B Validation', () => {
    it('should accept valid multi-field payloads', async () => {
      const validPayload = {
        field1: 'value1',
        field2: 'value2',
        field3: 123
      };

      const result = await validateMutation(validPayload, mockEnv);
      expect(result).toEqual(validPayload);
    });

    it('should reject single-field payloads', async () => {
      const singleFieldPayload = {
        field1: 'value1'
      };

      await expect(validateMutation(singleFieldPayload, mockEnv))
        .rejects.toThrow(MalformedContractError);
    });

    it('should reject null payloads', async () => {
      await expect(validateMutation(null, mockEnv))
        .rejects.toThrow(MalformedContractError);
    });

    it('should reject non-object payloads', async () => {
      await expect(validateMutation('string', mockEnv))
        .rejects.toThrow(MalformedContractError);
    });

    it('should reject payloads with undefined values', async () => {
      const invalidPayload = {
        field1: 'value1',
        field2: undefined
      };

      await expect(validateMutation(invalidPayload, mockEnv))
        .rejects.toThrow(MalformedContractError);
    });
  });

  describe('Spatial Coordinate Validation', () => {
    it('should accept valid y-axis coordinates (0-111)', async () => {
      const validPayload = {
        x: 50,
        y: 55,
        z: 30,
        action: 'move'
      };

      const result = await validateMutation(validPayload, mockEnv);
      expect(result).toEqual(validPayload);
    });

    it('should reject y-axis coordinates below 0', async () => {
      const invalidPayload = {
        x: 50,
        y: -1,
        z: 30,
        action: 'move'
      };

      await expect(validateMutation(invalidPayload, mockEnv))
        .rejects.toThrow(CoordinateOutOfBoundsError);
    });

    it('should reject y-axis coordinates above 111', async () => {
      const invalidPayload = {
        x: 50,
        y: 112,
        z: 30,
        action: 'move'
      };

      await expect(validateMutation(invalidPayload, mockEnv))
        .rejects.toThrow(CoordinateOutOfBoundsError);
    });

    it('should accept y-axis coordinates at boundary values', async () => {
      const validPayload = {
        y: 0,
        action: 'move'
      };

      const result = await validateMutation(validPayload, mockEnv);
      expect(result).toEqual(validPayload);

      const validPayload2 = {
        y: 111,
        action: 'move'
      };

      const result2 = await validateMutation(validPayload2, mockEnv);
      expect(result2).toEqual(validPayload2);
    });

    it('should reject non-numeric y-axis coordinates', async () => {
      const invalidPayload = {
        y: 'invalid',
        action: 'move'
      };

      await expect(validateMutation(invalidPayload, mockEnv))
        .rejects.toThrow(MalformedContractError);
    });
  });

  describe('Error Logging', () => {
    it('should log validation failures to reliability-tracing', async () => {
      const invalidPayload = {
        field1: 'value1'
      };

      await expect(validateMutation(invalidPayload, mockEnv))
        .rejects.toThrow(MalformedContractError);

      expect(mockEnv.RELIABILITY_TRACING.prepare).toHaveBeenCalled();
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple payloads successfully', async () => {
      const payloads = [
        { field1: 'value1', field2: 'value2' },
        { field3: 'value3', field4: 'value4' }
      ];

      const result = await validateMutations(payloads, mockEnv);
      expect(result.validated).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle mixed valid and invalid payloads', async () => {
      const payloads = [
        { field1: 'value1', field2: 'value2' },
        { field1: 'single' } // Invalid
      ];

      const result = await validateMutations(payloads, mockEnv);
      expect(result.validated).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});