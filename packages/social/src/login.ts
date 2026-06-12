/**
 * @aether/social - Social Login Module
 * 
 * Social login functionality allowing users to authenticate via OAuth providers,
 * link/unlink social accounts, and manage social authentication sessions.
 */

import type {
  OAuthProvider,
  OAuthUserProfile,
  OAuthToken,
  SocialLoginRequest,
  SocialLoginResponse,
  SocialLinkRequest,
  SocialLinkResponse,
  SocialUnlinkRequest,
  SocialUnlinkResponse
} from './types.js';
import { OAuthError, SocialError } from './types.js';
import { OAuthManager } from './oauth.js';

// ============================================================================
// User-Social Account Mapping (In-Memory Storage)
// ============================================================================

interface UserSocialAccount {
  userId: string;
  provider: OAuthProvider;
  providerId: string;
  profile: OAuthUserProfile;
  token: OAuthToken;
  linkedAt: Date;
  lastUsedAt: Date;
}

class SocialAccountStore {
  private accounts: Map<string, UserSocialAccount[]> = new Map();
  private providerIndex: Map<string, string> = new Map(); // provider:providerId -> userId

  /**
   * Link a social account to a user
   */
  link(account: UserSocialAccount): void {
    const userAccounts = this.accounts.get(account.userId) || [];
    userAccounts.push(account);
    this.accounts.set(account.userId, userAccounts);
    
    const key = `${account.provider}:${account.providerId}`;
    this.providerIndex.set(key, account.userId);
  }

  /**
   * Unlink a social account from a user
   */
  unlink(userId: string, provider: OAuthProvider): boolean {
    const userAccounts = this.accounts.get(userId) || [];
    const filtered = userAccounts.filter(a => a.provider !== provider);
    
    if (filtered.length === userAccounts.length) {
      return false; // No account found
    }
    
    this.accounts.set(userId, filtered);
    
    // Remove from provider index
    for (const account of userAccounts) {
      if (account.provider === provider) {
        const key = `${account.provider}:${account.providerId}`;
        this.providerIndex.delete(key);
      }
    }
    
    return true;
  }

  /**
   * Get user by provider and provider ID
   */
  getUserByProvider(provider: OAuthProvider, providerId: string): string | undefined {
    const key = `${provider}:${providerId}`;
    return this.providerIndex.get(key);
  }

  /**
   * Get all social accounts for a user
   */
  getUserAccounts(userId: string): UserSocialAccount[] {
    return this.accounts.get(userId) || [];
  }

  /**
   * Get specific social account for a user
   */
  getUserAccount(userId: string, provider: OAuthProvider): UserSocialAccount | undefined {
    const accounts = this.getUserAccounts(userId);
    return accounts.find(a => a.provider === provider);
  }

  /**
   * Update last used timestamp
   */
  updateLastUsed(userId: string, provider: OAuthProvider): void {
    const account = this.getUserAccount(userId, provider);
    if (account) {
      account.lastUsedAt = new Date();
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.accounts.clear();
    this.providerIndex.clear();
  }
}

// ============================================================================
// Social Login Manager Class
// ============================================================================

export class SocialLoginManager {
  private oauthManager: OAuthManager;
  private accountStore: SocialAccountStore;
  private sessionStore: Map<string, { userId: string; expiresAt: Date }> = new Map();

  constructor(oauthManager?: OAuthManager) {
    this.oauthManager = oauthManager || new OAuthManager();
    this.accountStore = new SocialAccountStore();
  }

  /**
   * Initiate social login flow
   */
  async initiateLogin(
    provider: OAuthProvider,
    redirectUri: string,
    state?: string
  ): Promise<{ authorizationUrl: string; state: string }> {
    const authUrl = this.oauthManager.getAuthorizationUrl(provider, state);
    return {
      authorizationUrl: authUrl.url,
      state: authUrl.state
    };
  }

  /**
   * Complete social login flow
   */
  async completeLogin(request: SocialLoginRequest): Promise<SocialLoginResponse> {
    try {
      // Exchange code for token
      const token = await this.oauthManager.exchangeCodeForToken(
        request.provider,
        request.code,
        request.state
      );

      // Get user profile
      const profile = await this.oauthManager.getUserProfile(request.provider, token);

      // Check if user exists
      const existingUserId = this.accountStore.getUserByProvider(
        request.provider,
        profile.providerId
      );

      if (existingUserId) {
        // Existing user - update token and last used
        const account = this.accountStore.getUserAccount(existingUserId, request.provider);
        if (account) {
          account.token = token;
          account.lastUsedAt = new Date();
        }

        return {
          success: true,
          user: profile,
          token,
          isNewUser: false
        };
      }

      // New user - create account
      const newUserId = this.generateUserId();
      this.accountStore.link({
        userId: newUserId,
        provider: request.provider,
        providerId: profile.providerId,
        profile,
        token,
        linkedAt: new Date(),
        lastUsedAt: new Date()
      });

      return {
        success: true,
        user: profile,
        token,
        isNewUser: true
      };
    } catch (error) {
      if (error instanceof OAuthError) {
        return {
          success: false,
          error: error.message
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Link a social account to an existing user
   */
  async linkAccount(request: SocialLinkRequest): Promise<SocialLinkResponse> {
    try {
      // Exchange code for token
      const token = await this.oauthManager.exchangeCodeForToken(
        request.provider,
        request.code,
        request.state
      );

      // Get user profile
      const profile = await this.oauthManager.getUserProfile(request.provider, token);

      // Check if already linked to another user
      const existingUserId = this.accountStore.getUserByProvider(
        request.provider,
        profile.providerId
      );

      if (existingUserId && existingUserId !== request.userId) {
        return {
          success: false,
          error: 'This social account is already linked to another user'
        };
      }

      // Check if already linked to this user
      const existingAccount = this.accountStore.getUserAccount(request.userId, request.provider);
      if (existingAccount) {
        return {
          success: false,
          error: 'This social account is already linked to your account'
        };
      }

      // Link account
      this.accountStore.link({
        userId: request.userId,
        provider: request.provider,
        providerId: profile.providerId,
        profile,
        token,
        linkedAt: new Date(),
        lastUsedAt: new Date()
      });

      return {
        success: true,
        linked: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link account'
      };
    }
  }

  /**
   * Unlink a social account from a user
   */
  async unlinkAccount(request: SocialUnlinkRequest): Promise<SocialUnlinkResponse> {
    try {
      // Check if user has this account linked
      const account = this.accountStore.getUserAccount(request.userId, request.provider);
      if (!account) {
        return {
          success: false,
          error: 'No linked account found for this provider'
        };
      }

      // Check if this is the only linked account
      const userAccounts = this.accountStore.getUserAccounts(request.userId);
      if (userAccounts.length === 1) {
        return {
          success: false,
          error: 'Cannot unlink the only authentication method'
        };
      }

      // Unlink account
      const unlinked = this.accountStore.unlink(request.userId, request.provider);

      return {
        success: true,
        unlinked
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlink account'
      };
    }
  }

  /**
   * Get all linked social accounts for a user
   */
  getLinkedAccounts(userId: string): UserSocialAccount[] {
    return this.accountStore.getUserAccounts(userId);
  }

  /**
   * Get a specific linked social account
   */
  getLinkedAccount(userId: string, provider: OAuthProvider): UserSocialAccount | undefined {
    return this.accountStore.getUserAccount(userId, provider);
  }

  /**
   * Refresh token for a linked account
   */
  async refreshToken(userId: string, provider: OAuthProvider): Promise<OAuthToken | null> {
    const account = this.accountStore.getUserAccount(userId, provider);
    if (!account || !account.token.refreshToken) {
      return null;
    }

    try {
      const newToken = await this.oauthManager.refreshToken(
        provider,
        account.token.refreshToken
      );

      // Update stored token
      account.token = newToken;
      account.lastUsedAt = new Date();

      return newToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  /**
   * Create a session for a user
   */
  createSession(userId: string, expiresIn: number = 86400000): string {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + expiresIn);
    
    this.sessionStore.set(sessionId, { userId, expiresAt });
    
    return sessionId;
  }

  /**
   * Validate a session
   */
  validateSession(sessionId: string): string | null {
    const session = this.sessionStore.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    if (new Date() > session.expiresAt) {
      this.sessionStore.delete(sessionId);
      return null;
    }
    
    return session.userId;
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): void {
    this.sessionStore.delete(sessionId);
  }

  /**
   * Destroy all sessions for a user
   */
  destroyUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (session.userId === userId) {
        this.sessionStore.delete(sessionId);
      }
    }
  }

  /**
   * Generate a unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get OAuth manager instance
   */
  getOAuthManager(): OAuthManager {
    return this.oauthManager;
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.accountStore.clear();
    this.sessionStore.clear();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new social login manager instance
 */
export function createSocialLoginManager(oauthManager?: OAuthManager): SocialLoginManager {
  return new SocialLoginManager(oauthManager);
}

/**
 * Check if a provider supports login
 */
export function supportsLogin(provider: OAuthProvider): boolean {
  // All OAuth providers support login
  return true;
}

/**
 * Get recommended providers for login
 */
export function getRecommendedLoginProviders(): OAuthProvider[] {
  return ['google', 'facebook', 'twitter', 'github', 'apple'];
}
