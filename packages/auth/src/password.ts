/**
 * @aether/auth - Password Hashing Module
 * 
 * Password hashing with bcrypt and argon2 support,
 * password policy validation, and strength checking
 */

import crypto from 'crypto';
import {
  PasswordHashConfig,
  HashAlgorithm,
  PasswordPolicy,
  PasswordValidationResult,
  PasswordPolicyError
} from './types.js';
import { PasswordHashConfigSchema, PasswordPolicySchema, PasswordValidationResultSchema } from './schemas.js';

export class PasswordAuth {
  private defaultConfig: PasswordHashConfig;
  private policy: PasswordPolicy;

  constructor(
    hashConfig?: Partial<PasswordHashConfig>,
    policy?: Partial<PasswordPolicy>
  ) {
    this.defaultConfig = PasswordHashConfigSchema.parse({
      algorithm: 'argon2id',
      rounds: 10,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      ...hashConfig
    });

    this.policy = PasswordPolicySchema.parse({
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      ...policy
    });
  }

  /**
   * Hash a password using the configured algorithm
   */
  async hashPassword(password: string, config?: Partial<PasswordHashConfig>): Promise<string> {
    const hashConfig = PasswordHashConfigSchema.parse({ ...this.defaultConfig, ...config });

    switch (hashConfig.algorithm) {
      case 'bcrypt':
        return this.hashBcrypt(password, hashConfig.rounds || 10);
      case 'argon2id':
      case 'argon2i':
      case 'argon2d':
        return this.hashArgon2(password, hashConfig);
      default:
        throw new Error(`Unsupported hash algorithm: ${hashConfig.algorithm}`);
    }
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Detect hash type from prefix
    if (hash.startsWith('$argon2')) {
      const result = await this.verifyArgon2(password, hash);
      return result === true;
    } else if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
      return this.verifyBcrypt(password, hash);
    }

    // Fallback to argon2
    const result = await this.verifyArgon2(password, hash);
    return result === true;
  }

  /**
   * Validate password against policy
   */
  validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    const minLength = this.policy.minLength ?? 8;
    const maxLength = this.policy.maxLength ?? 128;

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }

    if (password.length > maxLength) {
      errors.push(`Password must not exceed ${maxLength} characters`);
    }

    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    for (const pattern of this.policy.forbiddenPatterns || []) {
      if (new RegExp(pattern).test(password)) {
        errors.push('Password contains forbidden pattern');
      }
    }

    const valid = errors.length === 0;
    const strength = this.calculateStrength(password);

    return PasswordValidationResultSchema.parse({ valid, errors, strength });
  }

  /**
   * Hash password using bcrypt (simplified implementation)
   * Note: In production, use the 'bcrypt' npm package
   */
  private async hashBcrypt(password: string, rounds: number): Promise<string> {
    // This is a simplified bcrypt-like implementation
    // In production, use the actual bcrypt library
    const salt = crypto.randomBytes(16).toString('base64');
    const hash = crypto.pbkdf2Sync(password, salt, rounds, 64, 'sha512').toString('base64');
    return `$2b$${rounds}$${salt}${hash}`;
  }

  /**
   * Verify bcrypt password
   */
  private async verifyBcrypt(password: string, hash: string): Promise<boolean> {
    try {
      const parts = hash.split('$');
      const rounds = parseInt(parts[2], 10);
      const saltAndHash = parts[3];
      const salt = saltAndHash.slice(0, 24);
      const expectedHash = saltAndHash.slice(24);

      const computedHash = crypto.pbkdf2Sync(password, salt, rounds, 64, 'sha512').toString('base64');
      return this.constantTimeCompare(expectedHash, computedHash);
    } catch {
      return false;
    }
  }

  /**
   * Hash password using argon2 (simplified implementation)
   * Note: In production, use the 'argon2' npm package
   */
  private async hashArgon2(password: string, config: PasswordHashConfig): Promise<string> {
    // This is a simplified argon2-like implementation
    // In production, use the actual argon2 library
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      (config.timeCost || 3) * 1000,
      32,
      'sha256'
    );

    const version = 19;
    const params = `${config.memoryCost || 65536},${config.timeCost || 3},${config.parallelism || 4}`;
    const b64salt = salt.toString('base64');
    const b64hash = hash.toString('base64');

    return `$argon2${config.algorithm.slice(-2)}$v=${version}$m=${params}$${b64salt}$${b64hash}`;
  }

  /**
   * Verify argon2 password
   */
  private async verifyArgon2(password: string, hash: string): Promise<string | boolean> {
    try {
      const parts = hash.split('$');
      const algorithm = parts[1];
      const params = parts[3].replace('m=', '').split(',');
      const memoryCost = parseInt(params[0], 10);
      const timeCost = parseInt(params[1], 10);
      const parallelism = parseInt(params[2], 10);
      const b64salt = parts[4];
      const b64hash = parts[5];

      const salt = Buffer.from(b64salt, 'base64');
      const expectedHash = Buffer.from(b64hash, 'base64');

      const computedHash = crypto.pbkdf2Sync(
        password,
        salt,
        timeCost * 1000,
        32,
        'sha256'
      );

      return this.constantTimeCompare(expectedHash.toString('base64'), computedHash.toString('base64'));
    } catch {
      return false;
    }
  }

  /**
   * Calculate password strength
   */
  private calculateStrength(password: string): 'weak' | 'fair' | 'good' | 'strong' {
    let score = 0;

    // Length score
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    // Complexity
    if (password.length >= 20) score += 1;
    if (/\d.*\d.*\d/.test(password)) score += 1; // Multiple numbers
    if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1; // Multiple special chars

    if (score <= 3) return 'weak';
    if (score <= 5) return 'fair';
    if (score <= 7) return 'good';
    return 'strong';
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Generate a secure random password
   */
  generatePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomBytes = crypto.randomBytes(length);
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    return password;
  }

  /**
   * Check if password needs rehashing (e.g., after config change)
   */
  async needsRehash(hash: string, config?: Partial<PasswordHashConfig>): Promise<boolean> {
    const hashConfig = PasswordHashConfigSchema.parse({ ...this.defaultConfig, ...config });

    if (hash.startsWith('$argon2')) {
      // Check if parameters match
      const parts = hash.split('$');
      const params = parts[3].replace('m=', '').split(',');
      const memoryCost = parseInt(params[0], 10);
      const timeCost = parseInt(params[1], 10);
      const parallelism = parseInt(params[2], 10);

      return (
        memoryCost !== (hashConfig.memoryCost || 65536) ||
        timeCost !== (hashConfig.timeCost || 3) ||
        parallelism !== (hashConfig.parallelism || 4)
      );
    }

    if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
      const parts = hash.split('$');
      const rounds = parseInt(parts[2], 10);
      return rounds !== (hashConfig.rounds || 10);
    }

    return true;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalPasswordAuth: PasswordAuth | null = null;

export function setupPasswordAuth(
  hashConfig?: Partial<PasswordHashConfig>,
  policy?: Partial<PasswordPolicy>
): PasswordAuth {
  globalPasswordAuth = new PasswordAuth(hashConfig, policy);
  return globalPasswordAuth;
}

export function getPasswordAuth(): PasswordAuth | null {
  return globalPasswordAuth;
}

export function createPasswordAuth(
  hashConfig?: Partial<PasswordHashConfig>,
  policy?: Partial<PasswordPolicy>
): PasswordAuth {
  return new PasswordAuth(hashConfig, policy);
}
