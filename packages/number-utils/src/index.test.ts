import { describe, it, expect } from 'vitest';
import { numberUtils } from './index';

describe('NumberUtils', () => {
  describe('clamp', () => {
    it('should clamp to min', () => {
      expect(numberUtils.clamp(5, 10, 20)).toBe(10);
    });

    it('should clamp to max', () => {
      expect(numberUtils.clamp(25, 10, 20)).toBe(20);
    });

    it('should return value within range', () => {
      expect(numberUtils.clamp(15, 10, 20)).toBe(15);
    });
  });

  describe('random', () => {
    it('should return number in range', () => {
      const result = numberUtils.random(0, 10);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    });
  });

  describe('randomInt', () => {
    it('should return integer in range', () => {
      const result = numberUtils.randomInt(0, 10);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('round', () => {
    it('should round to precision', () => {
      expect(numberUtils.round(1.2345, 2)).toBe(1.23);
    });
  });

  describe('format', () => {
    it('should format number', () => {
      expect(numberUtils.format(1.2345, 2)).toBe('1.23');
    });
  });
});