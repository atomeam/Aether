/**
 * @aether/string-utils - String Utilities
 */

export class StringUtils {
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  }
  
  camelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
  }
  
  kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  snakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }
}

export const stringUtils = new StringUtils();