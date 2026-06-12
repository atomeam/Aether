/**
 * @aether/auth - Authentication System
 * 
 * Zod schemas for validation
 */

import { z } from 'zod';

// ============================================================================
// User Schemas
// ============================================================================

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50).optional(),
  roles: z.array(z.string()),
  attributes: z.record(z.any())
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50).optional(),
  passwordHash: z.string().optional(),
  roles: z.array(z.string()),
  attributes: z.record(z.any()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastLoginAt: z.coerce.date().optional(),
  mfaEnabled: z.boolean(),
  mfaSecret: z.string().optional()
});

// ============================================================================
// JWT Schemas
// ============================================================================

export const JWTConfigSchema = z.object({
  secret: z.string().min(32),
  expiresIn: z.string().default('1h'),
  algorithm: z.enum(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512']).default('HS256'),
  issuer: z.string().optional(),
  audience: z.string().optional(),
  refreshExpiresIn: z.string().default('7d')
});

export const JWTPayloadSchema = z.object({
  sub: z.string(),
  iat: z.number().optional(),
  exp: z.number().optional(),
  iss: z.string().optional(),
  aud: z.string().optional(),
  type: z.enum(['access', 'refresh']).optional()
}).passthrough();

export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number()
});

// ============================================================================
// OAuth Schemas
// ============================================================================

export const OAuthProviderSchema = z.enum(['google', 'github', 'facebook', 'twitter', 'microsoft']);

export const OAuthConfigSchema = z.object({
  provider: OAuthProviderSchema,
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).optional()
});

export const OAuthUserProfileSchema = z.object({
  id: z.string(),
  provider: OAuthProviderSchema,
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
  rawProfile: z.record(z.any())
});

export const OAuthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(),
  tokenType: z.string().optional(),
  scope: z.string().optional()
});

// ============================================================================
// Session Schemas
// ============================================================================

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  lastAccessedAt: z.coerce.date(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const SessionConfigSchema = z.object({
  maxAge: z.number().default(86400000), // 24 hours
  rolling: z.boolean().default(true),
  secure: z.boolean().default(true),
  httpOnly: z.boolean().default(true),
  sameSite: z.enum(['strict', 'lax', 'none']).default('strict'),
  domain: z.string().optional(),
  path: z.string().default('/')
});

// ============================================================================
// MFA Schemas
// ============================================================================

export const MFAFactorSchema = z.enum(['totp', 'sms', 'email', 'backup']);

export const MFAConfigSchema = z.object({
  enabled: z.boolean(),
  factors: z.array(MFAFactorSchema),
  totpSecret: z.string().optional(),
  backupCodes: z.array(z.string()).optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional()
});

export const MFAVerificationSchema = z.object({
  factor: MFAFactorSchema,
  code: z.string(),
  timestamp: z.number()
});

export const TOTPConfigSchema = z.object({
  secret: z.string(),
  digits: z.union([z.literal(6), z.literal(8)]).default(6),
  period: z.number().default(30),
  algorithm: z.enum(['SHA1', 'SHA256', 'SHA512']).default('SHA1')
});

// ============================================================================
// Password Schemas
// ============================================================================

export const HashAlgorithmSchema = z.enum(['bcrypt', 'argon2id', 'argon2i', 'argon2d']);

export const PasswordHashConfigSchema = z.object({
  algorithm: HashAlgorithmSchema,
  rounds: z.number().min(4).max(31).default(10),
  memoryCost: z.number().min(8).max(2147483647).default(65536),
  timeCost: z.number().min(1).max(2147483647).default(3),
  parallelism: z.number().min(1).max(2147483647).default(4)
});

export const PasswordPolicySchema = z.object({
  minLength: z.number().min(8).default(8),
  maxLength: z.number().max(128).default(128),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSpecialChars: z.boolean().default(true),
  forbiddenPatterns: z.array(z.string()).default([])
});

export const PasswordValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  strength: z.enum(['weak', 'fair', 'good', 'strong'])
});

// ============================================================================
// Authentication Schemas
// ============================================================================

export const AuthCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const AuthResultSchema = z.object({
  success: z.boolean(),
  user: UserProfileSchema.optional(),
  tokens: TokenPairSchema.optional(),
  session: SessionSchema.optional(),
  error: z.string().optional(),
  requiresMFA: z.boolean().optional()
});

export const RefreshTokenResultSchema = z.object({
  success: z.boolean(),
  tokens: TokenPairSchema.optional(),
  error: z.string().optional()
});
