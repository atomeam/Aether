/**
 * @aether/social - Social Media Integration Package
 * 
 * TypeScript type definitions for social media integration features including
 * OAuth providers, social sharing, social login, profile sync, and social analytics.
 */

// ============================================================================
// OAuth Provider Types
// ============================================================================

export type OAuthProvider = 
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'google'
  | 'github'
  | 'instagram'
  | 'tiktok'
  | 'discord'
  | 'spotify'
  | 'apple';

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
  state?: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  scope?: string;
  obtainedAt: Date;
}

export interface OAuthUserProfile {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  name?: string;
  username?: string;
  avatar?: string;
  profileUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  verified?: boolean;
  followersCount?: number;
  followingCount?: number;
  raw?: Record<string, unknown>;
}

export interface OAuthAuthorizationUrl {
  url: string;
  state: string;
}

// ============================================================================
// Social Sharing Types
// ============================================================================

export type SharePlatform = 
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'pinterest'
  | 'reddit'
  | 'whatsapp'
  | 'telegram'
  | 'email';

export interface ShareContent {
  title: string;
  description?: string;
  url: string;
  image?: string;
  hashtags?: string[];
  via?: string;
  related?: string[];
}

export interface ShareOptions {
  platform: SharePlatform;
  content: ShareContent;
  openInNewTab?: boolean;
  trackingParams?: Record<string, string>;
}

export interface ShareResult {
  success: boolean;
  platform: SharePlatform;
  url?: string;
  error?: string;
}

// ============================================================================
// Social Login Types
// ============================================================================

export interface SocialLoginRequest {
  provider: OAuthProvider;
  code: string;
  state: string;
  redirectUri: string;
}

export interface SocialLoginResponse {
  success: boolean;
  user?: OAuthUserProfile;
  token?: OAuthToken;
  error?: string;
  isNewUser?: boolean;
}

export interface SocialLinkRequest {
  userId: string;
  provider: OAuthProvider;
  code: string;
  state: string;
  redirectUri: string;
}

export interface SocialLinkResponse {
  success: boolean;
  linked?: boolean;
  error?: string;
}

export interface SocialUnlinkRequest {
  userId: string;
  provider: OAuthProvider;
}

export interface SocialUnlinkResponse {
  success: boolean;
  unlinked?: boolean;
  error?: string;
}

// ============================================================================
// Profile Sync Types
// ============================================================================

export type SyncField = 
  | 'name'
  | 'email'
  | 'avatar'
  | 'bio'
  | 'location'
  | 'website'
  | 'username';

export interface SyncConfig {
  provider: OAuthProvider;
  fields: SyncField[];
  autoSync: boolean;
  syncInterval?: number; // in milliseconds
  lastSyncAt?: Date;
}

export interface SyncResult {
  success: boolean;
  provider: OAuthProvider;
  syncedFields: SyncField[];
  failedFields: SyncField[];
  syncedAt: Date;
  error?: string;
}

export interface ProfileData {
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
}

// ============================================================================
// Social Analytics Types
// ============================================================================

export type AnalyticsMetric = 
  | 'shares'
  | 'clicks'
  | 'impressions'
  | 'engagement'
  | 'followers'
  | 'following'
  | 'posts'
  | 'mentions'
  | 'reach';

export interface AnalyticsData {
  provider: OAuthProvider;
  metric: AnalyticsMetric;
  value: number;
  change?: number; // percentage change
  period: AnalyticsPeriod;
  timestamp: Date;
}

export type AnalyticsPeriod = 
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

export interface AnalyticsQuery {
  provider: OAuthProvider;
  metrics: AnalyticsMetric[];
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  granularity?: AnalyticsPeriod;
}

export interface AnalyticsReport {
  provider: OAuthProvider;
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;
  data: AnalyticsData[];
  summary: AnalyticsSummary;
}

export interface AnalyticsSummary {
  totalShares?: number;
  totalClicks?: number;
  totalImpressions?: number;
  averageEngagement?: number;
  followerGrowth?: number;
  topPerformingContent?: {
    url: string;
    shares: number;
    clicks: number;
  }[];
}

export interface SocialPostAnalytics {
  postId: string;
  platform: SharePlatform;
  url: string;
  shares: number;
  likes: number;
  comments: number;
  clicks: number;
  impressions: number;
  engagementRate: number;
  publishedAt: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export class SocialError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: OAuthProvider,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SocialError';
  }
}

export class OAuthError extends SocialError {
  constructor(
    message: string,
    code: string,
    provider: OAuthProvider,
    details?: Record<string, unknown>
  ) {
    super(message, code, provider, details);
    this.name = 'OAuthError';
  }
}

export class ShareError extends SocialError {
  constructor(
    message: string,
    code: string,
    platform: SharePlatform,
    details?: Record<string, unknown>
  ) {
    super(message, code, undefined, { ...details, platform });
    this.name = 'ShareError';
  }
}

export class SyncError extends SocialError {
  constructor(
    message: string,
    code: string,
    provider: OAuthProvider,
    details?: Record<string, unknown>
  ) {
    super(message, code, provider, details);
    this.name = 'SyncError';
  }
}
