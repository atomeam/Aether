import { describe, it, expect } from 'vitest';
import { objectUtils } from './index';

describe('ObjectUtils', () => {
  describe('deepClone', () => {
    it('should clone object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = objectUtils.deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 } as any;
      const result = objectUtils.deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('omit', () => {
    it('should omit keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = objectUtils.omit(obj, ['b', 'c']);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('pick', () => {
    it('should pick keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = objectUtils.pick(obj, ['a', 'b']);
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });
});