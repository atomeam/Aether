/**
 * Tests for unit conversion utilities
 */

import { describe, it, expect } from 'vitest';
import {
  fromWei,
  toWei,
  formatWei,
  parseWei,
  convertDecimals,
  formatTokenAmount,
  parseTokenAmount,
  calculateGasCost,
  gweiToWei,
  weiToGwei,
} from '../src/utils/units';

describe('Unit Utilities', () => {
  describe('fromWei', () => {
    it('should convert wei to ether', () => {
      expect(fromWei('1000000000000000000')).toBe('1');
      expect(fromWei('500000000000000000')).toBe('0.5');
      expect(fromWei('10000000000000000000')).toBe('10');
    });

    it('should handle bigint input', () => {
      expect(fromWei(1000000000000000000n)).toBe('1');
      expect(fromWei(500000000000000000n)).toBe('0.5');
    });

    it('should handle custom decimals', () => {
      expect(fromWei('1000000', 6)).toBe('1');
      expect(fromWei('500000', 6)).toBe('0.5');
    });
  });

  describe('toWei', () => {
    it('should convert ether to wei', () => {
      expect(toWei('1')).toBe(1000000000000000000n);
      expect(toWei('0.5')).toBe(500000000000000000n);
      expect(toWei('10')).toBe(10000000000000000000n);
    });

    it('should handle custom decimals', () => {
      expect(toWei('1', 6)).toBe(1000000n);
      expect(toWei('0.5', 6)).toBe(500000n);
    });
  });

  describe('formatWei', () => {
    it('should format wei to human-readable string', () => {
      expect(formatWei('1000000000000000000', 2)).toBe('1.00');
      expect(formatWei('500000000000000000', 2)).toBe('0.50');
      expect(formatWei('1234567890123456789', 4)).toBe('1.2345');
    });

    it('should handle zero decimals', () => {
      expect(formatWei('1000000000000000000', 0)).toBe('1');
    });
  });

  describe('parseWei', () => {
    it('should parse human-readable string to wei', () => {
      expect(parseWei('1')).toBe(1000000000000000000n);
      expect(parseWei('0.5')).toBe(500000000000000000n);
      expect(parseWei('1.2345')).toBe(1234500000000000000n);
    });
  });

  describe('convertDecimals', () => {
    it('should convert between same decimals', () => {
      expect(convertDecimals('1000000000000000000', 18, 18)).toBe(1000000000000000000n);
    });

    it('should convert from higher to lower decimals', () => {
      expect(convertDecimals('1000000000000000000', 18, 6)).toBe(1000000n);
    });

    it('should convert from lower to higher decimals', () => {
      expect(convertDecimals('1000000', 6, 18)).toBe(1000000000000000000n);
    });
  });

  describe('formatTokenAmount', () => {
    it('should format token amount with decimals', () => {
      expect(formatTokenAmount('1000000000000000000', 18, 4)).toBe('1.0000');
      expect(formatTokenAmount('500000000000000000', 18, 2)).toBe('0.50');
      expect(formatTokenAmount('1000000', 6, 2)).toBe('1.00');
    });

    it('should handle tokens with different decimals', () => {
      expect(formatTokenAmount('1000000', 6, 4)).toBe('1.0000');
      expect(formatTokenAmount('100', 2, 2)).toBe('1.00');
    });
  });

  describe('parseTokenAmount', () => {
    it('should parse token amount to smallest unit', () => {
      expect(parseTokenAmount('1', 18)).toBe(1000000000000000000n);
      expect(parseTokenAmount('0.5', 18)).toBe(500000000000000000n);
      expect(parseTokenAmount('1', 6)).toBe(1000000n);
    });
  });

  describe('calculateGasCost', () => {
    it('should calculate gas cost in ETH', () => {
      expect(calculateGasCost('21000', '20000000000')).toBe('0.00042');
      expect(calculateGasCost('100000', '50000000000')).toBe('0.005');
    });

    it('should handle bigint input', () => {
      expect(calculateGasCost(21000n, 20000000000n)).toBe('0.00042');
    });
  });

  describe('gweiToWei', () => {
    it('should convert Gwei to wei', () => {
      expect(gweiToWei('1')).toBe(1000000000n);
      expect(gweiToWei('20')).toBe(20000000000n);
      expect(gweiToWei('50')).toBe(50000000000n);
    });

    it('should handle bigint input', () => {
      expect(gweiToWei(1n)).toBe(1000000000n);
      expect(gweiToWei(20n)).toBe(20000000000n);
    });
  });

  describe('weiToGwei', () => {
    it('should convert wei to Gwei', () => {
      expect(weiToGwei('1000000000')).toBe('1');
      expect(weiToGwei('20000000000')).toBe('20');
      expect(weiToGwei('50000000000')).toBe('50');
    });

    it('should handle bigint input', () => {
      expect(weiToGwei(1000000000n)).toBe('1');
      expect(weiToGwei(20000000000n)).toBe('20');
    });
  });
});
