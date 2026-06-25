/**
 * @aether/parser - Parser
 */

export class Parser {
  parseJSON<T>(json: string): T {
    return JSON.parse(json);
  }
  
  stringifyJSON(obj: any): string {
    return JSON.stringify(obj);
  }
  
  parseURL(url: string): URL {
    return new URL(url);
  }
  
  parseQueryString(query: string): Record<string, string> {
    const params = new URLSearchParams(query);
    const result: Record<string, string> = {};
    params.forEach((value, key) => result[key] = value);
    return result;
  }
}

export const parser = new Parser();