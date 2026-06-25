/**
 * AST utilities for parsing TypeScript code
 */

import * as ts from 'typescript';

export class AstUtils {
  /**
   * Parse a TypeScript file into an AST
   */
  static parseFile(filePath: string, sourceCode: string): ts.SourceFile {
    return ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
  }

  /**
   * Get all exported interfaces from a source file
   */
  static getInterfaces(sourceFile: ts.SourceFile): ts.InterfaceDeclaration[] {
    const interfaces: ts.InterfaceDeclaration[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node) && this.isExported(node)) {
        interfaces.push(node);
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return interfaces;
  }

  /**
   * Get all exported type aliases from a source file
   */
  static getTypeAliases(sourceFile: ts.SourceFile): ts.TypeAliasDeclaration[] {
    const typeAliases: ts.TypeAliasDeclaration[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isTypeAliasDeclaration(node) && this.isExported(node)) {
        typeAliases.push(node);
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return typeAliases;
  }

  /**
   * Get all exported enums from a source file
   */
  static getEnums(sourceFile: ts.SourceFile): ts.EnumDeclaration[] {
    const enums: ts.EnumDeclaration[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isEnumDeclaration(node) && this.isExported(node)) {
        enums.push(node);
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return enums;
  }

  /**
   * Get all exported classes from a source file
   */
  static getClasses(sourceFile: ts.SourceFile): ts.ClassDeclaration[] {
    const classes: ts.ClassDeclaration[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && this.isExported(node)) {
        classes.push(node);
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return classes;
  }

  /**
   * Get all exported functions from a source file
   */
  static getFunctions(sourceFile: ts.SourceFile): ts.FunctionDeclaration[] {
    const functions: ts.FunctionDeclaration[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && this.isExported(node)) {
        functions.push(node);
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return functions;
  }

  /**
   * Get JSDoc comments for a node
   */
  static getJSDoc(node: ts.Node): string | undefined {
    const jsDocTags = ts.getJSDocTags(node);
    if (jsDocTags.length === 0) return undefined;

    const comments = jsDocTags
      .map(tag => {
        const tagText = tag.tagName.getText();
        let comment = '';
        if (tag.comment) {
          if (Array.isArray(tag.comment)) {
            comment = ts.displayPartsToString(tag.comment as any);
          } else {
            comment = String(tag.comment);
          }
        }
        return comment ? `@${tagText} ${comment}` : `@${tagText}`;
      })
      .join('\n');

    return comments;
  }

  /**
   * Get the description comment for a node
   */
  static getDescription(node: ts.Node): string | undefined {
    const fullText = node.getSourceFile().getFullText();
    const commentRanges = ts.getLeadingCommentRanges(fullText, node.getFullStart());

    if (!commentRanges || commentRanges.length === 0) return undefined;

    const lastComment = commentRanges[commentRanges.length - 1];
    const commentText = fullText.substring(lastComment.pos, lastComment.end);

    // Remove comment markers
    return commentText
      .replace(/\/\*\*|\*\//g, '')
      .replace(/^\s*\*\s?/gm, '')
      .replace(/^\s*\/\/\s?/gm, '')
      .trim();
  }

  /**
   * Check if a node is exported
   */
  static isExported(node: ts.Node): boolean {
    const flags = ts.getCombinedModifierFlags(node as any);
    return (
      (flags & ts.ModifierFlags.Export) !== 0 ||
      (flags & ts.ModifierFlags.Default) !== 0
    );
  }

  /**
   * Get the type name from a type node
   */
  static getTypeName(typeNode: ts.TypeNode): string {
    if (ts.isIdentifier(typeNode)) {
      return typeNode.text;
    }
    if (ts.isTypeReferenceNode(typeNode)) {
      return typeNode.typeName.getText();
    }
    if (ts.isUnionTypeNode(typeNode)) {
      return typeNode.types.map(t => this.getTypeName(t)).join(' | ');
    }
    if (ts.isIntersectionTypeNode(typeNode)) {
      return typeNode.types.map(t => this.getTypeName(t)).join(' & ');
    }
    if (ts.isArrayTypeNode(typeNode)) {
      return `${this.getTypeName(typeNode.elementType)}[]`;
    }
    if (ts.isLiteralTypeNode(typeNode)) {
      return typeNode.getText();
    }
    return typeNode.getText();
  }

  /**
   * Get all properties from an interface
   */
  static getInterfaceProperties(interfaceDecl: ts.InterfaceDeclaration): Array<{
    name: string;
    type: string;
    optional: boolean;
    description?: string;
  }> {
    return interfaceDecl.members
      .filter(ts.isPropertySignature)
      .map(prop => ({
        name: prop.name.getText(),
        type: prop.type ? this.getTypeName(prop.type) : 'any',
        optional: prop.questionToken !== undefined,
        description: this.getDescription(prop),
      }));
  }

  /**
   * Get all methods from a class
   */
  static getClassMethods(classDecl: ts.ClassDeclaration): Array<{
    name: string;
    returnType: string;
    parameters: Array<{ name: string; type: string; optional: boolean }>;
    description?: string;
  }> {
    return classDecl.members
      .filter(ts.isMethodDeclaration)
      .map(method => ({
        name: method.name.getText(),
        returnType: method.type ? this.getTypeName(method.type) : 'void',
        parameters: method.parameters.map(param => ({
          name: param.name.getText(),
          type: param.type ? this.getTypeName(param.type) : 'any',
          optional: param.questionToken !== undefined,
        })),
        description: this.getDescription(method),
      }));
  }
}
