/**
 * @aether/file-system - File System Utilities
 */

export class PathUtils {
  join(...parts: string[]): string {
    return parts.filter(Boolean).join('/').replace(/\/+/g, '/');
  }
  
  basename(path: string): string {
    return path.split('/').pop() ?? '';
  }
  
  dirname(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  }
  
  extname(path: string): string {
    const basename = this.basename(path);
    const dotIndex = basename.lastIndexOf('.');
    return dotIndex > 0 ? basename.slice(dotIndex) : '';
  }
  
  normalize(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '');
  }
  
  relative(from: string, to: string): string {
    const fromParts = from.split('/');
    const toParts = to.split('/');
    
    let commonLength = 0;
    for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
      if (fromParts[i] === toParts[i]) {
        commonLength++;
      } else {
        break;
      }
    }
    
    const upCount = fromParts.length - commonLength;
    const downParts = toParts.slice(commonLength);
    
    return Array(upCount).fill('..').concat(downParts).join('/');
  }
  
  resolve(...parts: string[]): string {
    let result = '';
    for (const part of parts) {
      if (part.startsWith('/')) {
        result = part;
      } else {
        result = this.join(result, part);
      }
    }
    return this.normalize(result);
  }
}

export class FileUtils {
  static async readText(path: string): Promise<string> {
    const response = await fetch(path);
    return response.text();
  }
  
  static async readJSON<T>(path: string): Promise<T> {
    const text = await this.readText(path);
    return JSON.parse(text);
  }
  
  static async writeText(path: string, content: string): Promise<void> {
    // Browser-based implementation - in Node.js this would use fs.writeFile
    const doc = (globalThis as any).document;
    if (typeof Blob !== 'undefined' && doc) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = doc.createElement('a');
      a.href = url;
      a.download = path;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Node.js or other environment - would need fs module
      throw new Error('Write operation not supported in this environment');
    }
  }
  
  static async writeJSON(path: string, data: any): Promise<void> {
    await this.writeText(path, JSON.stringify(data, null, 2));
  }
  
  static async exists(path: string): Promise<boolean> {
    try {
      await fetch(path);
      return true;
    } catch {
      return false;
    }
  }
  
  static getSize(path: string): Promise<number> {
    return fetch(path).then(response => {
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength) : 0;
    });
  }
}

export class DirectoryUtils {
  static async list(path: string): Promise<string[]> {
    // Browser-based implementation
    return [];
  }
  
  static async create(path: string): Promise<void> {
    // Browser-based implementation - no-op in browser
  }
  
  static async remove(path: string): Promise<void> {
    // Browser-based implementation - no-op in browser
  }
  
  static async exists(path: string): Promise<boolean> {
    return FileUtils.exists(path);
  }
}

export const pathUtils = new PathUtils();
export const fileUtils = new FileUtils();
export const directoryUtils = new DirectoryUtils();