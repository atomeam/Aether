/**
 * @aether/auth - OAuth 2.0 Authentication Module
 * 
 * OAuth 2.0 implementation with support for multiple providers
 * including Google, GitHub, Facebook, Twitter, and Microsoft
 */

import crypto from 'crypto';
import {
  OAuthConfig,
  OAuthProvider,
  OAuthUserProfile,
  OAuthTokenResponse,
  AuthError
} from './types.js';
import { OAuthConfigSchema, OAuthUserProfileSchema, OAuthTokenResponseSchema } from './schemas.js';

export class OAuthAuth {
  private configs: Map<OAuthProvider, OAuthConfig>;

  constructor() {
    this.configs = new Map();
  }

  /**
   * Register an OAuth provider configuration
   */
  registerProvider(config: OAuthConfig): void {
    const validated = OAuthConfigSchema.parse(config);
    this.configs.set(validated.provider, validated);
  }

  /**
   * Get the authorization URL for a provider
   */
  getAuthorizationUrl(provider: OAuthProvider, state?: string): string {
    const config = this.configs.get(provider);
    if (!config) {
      throw new AuthError(`Provider ${provider} not configured`, 'PROVIDER_NOT_CONFIGURED');
    }

    const urls = this.getProviderEndpoints(provider);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes?.join(' ') || this.getDefaultScopes(provider),
      state: state || this.generateState()
    });

    return `${urls.auth}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string
  ): Promise<OAuthTokenResponse> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new AuthError(`Provider ${provider} not configured`, 'PROVIDER_NOT_CONFIGURED');
    }

    const urls = this.getProviderEndpoints(provider);
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch(urls.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new AuthError('Failed to exchange code for token', 'TOKEN_EXCHANGE_FAILED');
    }

    const data = await response.json();
    return OAuthTokenResponseSchema.parse(data);
  }

  /**
   * Get user profile from provider using access token
   */
  async getUserProfile(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<OAuthUserProfile> {
    const urls = this.getProviderEndpoints(provider);
    const response = await fetch(urls.profile, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new AuthError('Failed to fetch user profile', 'PROFILE_FETCH_FAILED');
    }

    const rawProfile = await response.json();
    const profile = this.normalizeProfile(provider, rawProfile);
    
    return OAuthUserProfileSchema.parse(profile);
  }

  /**
   * Complete OAuth flow (exchange code and get profile)
   */
  async completeOAuthFlow(
    provider: OAuthProvider,
    code: string
  ): Promise<{ tokens: OAuthTokenResponse; profile: OAuthUserProfile }> {
    const tokens = await this.exchangeCodeForToken(provider, code);
    const profile = await this.getUserProfile(provider, tokens.accessToken);
    return { tokens, profile };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    provider: OAuthProvider,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new AuthError(`Provider ${provider} not configured`, 'PROVIDER_NOT_CONFIGURED');
    }

    const urls = this.getProviderEndpoints(provider);
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const response = await fetch(urls.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new AuthError('Failed to refresh token', 'TOKEN_REFRESH_FAILED');
    }

    const data = await response.json();
    return OAuthTokenResponseSchema.parse(data);
  }

  /**
   * Get provider-specific endpoints
   */
  private getProviderEndpoints(provider: OAuthProvider): {
    auth: string;
    token: string;
    profile: string;
  } {
    const endpoints: Record<OAuthProvider, { auth: string; token: string; profile: string }> = {
      google: {
        auth: 'https://accounts.google.com/o/oauth2/v2/auth',
        token: 'https://oauth2.googleapis.com/token',
        profile: 'https://www.googleapis.com/oauth2/v2/userinfo'
      },
      github: {
        auth: 'https://github.com/login/oauth/authorize',
        token: 'https://github.com/login/oauth/access_token',
        profile: 'https://api.github.com/user'
      },
      facebook: {
        auth: 'https://www.facebook.com/v18.0/dialog/oauth',
        token: 'https://graph.facebook.com/v18.0/oauth/access_token',
        profile: 'https://graph.facebook.com/v18.0/me?fields=id,name,email,picture'
      },
      twitter: {
        auth: 'https://twitter.com/i/oauth2/authorize',
        token: 'https://api.twitter.com/2/oauth2/token',
        profile: 'https://api.twitter.com/2/users/me'
      },
      microsoft: {
        auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        profile: 'https://graph.microsoft.com/v1.0/me'
      }
    };

    return endpoints[provider];
  }

  /**
   * Get default scopes for a provider
   */
  private getDefaultScopes(provider: OAuthProvider): string {
    const scopes: Record<OAuthProvider, string> = {
      google: 'openid profile email',
      github: 'user:email',
      facebook: 'email public_profile',
      twitter: 'tweet.read users.read',
      microsoft: 'openid profile email'
    };

    return scopes[provider];
  }

  /**
   * Normalize provider-specific profile data
   */
  private normalizeProfile(provider: OAuthProvider, rawProfile: any): OAuthUserProfile {
    const normalizers: Record<OAuthProvider, (raw: any) => OAuthUserProfile> = {
      google: (raw) => ({
        id: raw.id,
        provider: 'google',
        email: raw.email,
        name: raw.name,
        avatar: raw.picture,
        rawProfile: raw
      }),
      github: (raw) => ({
        id: String(raw.id),
        provider: 'github',
        email: raw.email,
        name: raw.name || raw.login,
        avatar: raw.avatar_url,
        rawProfile: raw
      }),
      facebook: (raw) => ({
        id: raw.id,
        provider: 'facebook',
        email: raw.email,
        name: raw.name,
        avatar: raw.picture?.data?.url,
        rawProfile: raw
      }),
      twitter: (raw) => ({
        id: raw.data?.id,
        provider: 'twitter',
        name: raw.data?.name,
        avatar: raw.data?.profile_image_url,
        rawProfile: raw
      }),
      microsoft: (raw) => ({
        id: raw.id,
        provider: 'microsoft',
        email: raw.mail || raw.userPrincipalName,
        name: raw.displayName,
        rawProfile: raw
      })
    };

    return normalizers[provider](rawProfile);
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Verify state parameter
   */
  verifyState(state: string, expectedState: string): boolean {
    return state === expectedState;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalOAuthAuth: OAuthAuth | null = null;

export function setupOAuthAuth(): OAuthAuth {
  globalOAuthAuth = new OAuthAuth();
  return globalOAuthAuth;
}

export function getOAuthAuth(): OAuthAuth | null {
  return globalOAuthAuth;
}

export function createOAuthAuth(): OAuthAuth {
  return new OAuthAuth();
}
