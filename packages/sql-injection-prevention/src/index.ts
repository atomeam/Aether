/**
 * @aether/sql-injection-prevention - SQL Injection Prevention
 * 
 * Provides SQL injection prevention utilities.
 * Sanitizes and validates SQL queries and parameters.
 */

export interface SQLConfig {
  allowMultipleStatements?: boolean;
  allowComments?: boolean;
  allowSpecialChars?: boolean;
}

export class SQLInjectionPrevention {
  private config: SQLConfig;

  constructor(config: SQLConfig = {}) {
    this.config = {
      allowMultipleStatements: false,
      allowComments: false,
      allowSpecialChars: false,
      ...config
    };
  }

  sanitizeQuery(query: string): string {
    let sanitized = query;

    // Remove SQL comments
    if (!this.config.allowComments) {
      sanitized = sanitized
        .replace(/--.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
    }

    // Remove multiple statements
    if (!this.config.allowMultipleStatements) {
      sanitized = sanitized.split(';')[0];
    }

    // Remove special characters
    if (!this.config.allowSpecialChars) {
      sanitized = sanitized
        .replace(/['";\\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return sanitized;
  }

  validateQuery(query: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for SQL injection patterns
    const injectionPatterns = [
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+\w+\s*=\s*\w+)/i,
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\bEXEC\b|EXECUTE\b)/i,
      /(\bxp_cmdshell\b|xp_cmdshell\b)/i,
      /(\bsp_OACreate\b|sp_OADestroy\b)/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(query)) {
        errors.push(`Potential SQL injection pattern detected: ${pattern}`);
      }
    }

    // Check for multiple statements
    if (!this.config.allowMultipleStatements && query.includes(';')) {
      errors.push('Multiple statements not allowed');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  escapeParameter(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    return `'${String(value).replace(/'/g, "''")}'`;
  }

  escapeIdentifier(identifier: string): string {
    // Escape SQL identifiers (backticks for MySQL, brackets for SQL Server, quotes for PostgreSQL)
    return `\`${identifier.replace(/`/g, '``')}\``;
  }
}

// Global SQL injection prevention instance
let globalSQLPrevention: SQLInjectionPrevention | null = null;

export function setupSQLPrevention(config?: SQLConfig): SQLInjectionPrevention {
  globalSQLPrevention = new SQLInjectionPrevention(config);
  return globalSQLPrevention;
}

export function getSQLPrevention(): SQLInjectionPrevention {
  if (!globalSQLPrevention) {
    globalSQLPrevention = new SQLInjectionPrevention();
  }
  return globalSQLPrevention;
}

// Common SQL injection prevention functions
export function sanitizeSQL(query: string): string {
  return getSQLPrevention().sanitizeQuery(query);
}

export function validateSQL(query: string): { valid: boolean; errors: string[] } {
  return getSQLPrevention().validateQuery(query);
}

export function escapeSQLParam(value: any): string {
  return getSQLPrevention().escapeParameter(value);
}

export function escapeSQLIdentifier(identifier: string): string {
  return getSQLPrevention().escapeIdentifier(identifier);
}