/**
 * TypeScript Type Documentation Generator
 *
 * Generates documentation for TypeScript types, interfaces, and enums
 */

import * as path from 'path';
import * as ts from 'typescript';
import { FileUtils } from '../utils/file-utils';
import { AstUtils } from '../utils/ast-utils';
import { FormatUtils } from '../utils/format-utils';
import { TypeDocConfig, TypeDoc, DocOutput, TypeMember } from '../types/index';

export class TypeDocGenerator {
  private config: TypeDocConfig;

  constructor(config: TypeDocConfig) {
    this.config = config;
  }

  /**
   * Generate type documentation
   */
  async generate(): Promise<DocOutput[]> {
    const outputs: DocOutput[] = [];
    const types = await this.collectTypes();

    for (const typeDoc of types) {
      const markdown = this.generateTypeMarkdown(typeDoc);
      const outputPath = path.join(
        this.config.outputDir,
        'types',
        `${typeDoc.name}.md`
      );

      await FileUtils.writeFile(outputPath, markdown);

      outputs.push({
        path: outputPath,
        content: markdown,
        type: 'type',
        metadata: {
          generatedAt: new Date(),
          generatorVersion: '1.0.0',
          sourceFiles: [typeDoc.filePath],
          itemCount: 1,
        },
      });
    }

    // Generate index
    const indexMarkdown = this.generateIndex(types);
    const indexPath = path.join(this.config.outputDir, 'types', 'README.md');
    await FileUtils.writeFile(indexPath, indexMarkdown);

    outputs.push({
      path: indexPath,
      content: indexMarkdown,
      type: 'type',
      metadata: {
        generatedAt: new Date(),
        generatorVersion: '1.0.0',
        sourceFiles: [],
        itemCount: types.length,
      },
    });

    return outputs;
  }

  /**
   * Collect all TypeScript types
   */
  private async collectTypes(): Promise<TypeDoc[]> {
    const types: TypeDoc[] = [];

    // Scan packages directory
    const packagesDir = path.join(this.config.rootDir, 'packages');
    const tsFiles = await FileUtils.getTypeScriptFiles(packagesDir);

    for (const file of tsFiles) {
      const content = await FileUtils.readFile(file);
      const sourceFile = AstUtils.parseFile(file, content);
      const fileTypes = this.parseTypes(file, sourceFile);
      types.push(...fileTypes);
    }

    return types;
  }

  /**
   * Parse types from a source file
   */
  private parseTypes(filePath: string, sourceFile: ts.SourceFile): TypeDoc[] {
    const types: TypeDoc[] = [];

    // Parse interfaces
    const interfaces = AstUtils.getInterfaces(sourceFile);
    for (const iface of interfaces) {
      types.push({
        name: iface.name.text,
        kind: 'interface',
        filePath,
        description: AstUtils.getDescription(iface) || 'No description',
        definition: iface.getText(),
        members: AstUtils.getInterfaceProperties(iface),
        extends: iface.heritageClauses
          ?.flatMap(h => h.types.map(t => t.getText()))
          .filter(Boolean),
      });
    }

    // Parse type aliases
    const typeAliases = AstUtils.getTypeAliases(sourceFile);
    for (const alias of typeAliases) {
      types.push({
        name: alias.name.text,
        kind: 'type',
        filePath,
        description: AstUtils.getDescription(alias) || 'No description',
        definition: alias.getText(),
      });
    }

    // Parse enums
    const enums = AstUtils.getEnums(sourceFile);
    for (const enumDecl of enums) {
      const members = enumDecl.members.map(member => ({
        name: member.name.getText(),
        type: 'string',
        optional: false,
        description: AstUtils.getDescription(member),
      }));

      types.push({
        name: enumDecl.name.text,
        kind: 'enum',
        filePath,
        description: AstUtils.getDescription(enumDecl) || 'No description',
        definition: enumDecl.getText(),
        members,
      });
    }

    // Parse classes
    const classes = AstUtils.getClasses(sourceFile);
    for (const cls of classes) {
      const members = AstUtils.getClassMethods(cls);
      types.push({
        name: cls.name?.getText() || 'Anonymous',
        kind: 'class',
        filePath,
        description: AstUtils.getDescription(cls) || 'No description',
        definition: cls.getText(),
        members: members.map(m => ({
          name: m.name,
          type: m.returnType,
          optional: false,
          description: m.description,
        })),
        extends: cls.heritageClauses
          ?.flatMap(h => h.types.map(t => t.getText()))
          .filter(Boolean),
      });
    }

    return types;
  }

  /**
   * Generate markdown for a type
   */
  private generateTypeMarkdown(typeDoc: TypeDoc): string {
    let markdown = '';

    const kindEmoji = {
      interface: '📘',
      type: '📗',
      enum: '📕',
      class: '📙',
      function: '📓',
      variable: '📔',
    };

    markdown += FormatUtils.heading(`${kindEmoji[typeDoc.kind as keyof typeof kindEmoji]} ${typeDoc.name}`, 1);
    markdown += `**Kind**: ${typeDoc.kind}\n\n`;
    markdown += `${typeDoc.description}\n\n`;

    markdown += FormatUtils.heading('Definition', 2);
    markdown += FormatUtils.codeBlock(typeDoc.definition, 'typescript');

    if (typeDoc.extends && typeDoc.extends.length > 0) {
      markdown += FormatUtils.heading('Extends', 2);
      markdown += typeDoc.extends.map((e: string) => FormatUtils.inlineCode(e)).join(', ') + '\n\n';
    }

    if (typeDoc.implements && typeDoc.implements.length > 0) {
      markdown += FormatUtils.heading('Implements', 2);
      markdown += typeDoc.implements.map((i: string) => FormatUtils.inlineCode(i)).join(', ') + '\n\n';
    }

    if (typeDoc.members && typeDoc.members.length > 0) {
      markdown += FormatUtils.heading('Members', 2);
      const headers = ['Name', 'Type', 'Optional', 'Description'];
      const rows = typeDoc.members.map((m: TypeMember) => [
        FormatUtils.inlineCode(m.name),
        FormatUtils.inlineCode(m.type),
        m.optional ? 'Yes' : 'No',
        m.description || '-',
      ]);
      markdown += FormatUtils.table(headers, rows);
    }

    return markdown;
  }

  /**
   * Generate type index
   */
  private generateIndex(types: TypeDoc[]): string {
    let markdown = '';

    markdown += FormatUtils.heading('Type Documentation', 1);
    markdown += `This directory contains documentation for all TypeScript types in the Aether packages.\n\n`;

    // Group by kind
    const grouped = types.reduce((acc, type) => {
      if (!acc[type.kind]) {
        acc[type.kind] = [];
      }
      acc[type.kind].push(type);
      return acc;
    }, {} as Record<string, TypeDoc[]>);

    for (const [kind, kindTypes] of Object.entries(grouped)) {
      markdown += FormatUtils.heading(`${kind.charAt(0).toUpperCase() + kind.slice(1)}s`, 2);

      const sorted = (kindTypes as TypeDoc[]).sort((a, b) => a.name.localeCompare(b.name));

      for (const type of sorted) {
        markdown += `- [${type.name}](${type.name}.md) - ${type.description}\n`;
      }

      markdown += '\n';
    }

    return markdown;
  }
}
