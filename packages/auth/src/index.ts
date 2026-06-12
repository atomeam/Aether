/**
 * @aether/auth - Authentication System
 * 
 * Comprehensive authentication system with JWT, OAuth 2.0,
 * session management, MFA, and password hashing
 */

// ============================================================================
// Types
// ============================================================================

export type {
  User,
  UserProfile,
  JWTConfig,
  JWTPayload,
  TokenPair,
  OAuthProvider,
  OAuthConfig,
  OAuthUserProfile,
  OAuthTokenResponse,
  Session,
  SessionConfig,
  MFAFactor,
  MFAConfig,
  MFAVerification,
  TOTPConfig,
  HashAlgorithm,
  PasswordHashConfig,
  PasswordPolicy,
  PasswordValidationResult,
  AuthCredentials,
  AuthResult,
  RefreshTokenResult
} from './types.js';

export {
  AuthError,
  InvalidCredentialsError,
  TokenExpiredError,
  InvalidTokenError,
  MFARequiredError,
  MFAFailedError,
  UserNotFoundError,
  PasswordPolicyError
} from './types.js';

// ============================================================================
// Schemas
// ============================================================================

export {
  UserProfileSchema,
  UserSchema,
  JWTConfigSchema,
  JWTPayloadSchema,
  TokenPairSchema,
  OAuthProviderSchema,
  OAuthConfigSchema,
  OAuthUserProfileSchema,
  OAuthTokenResponseSchema,
  SessionSchema,
  SessionConfigSchema,
  MFAFactorSchema,
  MFAConfigSchema,
  MFAVerificationSchema,
  TOTPConfigSchema,
  HashAlgorithmSchema,
  PasswordHashConfigSchema,
  PasswordPolicySchema,
  PasswordValidationResultSchema,
  AuthCredentialsSchema,
  AuthResultSchema,
  RefreshTokenResultSchema
} from './schemas.js';

// ============================================================================
// JWT Authentication
// ============================================================================

export { JWTAuth } from './jwt.js';
export { setupJWTAuth, getJWTAuth, createJWTAuth } from './jwt.js';

// ============================================================================
// OAuth Authentication
// ============================================================================

export { OAuthAuth } from './oauth.js';
export { setupOAuthAuth, getOAuthAuth, createOAuthAuth } from './oauth.js';

// ============================================================================
// Session Management
// ============================================================================

export { SessionManager } from './session.js';
export { setupSessionManager, getSessionManager, createSessionManager } from './session.js';

// ============================================================================
// Multi-Factor Authentication
// ============================================================================

export { MFAAuth } from './mfa.js';
export { setupMFAAuth, getMFAAuth, createMFAAuth } from './mfa.js';

// ============================================================================
// Password Authentication
// ============================================================================

export { PasswordAuth } from './password.js';
export { setupPasswordAuth, getPasswordAuth, createPasswordAuth } from './password.js';
