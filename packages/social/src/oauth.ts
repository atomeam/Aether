/**
 * @aether/social - OAuth Providers Module
 * 
 * OAuth 2.0 implementation for various social media platforms including
 * Twitter, Facebook, LinkedIn, Google, GitHub, Instagram, TikTok, Discord, Spotify, and Apple.
 */

import type {
  OAuthConfig,
  OAuthToken,
  OAuthUserProfile,
  OAuthAuthorizationUrl,
  OAuthProvider
} from './types.js';
import { OAuthError } from './types.js';

// ============================================================================
// OAuth Provider Configuration
// ============================================================================

const PROVIDER_ENDPOINTS: Record<OAuthProvider, {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: Record<string, string[]>;
}> = {
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    scopes: {
      read: ['tweet.read', 'users.read'],
      write: ['tweet.read', 'tweet.write', 'users.read'],
      full: ['tweet.read', 'tweet.write', 'users.read', 'follows.read', 'like.read']
    }
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/v18.0/me',
    scopes: {
      read: ['email', 'public_profile'],
      write: ['email', 'public_profile', 'publish_actions'],
      full: ['email', 'public_profile', 'publish_actions', 'user_friends', 'user_likes']
    }
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/me',
    scopes: {
      read: ['r_liteprofile', 'r_emailaddress'],
      write: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
      full: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'r_network']
    }
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: {
      read: ['openid', 'profile', 'email'],
      write: ['openid', 'profile', 'email'],
      full: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/contacts.readonly']
    }
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: {
      read: ['read:user', 'user:email'],
      write: ['read:user', 'user:email', 'repo'],
      full: ['read:user', 'user:email', 'repo', 'gist', 'notifications']
    }
  },
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    userInfoUrl: 'https://graph.instagram.com/me',
    scopes: {
      read: ['user_profile'],
      write: ['user_profile', 'instagram_content_publish'],
      full: ['user_profile', 'instagram_content_publish', 'instagram_basic', 'instagram_manage_comments']
    }
  },
  tiktok: {
    authUrl: 'https://open.tiktokapis.com/v2/oauth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token',
    userInfoUrl: 'https://open.tiktokapis.com/v2/user/info',
    scopes: {
      read: ['user.info.basic'],
      write: ['user.info.basic', 'video.list'],
      full: ['user.info.basic', 'video.list', 'video.upload']
    }
  },
  discord: {
    authUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
    scopes: {
      read: ['identify', 'email'],
      write: ['identify', 'email'],
      full: ['identify', 'email', 'guilds', 'connections']
    }
  },
  spotify: {
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    userInfoUrl: 'https://api.spotify.com/v1/me',
    scopes: {
      read: ['user-read-private', 'user-read-email'],
      write: ['user-read-private', 'user-read-email'],
      full: ['user-read-private', 'user-read-email', 'playlist-read-private', 'user-library-read']
    }
  },
  apple: {
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: '', // Apple doesn't have a user info endpoint - data comes from JWT
    scopes: {
      read: ['name', 'email'],
      write: ['name', 'email'],
      full: ['name', 'email']
    }
  }
};

// ============================================================================
// OAuth Manager Class
// ============================================================================

export class OAuthManager {
  private configs: Map<OAuthProvider, OAuthConfig> = new Map();
  private tokens: Map<string, OAuthToken> = new Map();

  /**
   * Register an OAuth provider configuration
   */
  registerProvider(config: OAuthConfig): void {
    this.configs.set(config.provider, config);
  }

  /**
   * Get the authorization URL for a provider
   */
  getAuthorizationUrl(
    provider: OAuthProvider,
    state?: string,
    additionalScopes?: string[]
  ): OAuthAuthorizationUrl {
    const config = this.configs.get(provider);
    if (!config) {
      throw new OAuthError(
        `Provider ${provider} not configured`,
        'PROVIDER_NOT_CONFIGURED',
        provider
      );
    }

    const endpoints = PROVIDER_ENDPOINTS[provider];
    const scopes = additionalScopes || config.scopes || endpoints.scopes.read;
    const finalState = state || config.state || this.generateState();

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state: finalState
    });

    const url = `${endpoints.authUrl}?${params.toString()}`;

    return { url, state: finalState };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<OAuthToken> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new OAuthError(
        `Provider ${provider} not configured`,
        'PROVIDER_NOT_CONFIGURED',
        provider
      );
    }

    const endpoints = PROVIDER_ENDPOINTS[provider];

    try {
      const response = await fetch(endpoints.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code',
          state
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new OAuthError(
          `Failed to exchange code for token: ${error}`,
          'TOKEN_EXCHANGE_FAILED',
          provider,
          { status: response.status, error }
        );
      }

      const data = await response.json();

      const token: OAuthToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type || 'Bearer',
        expiresIn: data.expires_in,
        scope: data.scope,
        obtainedAt: new Date()
      };

      // Store token
      this.tokens.set(`${provider}:${state}`, token);

      return token;
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }
      throw new OAuthError(
        `Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOKEN_EXCHANGE_ERROR',
        provider
      );
    }
  }

  /**
   * Refresh an access token
   */
  async refreshToken(
    provider: OAuthProvider,
    refreshToken: string
  ): Promise<OAuthToken> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new OAuthError(
        `Provider ${provider} not configured`,
        'PROVIDER_NOT_CONFIGURED',
        provider
      );
    }

    const endpoints = PROVIDER_ENDPOINTS[provider];

    try {
      const response = await fetch(endpoints.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new OAuthError(
          `Failed to refresh token: ${error}`,
          'TOKEN_REFRESH_FAILED',
          provider,
          { status: response.status, error }
        );
      }

      const data = await response.json();

      const token: OAuthToken = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        tokenType: data.token_type || 'Bearer',
        expiresIn: data.expires_in,
        scope: data.scope,
        obtainedAt: new Date()
      };

      return token;
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }
      throw new OAuthError(
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TOKEN_REFRESH_ERROR',
        provider
      );
    }
  }

  /**
   * Get user profile from provider
   */
  async getUserProfile(
    provider: OAuthProvider,
    token: OAuthToken
  ): Promise<OAuthUserProfile> {
    const endpoints = PROVIDER_ENDPOINTS[provider];

    // Apple doesn't have a user info endpoint
    if (provider === 'apple') {
      throw new OAuthError(
        'Apple user info must be decoded from JWT token',
        'APPLE_JWT_REQUIRED',
        provider
      );
    }

    try {
      const response = await fetch(endpoints.userInfoUrl, {
        headers: {
          'Authorization': `${token.tokenType} ${token.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new OAuthError(
          `Failed to fetch user profile: ${error}`,
          'USER_PROFILE_FETCH_FAILED',
          provider,
          { status: response.status, error }
        );
      }

      const data = await response.json();

      return this.normalizeUserProfile(provider, data);
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error;
      }
      throw new OAuthError(
        `User profile fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'USER_PROFILE_ERROR',
        provider
      );
    }
  }

  /**
   * Normalize user profile data from different providers
   */
  private normalizeUserProfile(
    provider: OAuthProvider,
    data: Record<string, unknown>
  ): OAuthUserProfile {
    const base: OAuthUserProfile = {
      provider,
      providerId: '',
      raw: data
    };

    const d = data as any;

    switch (provider) {
      case 'twitter':
        base.providerId = String(d.id || d.data?.id);
        base.name = String(d.name || d.data?.name);
        base.username = String(d.username || d.data?.username);
        base.avatar = d.profile_image_url ? String(d.profile_image_url) : undefined;
        base.bio = d.description ? String(d.description) : undefined;
        base.location = d.location ? String(d.location) : undefined;
        base.verified = d.verified as boolean;
        base.followersCount = d.public_metrics?.followers_count as number;
        base.followingCount = d.public_metrics?.following_count as number;
        break;

      case 'facebook':
        base.providerId = String(d.id);
        base.name = String(d.name);
        base.email = d.email ? String(d.email) : undefined;
        base.avatar = d.picture?.data?.url ? String(d.picture.data.url) : undefined;
        break;

      case 'linkedin':
        base.providerId = String(d.id);
        base.name = `${d.localizedFirstName} ${d.localizedLastName}`;
        base.avatar = d.profilePicture?.displayImage ? String(d.profilePicture.displayImage) : undefined;
        break;

      case 'google':
        base.providerId = String(d.id);
        base.name = String(d.name);
        base.email = d.email ? String(d.email) : undefined;
        base.avatar = d.picture ? String(d.picture) : undefined;
        base.verified = d.verified_email as boolean;
        break;

      case 'github':
        base.providerId = String(d.id);
        base.name = d.name ? String(d.name) : String(d.login);
        base.username = String(d.login);
        base.email = d.email ? String(d.email) : undefined;
        base.avatar = d.avatar_url ? String(d.avatar_url) : undefined;
        base.bio = d.bio ? String(d.bio) : undefined;
        base.location = d.location ? String(d.location) : undefined;
        base.website = d.blog ? String(d.blog) : undefined;
        base.followersCount = d.followers as number;
        base.followingCount = d.following as number;
        break;

      case 'instagram':
        base.providerId = String(d.id);
        base.username = String(d.username);
        break;

      case 'tiktok':
        base.providerId = String(d.data?.user?.id);
        base.username = String(d.data?.user?.display_name);
        base.avatar = d.data?.user?.avatar_url ? String(d.data.user.avatar_url) : undefined;
        break;

      case 'discord':
        base.providerId = String(d.id);
        base.name = d.global_name ? String(d.global_name) : String(d.username);
        base.username = String(d.username);
        base.avatar = d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png` : undefined;
        base.email = d.email ? String(d.email) : undefined;
        base.verified = d.verified as boolean;
        break;

      case 'spotify':
        base.providerId = String(d.id);
        base.name = String(d.display_name);
        base.avatar = d.images?.[0]?.url ? String(d.images[0].url) : undefined;
        break;

      default:
        base.providerId = String(data.id);
    }

    return base;
  }

  /**
   * Generate a random state string for OAuth flow
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate state parameter (implement your own validation logic)
   */
  validateState(state: string, expectedState: string): boolean {
    return state === expectedState;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: OAuthToken): boolean {
    if (!token.expiresIn) {
      return false;
    }
    const expiryTime = new Date(token.obtainedAt.getTime() + token.expiresIn * 1000);
    return new Date() > expiryTime;
  }

  /**
   * Get stored token
   */
  getToken(key: string): OAuthToken | undefined {
    return this.tokens.get(key);
  }

  /**
   * Store token
   */
  setToken(key: string, token: OAuthToken): void {
    this.tokens.set(key, token);
  }

  /**
   * Remove token
   */
  removeToken(key: string): void {
    this.tokens.delete(key);
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    this.tokens.clear();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new OAuth manager instance
 */
export function createOAuthManager(): OAuthManager {
  return new OAuthManager();
}

/**
 * Get default scopes for a provider
 */
export function getDefaultScopes(provider: OAuthProvider, level: 'read' | 'write' | 'full' = 'read'): string[] {
  return PROVIDER_ENDPOINTS[provider].scopes[level];
}

/**
 * Check if provider is supported
 */
export function isProviderSupported(provider: string): provider is OAuthProvider {
  return provider in PROVIDER_ENDPOINTS;
}

/**
 * Get list of supported providers
 */
export function getSupportedProviders(): OAuthProvider[] {
  return Object.keys(PROVIDER_ENDPOINTS) as OAuthProvider[];
}
