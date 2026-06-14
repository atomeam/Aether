/**
 * Safety Systems for Automation
 * Shared safety capabilities for all automation systems
 */

class AutomationSafety {
  constructor() {
    this.rateLimits = {
      support: { max: 100, period: 'hour', current: 0, history: [] },
      content: { max: 50, period: 'day', current: 0, history: [] },
      seo: { max: 30, period: 'day', current: 0, history: [] },
      leads: { max: 200, period: 'day', current: 0, history: [] },
      testing: { max: 10, period: 'day', current: 0, history: [] },
      features: { max: 5, period: 'day', current: 0, history: [] }
    };
    
    this.dataPath = __dirname + '/automation-safety.json';
    this.loadSafety();
  }

  // Check rate limit
  async checkRateLimit(system) {
    const limit = this.rateLimits[system];
    
    if (!limit) {
      return { allowed: true, reason: 'No limit configured' };
    }
    
    this.cleanHistory(limit);
    
    if (limit.history.length >= limit.max) {
      const resetTime = this.calculateResetTime(limit);
      return {
        allowed: false,
        reason: `Rate limit exceeded (${limit.history.length}/${limit.max} per ${limit.period})`,
        resetTime
      };
    }
    
    return {
      allowed: true,
      remaining: limit.max - limit.history.length
    };
  }

  // Record action
  async recordAction(system) {
    const limit = this.rateLimits[system];
    
    if (!limit) {
      return;
    }
    
    limit.history.push({
      timestamp: new Date().toISOString(),
      system
    });
    
    this.saveSafety();
  }

  // Clean old history
  cleanHistory(limit) {
    const now = new Date();
    const cutoff = this.calculateCutoff(limit.period);
    
    limit.history = limit.history.filter(entry => {
      const entryTime = new Date(entry.timestamp);
      return entryTime > cutoff;
    });
  }

  // Calculate cutoff
  calculateCutoff(period) {
    const now = new Date();
    
    switch (period) {
      case 'minute':
        return new Date(now.getTime() - 60 * 1000);
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 60 * 60 * 1000);
    }
  }

  // Calculate reset time
  calculateResetTime(limit) {
    const cutoff = this.calculateCutoff(limit.period);
    return cutoff.toISOString();
  }

  // Validate data
  async validateData(data, schema) {
    console.log('🔍 Validating data...');
    
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!data[field]) {
          validation.valid = false;
          validation.errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    // Check field types
    if (schema.types) {
      for (const [field, type] of Object.entries(schema.types)) {
        if (data[field] && typeof data[field] !== type) {
          validation.valid = false;
          validation.errors.push(`Invalid type for ${field}: expected ${type}, got ${typeof data[field]}`);
        }
      }
    }
    
    // Check field formats
    if (schema.formats) {
      for (const [field, format] of Object.entries(schema.formats)) {
        if (data[field] && !this.validateFormat(data[field], format)) {
          validation.valid = false;
          validation.errors.push(`Invalid format for ${field}: expected ${format}`);
        }
      }
    }
    
    return validation;
  }

  // Validate format
  validateFormat(value, format) {
    switch (format) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        return /^https?:\/\/.+/.test(value);
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      default:
        return true;
    }
  }

  // Sanitize data
  async sanitizeData(data) {
    console.log('🧹 Sanitizing data...');
    
    const sanitized = { ...data };
    
    // Remove potentially dangerous fields
    const dangerousFields = ['password', 'secret', 'token', 'apiKey', 'privateKey'];
    for (const field of dangerousFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Trim string fields
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      }
    }
    
    return sanitized;
  }

  // Check for sensitive data
  async checkSensitiveData(data) {
    console.log('🔒 Checking for sensitive data...');
    
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /api[_-]?key/i,
      /private[_-]?key/i,
      /credit[_-]?card/i,
      /ssn/i,
      /social[_-]?security/i
    ];
    
    const found = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        for (const pattern of sensitivePatterns) {
          if (pattern.test(key) || pattern.test(value)) {
            found.push(key);
            break;
          }
        }
      }
    }
    
    return {
      hasSensitiveData: found.length > 0,
      fields: found
    };
  }

  // Approve action
  async approveAction(system, action, data) {
    console.log(`🤖 Approving ${system} action: ${action}`);
    
    // Check rate limit
    const rateLimitCheck = await this.checkRateLimit(system);
    if (!rateLimitCheck.allowed) {
      return {
        approved: false,
        reason: rateLimitCheck.reason
      };
    }
    
    // Validate data
    const validation = await this.validateData(data, this.getSchema(system, action));
    if (!validation.valid) {
      return {
        approved: false,
        reason: 'Data validation failed',
        errors: validation.errors
      };
    }
    
    // Check for sensitive data
    const sensitiveCheck = await this.checkSensitiveData(data);
    if (sensitiveCheck.hasSensitiveData) {
      return {
        approved: false,
        reason: 'Sensitive data detected',
        fields: sensitiveCheck.fields
      };
    }
    
    // Approve
    await this.recordAction(system);
    
    return {
      approved: true,
      reason: 'All safety checks passed'
    };
  }

  // Get schema for system/action
  getSchema(system, action) {
    const schemas = {
      support: {
        required: ['id', 'subject', 'description'],
        types: { id: 'string', subject: 'string', description: 'string' }
      },
      content: {
        required: ['topic'],
        types: { topic: 'string' }
      },
      leads: {
        required: ['industry'],
        types: { industry: 'string' }
      },
      testing: {
        required: ['name', 'variants'],
        types: { name: 'string', variants: 'object' }
      },
      features: {
        required: ['title', 'description'],
        types: { title: 'string', description: 'string' }
      }
    };
    
    return schemas[system] || {};
  }

  // Get safety status
  getSafetyStatus() {
    const status = {};
    
    for (const [system, limit] of Object.entries(this.rateLimits)) {
      this.cleanHistory(limit);
      
      status[system] = {
        current: limit.history.length,
        max: limit.max,
        period: limit.period,
        remaining: limit.max - limit.history.length
      };
    }
    
    return status;
  }

  // Load safety data
  loadSafety() {
    if (require('fs').existsSync(this.dataPath)) {
      const data = require('fs').readFileSync(this.dataPath, 'utf8');
      const parsed = JSON.parse(data);
      
      for (const [system, limit] of Object.entries(parsed)) {
        if (this.rateLimits[system]) {
          this.rateLimits[system].history = limit.history || [];
        }
      }
    }
  }

  // Save safety data
  saveSafety() {
    const data = {};
    
    for (const [system, limit] of Object.entries(this.rateLimits)) {
      data[system] = {
        max: limit.max,
        period: limit.period,
        history: limit.history
      };
    }
    
    require('fs').writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }
}

module.exports = {
  AutomationSafety
};
