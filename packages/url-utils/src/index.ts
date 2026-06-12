/**
 * @aether/url-utils - URL Utilities
 */

export class URLUtils {
  parse(url: string): URL {
    return new URL(url);
  }
  
  build(base: string, path: string, params?: Record<string, string>): string {
    const url = new URL(path, base);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }
  
  getQueryParam(url: string, param: string): string | null {
    const parsed = new URL(url);
    return parsed.searchParams.get(param);
  }
  
  setQueryParam(url: string, param: string, value: string): string {
    const parsed = new URL(url);
    parsed.searchParams.set(param, value);
    return parsed.toString();
  }
  
  removeQueryParam(url: string, param: string): string {
    const parsed = new URL(url);
    parsed.searchParams.delete(param);
    return parsed.toString();
  }
  
  getDomain(url: string): string {
    const parsed = new URL(url);
    return parsed.hostname;
  }
  
  getPath(url: string): string {
    const parsed = new URL(url);
    return parsed.pathname;
  }
  
  isAbsolute(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  isRelative(url: string): boolean {
    return !this.isAbsolute(url);
  }
  
  join(...parts: string[]): string {
    return parts
      .map(part => part.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }
}

export const urlUtils = new URLUtils();