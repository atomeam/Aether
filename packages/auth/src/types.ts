/**
 * @aether/auth - Authentication System
 * 
 * TypeScript type definitions for authentication operations
 */

import { z } from 'zod';

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  username?: string;
  passwordHash?: string;
  roles: string[];
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  roles: string[];
  attributes: Record<string, any>;
}

// ============================================================================
// JWT Types
// ============================================================================

export interface JWTConfig {
  secret: string;
  expiresIn?: string;
  algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
  issuer?: string;
  audience?: string;
  refreshExpiresIn?: string;
}

export interface JWTPayload {
  sub: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  type?: 'access' | 'refresh';
  [key: string]: any;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================================
// OAuth Types
// ============================================================================

export type OAuthProvider = 'google' | 'github' | 'facebook' | 'twitter' | 'microsoft';

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

export interface OAuthUserProfile {
  id: string;
  provider: OAuthProvider;
  email?: string;
  name?: string;
  avatar?: string;
  rawProfile: Record<string, any>;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface SessionConfig {
  maxAge?: number;
  rolling?: boolean;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}

// ============================================================================
// MFA Types
// ============================================================================

export type MFAFactor = 'totp' | 'sms' | 'email' | 'backup';

export interface MFAConfig {
  enabled: boolean;
  factors: MFAFactor[];
  totpSecret?: string;
  backupCodes?: string[];
  phoneNumber?: string;
  email?: string;
}

export interface MFAVerification {
  factor: MFAFactor;
  code: string;
  timestamp: number;
}

export interface TOTPConfig {
  secret: string;
  digits?: 6 | 8;
  period?: number;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
}

// ============================================================================
// Password Types
// ============================================================================

export type HashAlgorithm = 'bcrypt' | 'argon2id' | 'argon2i' | 'argon2d';

export interface PasswordHashConfig {
  algorithm: HashAlgorithm;
  rounds?: number;
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
}

export interface PasswordPolicy {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  forbiddenPatterns?: string[];
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  tokens?: TokenPair;
  session?: Session;
  error?: string;
  requiresMFA?: boolean;
}

export interface RefreshTokenResult {
  success: boolean;
  tokens?: TokenPair;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message: string = 'Invalid credentials') {
    super(message, 'INVALID_CREDENTIALS', 401);
    this.name = 'InvalidCredentialsError';
  }
}

export class TokenExpiredError extends AuthError {
  constructor(message: string = 'Token has expired') {
    super(message, 'TOKEN_EXPIRED', 401);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends AuthError {
  constructor(message: string = 'Invalid token') {
    super(message, 'INVALID_TOKEN', 401);
    this.name = 'InvalidTokenError';
  }
}

export class MFARequiredError extends AuthError {
  constructor(message: string = 'Multi-factor authentication required') {
    super(message, 'MFA_REQUIRED', 403);
    this.name = 'MFARequiredError';
  }
}

export class MFAFailedError extends AuthError {
  constructor(message: string = 'Multi-factor authentication failed') {
    super(message, 'MFA_FAILED', 401);
    this.name = 'MFAFailedError';
  }
}

export class UserNotFoundError extends AuthError {
  constructor(message: string = 'User not found') {
    super(message, 'USER_NOT_FOUND', 404);
    this.name = 'UserNotFoundError';
  }
}

export class PasswordPolicyError extends AuthError {
  constructor(message: string = 'Password does not meet policy requirements') {
    super(message, 'PASSWORD_POLICY', 400);
    this.name = 'PasswordPolicyError';
  }
}
