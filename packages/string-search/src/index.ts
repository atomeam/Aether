/**
 * @aether/string-search - String Search Algorithms
 */

export class StringSearch {
  kmp(text: string, pattern: string): number[] {
    if (pattern.length === 0) return [];
    
    const lps = this.buildLPS(pattern);
    const matches: number[] = [];
    let i = 0, j = 0;
    
    while (i < text.length) {
      if (pattern[j] === text[i]) {
        i++;
        j++;
        
        if (j === pattern.length) {
          matches.push(i - j);
          j = lps[j - 1];
        }
      } else if (j > 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
    
    return matches;
  }
  
  private buildLPS(pattern: string): number[] {
    const lps = new Array(pattern.length).fill(0);
    let len = 0, i = 1;
    
    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else if (len > 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
    
    return lps;
  }
  
  boyerMoore(text: string, pattern: string): number[] {
    if (pattern.length === 0) return [];
    
    const badChar = this.buildBadCharTable(pattern);
    const matches: number[] = [];
    let i = 0;
    
    while (i <= text.length - pattern.length) {
      let j = pattern.length - 1;
      
      while (j >= 0 && pattern[j] === text[i + j]) {
        j--;
      }
      
      if (j < 0) {
        matches.push(i);
        i += pattern.length;
      } else {
        const shift = Math.max(1, j - (badChar[text[i + j]] ?? -1));
        i += shift;
      }
    }
    
    return matches;
  }
  
  private buildBadCharTable(pattern: string): Record<string, number> {
    const table: Record<string, number> = {};
    for (let i = 0; i < pattern.length - 1; i++) {
      table[pattern[i]] = i;
    }
    return table;
  }
  
  rabinKarp(text: string, pattern: string): number[] {
    if (pattern.length === 0) return [];
    
    const prime = 101;
    const d = 256;
    const n = text.length;
    const m = pattern.length;
    const h = Math.pow(d, m - 1) % prime;
    
    let p = 0, t = 0;
    const matches: number[] = [];
    
    for (let i = 0; i < m; i++) {
      p = (d * p + pattern.charCodeAt(i)) % prime;
      t = (d * t + text.charCodeAt(i)) % prime;
    }
    
    for (let i = 0; i <= n - m; i++) {
      if (p === t) {
        let j;
        for (j = 0; j < m; j++) {
          if (text[i + j] !== pattern[j]) break;
        }
        if (j === m) matches.push(i);
      }
      
      if (i < n - m) {
        t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % prime;
        if (t < 0) t += prime;
      }
    }
    
    return matches;
  }
  
  naive(text: string, pattern: string): number[] {
    const matches: number[] = [];
    const n = text.length;
    const m = pattern.length;
    
    for (let i = 0; i <= n - m; i++) {
      let j;
      for (j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) break;
      }
      if (j === m) matches.push(i);
    }
    
    return matches;
  }
}

export const stringSearch = new StringSearch();