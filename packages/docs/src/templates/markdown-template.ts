/**
 * Markdown Template System
 *
 * Provides reusable markdown templates for documentation
 */

import { FormatUtils } from '../utils/format-utils';

export class MarkdownTemplate {
  /**
   * Template for a complete documentation page
   */
  static pageTemplate(content: string, metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  }): string {
    let markdown = '';

    if (metadata?.title) {
      markdown += FormatUtils.heading(metadata.title, 1);
    }

    if (metadata?.description) {
      markdown += `${metadata.description}\n\n`;
    }

    if (metadata?.tags && metadata.tags.length > 0) {
      markdown += '**Tags**: ' + metadata.tags.map(t => `\`${t}\``).join(', ') + '\n\n';
    }

    markdown += FormatUtils.horizontalRule();
    markdown += content;

    return markdown;
  }

  /**
   * Template for API endpoint documentation
   */
  static apiEndpointTemplate(endpoint: {
    method: string;
    path: string;
    description: string;
    parameters?: any[];
    requestBody?: any;
    response?: any;
    example?: string;
  }): string {
    let markdown = '';

    const methodBadge = this.getMethodBadge(endpoint.method);
    markdown += `${methodBadge} ${FormatUtils.inlineCode(endpoint.path)}\n\n`;
    markdown += `${endpoint.description}\n\n`;

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      markdown += FormatUtils.heading('Parameters', 3);
      const headers = ['Name', 'Type', 'Required', 'Description'];
      const rows = endpoint.parameters.map((p: any) => [
        FormatUtils.inlineCode(p.name),
        FormatUtils.inlineCode(p.type),
        p.required ? 'Yes' : 'No',
        p.description,
      ]);
      markdown += FormatUtils.table(headers, rows);
    }

    if (endpoint.requestBody) {
      markdown += FormatUtils.heading('Request Body', 3);
      markdown += FormatUtils.codeBlock(JSON.stringify(endpoint.requestBody, null, 2), 'json');
    }

    if (endpoint.response) {
      markdown += FormatUtils.heading('Response', 3);
      markdown += FormatUtils.codeBlock(JSON.stringify(endpoint.response, null, 2), 'json');
    }

    if (endpoint.example) {
      markdown += FormatUtils.heading('Example', 3);
      markdown += FormatUtils.codeBlock(endpoint.example, 'bash');
    }

    return markdown;
  }

  /**
   * Template for component documentation
   */
  static componentTemplate(component: {
    name: string;
    description: string;
    props?: any[];
    state?: any[];
    methods?: any[];
    example?: string;
  }): string {
    let markdown = '';

    markdown += FormatUtils.heading(component.name, 2);
    markdown += `${component.description}\n\n`;

    if (component.props && component.props.length > 0) {
      markdown += FormatUtils.heading('Props', 3);
      const headers = ['Name', 'Type', 'Required', 'Default', 'Description'];
      const rows = component.props.map((p: any) => [
        FormatUtils.inlineCode(p.name),
        FormatUtils.inlineCode(p.type),
        p.required ? 'Yes' : 'No',
        p.default ? FormatUtils.inlineCode(String(p.default)) : '-',
        p.description,
      ]);
      markdown += FormatUtils.table(headers, rows);
    }

    if (component.state && component.state.length > 0) {
      markdown += FormatUtils.heading('State', 3);
      const headers = ['Name', 'Type', 'Initial', 'Description'];
      const rows = component.state.map((s: any) => [
        FormatUtils.inlineCode(s.name),
        FormatUtils.inlineCode(s.type),
        s.initial ? FormatUtils.inlineCode(String(s.initial)) : '-',
        s.description,
      ]);
      markdown += FormatUtils.table(headers, rows);
    }

    if (component.methods && component.methods.length > 0) {
      markdown += FormatUtils.heading('Methods', 3);
      for (const method of component.methods) {
        markdown += `#### ${FormatUtils.inlineCode(method.name)}()\n\n`;
        markdown += `${method.description}\n\n`;
        if (method.parameters && method.parameters.length > 0) {
          const headers = ['Parameter', 'Type', 'Required', 'Description'];
          const rows = method.parameters.map((p: any) => [
            FormatUtils.inlineCode(p.name),
            FormatUtils.inlineCode(p.type),
            p.required ? 'Yes' : 'No',
            p.description,
          ]);
          markdown += FormatUtils.table(headers, rows);
        }
        markdown += `**Returns**: ${FormatUtils.inlineCode(method.returnType)}\n\n`;
      }
    }

    if (component.example) {
      markdown += FormatUtils.heading('Example', 3);
      markdown += FormatUtils.codeBlock(component.example, 'tsx');
    }

    return markdown;
  }

  /**
   * Template for type documentation
   */
  static typeTemplate(typeDoc: {
    name: string;
    kind: string;
    description: string;
    definition: string;
    members?: any[];
    extends?: string[];
    implements?: string[];
  }): string {
    let markdown = '';

    const kindEmoji = {
      interface: '📘',
      type: '📗',
      enum: '📕',
      class: '📙',
      function: '📓',
      variable: '📔',
    };

    markdown += FormatUtils.heading(`${kindEmoji[typeDoc.kind as keyof typeof kindEmoji] || '📄'} ${typeDoc.name}`, 3);
    markdown += `**Kind**: ${typeDoc.kind}\n\n`;
    markdown += `${typeDoc.description}\n\n`;

    markdown += FormatUtils.heading('Definition', 4);
    markdown += FormatUtils.codeBlock(typeDoc.definition, 'typescript');

    if (typeDoc.extends && typeDoc.extends.length > 0) {
      markdown += FormatUtils.heading('Extends', 4);
      markdown += typeDoc.extends.map((e: string) => FormatUtils.inlineCode(e)).join(', ') + '\n\n';
    }

    if (typeDoc.implements && typeDoc.implements.length > 0) {
      markdown += FormatUtils.heading('Implements', 4);
      markdown += typeDoc.implements.map((i: string) => FormatUtils.inlineCode(i)).join(', ') + '\n\n';
    }

    if (typeDoc.members && typeDoc.members.length > 0) {
      markdown += FormatUtils.heading('Members', 4);
      const headers = ['Name', 'Type', 'Optional', 'Description'];
      const rows = typeDoc.members.map((m: any) => [
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
   * Template for usage example
   */
  static exampleTemplate(example: {
    name: string;
    description: string;
    code: string;
    language: string;
    category: string;
  }): string {
    let markdown = '';

    markdown += FormatUtils.heading(example.name, 3);
    markdown += `${example.description}\n\n`;
    markdown += FormatUtils.alert('note', `Category: ${example.category}`);
    markdown += FormatUtils.heading('Code', 4);
    markdown += FormatUtils.codeBlock(example.code, example.language);

    return markdown;
  }

  /**
   * Get a badge for HTTP method
   */
  private static getMethodBadge(method: string): string {
    const colors: Record<string, string> = {
      GET: 'green',
      POST: 'blue',
      PUT: 'orange',
      DELETE: 'red',
      PATCH: 'yellow',
      HEAD: 'gray',
      OPTIONS: 'gray',
    };

    return FormatUtils.badge(method, colors[method] || 'gray');
  }

  /**
   * Template for package README
   */
  static packageReadmeTemplate(packageData: {
    name: string;
    description: string;
    version: string;
    installation: string;
    usage: string;
    api?: string;
    exports?: string[];
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    license?: string;
  }): string {
    let markdown = '';

    markdown += FormatUtils.heading(packageData.name, 1);
    markdown += `${packageData.description}\n\n`;
    markdown += `**Version**: ${packageData.version}\n\n`;

    markdown += FormatUtils.heading('Installation', 2);
    markdown += FormatUtils.codeBlock(packageData.installation, 'bash');

    markdown += FormatUtils.heading('Usage', 2);
    markdown += packageData.usage;

    if (packageData.api) {
      markdown += packageData.api;
    }

    if (packageData.exports && packageData.exports.length > 0) {
      markdown += FormatUtils.heading('Exports', 2);
      markdown += packageData.exports.map(e => `- ${FormatUtils.inlineCode(e)}`).join('\n') + '\n\n';
    }

    if (packageData.scripts && Object.keys(packageData.scripts).length > 0) {
      markdown += FormatUtils.heading('Available Scripts', 2);
      const headers = ['Script', 'Description'];
      const rows = Object.entries(packageData.scripts).map(([name, cmd]) => [
        FormatUtils.inlineCode(`npm run ${name}`),
        cmd,
      ]);
      markdown += FormatUtils.table(headers, rows);
    }

    if (packageData.dependencies && Object.keys(packageData.dependencies).length > 0) {
      markdown += FormatUtils.heading('Dependencies', 2);
      const deps = Object.keys(packageData.dependencies).sort();
      markdown += deps.map(d => `- ${d}`).join('\n') + '\n\n';
    }

    if (packageData.license) {
      markdown += FormatUtils.heading('License', 2);
      markdown += `${packageData.license}\n\n`;
    }

    return markdown;
  }
}
