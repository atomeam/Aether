# @aether/auth

Comprehensive authentication system for the Aether monorepo with JWT, OAuth 2.0, session management, MFA, and password hashing.

## Features

- **JWT Authentication**: Secure token-based authentication with support for access and refresh tokens
- **OAuth 2.0**: Integration with Google, GitHub, Facebook, Twitter, and Microsoft
- **Session Management**: In-memory session management with rolling sessions and automatic cleanup
- **Multi-Factor Authentication**: TOTP, SMS, email, and backup code support
- **Password Hashing**: bcrypt and argon2 support with password policy validation
- **TypeScript**: Full type safety with comprehensive TypeScript types
- **Zod Schemas**: Runtime validation with Zod schemas
- **Production Ready**: Comprehensive test coverage and error handling

## Installation

```bash
npm install @aether/auth
```

## Quick Start

### JWT Authentication

```typescript
import { JWTAuth } from '@aether/auth';

const jwt = new JWTAuth({
  secret: 'your-secret-key-at-least-32-characters',
  expiresIn: '1h',
  algorithm: 'HS256',
  issuer: 'your-app',
  audience: 'your-users'
});

// Generate access token
const accessToken = jwt.generateAccessToken({
  sub: 'user123',
  role: 'admin'
});

// Verify token
const payload = jwt.verifyToken(accessToken);
console.log(payload.sub); // 'user123'

// Generate token pair
const tokens = jwt.generateTokenPair({ sub: 'user123' });
console.log(tokens.accessToken, tokens.refreshToken);
```

### OAuth 2.0

```typescript
import { OAuthAuth } from '@aether/auth';

const oauth = new OAuthAuth();

// Register provider
oauth.registerProvider({
  provider: 'google',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://your-app.com/auth/callback',
  scopes: ['openid', 'profile', 'email']
});

// Get authorization URL
const authUrl = oauth.getAuthorizationUrl('google', 'random-state');
// Redirect user to authUrl

// Exchange code for token
const tokens = await oauth.exchangeCodeForToken('google', 'authorization-code');

// Get user profile
const profile = await oauth.getUserProfile('google', tokens.accessToken);
```

### Session Management

```typescript
import { SessionManager } from '@aether/auth';

const sessionManager = new SessionManager({
  maxAge: 86400000, // 24 hours
  rolling: true,
  secure: true,
  httpOnly: true
});

// Create session
const session = sessionManager.createSession('user123', {
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0...'
});

// Validate session
const isValid = sessionManager.validateSession(session.id);

// Get session
const currentSession = sessionManager.getSession(session.id);

// Delete session
sessionManager.deleteSession(session.id);
```

### Multi-Factor Authentication

```typescript
import { MFAAuth } from '@aether/auth';

const mfa = new MFAAuth();

// Generate TOTP secret
const secret = mfa.generateTOTPSecret();

// Generate TOTP URI for QR code
const uri = mfa.generateTOTPUri(secret, 'user@example.com', 'MyApp');

// Verify TOTP code
const code = mfa.generateTOTPCode(secret);
const isValid = mfa.verifyTOTPCode(secret, code);

// Generate backup codes
const backupCodes = mfa.generateBackupCodes(10);

// Verify backup code
const isBackupValid = mfaAuth.verifyBackupCode(backupCodes, 'CODE1234');
```

### Password Hashing

```typescript
import { PasswordAuth } from '@aether/auth';

const passwordAuth = new PasswordAuth({
  algorithm: 'argon2id',
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4
}, {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
});

// Hash password
const hash = await passwordAuth.hashPassword('MySecurePassword123!');

// Verify password
const isValid = await passwordAuth.verifyPassword('MySecurePassword123!', hash);

// Validate password against policy
const result = passwordAuth.validatePassword('MySecurePassword123!');
console.log(result.valid, result.strength);

// Generate secure password
const password = passwordAuth.generatePassword(16);
```

## API Reference

### JWTAuth

| Method | Description |
|--------|-------------|
| `generateAccessToken(payload)` | Generate an access token |
| `generateRefreshToken(payload)` | Generate a refresh token |
| `generateTokenPair(payload)` | Generate both access and refresh tokens |
| `verifyToken(token)` | Verify and decode a token |
| `decodeToken(token)` | Decode token without verification |
| `refreshAccessToken(refreshToken)` | Refresh access token using refresh token |

### OAuthAuth

| Method | Description |
|--------|-------------|
| `registerProvider(config)` | Register an OAuth provider |
| `getAuthorizationUrl(provider, state)` | Get authorization URL |
| `exchangeCodeForToken(provider, code)` | Exchange code for access token |
| `getUserProfile(provider, accessToken)` | Get user profile from provider |
| `completeOAuthFlow(provider, code)` | Complete OAuth flow |
| `refreshAccessToken(provider, refreshToken)` | Refresh access token |

### SessionManager

| Method | Description |
|--------|-------------|
| `createSession(userId, metadata)` | Create a new session |
| `getSession(sessionId)` | Get session by ID |
| `getSessionByToken(token)` | Get session by token |
| `updateSession(sessionId, updates)` | Update session |
| `deleteSession(sessionId)` | Delete a session |
| `deleteUserSessions(userId)` | Delete all sessions for user |
| `getUserSessions(userId)` | Get all sessions for user |
| `validateSession(sessionId)` | Validate session |
| `refreshSession(sessionId)` | Refresh session expiration |
| `cleanupExpiredSessions()` | Clean up expired sessions |

### MFAAuth

| Method | Description |
|--------|-------------|
| `generateTOTPSecret()` | Generate TOTP secret |
| `generateBackupCodes(count)` | Generate backup codes |
| `generateTOTPCode(secret, config)` | Generate TOTP code |
| `verifyTOTPCode(secret, code)` | Verify TOTP code |
| `verifyBackupCode(codes, code)` | Verify backup code |
| `removeBackupCode(codes, code)` | Remove used backup code |
| `generateTOTPUri(secret, account, issuer)` | Generate TOTP URI for QR code |
| `verifyMFA(config, verification)` | Verify MFA verification |

### PasswordAuth

| Method | Description |
|--------|-------------|
| `hashPassword(password, config)` | Hash a password |
| `verifyPassword(password, hash)` | Verify password against hash |
| `validatePassword(password)` | Validate password against policy |
| `generatePassword(length)` | Generate secure random password |
| `needsRehash(hash, config)` | Check if password needs rehashing |

## Configuration

### JWT Configuration

```typescript
interface JWTConfig {
  secret: string;              // Secret key (min 32 chars for HMAC)
  expiresIn?: string;          // Token expiration (e.g., '1h', '7d')
  algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
  issuer?: string;             // Token issuer
  audience?: string;           // Token audience
  refreshExpiresIn?: string;   // Refresh token expiration
}
```

### Session Configuration

```typescript
interface SessionConfig {
  maxAge?: number;             // Session max age in milliseconds
  rolling?: boolean;            // Enable rolling sessions
  secure?: boolean;            // Secure cookie flag
  httpOnly?: boolean;          // HttpOnly cookie flag
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;             // Cookie domain
  path?: string;               // Cookie path
}
```

### Password Hash Configuration

```typescript
interface PasswordHashConfig {
  algorithm: 'bcrypt' | 'argon2id' | 'argon2i' | 'argon2d';
  rounds?: number;             // bcrypt rounds (4-31)
  memoryCost?: number;         // argon2 memory cost
  timeCost?: number;           // argon2 time cost
  parallelism?: number;        // argon2 parallelism
}
```

### Password Policy

```typescript
interface PasswordPolicy {
  minLength?: number;           // Minimum password length
  maxLength?: number;           // Maximum password length
  requireUppercase?: boolean;  // Require uppercase letters
  requireLowercase?: boolean;  // Require lowercase letters
  requireNumbers?: boolean;    // Require numbers
  requireSpecialChars?: boolean; // Require special characters
  forbiddenPatterns?: string[]; // Forbidden regex patterns
}
```

## Error Handling

The package provides specific error types for different authentication failures:

- `AuthError` - Base authentication error
- `InvalidCredentialsError` - Invalid credentials provided
- `TokenExpiredError` - Token has expired
- `InvalidTokenError` - Invalid token format or signature
- `MFARequiredError` - MFA is required
- `MFAFailedError` - MFA verification failed
- `UserNotFoundError` - User not found
- `PasswordPolicyError` - Password does not meet policy

```typescript
import { InvalidCredentialsError, TokenExpiredError } from '@aether/auth';

try {
  await auth.authenticate(credentials);
} catch (error) {
  if (error instanceof InvalidCredentialsError) {
    // Handle invalid credentials
  } else if (error instanceof TokenExpiredError) {
    // Handle expired token
  }
}
```

## Testing

```bash
npm test
```

## License

MIT
