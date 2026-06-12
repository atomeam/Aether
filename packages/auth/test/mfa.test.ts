/**
 * @aether/auth - MFA Authentication Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MFAAuth, setupMFAAuth, createMFAAuth } from '../src/mfa.js';
import { MFAFailedError, MFARequiredError } from '../src/types.js';

describe('MFAAuth', () => {
  let mfaAuth: MFAAuth;

  beforeEach(() => {
    mfaAuth = new MFAAuth();
  });

  describe('generateTOTPSecret', () => {
    it('should generate a TOTP secret', () => {
      const secret = mfaAuth.generateTOTPSecret();

      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate different secrets each time', () => {
      const secret1 = mfaAuth.generateTOTPSecret();
      const secret2 = mfaAuth.generateTOTPSecret();

      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate backup codes', () => {
      const codes = mfaAuth.generateBackupCodes(10);

      expect(codes).toHaveLength(10);
      expect(codes.every(code => code.length === 8)).toBe(true);
    });

    it('should generate unique codes', () => {
      const codes = mfaAuth.generateBackupCodes(10);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(10);
    });
  });

  describe('generateTOTPCode', () => {
    it('should generate a TOTP code', () => {
      const secret = mfaAuth.generateTOTPSecret();
      const code = mfaAuth.generateTOTPCode(secret);

      expect(code).toBeDefined();
      expect(code.length).toBe(6);
    });

    it('should generate codes with custom digits', () => {
      const secret = mfaAuth.generateTOTPSecret();
      const code = mfaAuth.generateTOTPCode(secret, { digits: 8 });

      expect(code.length).toBe(8);
    });
  });

  describe('verifyTOTPCode', () => {
    it('should verify correct TOTP code', () => {
      const secret = mfaAuth.generateTOTPSecret();
      const code = mfaAuth.generateTOTPCode(secret);
      const isValid = mfaAuth.verifyTOTPCode(secret, code);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect TOTP code', () => {
      const secret = mfaAuth.generateTOTPSecret();
      const isValid = mfaAuth.verifyTOTPCode(secret, '000000');

      expect(isValid).toBe(false);
    });

    it('should verify code within time window', () => {
      const secret = mfaAuth.generateTOTPSecret();
      const code = mfaAuth.generateTOTPCode(secret);
      const isValid = mfaAuth.verifyTOTPCode(secret, code, undefined, 1);

      expect(isValid).toBe(true);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify correct backup code', () => {
      const codes = mfaAuth.generateBackupCodes(10);
      const isValid = mfaAuth.verifyBackupCode(codes, codes[0]);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect backup code', () => {
      const codes = mfaAuth.generateBackupCodes(10);
      const isValid = mfaAuth.verifyBackupCode(codes, '00000000');

      expect(isValid).toBe(false);
    });

    it('be case-insensitive', () => {
      const codes = mfaAuth.generateBackupCodes(10);
      const isValid = mfaAuth.verifyBackupCode(codes, codes[0].toLowerCase());

      expect(isValid).toBe(true);
    });
  });

  describe('removeBackupCode', () => {
    it('should remove used backup code', () => {
      const codes = mfaAuth.generateBackupCodes(10);
      const updated = mfaAuth.removeBackupCode(codes, codes[0]);

      expect(updated).toHaveLength(9);
      expect(updated.includes(codes[0])).toBe(false);
    });

    it('should not remove other codes', () => {
      const codes = mfaAuth.generateBackupCodes(10);
      const updated = mfaAuth.removeBackupCode(codes, codes[0]);

      expect(updated.includes(codes[1])).toBe(true);
    });
  });

  describe('generateTOTPUri', () => {
    it('should generate TOTP URI', () => {
      const secret = mfaAuth.generateTOTPSecret();
      const uri = mfaAuth.generateTOTPUri(secret, 'user@example.com', 'MyApp');

      expect(uri).toBeDefined();
      expect(uri).toContain('otpauth://totp');
      expect(uri).toContain('MyApp');
      expect(uri).toContain('user@example.com');
      expect(uri).toContain('secret=');
    });

    it('should include custom parameters', () => {
      const secret = mfaAuth.generateTOTPSecret();
      const uri = mfaAuth.generateTOTPUri(secret, 'user@example.com', 'MyApp', {
        digits: 8,
        period: 60
      });

      expect(uri).toContain('digits=8');
      expect(uri).toContain('period=60');
    });
  });

  describe('verifyMFA', () => {
    it('should verify TOTP factor', async () => {
      const secret = mfaAuth.generateTOTPSecret();
      const code = mfaAuth.generateTOTPCode(secret);
      const config = {
        enabled: true,
        factors: ['totp' as const],
        totpSecret: secret
      };

      const isValid = await mfaAuth.verifyMFA(config, {
        factor: 'totp',
        code,
        timestamp: Date.now()
      });

      expect(isValid).toBe(true);
    });

    it('should throw when MFA not enabled', async () => {
      const config = {
        enabled: false,
        factors: ['totp' as const]
      };

      await expect(
        mfaAuth.verifyMFA(config, {
          factor: 'totp',
          code: '000000',
          timestamp: Date.now()
        })
      ).rejects.toThrow(MFARequiredError);
    });

    it('should throw when factor not enabled', async () => {
      const config = {
        enabled: true,
        factors: ['backup' as const]
      };

      await expect(
        mfaAuth.verifyMFA(config, {
          factor: 'totp',
          code: '000000',
          timestamp: Date.now()
        })
      ).rejects.toThrow(MFAFailedError);
    });

    it('should verify backup code factor', async () => {
      const codes = mfaAuth.generateBackupCodes(10);
      const config = {
        enabled: true,
        factors: ['backup' as const],
        backupCodes: codes
      };

      const isValid = await mfaAuth.verifyMFA(config, {
        factor: 'backup',
        code: codes[0],
        timestamp: Date.now()
      });

      expect(isValid).toBe(true);
    });
  });

  describe('factory functions', () => {
    it('should setup global MFA auth', () => {
      const globalMFA = setupMFAAuth();
      expect(globalMFA).toBeInstanceOf(MFAAuth);
      expect(getMFAAuth()).toBe(globalMFA);
    });

    it('should create new instance', () => {
      const auth = createMFAAuth();
      expect(auth).toBeInstanceOf(MFAAuth);
    });
  });
});
