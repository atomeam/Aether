/**
 * @aether/auth - Multi-Factor Authentication Module
 * 
 * MFA implementation with TOTP (Time-based One-Time Password),
 * SMS, email, and backup codes support
 */

import crypto from 'crypto';
import {
  MFAConfig,
  MFAFactor,
  MFAVerification,
  TOTPConfig,
  MFAFailedError,
  MFARequiredError
} from './types.js';
import { MFAConfigSchema, MFAVerificationSchema, TOTPConfigSchema } from './schemas.js';

export class MFAAuth {
  /**
   * Generate a TOTP secret
   */
  generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Generate a TOTP code for a given secret
   */
  generateTOTPCode(secret: string, config?: Partial<TOTPConfig>): string {
    const totpConfig = TOTPConfigSchema.parse({ secret, ...config });
    const time = Math.floor(Date.now() / 1000 / totpConfig.period);
    return this.generateTOTPForTime(secret, time, totpConfig);
  }

  /**
   * Verify a TOTP code
   */
  verifyTOTPCode(
    secret: string,
    code: string,
    config?: Partial<TOTPConfig>,
    window: number = 1
  ): boolean {
    const totpConfig = TOTPConfigSchema.parse({ secret, ...config });
    const time = Math.floor(Date.now() / 1000 / totpConfig.period);

    // Check current time and adjacent windows
    for (let i = -window; i <= window; i++) {
      const expectedCode = this.generateTOTPForTime(secret, time + i, totpConfig);
      if (this.constantTimeCompare(expectedCode, code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate TOTP for a specific time counter
   */
  private generateTOTPForTime(secret: string, time: number, config: TOTPConfig): string {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(time));

    const algorithm = config.algorithm || 'SHA1';
    const digits = config.digits || 6;
    const hmac = crypto.createHmac(algorithm.toLowerCase().replace('sha', 'sha'), this.base32Decode(secret));
    hmac.update(buffer);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0x0f;
    const code = (
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)
    ) % Math.pow(10, digits);

    return code.toString().padStart(digits, '0');
  }

  /**
   * Verify a backup code
   */
  verifyBackupCode(backupCodes: string[], code: string): boolean {
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const index = backupCodes.findIndex(c => 
      c.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedCode
    );
    return index !== -1;
  }

  /**
   * Remove a used backup code
   */
  removeBackupCode(backupCodes: string[], code: string): string[] {
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return backupCodes.filter(c => 
      c.toUpperCase().replace(/[^A-Z0-9]/g, '') !== normalizedCode
    );
  }

  /**
   * Generate a TOTP URI for QR code generation
   */
  generateTOTPUri(
    secret: string,
    accountName: string,
    issuer: string,
    config?: Partial<TOTPConfig>
  ): string {
    const totpConfig = TOTPConfigSchema.parse({ secret, ...config });
    const params = new URLSearchParams({
      secret: secret,
      issuer: issuer,
      algorithm: totpConfig.algorithm,
      digits: totpConfig.digits.toString(),
      period: totpConfig.period.toString()
    });

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`;
  }

  /**
   * Verify an MFA verification
   */
  async verifyMFA(
    config: MFAConfig,
    verification: MFAVerification
  ): Promise<boolean> {
    const validated = MFAVerificationSchema.parse(verification);

    if (!config.enabled) {
      throw new MFARequiredError('MFA is not enabled for this user');
    }

    if (!config.factors.includes(validated.factor)) {
      throw new MFAFailedError('MFA factor not enabled for this user');
    }

    switch (validated.factor) {
      case 'totp':
        if (!config.totpSecret) {
          throw new MFAFailedError('TOTP secret not configured');
        }
        return this.verifyTOTPCode(config.totpSecret, validated.code);

      case 'backup':
        if (!config.backupCodes || config.backupCodes.length === 0) {
          throw new MFAFailedError('Backup codes not available');
        }
        return this.verifyBackupCode(config.backupCodes, validated.code);

      case 'sms':
      case 'email':
        // In production, you would verify against a stored code
        // This is a placeholder for SMS/email verification
        throw new MFAFailedError('SMS/Email verification requires external service');

      default:
        throw new MFAFailedError('Unsupported MFA factor');
    }
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
   * Base32 decode
   */
  private base32Decode(str: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    let bits = '';
    for (const char of cleaned) {
      const val = alphabet.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }

    return Buffer.from(bytes);
  }

  /**
   * Base32 encode
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    
    for (const byte of buffer) {
      bits += byte.toString(2).padStart(8, '0');
    }

    let result = '';
    for (let i = 0; i + 5 <= bits.length; i += 5) {
      const index = parseInt(bits.slice(i, i + 5), 2);
      result += alphabet[index];
    }

    return result;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalMFAAuth: MFAAuth | null = null;

export function setupMFAAuth(): MFAAuth {
  globalMFAAuth = new MFAAuth();
  return globalMFAAuth;
}

export function getMFAAuth(): MFAAuth | null {
  return globalMFAAuth;
}

export function createMFAAuth(): MFAAuth {
  return new MFAAuth();
}
