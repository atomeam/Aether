/**
 * @aether/social - Profile Sync Module
 * 
 * Profile synchronization functionality to keep user profiles in sync with
 * their social media profiles across multiple platforms.
 */

import type {
  OAuthProvider,
  OAuthUserProfile,
  OAuthToken,
  SyncConfig,
  SyncResult,
  SyncField,
  ProfileData
} from './types.js';
import { SyncError } from './types.js';
import { OAuthManager } from './oauth.js';

// ============================================================================
// Sync Configuration Store
// ============================================================================

interface UserSyncConfig {
  userId: string;
  configs: Map<OAuthProvider, SyncConfig>;
}

class SyncConfigStore {
  private configs: Map<string, UserSyncConfig> = new Map();

  /**
   * Set sync configuration for a user
   */
  setConfig(userId: string, config: SyncConfig): void {
    let userConfig = this.configs.get(userId);
    if (!userConfig) {
      userConfig = { userId, configs: new Map() };
      this.configs.set(userId, userConfig);
    }
    userConfig.configs.set(config.provider, config);
  }

  /**
   * Get sync configuration for a user and provider
   */
  getConfig(userId: string, provider: OAuthProvider): SyncConfig | undefined {
    const userConfig = this.configs.get(userId);
    return userConfig?.configs.get(provider);
  }

  /**
   * Get all sync configurations for a user
   */
  getAllConfigs(userId: string): SyncConfig[] {
    const userConfig = this.configs.get(userId);
    if (!userConfig) {
      return [];
    }
    return Array.from(userConfig.configs.values());
  }

  /**
   * Remove sync configuration
   */
  removeConfig(userId: string, provider: OAuthProvider): boolean {
    const userConfig = this.configs.get(userId);
    if (!userConfig) {
      return false;
    }
    return userConfig.configs.delete(provider);
  }

  /**
   * Clear all configurations
   */
  clear(): void {
    this.configs.clear();
  }
}

// ============================================================================
// Profile Sync Manager Class
// ============================================================================

export class ProfileSyncManager {
  private oauthManager: OAuthManager;
  private configStore: SyncConfigStore;
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private profileStore: Map<string, ProfileData> = new Map();

  constructor(oauthManager?: OAuthManager) {
    this.oauthManager = oauthManager || new OAuthManager();
    this.configStore = new SyncConfigStore();
  }

  /**
   * Configure profile sync for a user
   */
  configureSync(userId: string, config: SyncConfig): void {
    this.configStore.setConfig(userId, config);

    // Clear existing timer for this user/provider
    const timerKey = `${userId}:${config.provider}`;
    const existingTimer = this.syncTimers.get(timerKey);
    if (existingTimer) {
      clearInterval(existingTimer);
      this.syncTimers.delete(timerKey);
    }

    // Set up auto-sync if enabled
    if (config.autoSync && config.syncInterval) {
      const timer = setInterval(() => {
        this.syncProfile(userId, config.provider).catch(console.error);
      }, config.syncInterval);
      this.syncTimers.set(timerKey, timer);
    }
  }

  /**
   * Sync profile from a provider
   */
  async syncProfile(userId: string, provider: OAuthProvider): Promise<SyncResult> {
    const config = this.configStore.getConfig(userId, provider);
    if (!config) {
      throw new SyncError(
        'No sync configuration found',
        'CONFIG_NOT_FOUND',
        provider
      );
    }

    const tokenKey = `${userId}:${provider}`;
    const token = this.oauthManager.getToken(tokenKey);

    if (!token) {
      throw new SyncError(
        'No OAuth token found for provider',
        'TOKEN_NOT_FOUND',
        provider
      );
    }

    if (this.oauthManager.isTokenExpired(token)) {
      throw new SyncError(
        'OAuth token has expired',
        'TOKEN_EXPIRED',
        provider
      );
    }

    try {
      // Fetch user profile from provider
      const profile = await this.oauthManager.getUserProfile(provider, token);

      // Extract fields to sync
      const syncedFields: SyncField[] = [];
      const failedFields: SyncField[] = [];
      const profileData: ProfileData = {};

      for (const field of config.fields) {
        try {
          const value = this.extractField(profile, field);
          if (value !== undefined) {
            profileData[field] = value as string;
            syncedFields.push(field);
          } else {
            failedFields.push(field);
          }
        } catch (error) {
          failedFields.push(field);
        }
      }

      // Update stored profile
      const existingProfile = this.profileStore.get(userId) || {};
      this.profileStore.set(userId, { ...existingProfile, ...profileData });

      // Update last sync time
      config.lastSyncAt = new Date();
      this.configStore.setConfig(userId, config);

      return {
        success: true,
        provider,
        syncedFields,
        failedFields,
        syncedAt: new Date()
      };
    } catch (error) {
      if (error instanceof SyncError) {
        throw error;
      }
      throw new SyncError(
        `Profile sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SYNC_FAILED',
        provider
      );
    }
  }

  /**
   * Sync profile from all configured providers
   */
  async syncAllProfiles(userId: string): Promise<SyncResult[]> {
    const configs = this.configStore.getAllConfigs(userId);
    const results: SyncResult[] = [];

    for (const config of configs) {
      try {
        const result = await this.syncProfile(userId, config.provider);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          provider: config.provider,
          syncedFields: [],
          failedFields: config.fields,
          syncedAt: new Date(),
          error: error instanceof Error ? error.message : 'Sync failed'
        });
      }
    }

    return results;
  }

  /**
   * Extract a specific field from a profile
   */
  private extractField(profile: OAuthUserProfile, field: SyncField): unknown {
    switch (field) {
      case 'name':
        return profile.name;
      case 'email':
        return profile.email;
      case 'avatar':
        return profile.avatar;
      case 'bio':
        return profile.bio;
      case 'location':
        return profile.location;
      case 'website':
        return profile.website;
      case 'username':
        return profile.username;
      default:
        return undefined;
    }
  }

  /**
   * Get synced profile data for a user
   */
  getSyncedProfile(userId: string): ProfileData | undefined {
    return this.profileStore.get(userId);
  }

  /**
   * Get specific field from synced profile
   */
  getSyncedField(userId: string, field: SyncField): unknown {
    const profile = this.profileStore.get(userId);
    return profile?.[field];
  }

  /**
   * Manually trigger a sync
   */
  async manualSync(userId: string, provider: OAuthProvider): Promise<SyncResult> {
    return this.syncProfile(userId, provider);
  }

  /**
   * Remove sync configuration
   */
  removeSyncConfig(userId: string, provider: OAuthProvider): void {
    this.configStore.removeConfig(userId, provider);

    // Clear timer
    const timerKey = `${userId}:${provider}`;
    const timer = this.syncTimers.get(timerKey);
    if (timer) {
      clearInterval(timer);
      this.syncTimers.delete(timerKey);
    }
  }

  /**
   * Remove all sync configurations for a user
   */
  removeAllSyncConfigs(userId: string): void {
    const configs = this.configStore.getAllConfigs(userId);
    for (const config of configs) {
      this.removeSyncConfig(userId, config.provider);
    }
  }

  /**
   * Get sync status for a user
   */
  getSyncStatus(userId: string): Record<OAuthProvider, { configured: boolean; lastSync?: Date; autoSync: boolean }> {
    const configs = this.configStore.getAllConfigs(userId);
    const status: Record<OAuthProvider, { configured: boolean; lastSync?: Date; autoSync: boolean }> = {} as any;

    for (const config of configs) {
      status[config.provider] = {
        configured: true,
        lastSync: config.lastSyncAt,
        autoSync: config.autoSync
      };
    }

    return status;
  }

  /**
   * Check if a field is syncable for a provider
   */
  isFieldSyncable(provider: OAuthProvider, field: SyncField): boolean {
    const nonSyncableFields: Record<OAuthProvider, SyncField[]> = {
      instagram: ['email', 'location', 'website'],
      tiktok: ['email', 'location', 'website'],
      spotify: ['email', 'location', 'website', 'username'],
      discord: ['location', 'website'],
      twitter: [],
      facebook: [],
      linkedin: [],
      google: [],
      github: [],
      apple: []
    };

    const excluded = nonSyncableFields[provider] || [];
    return !excluded.includes(field);
  }

  /**
   * Get recommended sync fields for a provider
   */
  getRecommendedSyncFields(provider: OAuthProvider): SyncField[] {
    const allFields: SyncField[] = ['name', 'email', 'avatar', 'bio', 'location', 'website', 'username'];
    return allFields.filter(field => this.isFieldSyncable(provider, field));
  }

  /**
   * Merge profile data from multiple providers
   */
  mergeProfiles(profiles: OAuthUserProfile[]): ProfileData {
    const merged: ProfileData = {};

    // Priority order for fields
    const priority: OAuthProvider[] = ['google', 'facebook', 'twitter', 'github', 'linkedin'];

    // Sort profiles by priority
    const sorted = [...profiles].sort((a, b) => {
      const aIndex = priority.indexOf(a.provider);
      const bIndex = priority.indexOf(b.provider);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    for (const profile of sorted) {
      if (!merged.name && profile.name) merged.name = profile.name;
      if (!merged.email && profile.email) merged.email = profile.email;
      if (!merged.avatar && profile.avatar) merged.avatar = profile.avatar;
      if (!merged.bio && profile.bio) merged.bio = profile.bio;
      if (!merged.location && profile.location) merged.location = profile.location;
      if (!merged.website && profile.website) merged.website = profile.website;
      if (!merged.username && profile.username) merged.username = profile.username;
    }

    return merged;
  }

  /**
   * Validate sync configuration
   */
  validateConfig(config: SyncConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.fields.length === 0) {
      errors.push('At least one field must be specified for sync');
    }

    for (const field of config.fields) {
      if (!this.isFieldSyncable(config.provider, field)) {
        errors.push(`Field '${field}' is not syncable for provider '${config.provider}'`);
      }
    }

    if (config.autoSync && config.syncInterval && config.syncInterval < 60000) {
      errors.push('Sync interval must be at least 60 seconds');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.configStore.clear();
    this.profileStore.clear();
    
    // Clear all timers
    for (const timer of this.syncTimers.values()) {
      clearInterval(timer);
    }
    this.syncTimers.clear();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a new profile sync manager instance
 */
export function createProfileSyncManager(oauthManager?: OAuthManager): ProfileSyncManager {
  return new ProfileSyncManager(oauthManager);
}

/**
 * Create a default sync configuration
 */
export function createDefaultSyncConfig(provider: OAuthProvider, autoSync: boolean = false): SyncConfig {
  const manager = new ProfileSyncManager();
  return {
    provider,
    fields: manager.getRecommendedSyncFields(provider),
    autoSync,
    syncInterval: autoSync ? 3600000 : undefined // 1 hour if auto-sync enabled
  };
}
