/**
 * Version Control System
 * Manages content versioning and history
 */

import type { Content, ContentVersion } from '../types/index.js';
import { ContentVersionSchema } from '../schemas/index.js';

export interface VersionDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: 'added' | 'removed' | 'modified';
}

export class VersionControl {
  private versions: Map<string, ContentVersion[]> = new Map();

  /**
   * Create a new version of content
   */
  createVersion(
    content: Content,
    comment?: string,
    author?: string
  ): ContentVersion {
    const version: ContentVersion = {
      id: this.generateId(),
      contentId: content.id,
      version: content.version,
      fields: { ...content.fields },
      createdBy: author || content.updatedBy,
      createdAt: new Date(),
      comment,
    };

    const validated = ContentVersionSchema.parse(version);
    
    const versions = this.versions.get(content.id) || [];
    versions.push(validated);
    this.versions.set(content.id, versions);
    
    return validated;
  }

  /**
   * Get all versions for a content item
   */
  getVersions(contentId: string): ContentVersion[] {
    return this.versions.get(contentId) || [];
  }

  /**
   * Get a specific version
   */
  getVersion(contentId: string, versionNumber: number): ContentVersion | undefined {
    const versions = this.versions.get(contentId) || [];
    return versions.find(v => v.version === versionNumber);
  }

  /**
   * Get the latest version
   */
  getLatestVersion(contentId: string): ContentVersion | undefined {
    const versions = this.versions.get(contentId) || [];
    return versions[versions.length - 1];
  }

  /**
   * Compare two versions
   */
  compareVersions(
    contentId: string,
    versionA: number,
    versionB: number
  ): VersionDiff[] {
    const versionAData = this.getVersion(contentId, versionA);
    const versionBData = this.getVersion(contentId, versionB);

    if (!versionAData || !versionBData) {
      return [];
    }

    const diffs: VersionDiff[] = [];
    const allKeys = new Set([
      ...Object.keys(versionAData.fields),
      ...Object.keys(versionBData.fields),
    ]);

    for (const key of allKeys) {
      const valueA = versionAData.fields[key];
      const valueB = versionBData.fields[key];

      if (valueA === undefined && valueB !== undefined) {
        diffs.push({
          field: key,
          oldValue: undefined,
          newValue: valueB,
          type: 'added',
        });
      } else if (valueA !== undefined && valueB === undefined) {
        diffs.push({
          field: key,
          oldValue: valueA,
          newValue: undefined,
          type: 'removed',
        });
      } else if (JSON.stringify(valueA) !== JSON.stringify(valueB)) {
        diffs.push({
          field: key,
          oldValue: valueA,
          newValue: valueB,
          type: 'modified',
        });
      }
    }

    return diffs;
  }

  /**
   * Restore content to a specific version
   */
  restoreVersion(contentId: string, versionNumber: number): Record<string, unknown> | null {
    const version = this.getVersion(contentId, versionNumber);
    if (!version) return null;

    return { ...version.fields };
  }

  /**
   * Delete old versions (keep only N most recent)
   */
  pruneVersions(contentId: string, keepCount: number): number {
    const versions = this.versions.get(contentId);
    if (!versions || versions.length <= keepCount) return 0;

    const toDelete = versions.length - keepCount;
    const pruned = versions.slice(toDelete);
    this.versions.set(contentId, pruned);
    
    return toDelete;
  }

  /**
   * Get version history summary
   */
  getVersionHistory(contentId: string): Array<{
    version: number;
    author: string;
    createdAt: Date;
    comment?: string;
  }> {
    const versions = this.versions.get(contentId) || [];
    
    return versions.map(v => ({
      version: v.version,
      author: v.createdBy,
      createdAt: v.createdAt,
      comment: v.comment,
    }));
  }

  /**
   * Delete all versions for a content item
   */
  deleteVersions(contentId: string): boolean {
    return this.versions.delete(contentId);
  }

  /**
   * Get version count for a content item
   */
  getVersionCount(contentId: string): number {
    return this.versions.get(contentId)?.length || 0;
  }

  /**
   * Check if a version exists
   */
  hasVersion(contentId: string, versionNumber: number): boolean {
    const versions = this.versions.get(contentId) || [];
    return versions.some(v => v.version === versionNumber);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
