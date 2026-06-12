/**
 * @aether/security - Security Utilities
 */

export class Security {
  static sanitizeHTML(html: string): string {
    const doc = (globalThis as any).document;
    if (!doc) {
      // Fallback for non-browser environments
      return html.replace(/[<>&"']/g, char => {
        const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
        return map[char] || char;
      });
    }
    const div = doc.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  static sanitizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'javascript:') {
        return '';
      }
      return url;
    } catch {
      return '';
    }
  }
  
  static escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }
  
  static escapeJSON(json: string): string {
    return json.replace(/[\u0000-\u001F\u007F-\u009F]/g, char => {
      return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
    });
  }
  
  static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  
  static generateToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
      const r = Math.random() * 16 | 0;
      const v = char === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  static compareTokens(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
  
  static validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  static validatePhone(phone: string): boolean {
    const regex = /^\+?[\d\s\-()]+$/;
    return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
  
  static validateIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Regex.test(ip)) {
      return ip.split('.').every(octet => parseInt(octet) <= 255);
    }
    
    return ipv6Regex.test(ip);
  }
  
  static validateUUID(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }
  
  static validateMAC(mac: string): boolean {
    const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return regex.test(mac);
  }
  
  static validateCreditCard(card: string): boolean {
    const digits = card.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
}

export const security = new Security();