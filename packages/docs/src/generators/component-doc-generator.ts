/**
 * Component Documentation Generator
 *
 * Generates documentation for React components
 */

import * as path from 'path';
import * as ts from 'typescript';
import { FileUtils } from '../utils/file-utils';
import { AstUtils } from '../utils/ast-utils';
import { FormatUtils } from '../utils/format-utils';
import { ComponentDocConfig, ComponentDoc, DocOutput, ComponentProp } from '../types/index';

export class ComponentDocGenerator {
  private config: ComponentDocConfig;

  constructor(config: ComponentDocConfig) {
    this.config = config;
  }

  /**
   * Generate component documentation
   */
  async generate(): Promise<DocOutput[]> {
    const outputs: DocOutput[] = [];
    const components = await this.collectComponents();

    for (const component of components) {
      const markdown = this.generateComponentMarkdown(component);
      const outputPath = path.join(
        this.config.outputDir,
        'components',
        `${component.name}.md`
      );

      await FileUtils.writeFile(outputPath, markdown);

      outputs.push({
        path: outputPath,
        content: markdown,
        type: 'component',
        metadata: {
          generatedAt: new Date(),
          generatorVersion: '1.0.0',
          sourceFiles: [component.filePath],
          itemCount: 1,
        },
      });
    }

    // Generate index
    const indexMarkdown = this.generateIndex(components);
    const indexPath = path.join(this.config.outputDir, 'components', 'README.md');
    await FileUtils.writeFile(indexPath, indexMarkdown);

    outputs.push({
      path: indexPath,
      content: indexMarkdown,
      type: 'component',
      metadata: {
        generatedAt: new Date(),
        generatorVersion: '1.0.0',
        sourceFiles: [],
        itemCount: components.length,
      },
    });

    return outputs;
  }

  /**
   * Collect all React components
   */
  private async collectComponents(): Promise<ComponentDoc[]> {
    const components: ComponentDoc[] = [];

    // Scan frontend and apps directories
    const directories = [
      path.join(this.config.rootDir, 'apps', 'frontend'),
      path.join(this.config.rootDir, 'apps', 'cockpit'),
    ];

    for (const dir of directories) {
      const reactFiles = await FileUtils.getReactFiles(dir);

      for (const file of reactFiles) {
        const content = await FileUtils.readFile(file);
        const sourceFile = AstUtils.parseFile(file, content);
        const component = this.parseComponent(file, sourceFile);

        if (component) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Parse a component from a source file
   */
  private parseComponent(filePath: string, sourceFile: ts.SourceFile): ComponentDoc | null {
    // Look for function components
    const visit = (node: ts.Node): ComponentDoc | null => {
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
        const name = this.getComponentName(node);
        if (name && this.isComponent(node)) {
          return {
            name,
            filePath,
            description: AstUtils.getDescription(node) || 'No description',
            props: this.extractProps(node),
            example: this.extractExample(sourceFile, name),
          };
        }
      }

      if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
          const name = declaration.name.getText();
          if (this.isComponent(declaration.initializer)) {
            return {
              name,
              filePath,
              description: AstUtils.getDescription(node) || 'No description',
              props: this.extractProps(declaration.initializer),
              example: this.extractExample(sourceFile, name),
            };
          }
        }
      }

      let result: ComponentDoc | null = null;
      ts.forEachChild(node, child => {
        if (!result) {
          result = visit(child);
        }
      });
      return result;
    };

    return visit(sourceFile);
  }

  /**
   * Get component name from a node
   */
  private getComponentName(node: ts.Node): string | null {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    }
    return null;
  }

  /**
   * Check if a node is a React component
   */
  private isComponent(node: ts.Node): boolean {
    // Check if it returns JSX
    const visit = (n: ts.Node): boolean => {
      if (ts.isJsxElement(n) || ts.isJsxFragment(n)) {
        return true;
      }
      let found = false;
      ts.forEachChild(n, child => {
        if (!found) {
          found = visit(child);
        }
      });
      return found;
    };
    return visit(node);
  }

  /**
   * Extract props from a component
   */
  private extractProps(_node: ts.Node): any[] {
    // This is a simplified version - in production, you'd use more sophisticated AST analysis
    return [];
  }

  /**
   * Extract example usage
   */
  private extractExample(_sourceFile: ts.SourceFile, _componentName: string): string | undefined {
    // Look for example comments or test files
    return undefined;
  }

  /**
   * Generate markdown for a component
   */
  private generateComponentMarkdown(component: ComponentDoc): string {
    let markdown = '';

    markdown += FormatUtils.heading(component.name, 1);
    markdown += `${component.description}\n\n`;

    if (component.props && component.props.length > 0) {
      markdown += FormatUtils.heading('Props', 2);
      const headers = ['Name', 'Type', 'Required', 'Default', 'Description'];
      const rows = component.props.map((p: ComponentProp) => [
        FormatUtils.inlineCode(p.name),
        FormatUtils.inlineCode(p.type),
        p.required ? 'Yes' : 'No',
        p.default ? FormatUtils.inlineCode(String(p.default)) : '-',
        p.description,
      ]);
      markdown += FormatUtils.table(headers, rows);
    }

    if (component.example) {
      markdown += FormatUtils.heading('Example', 2);
      markdown += FormatUtils.codeBlock(component.example, 'tsx');
    }

    return markdown;
  }

  /**
   * Generate component index
   */
  private generateIndex(components: ComponentDoc[]): string {
    let markdown = '';

    markdown += FormatUtils.heading('Components', 1);
    markdown += `This directory contains documentation for all React components in the Aether system.\n\n`;
    markdown += FormatUtils.heading('Available Components', 2);

    const sorted = components.sort((a, b) => a.name.localeCompare(b.name));

    for (const component of sorted) {
      markdown += `- [${component.name}](${component.name}.md) - ${component.description}\n`;
    }

    markdown += '\n';
    return markdown;
  }
}
