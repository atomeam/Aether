/**
 * All Documentation Generator
 *
 * Runs all documentation generators in sequence
 */

import { ApiDocGenerator } from './api-doc-generator';
import { ArchitectureGenerator } from './architecture-generator';
import { ComponentDocGenerator } from './component-doc-generator';
import { ExamplesGenerator } from './examples-generator';
import { TypeDocGenerator } from './type-doc-generator';
import { PackageReadmeGenerator } from './package-readme-generator';
import { DocConfig, ApiDocConfig, ArchitectureConfig, ComponentDocConfig, ExamplesConfig, TypeDocConfig } from '../types/index';
import * as path from 'path';

export class AllDocsGenerator {
  private config: DocConfig;

  constructor(config: DocConfig) {
    this.config = config;
  }

  /**
   * Generate all documentation
   */
  async generate(): Promise<void> {
    console.log('🚀 Starting documentation generation...');

    // Generate API documentation
    console.log('📝 Generating API documentation...');
    const apiConfig: ApiDocConfig = {
      ...this.config,
      outputDir: path.join(this.config.outputDir, 'api'),
    };
    const apiGenerator = new ApiDocGenerator(apiConfig);
    await apiGenerator.generate();
    console.log('✅ API documentation generated');

    // Generate architecture documentation
    console.log('🏗️  Generating architecture documentation...');
    const archConfig: ArchitectureConfig = {
      ...this.config,
      outputDir: this.config.outputDir,
    };
    const archGenerator = new ArchitectureGenerator(archConfig);
    await archGenerator.generate();
    console.log('✅ Architecture documentation generated');

    // Generate component documentation
    console.log('🧩 Generating component documentation...');
    const compConfig: ComponentDocConfig = {
      ...this.config,
      outputDir: path.join(this.config.outputDir, 'components'),
    };
    const compGenerator = new ComponentDocGenerator(compConfig);
    await compGenerator.generate();
    console.log('✅ Component documentation generated');

    // Generate usage examples
    console.log('💡 Generating usage examples...');
    const exConfig: ExamplesConfig = {
      ...this.config,
      outputDir: path.join(this.config.outputDir, 'examples'),
    };
    const exGenerator = new ExamplesGenerator(exConfig);
    await exGenerator.generate();
    console.log('✅ Usage examples generated');

    // Generate type documentation
    console.log('📚 Generating type documentation...');
    const typeConfig: TypeDocConfig = {
      ...this.config,
      outputDir: path.join(this.config.outputDir, 'types'),
    };
    const typeGenerator = new TypeDocGenerator(typeConfig);
    await typeGenerator.generate();
    console.log('✅ Type documentation generated');

    // Generate package READMEs
    console.log('📦 Generating package READMEs...');
    const readmeGenerator = new PackageReadmeGenerator(this.config);
    await readmeGenerator.generate();
    console.log('✅ Package READMEs generated');

    console.log('🎉 All documentation generated successfully!');
  }
}

// CLI entry point
if (require.main === module) {
  const config: DocConfig = {
    rootDir: path.resolve(__dirname, '../../../..'),
    outputDir: path.resolve(__dirname, '../../../..'),
    includePrivate: false,
    includeInternal: false,
  };

  const generator = new AllDocsGenerator(config);
  generator.generate().catch(console.error);
}
