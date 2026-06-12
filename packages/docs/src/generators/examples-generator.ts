/**
 * Usage Examples Generator
 *
 * Generates usage examples from test files and documentation
 */

import * as path from 'path';
import { FileUtils } from '../utils/file-utils';
import { FormatUtils } from '../utils/format-utils';
import { ExamplesConfig, DocOutput } from '../types/index';

export class ExamplesGenerator {
  private config: ExamplesConfig;

  constructor(config: ExamplesConfig) {
    this.config = config;
  }

  /**
   * Generate usage examples
   */
  async generate(): Promise<DocOutput[]> {
    const outputs: DocOutput[] = [];

    const examples = await this.collectExamples();

    for (const example of examples) {
      const markdown = this.generateExampleMarkdown(example);
      const outputPath = path.join(
        this.config.outputDir,
        'examples',
        `${example.name}.md`
      );

      await FileUtils.writeFile(outputPath, markdown);

      outputs.push({
        path: outputPath,
        content: markdown,
        type: 'example',
        metadata: {
          generatedAt: new Date(),
          generatorVersion: '1.0.0',
          sourceFiles: example.sourceFiles,
          itemCount: 1,
        },
      });
    }

    // Generate index
    const indexMarkdown = this.generateIndex(examples);
    const indexPath = path.join(this.config.outputDir, 'examples', 'README.md');
    await FileUtils.writeFile(indexPath, indexMarkdown);

    outputs.push({
      path: indexPath,
      content: indexMarkdown,
      type: 'example',
      metadata: {
        generatedAt: new Date(),
        generatorVersion: '1.0.0',
        sourceFiles: [],
        itemCount: examples.length,
      },
    });

    return outputs;
  }

  /**
   * Collect examples from test files and documentation
   */
  private async collectExamples(): Promise<
    Array<{
      name: string;
      description: string;
      code: string;
      language: string;
      category: string;
      sourceFiles: string[];
    }>
  > {
    const examples: Array<{
      name: string;
      description: string;
      code: string;
      language: string;
      category: string;
      sourceFiles: string[];
    }> = [];

    // Scan test files for examples
    const packagesDir = path.join(this.config.rootDir, 'packages');
    const testFiles = await FileUtils.getTypeScriptFiles(packagesDir);

    for (const file of testFiles) {
      if (file.includes('.test.') || file.includes('.spec.')) {
        const content = await FileUtils.readFile(file);
        const fileExamples = this.parseTestExamples(file, content);
        examples.push(...fileExamples);
      }
    }

    return examples;
  }

  /**
   * Parse examples from test files
   */
  private parseTestExamples(
    filePath: string,
    content: string
  ): Array<{
    name: string;
    description: string;
    code: string;
    language: string;
    category: string;
    sourceFiles: string[];
  }> {
    const examples: Array<{
      name: string;
      description: string;
      code: string;
      language: string;
      category: string;
      sourceFiles: string[];
    }> = [];

    // Look for describe/it blocks
    const describeRegex = /describe\(['"`]([^'"`]+)['"`],\s*\(\)\s*=>\s*\{([\s\S]*?)\}\)/g;
    let match;

    while ((match = describeRegex.exec(content)) !== null) {
      const [, description, block] = match;
      const itRegex = /it\(['"`]([^'"`]+)['"`],\s*\(\)\s*=>\s*\{([\s\S]*?)\}\)/g;
      let itMatch;

      while ((itMatch = itRegex.exec(block)) !== null) {
        const [, testName, testCode] = itMatch;
        examples.push({
          name: `${description} - ${testName}`,
          description: `${description}: ${testName}`,
          code: this.cleanCode(testCode),
          language: 'typescript',
          category: description,
          sourceFiles: [filePath],
        });
      }
    }

    return examples;
  }

  /**
   * Clean up code for documentation
   */
  private cleanCode(code: string): string {
    // Remove test-specific code
    return code
      .replace(/expect\([^)]+\)\.[a-zA-Z]+\([^)]*\);?/g, '')
      .replace(/\.to[BE].*\(\);?/g, '')
      .replace(/beforeEach\([^)]*\);?/g, '')
      .replace(/afterEach\([^)]*\);?/g, '')
      .replace(/beforeAll\([^)]*\);?/g, '')
      .replace(/afterAll\([^)]*\);?/g, '')
      .trim();
  }

  /**
   * Generate markdown for an example
   */
  private generateExampleMarkdown(example: any): string {
    let markdown = '';

    markdown += FormatUtils.heading(example.name, 1);
    markdown += `${example.description}\n\n`;
    markdown += FormatUtils.heading('Code', 2);
    markdown += FormatUtils.codeBlock(example.code, example.language);
    markdown += FormatUtils.alert('note', `Category: ${example.category}`);

    return markdown;
  }

  /**
   * Generate examples index
   */
  private generateIndex(examples: any[]): string {
    let markdown = '';

    markdown += FormatUtils.heading('Usage Examples', 1);
    markdown += `This directory contains usage examples extracted from test files and documentation.\n\n`;

    // Group by category
    const grouped = examples.reduce((acc, example) => {
      if (!acc[example.category]) {
        acc[example.category] = [];
      }
      acc[example.category].push(example);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [category, categoryExamples] of Object.entries(grouped)) {
      markdown += FormatUtils.heading(category, 2);

      for (const example of categoryExamples as any[]) {
        markdown += `- [${example.name}](${example.name}.md)\n`;
      }

      markdown += '\n';
    }

    return markdown;
  }
}
