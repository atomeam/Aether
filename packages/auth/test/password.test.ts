/**
 * @aether/auth - Password Authentication Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordAuth, setupPasswordAuth, createPasswordAuth } from '../src/password.js';
import { PasswordPolicyError } from '../src/types.js';

describe('PasswordAuth', () => {
  let passwordAuth: PasswordAuth;

  beforeEach(() => {
    passwordAuth = new PasswordAuth();
  });

  describe('hashPassword', () => {
    it('should hash a password with argon2id', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordAuth.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$argon2')).toBe(true);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'MySecurePassword123!';
      const hash1 = await passwordAuth.hashPassword(password);
      const hash2 = await passwordAuth.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should support bcrypt algorithm', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordAuth.hashPassword(password, { algorithm: 'bcrypt', rounds: 10 });

      expect(hash).toBeDefined();
      expect(hash.startsWith('$2b$')).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordAuth.hashPassword(password);
      const isValid = await passwordAuth.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'MySecurePassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await passwordAuth.hashPassword(password);
      const isValid = await passwordAuth.verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should verify bcrypt hash', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordAuth.hashPassword(password, { algorithm: 'bcrypt' });
      const isValid = await passwordAuth.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const password = 'MySecurePassword123!';
      const result = passwordAuth.validatePassword(password);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const password = 'Short1!';
      const result = passwordAuth.validatePassword(password);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject password without uppercase', () => {
      const password = 'mysecurepassword123!';
      const result = passwordAuth.validatePassword(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const password = 'MYSECUREPASSWORD123!';
      const result = passwordAuth.validatePassword(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without numbers', () => {
      const password = 'MySecurePassword!';
      const result = passwordAuth.validatePassword(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special characters', () => {
      const password = 'MySecurePassword123';
      const result = passwordAuth.validatePassword(password);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should calculate password strength', () => {
      const weak = passwordAuth.validatePassword('short');
      expect(weak.strength).toBe('weak');

      const fair = passwordAuth.validatePassword('Short123');
      expect(fair.strength).toBe('fair');

      const good = passwordAuth.validatePassword('GoodPassword123!');
      expect(good.strength).toBe('good');

      const strong = passwordAuth.validatePassword('VeryStrongPassword123!@#');
      expect(strong.strength).toBe('strong');
    });
  });

  describe('generatePassword', () => {
    it('should generate secure random password', () => {
      const password = passwordAuth.generatePassword(16);

      expect(password).toBeDefined();
      expect(password.length).toBe(16);
    });

    it('should generate different passwords each time', () => {
      const password1 = passwordAuth.generatePassword(16);
      const password2 = passwordAuth.generatePassword(16);

      expect(password1).not.toBe(password2);
    });

    it('should generate valid password according to policy', () => {
      const password = passwordAuth.generatePassword(16);
      const result = passwordAuth.validatePassword(password);

      expect(result.valid).toBe(true);
    });
  });

  describe('needsRehash', () => {
    it('should detect when rehash is needed', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordAuth.hashPassword(password, { memoryCost: 1024 });
      const needsRehash = await passwordAuth.needsRehash(hash, { memoryCost: 65536 });

      expect(needsRehash).toBe(true);
    });

    it('should return false when parameters match', async () => {
      const password = 'MySecurePassword123!';
      const hash = await passwordAuth.hashPassword(password);
      const needsRehash = await passwordAuth.needsRehash(hash);

      expect(needsRehash).toBe(false);
    });
  });

  describe('custom policy', () => {
    it('should use custom password policy', () => {
      const customAuth = new PasswordAuth(undefined, {
        minLength: 12,
        requireUppercase: false,
        requireNumbers: false,
        requireSpecialChars: false
      });

      const result = customAuth.validatePassword('lowercaseonly');
      expect(result.valid).toBe(true);
    });
  });

  describe('factory functions', () => {
    it('should setup global password auth', () => {
      const globalAuth = setupPasswordAuth();
      expect(globalAuth).toBeInstanceOf(PasswordAuth);
      expect(getPasswordAuth()).toBe(globalAuth);
    });

    it('should create new instance', () => {
      const auth = createPasswordAuth();
      expect(auth).toBeInstanceOf(PasswordAuth);
    });
  });
});
