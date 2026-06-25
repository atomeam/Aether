/**
 * Tests for address utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isValidAddress,
  truncateAddress,
  areAddressesEqual,
  toChecksumAddress,
} from '../src/utils/addresses';

describe('Address Utilities', () => {
  describe('isValidAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
      expect(isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
      expect(isValidAddress('0xffffffffffffffffffffffffffffffffffffffff')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44')).toBe(false); // Too short
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e123')).toBe(false); // Too long
      expect(isValidAddress('742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(false); // Missing 0x
      expect(isValidAddress('0xG42d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(false); // Invalid char
      expect(isValidAddress('')).toBe(false);
    });
  });

  describe('truncateAddress', () => {
    it('should truncate address with default chars', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const;
      expect(truncateAddress(address)).toBe('0x742d...f44e');
    });

    it('should truncate address with custom chars', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const;
      expect(truncateAddress(address, 6)).toBe('0x742d35...38f44e');
      expect(truncateAddress(address, 2)).toBe('0x74...4e');
    });

    it('should handle edge cases', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const;
      expect(truncateAddress(address, 20)).toBe('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    });
  });

  describe('areAddressesEqual', () => {
    it('should compare addresses case-insensitively', () => {
      const addr1 = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const;
      const addr2 = '0x742d35cc6634c0532925a3b844bc454e4438f44e' as const;
      const addr3 = '0x742d35Cc6634C0532925a3b844Bc454e4438f44f' as const;

      expect(areAddressesEqual(addr1, addr2)).toBe(true);
      expect(areAddressesEqual(addr1, addr3)).toBe(false);
    });
  });

  describe('toChecksumAddress', () => {
    it('should convert to checksum format', () => {
      const address = '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359' as const;
      const checksummed = toChecksumAddress(address);
      expect(checksummed).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });
});
