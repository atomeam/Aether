/**
 * @aether/regex-utils - Regex Utilities
 */

export class RegexUtils {
  escape(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  test(pattern: string | RegExp, str: string): boolean {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(str);
  }
  
  match(pattern: string | RegExp, str: string): RegExpMatchArray | null {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return str.match(regex);
  }
  
  matchAll(pattern: string | RegExp, str: string): RegExpMatchArray[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : new RegExp(pattern.source, 'g');
    const matches: RegExpMatchArray[] = [];
    let match;
    while ((match = regex.exec(str)) !== null) {
      matches.push(match);
    }
    return matches;
  }
  
  replace(pattern: string | RegExp, str: string, replacement: string): string {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return str.replace(regex, replacement);
  }
  
  split(pattern: string | RegExp, str: string): string[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return str.split(regex);
  }
  
  email(): RegExp {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  }
  
  url(): RegExp {
    return /^https?:\/\/.+/;
  }
  
  phone(): RegExp {
    return /^\+?[\d\s-()]+$/;
  }
  
  hexColor(): RegExp {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  }
  
  ipv4(): RegExp {
    return /^(\d{1,3}\.){3}\d{1,3}$/;
  }
  
  ipv6(): RegExp {
    return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  }
  
  uuid(): RegExp {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  }
  
  alphanumeric(): RegExp {
    return /^[a-zA-Z0-9]+$/;
  }
  
  numeric(): RegExp {
    return /^[0-9]+$/;
  }
  
  alpha(): RegExp {
    return /^[a-zA-Z]+$/;
  }
}

export const regexUtils = new RegexUtils();