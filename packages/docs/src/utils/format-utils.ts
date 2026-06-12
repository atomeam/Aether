/**
 * Formatting utilities for documentation generation
 */

import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

export class FormatUtils {
  /**
   * Convert text to markdown-safe format
   */
  static escapeMarkdown(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  /**
   * Create a markdown heading
   */
  static heading(text: string, level: number = 1): string {
    return `${'#'.repeat(level)} ${text}\n\n`;
  }

  /**
   * Create a markdown code block
   */
  static codeBlock(code: string, language: string = 'typescript'): string {
    return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  }

  /**
   * Create an inline code span
   */
  static inlineCode(text: string): string {
    return `\`${text}\``;
  }

  /**
   * Create a markdown link
   */
  static link(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  /**
   * Create a markdown table
   */
  static table(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separator = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');

    return `${headerRow}\n${separator}\n${dataRows}\n\n`;
  }

  /**
   * Create a markdown list
   */
  static list(items: string[], ordered: boolean = false): string {
    if (ordered) {
      return items.map((item, index) => `${index + 1}. ${item}`).join('\n') + '\n\n';
    }
    return items.map(item => `- ${item}`).join('\n') + '\n\n';
  }

  /**
   * Create a markdown blockquote
   */
  static blockquote(text: string): string {
    return `> ${text.split('\n').join('\n> ')}\n\n`;
  }

  /**
   * Create a horizontal rule
   */
  static horizontalRule(): string {
    return '---\n\n';
  }

  /**
   * Create a bold text
   */
  static bold(text: string): string {
    return `**${text}**`;
  }

  /**
   * Create italic text
   */
  static italic(text: string): string {
    return `*${text}*`;
  }

  /**
   * Create a strikethrough text
   */
  static strikethrough(text: string): string {
    return `~~${text}~~`;
  }

  /**
   * Create a collapsible section (HTML details)
   */
  static details(summary: string, content: string): string {
    return `<details>\n<summary>${summary}</summary>\n\n${content}\n</details>\n\n`;
  }

  /**
   * Create a badge
   */
  static badge(text: string, color: string = 'blue'): string {
    const colors: Record<string, string> = {
      blue: '0066cc',
      green: '28a745',
      red: 'dc3545',
      yellow: 'ffc107',
      orange: 'fd7e14',
      purple: '6f42c1',
      gray: '6c757d',
    };
    const bgColor = colors[color] || colors.blue;
    return `![${text}](https://img.shields.io/badge/${text.replace(/ /g, '_')}-${bgColor})`;
  }

  /**
   * Format a type signature
   */
  static formatType(type: string): string {
    return this.inlineCode(type);
  }

  /**
   * Format a function signature
   */
  static formatFunction(
    name: string,
    parameters: Array<{ name: string; type: string; optional: boolean }>,
    returnType: string
  ): string {
    const params = parameters
      .map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
      .join(', ');
    return this.inlineCode(`${name}(${params}): ${returnType}`);
  }

  /**
   * Format a property signature
   */
  static formatProperty(name: string, type: string, optional: boolean): string {
    return this.inlineCode(`${name}${optional ? '?' : ''}: ${type}`);
  }

  /**
   * Convert JSDoc to markdown
   */
  static jsDocToMarkdown(jsDoc: string): string {
    // Parse JSDoc tags and convert to markdown
    const lines = jsDoc.split('\n');
    const markdown: string[] = [];

    for (const line of lines) {
      if (line.startsWith('@param')) {
        const match = line.match(/@param\s+(\w+)\s+(.+)/);
        if (match) {
          markdown.push(`- **${match[1]}**: ${match[2]}`);
        }
      } else if (line.startsWith('@returns')) {
        const match = line.match(/@returns\s+(.+)/);
        if (match) {
          markdown.push(`- **Returns**: ${match[1]}`);
        }
      } else if (line.startsWith('@throws')) {
        const match = line.match(/@throws\s+(.+)/);
        if (match) {
          markdown.push(`- **Throws**: ${match[1]}`);
        }
      } else if (line.startsWith('@example')) {
        const match = line.match(/@example\s+(.+)/);
        if (match) {
          markdown.push('\n**Example:**\n');
          markdown.push(this.codeBlock(match[1]));
        }
      } else if (!line.startsWith('@')) {
        markdown.push(line);
      }
    }

    return markdown.join('\n');
  }

  /**
   * Render markdown to HTML
   */
  static renderToHTML(markdown: string): string {
    return md.render(markdown);
  }

  /**
   * Create a table of contents from headings
   */
  static createTableOfContents(headings: Array<{ level: number; text: string; id: string }>): string {
    const toc = headings
      .filter(h => h.level <= 3)
      .map(h => {
        const indent = '  '.repeat(h.level - 1);
        return `${indent}- [${h.text}](#${h.id})`;
      })
      .join('\n');

    return `## Table of Contents\n\n${toc}\n\n`;
  }

  /**
   * Create an alert box
   */
  static alert(type: 'note' | 'warning' | 'tip' | 'important', content: string): string {
    const emojis = {
      note: '📝',
      warning: '⚠️',
      tip: '💡',
      important: '❗',
    };

    return `> ${emojis[type]} **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${content}\n\n`;
  }
}
