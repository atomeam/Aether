import { describe, it, expect } from 'vitest';
import { arrayUtils } from './index';

describe('ArrayUtils', () => {
  describe('chunk', () => {
    it('should chunk array into smaller arrays', () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const result = arrayUtils.chunk(arr, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle remaining elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = arrayUtils.chunk(arr, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should return empty array for empty input', () => {
      const result = arrayUtils.chunk([], 2);
      expect(result).toEqual([]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      const arr = [1, 2, 2, 3, 3, 3];
      const result = arrayUtils.unique(arr);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      const result = arrayUtils.unique([]);
      expect(result).toEqual([]);
    });
  });

  describe('shuffle', () => {
    it('should shuffle array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = arrayUtils.shuffle(arr);
      expect(result).toHaveLength(5);
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result).toContain(4);
      expect(result).toContain(5);
    });

    it('should not modify original array', () => {
      const arr = [1, 2, 3];
      arrayUtils.shuffle(arr);
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  describe('sample', () => {
    it('should sample random elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = arrayUtils.sample(arr, 2);
      expect(result).toHaveLength(2);
    });

    it('should handle count larger than array', () => {
      const arr = [1, 2];
      const result = arrayUtils.sample(arr, 5);
      expect(result).toHaveLength(2);
    });
  });
});