/**
 * @aether/social - Zod Schemas
 * 
 * Zod validation schemas for all social media integration types.
 */

import { z } from 'zod';

// ============================================================================
// OAuth Provider Schemas
// ============================================================================

export const OAuthProviderSchema = z.enum([
  'twitter',
  'facebook',
  'linkedin',
  'google',
  'github',
  'instagram',
  'tiktok',
  'discord',
  'spotify',
  'apple'
]);

export const OAuthConfigSchema = z.object({
  provider: OAuthProviderSchema,
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).optional(),
  state: z.string().optional()
});

export const OAuthTokenSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number().int().positive().optional(),
  scope: z.string().optional(),
  obtainedAt: z.date()
});

export const OAuthUserProfileSchema = z.object({
  provider: OAuthProviderSchema,
  providerId: z.string().min(1),
  email: z.string().email().optional(),
  name: z.string().optional(),
  username: z.string().optional(),
  avatar: z.string().url().optional(),
  profileUrl: z.string().url().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  verified: z.boolean().optional(),
  followersCount: z.number().int().nonnegative().optional(),
  followingCount: z.number().int().nonnegative().optional(),
  raw: z.record(z.unknown()).optional()
});

export const OAuthAuthorizationUrlSchema = z.object({
  url: z.string().url(),
  state: z.string().min(1)
});

// ============================================================================
// Social Sharing Schemas
// ============================================================================

export const SharePlatformSchema = z.enum([
  'twitter',
  'facebook',
  'linkedin',
  'pinterest',
  'reddit',
  'whatsapp',
  'telegram',
  'email'
]);

export const ShareContentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  url: z.string().url(),
  image: z.string().url().optional(),
  hashtags: z.array(z.string().regex(/^#[a-zA-Z0-9_]+$/)).optional(),
  via: z.string().optional(),
  related: z.array(z.string()).optional()
});

export const ShareOptionsSchema = z.object({
  platform: SharePlatformSchema,
  content: ShareContentSchema,
  openInNewTab: z.boolean().default(true),
  trackingParams: z.record(z.string()).optional()
});

export const ShareResultSchema = z.object({
  success: z.boolean(),
  platform: SharePlatformSchema,
  url: z.string().url().optional(),
  error: z.string().optional()
});

// ============================================================================
// Social Login Schemas
// ============================================================================

export const SocialLoginRequestSchema = z.object({
  provider: OAuthProviderSchema,
  code: z.string().min(1),
  state: z.string().min(1),
  redirectUri: z.string().url()
});

export const SocialLoginResponseSchema = z.object({
  success: z.boolean(),
  user: OAuthUserProfileSchema.optional(),
  token: OAuthTokenSchema.optional(),
  error: z.string().optional(),
  isNewUser: z.boolean().optional()
});

export const SocialLinkRequestSchema = z.object({
  userId: z.string().min(1),
  provider: OAuthProviderSchema,
  code: z.string().min(1),
  state: z.string().min(1),
  redirectUri: z.string().url()
});

export const SocialLinkResponseSchema = z.object({
  success: z.boolean(),
  linked: z.boolean().optional(),
  error: z.string().optional()
});

export const SocialUnlinkRequestSchema = z.object({
  userId: z.string().min(1),
  provider: OAuthProviderSchema
});

export const SocialUnlinkResponseSchema = z.object({
  success: z.boolean(),
  unlinked: z.boolean().optional(),
  error: z.string().optional()
});

// ============================================================================
// Profile Sync Schemas
// ============================================================================

export const SyncFieldSchema = z.enum([
  'name',
  'email',
  'avatar',
  'bio',
  'location',
  'website',
  'username'
]);

export const SyncConfigSchema = z.object({
  provider: OAuthProviderSchema,
  fields: z.array(SyncFieldSchema).min(1),
  autoSync: z.boolean(),
  syncInterval: z.number().int().positive().optional(),
  lastSyncAt: z.date().optional()
});

export const SyncResultSchema = z.object({
  success: z.boolean(),
  provider: OAuthProviderSchema,
  syncedFields: z.array(SyncFieldSchema),
  failedFields: z.array(SyncFieldSchema),
  syncedAt: z.date(),
  error: z.string().optional()
});

export const ProfileDataSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
  username: z.string().optional()
});

// ============================================================================
// Social Analytics Schemas
// ============================================================================

export const AnalyticsMetricSchema = z.enum([
  'shares',
  'clicks',
  'impressions',
  'engagement',
  'followers',
  'following',
  'posts',
  'mentions',
  'reach'
]);

export const AnalyticsPeriodSchema = z.enum([
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly'
]);

export const AnalyticsDataSchema = z.object({
  provider: OAuthProviderSchema,
  metric: AnalyticsMetricSchema,
  value: z.number().int().nonnegative(),
  change: z.number().optional(),
  period: AnalyticsPeriodSchema,
  timestamp: z.date()
});

export const AnalyticsQuerySchema = z.object({
  provider: OAuthProviderSchema,
  metrics: z.array(AnalyticsMetricSchema).min(1),
  period: AnalyticsPeriodSchema,
  startDate: z.date(),
  endDate: z.date(),
  granularity: AnalyticsPeriodSchema.optional()
}).refine(
  (data) => data.startDate <= data.endDate,
  { message: "startDate must be before or equal to endDate" }
);

export const AnalyticsSummarySchema = z.object({
  totalShares: z.number().int().nonnegative().optional(),
  totalClicks: z.number().int().nonnegative().optional(),
  totalImpressions: z.number().int().nonnegative().optional(),
  averageEngagement: z.number().nonnegative().optional(),
  followerGrowth: z.number().optional(),
  topPerformingContent: z.array(z.object({
    url: z.string().url(),
    shares: z.number().int().nonnegative(),
    clicks: z.number().int().nonnegative()
  })).optional()
});

export const AnalyticsReportSchema = z.object({
  provider: OAuthProviderSchema,
  period: AnalyticsPeriodSchema,
  startDate: z.date(),
  endDate: z.date(),
  data: z.array(AnalyticsDataSchema),
  summary: AnalyticsSummarySchema
});

export const SocialPostAnalyticsSchema = z.object({
  postId: z.string().min(1),
  platform: SharePlatformSchema,
  url: z.string().url(),
  shares: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative(),
  engagementRate: z.number().nonnegative(),
  publishedAt: z.date()
});

// ============================================================================
// Export all schemas
// ============================================================================

export const SocialSchemas = {
  // OAuth
  OAuthProvider: OAuthProviderSchema,
  OAuthConfig: OAuthConfigSchema,
  OAuthToken: OAuthTokenSchema,
  OAuthUserProfile: OAuthUserProfileSchema,
  OAuthAuthorizationUrl: OAuthAuthorizationUrlSchema,
  
  // Sharing
  SharePlatform: SharePlatformSchema,
  ShareContent: ShareContentSchema,
  ShareOptions: ShareOptionsSchema,
  ShareResult: ShareResultSchema,
  
  // Login
  SocialLoginRequest: SocialLoginRequestSchema,
  SocialLoginResponse: SocialLoginResponseSchema,
  SocialLinkRequest: SocialLinkRequestSchema,
  SocialLinkResponse: SocialLinkResponseSchema,
  SocialUnlinkRequest: SocialUnlinkRequestSchema,
  SocialUnlinkResponse: SocialUnlinkResponseSchema,
  
  // Sync
  SyncField: SyncFieldSchema,
  SyncConfig: SyncConfigSchema,
  SyncResult: SyncResultSchema,
  ProfileData: ProfileDataSchema,
  
  // Analytics
  AnalyticsMetric: AnalyticsMetricSchema,
  AnalyticsPeriod: AnalyticsPeriodSchema,
  AnalyticsData: AnalyticsDataSchema,
  AnalyticsQuery: AnalyticsQuerySchema,
  AnalyticsReport: AnalyticsReportSchema,
  AnalyticsSummary: AnalyticsSummarySchema,
  SocialPostAnalytics: SocialPostAnalyticsSchema
};
