/**
 * API Documentation Generator
 *
 * Generates comprehensive API documentation from route definitions and controllers
 */

import * as path from 'path';
import { FileUtils } from '../utils/file-utils';
import { FormatUtils } from '../utils/format-utils';
import { ApiDocConfig, ApiEndpoint, DocOutput, ApiParameter } from '../types/index';

export class ApiDocGenerator {
  private config: ApiDocConfig;

  constructor(config: ApiDocConfig) {
    this.config = config;
  }

  /**
   * Generate API documentation
   */
  async generate(): Promise<DocOutput[]> {
    const outputs: DocOutput[] = [];
    const endpoints = await this.collectEndpoints();

    const markdown = this.generateMarkdown(endpoints);
    const outputPath = path.join(this.config.outputDir, 'API.md');

    await FileUtils.writeFile(outputPath, markdown);

    outputs.push({
      path: outputPath,
      content: markdown,
      type: 'api',
      metadata: {
        generatedAt: new Date(),
        generatorVersion: '1.0.0',
        sourceFiles: [],
        itemCount: endpoints.length,
      },
    });

    return outputs;
  }

  /**
   * Collect API endpoints from the codebase
   */
  private async collectEndpoints(): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];

    // Scan backend directory for route definitions
    const backendDir = path.join(this.config.rootDir, 'apps', 'backend');
    const tsFiles = await FileUtils.getTypeScriptFiles(backendDir);

    for (const file of tsFiles) {
      const content = await FileUtils.readFile(file);
      const fileEndpoints = this.parseEndpoints(file, content);
      endpoints.push(...fileEndpoints);
    }

    return endpoints;
  }

  /**
   * Parse endpoints from a TypeScript file
   */
  private parseEndpoints(_filePath: string, content: string): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    // Look for Express route patterns
    const routePatterns = [
      /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
      /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
    ];

    for (const pattern of routePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const [, method, routePath] = match;
        endpoints.push({
          method: method.toUpperCase() as any,
          path: routePath,
          description: this.extractDescription(content, match.index),
          parameters: this.extractParameters(content, match.index),
          authRequired: this.checkAuthRequired(content, match.index),
        });
      }
    }

    return endpoints;
  }

  /**
   * Extract description for an endpoint
   */
  private extractDescription(content: string, index: number): string {
    // Look for comments before the route definition
    const before = content.substring(0, index);
    const commentMatch = before.match(/\/\*\*([\s\S]*?)\*\//);

    if (commentMatch) {
      return commentMatch[1]
        .replace(/\*/g, '')
        .replace(/^\s*\/\*\*?|\*\/$/g, '')
        .trim();
    }

    return 'No description available';
  }

  /**
   * Extract parameters for an endpoint
   */
  private extractParameters(_content: string, _index: number): any[] {
    // This is a simplified version - in production, you'd use AST parsing
    return [];
  }

  /**
   * Check if authentication is required
   */
  private checkAuthRequired(content: string, index: number): boolean {
    // Look for auth middleware
    const before = content.substring(0, index);
    return before.includes('auth') || before.includes('authenticate');
  }

  /**
   * Generate markdown documentation
   */
  private generateMarkdown(endpoints: ApiEndpoint[]): string {
    let markdown = '';

    markdown += FormatUtils.heading('API Documentation', 1);
    markdown += FormatUtils.heading('Overview', 2);
    markdown += 'This document describes all available API endpoints in the Aether system.\n\n';

    // Group by method
    const grouped = this.groupByMethod(endpoints);

    for (const [method, methodEndpoints] of Object.entries(grouped)) {
      markdown += FormatUtils.heading(`${method} Endpoints`, 2);

      for (const endpoint of methodEndpoints) {
        markdown += this.formatEndpoint(endpoint);
      }
    }

    return markdown;
  }

  /**
   * Group endpoints by HTTP method
   */
  private groupByMethod(endpoints: ApiEndpoint[]): Record<string, ApiEndpoint[]> {
    const grouped: Record<string, ApiEndpoint[]> = {};

    for (const endpoint of endpoints) {
      if (!grouped[endpoint.method]) {
        grouped[endpoint.method] = [];
      }
      grouped[endpoint.method].push(endpoint);
    }

    return grouped;
  }

  /**
   * Format a single endpoint
   */
  private formatEndpoint(endpoint: ApiEndpoint): string {
    let markdown = '';

    markdown += FormatUtils.heading(`${endpoint.method} ${endpoint.path}`, 3);
    markdown += `${endpoint.description}\n\n`;

    if (endpoint.authRequired) {
      markdown += FormatUtils.alert('important', 'Authentication required for this endpoint');
    }

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      markdown += FormatUtils.heading('Parameters', 4);
      const headers = ['Name', 'Type', 'Required', 'Description'];
      const rows = endpoint.parameters.map((p: ApiParameter) => [
        p.name,
        p.type,
        p.required ? 'Yes' : 'No',
        p.description,
      ]);
      markdown += FormatUtils.table(headers, rows);
    }

    if (endpoint.example) {
      markdown += FormatUtils.heading('Example', 4);
      markdown += FormatUtils.codeBlock(endpoint.example, 'bash');
    }

    markdown += FormatUtils.horizontalRule();

    return markdown;
  }
}
