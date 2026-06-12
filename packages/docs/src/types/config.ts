/**
 * Configuration types for documentation generators
 */

export interface DocConfig {
  /** Root directory of the monorepo */
  rootDir: string;
  /** Output directory for generated documentation */
  outputDir: string;
  /** Package name being documented */
  packageName?: string;
  /** Whether to include private members */
  includePrivate?: boolean;
  /** Whether to include internal members */
  includeInternal?: boolean;
  /** Custom templates directory */
  templatesDir?: string;
  /** Additional metadata to include */
  metadata?: Record<string, any>;
}

export interface ApiDocConfig extends DocConfig {
  /** API base URL */
  baseUrl?: string;
  /** API version */
  version?: string;
  /** Authentication type */
  authType?: 'none' | 'bearer' | 'basic' | 'apiKey';
}

export interface ArchitectureConfig extends DocConfig {
  /** Include deployment diagrams */
  includeDeployment?: boolean;
  /** Include data flow diagrams */
  includeDataFlow?: boolean;
  /** Include component interaction diagrams */
  includeInteractions?: boolean;
}

export interface ComponentDocConfig extends DocConfig {
  /** Include props documentation */
  includeProps?: boolean;
  /** Include state documentation */
  includeState?: boolean;
  /** Include lifecycle documentation */
  includeLifecycle?: boolean;
}

export interface TypeDocConfig extends DocConfig {
  /** Include JSDoc comments */
  includeJSDoc?: boolean;
  /** Include type inheritance */
  includeInheritance?: boolean;
  /** Include type implementations */
  includeImplementations?: boolean;
}

export interface ExamplesConfig extends DocConfig {
  /** Include basic examples */
  includeBasic?: boolean;
  /** Include advanced examples */
  includeAdvanced?: boolean;
  /** Include edge case examples */
  includeEdgeCases?: boolean;
}
