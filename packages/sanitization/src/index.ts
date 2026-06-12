/**
 * @aether/sanitization - Sanitization
 */

export class Sanitization {
  sanitizeHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
  
  sanitizeSQL(sql: string): string {
    return sql.replace(/[';\\]/g, '');
  }
}

export const sanitization = new Sanitization();