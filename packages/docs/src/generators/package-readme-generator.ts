/**
 * Package README Generator
 *
 * Auto-generates README.md files for all packages in the monorepo
 */

import * as path from 'path';
import * as ts from 'typescript';
import { FileUtils } from '../utils/file-utils';
import { AstUtils } from '../utils/ast-utils';
import { FormatUtils } from '../utils/format-utils';
import { DocConfig, DocOutput } from '../types/index';

export class PackageReadmeGenerator {
  private config: DocConfig;

  constructor(config: DocConfig) {
    this.config = config;
  }

  /**
   * Generate README.md for all packages
   */
  async generate(): Promise<DocOutput[]> {
    const outputs: DocOutput[] = [];

    const packagesDir = path.join(this.config.rootDir, 'packages');
    const packageDirs = await FileUtils.readDir(packagesDir);

    for (const packageDir of packageDirs) {
      const packagePath = path.join(packagesDir, packageDir);
      const stat = await FileUtils.getStats(packagePath);

      if (stat.isDirectory()) {
        const readme = await this.generatePackageReadme(packagePath);
        if (readme) {
          const readmePath = path.join(packagePath, 'README.md');
          await FileUtils.writeFile(readmePath, readme);

          outputs.push({
            path: readmePath,
            content: readme,
            type: 'readme',
            metadata: {
              generatedAt: new Date(),
              generatorVersion: '1.0.0',
              sourceFiles: [packagePath],
              itemCount: 1,
            },
          });
        }
      }
    }

    return outputs;
  }

  /**
   * Generate README for a single package
   */
  private async generatePackageReadme(packagePath: string): Promise<string | null> {
    const packageJsonPath = path.join(packagePath, 'package.json');

    if (!(await FileUtils.exists(packageJsonPath))) {
      return null;
    }

    const packageJson = await FileUtils.parsePackageJson(packageJsonPath);
    const srcPath = path.join(packagePath, 'src');

    let markdown = '';

    // Title
    markdown += FormatUtils.heading(packageJson.name || 'Package', 1);

    // Description
    if (packageJson.description) {
      markdown += `${packageJson.description}\n\n`;
    }

    // Version
    if (packageJson.version) {
      markdown += `**Version**: ${packageJson.version}\n\n`;
    }

    // Installation
    markdown += FormatUtils.heading('Installation', 2);
    markdown += FormatUtils.codeBlock(`npm install ${packageJson.name}`, 'bash');

    // Usage
    markdown += FormatUtils.heading('Usage', 2);
    const usageExample = await this.generateUsageExample(packagePath, packageJson.name);
    markdown += usageExample;

    // API
    if (await FileUtils.exists(srcPath)) {
      const apiDocs = await this.generateApiDocs(srcPath);
      if (apiDocs) {
        markdown += apiDocs;
      }
    }

    // Exports
    const exports = await this.generateExportsList(srcPath);
    if (exports) {
      markdown += exports;
    }

    // Scripts
    if (packageJson.scripts && Object.keys(packageJson.scripts).length > 0) {
      markdown += FormatUtils.heading('Available Scripts', 2);
      const headers = ['Script', 'Description'];
      const rows = Object.entries(packageJson.scripts).map(([name, cmd]) => [
        FormatUtils.inlineCode(`npm run ${name}`),
        cmd as string,
      ]);
      markdown += FormatUtils.table(headers, rows);
    }

    // Dependencies
    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
      markdown += FormatUtils.heading('Dependencies', 2);
      const deps = Object.keys(packageJson.dependencies).sort();
      markdown += deps.map(d => `- ${d}`).join('\n') + '\n\n';
    }

    // Development
    markdown += FormatUtils.heading('Development', 2);
    markdown += FormatUtils.list([
      'Build: ' + FormatUtils.inlineCode('npm run build'),
      'Test: ' + FormatUtils.inlineCode('npm run test'),
      'Type check: ' + FormatUtils.inlineCode('npm run typecheck'),
    ]);

    // License
    if (packageJson.license) {
      markdown += FormatUtils.heading('License', 2);
      markdown += `${packageJson.license}\n\n`;
    }

    return markdown;
  }

  /**
   * Generate usage example
   */
  private async generateUsageExample(packagePath: string, packageName: string): Promise<string> {
    const srcPath = path.join(packagePath, 'src');

    if (!(await FileUtils.exists(srcPath))) {
      return 'No usage example available.\n\n';
    }

    const tsFiles = await FileUtils.getTypeScriptFiles(srcPath);

    if (tsFiles.length === 0) {
      return 'No usage example available.\n\n';
    }

    // Try to find the main entry point
    const indexFile = tsFiles.find(f => f.includes('index.ts'));

    if (indexFile) {
      const content = await FileUtils.readFile(indexFile);
      const sourceFile = AstUtils.parseFile(indexFile, content);
      const exports = this.getExports(sourceFile);

      if (exports.length > 0) {
        let example = '';
        example += FormatUtils.codeBlock(
          `import { ${exports.slice(0, 3).join(', ')}${exports.length > 3 ? ', ...' : ''} } from '${packageName}';\n\n// TODO: Add usage example`,
          'typescript'
        );
        return example;
      }
    }

    return 'No usage example available.\n\n';
  }

  /**
   * Generate API documentation
   */
  private async generateApiDocs(srcPath: string): Promise<string> {
    const tsFiles = await FileUtils.getTypeScriptFiles(srcPath);

    if (tsFiles.length === 0) {
      return '';
    }

    let markdown = FormatUtils.heading('API Reference', 2);

    for (const file of tsFiles) {
      const content = await FileUtils.readFile(file);
      const sourceFile = AstUtils.parseFile(file, content);

      // Interfaces
      const interfaces = AstUtils.getInterfaces(sourceFile);
      for (const iface of interfaces) {
        const description = AstUtils.getDescription(iface) || 'No description';
        markdown += `### ${FormatUtils.inlineCode(iface.name.text)}\n\n`;
        markdown += `${description}\n\n`;

        const properties = AstUtils.getInterfaceProperties(iface);
        if (properties.length > 0) {
          const headers = ['Property', 'Type', 'Optional', 'Description'];
          const rows = properties.map(p => [
            FormatUtils.inlineCode(p.name),
            FormatUtils.inlineCode(p.type),
            p.optional ? 'Yes' : 'No',
            p.description || '-',
          ]);
          markdown += FormatUtils.table(headers, rows);
        }
      }

      // Functions
      const functions = AstUtils.getFunctions(sourceFile);
      for (const func of functions) {
        const name = func.name?.getText() || 'Anonymous';
        const description = AstUtils.getDescription(func) || 'No description';
        const returnType = func.type?.getText() || 'void';
        const parameters = func.parameters.map(p => ({
          name: p.name.getText(),
          type: p.type?.getText() || 'any',
          optional: p.questionToken !== undefined,
        }));

        markdown += `### ${FormatUtils.inlineCode(name)}()\n\n`;
        markdown += `${description}\n\n`;

        if (parameters.length > 0) {
          const headers = ['Parameter', 'Type', 'Optional', 'Description'];
          const rows = parameters.map(p => [
            FormatUtils.inlineCode(p.name),
            FormatUtils.inlineCode(p.type),
            p.optional ? 'Yes' : 'No',
            '-',
          ]);
          markdown += FormatUtils.table(headers, rows);
        }

        markdown += `**Returns**: ${FormatUtils.inlineCode(returnType)}\n\n`;
      }
    }

    return markdown;
  }

  /**
   * Generate exports list
   */
  private async generateExportsList(srcPath: string): Promise<string> {
    const tsFiles = await FileUtils.getTypeScriptFiles(srcPath);

    if (tsFiles.length === 0) {
      return '';
    }

    const indexFile = tsFiles.find(f => f.includes('index.ts'));

    if (!indexFile) {
      return '';
    }

    const content = await FileUtils.readFile(indexFile);
    const sourceFile = AstUtils.parseFile(indexFile, content);
    const exports = this.getExports(sourceFile);

    if (exports.length === 0) {
      return '';
    }

    let markdown = FormatUtils.heading('Exports', 2);
    markdown += exports.map(e => `- ${FormatUtils.inlineCode(e)}`).join('\n') + '\n\n';

    return markdown;
  }

  /**
   * Get exported names from a source file
   */
  private getExports(sourceFile: ts.SourceFile): string[] {
    const exports: string[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isExportDeclaration(node)) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            exports.push(element.name.text);
          }
        }
      }

      if (ts.isInterfaceDeclaration(node) && AstUtils.isExported(node)) {
        exports.push(node.name.text);
      }

      if (ts.isTypeAliasDeclaration(node) && AstUtils.isExported(node)) {
        exports.push(node.name.text);
      }

      if (ts.isEnumDeclaration(node) && AstUtils.isExported(node)) {
        exports.push(node.name.text);
      }

      if (ts.isFunctionDeclaration(node) && node.name && AstUtils.isExported(node)) {
        exports.push(node.name.text);
      }

      if (ts.isClassDeclaration(node) && node.name && AstUtils.isExported(node)) {
        exports.push(node.name.text);
      }

      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (AstUtils.isExported(node)) {
            exports.push(decl.name.getText());
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return exports;
  }
}
