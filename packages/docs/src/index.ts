/**
 * @aether/docs - Documentation Generation Package
 *
 * This package provides comprehensive documentation generation tools for the Aether monorepo.
 * It includes generators for API docs, architecture diagrams, component documentation,
 * usage examples, and TypeScript type documentation.
 */

export { ApiDocGenerator } from './generators/api-doc-generator';
export { ArchitectureGenerator } from './generators/architecture-generator';
export { ComponentDocGenerator } from './generators/component-doc-generator';
export { ExamplesGenerator } from './generators/examples-generator';
export { TypeDocGenerator } from './generators/type-doc-generator';
export { PackageReadmeGenerator } from './generators/package-readme-generator';
export { AllDocsGenerator } from './generators/all-docs';

export { MarkdownTemplate } from './templates/markdown-template';
export type { DocConfig } from './types/config';
export type { DocOutput } from './types/output';

// Re-export utility functions
export * from './utils/file-utils';
export * from './utils/ast-utils';
export * from './utils/format-utils';
