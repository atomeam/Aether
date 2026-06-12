/**
 * @aether/etl - ETL (Extract, Transform, Load) Data Processing Library
 *
 * A comprehensive ETL library for data extraction, transformation, and loading.
 * Supports various data sources, schema mapping, data validation, and pipeline orchestration.
 *
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// TYPES AND SCHEMAS
// =============================================================================

/**
 * Data source types supported by the ETL pipeline
 */
export enum DataSourceType {
  DATABASE = 'database',
  API = 'api',
  FILE = 'file',
  STREAM = 'stream',
  MEMORY = 'memory',
}

/**
 * Data destination types supported by the ETL pipeline
 */
export enum DataDestinationType {
  DATABASE = 'database',
  API = 'api',
  FILE = 'file',
  STREAM = 'stream',
  MEMORY = 'memory',
}

/**
 * Schema for data source configuration
 */
export const DataSourceConfigSchema = z.object({
  type: z.nativeEnum(DataSourceType),
  connectionString: z.string().optional(),
  endpoint: z.string().optional(),
  headers: z.record(z.string()).optional(),
  query: z.string().optional(),
  filePath: z.string().optional(),
  format: z.enum(['json', 'csv', 'xml', 'parquet']).optional(),
  batchSize: z.number().min(1).default(1000),
});

export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;

/**
 * Schema for data destination configuration
 */
export const DataDestinationConfigSchema = z.object({
  type: z.nativeEnum(DataDestinationType),
  connectionString: z.string().optional(),
  endpoint: z.string().optional(),
  headers: z.record(z.string()).optional(),
  filePath: z.string().optional(),
  format: z.enum(['json', 'csv', 'xml', 'parquet']).optional(),
  batchSize: z.number().min(1).default(1000),
  upsert: z.boolean().default(false),
});

export type DataDestinationConfig = z.infer<typeof DataDestinationConfigSchema>;

/**
 * Schema for field mapping
 */
export const FieldMappingSchema = z.object({
  source: z.string(),
  destination: z.string(),
  transform: z.enum(['identity', 'uppercase', 'lowercase', 'trim', 'date', 'number', 'boolean']).default('identity'),
  defaultValue: z.any().optional(),
});

export type FieldMapping = z.infer<typeof FieldMappingSchema>;

/**
 * Schema for schema mapping configuration
 */
export const SchemaMappingConfigSchema = z.object({
  mappings: z.array(FieldMappingSchema),
  ignoreUnmapped: z.boolean().default(false),
  strict: z.boolean().default(false),
});

export type SchemaMappingConfig = z.infer<typeof SchemaMappingConfigSchema>;

/**
 * Schema for validation rules
 */
export const ValidationRuleSchema = z.object({
  field: z.string(),
  type: z.enum(['required', 'min', 'max', 'pattern', 'custom']),
  value: z.any().optional(),
  message: z.string().optional(),
});

export type ValidationRule = z.infer<typeof ValidationRuleSchema>;

/**
 * Schema for validation configuration
 */
export const ValidationConfigSchema = z.object({
  rules: z.array(ValidationRuleSchema),
  failOnError: z.boolean().default(true),
  logErrors: z.boolean().default(true),
});

export type ValidationConfig = z.infer<typeof ValidationConfigSchema>;

/**
 * Schema for transformation step
 */
export const TransformationStepSchema = z.object({
  name: z.string(),
  type: z.enum(['map', 'filter', 'reduce', 'aggregate', 'join', 'sort', 'group', 'custom']),
  config: z.record(z.any()).optional(),
});

export type TransformationStep = z.infer<typeof TransformationStepSchema>;

/**
 * Schema for ETL pipeline configuration
 */
export const ETLPipelineConfigSchema = z.object({
  name: z.string(),
  source: DataSourceConfigSchema,
  destination: DataDestinationConfigSchema,
  schemaMapping: SchemaMappingConfigSchema.optional(),
  validation: ValidationConfigSchema.optional(),
  transformations: z.array(TransformationStepSchema).default([]),
  parallel: z.boolean().default(false),
  retryAttempts: z.number().min(0).default(3),
  retryDelay: z.number().min(0).default(1000),
});

export type ETLPipelineConfig = z.infer<typeof ETLPipelineConfigSchema>;

/**
 * Schema for ETL execution result
 */
export const ETLResultSchema = z.object({
  pipelineName: z.string(),
  success: z.boolean(),
  recordsProcessed: z.number(),
  recordsSucceeded: z.number(),
  recordsFailed: z.number(),
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number(),
  errors: z.array(z.object({
    record: z.any(),
    error: z.string(),
    timestamp: z.date(),
  })),
  warnings: z.array(z.string()).default([]),
});

export type ETLResult = z.infer<typeof ETLResultSchema>;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Parse and validate data source configuration
 */
export function parseDataSourceConfig(data: unknown): DataSourceConfig {
  return DataSourceConfigSchema.parse(data);
}

/**
 * Parse and validate data destination configuration
 */
export function parseDataDestinationConfig(data: unknown): DataDestinationConfig {
  return DataDestinationConfigSchema.parse(data);
}

/**
 * Parse and validate ETL pipeline configuration
 */
export function parseETLPipelineConfig(data: unknown): ETLPipelineConfig {
  return ETLPipelineConfigSchema.parse(data);
}

/**
 * Parse and validate ETL result
 */
export function parseETLResult(data: unknown): ETLResult {
  return ETLResultSchema.parse(data);
}

// =============================================================================
// DATA EXTRACTION
// =============================================================================

/**
 * Extract data from a configured source
 */
export class DataExtractor {
  constructor(private config: DataSourceConfig) {}

  /**
   * Extract data from the configured source
   */
  async extract(): Promise<unknown[]> {
    switch (this.config.type) {
      case DataSourceType.MEMORY:
        return this.extractFromMemory();
      case DataSourceType.API:
        return this.extractFromAPI();
      case DataSourceType.FILE:
        return this.extractFromFile();
      case DataSourceType.DATABASE:
        return this.extractFromDatabase();
      case DataSourceType.STREAM:
        return this.extractFromStream();
      default:
        throw new Error(`Unsupported data source type: ${this.config.type}`);
    }
  }

  private async extractFromMemory(): Promise<unknown[]> {
    // Memory extraction is a no-op - data is provided directly
    return [];
  }

  private async extractFromAPI(): Promise<unknown[]> {
    if (!this.config.endpoint) {
      throw new Error('API endpoint is required for API data source');
    }

    const response = await fetch(this.config.endpoint, {
      headers: this.config.headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }

  private async extractFromFile(): Promise<unknown[]> {
    if (!this.config.filePath) {
      throw new Error('File path is required for file data source');
    }

    // In a real implementation, this would read from the file system
    // For now, we'll return an empty array
    throw new Error('File extraction not implemented in this version');
  }

  private async extractFromDatabase(): Promise<unknown[]> {
    if (!this.config.connectionString) {
      throw new Error('Connection string is required for database data source');
    }

    // In a real implementation, this would connect to a database
    // For now, we'll return an empty array
    throw new Error('Database extraction not implemented in this version');
  }

  private async extractFromStream(): Promise<unknown[]> {
    // In a real implementation, this would consume from a stream
    // For now, we'll return an empty array
    throw new Error('Stream extraction not implemented in this version');
  }
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Transform data according to schema mapping and transformation steps
 */
export class DataTransformer {
  constructor(
    private schemaMapping?: SchemaMappingConfig,
    private transformations: TransformationStep[] = []
  ) {}

  /**
   * Transform a single record
   */
  transformRecord(record: unknown): unknown {
    let transformed = record;

    // Apply schema mapping if configured
    if (this.schemaMapping) {
      transformed = this.applySchemaMapping(transformed);
    }

    // Apply transformation steps
    for (const step of this.transformations) {
      transformed = this.applyTransformationStep(transformed, step);
    }

    return transformed;
  }

  /**
   * Transform multiple records
   */
  transformRecords(records: unknown[]): unknown[] {
    return records.map(record => this.transformRecord(record));
  }

  private applySchemaMapping(record: unknown): unknown {
    if (!this.schemaMapping || !this.isObject(record)) {
      return record;
    }

    const mapped: Record<string, unknown> = {};

    for (const mapping of this.schemaMapping.mappings) {
      const sourceValue = record[mapping.source];

      if (sourceValue !== undefined) {
        mapped[mapping.destination] = this.applyFieldTransform(sourceValue, mapping.transform);
      } else if (mapping.defaultValue !== undefined) {
        mapped[mapping.destination] = mapping.defaultValue;
      } else if (!this.schemaMapping.ignoreUnmapped) {
        mapped[mapping.destination] = sourceValue;
      }
    }

    // Include unmapped fields if not in strict mode
    if (!this.schemaMapping.strict) {
      for (const [key, value] of Object.entries(record)) {
        const isMapped = this.schemaMapping.mappings.some(m => m.source === key);
        if (!isMapped && !(key in mapped)) {
          mapped[key] = value;
        }
      }
    }

    return mapped;
  }

  private applyFieldTransform(value: unknown, transform: string): unknown {
    switch (transform) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'date':
        return new Date(value as string);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'identity':
      default:
        return value;
    }
  }

  private applyTransformationStep(data: unknown, step: TransformationStep): unknown {
    if (!Array.isArray(data)) {
      return data;
    }

    switch (step.type) {
      case 'map':
        return this.applyMap(data, step.config);
      case 'filter':
        return this.applyFilter(data, step.config);
      case 'sort':
        return this.applySort(data, step.config);
      case 'group':
        return this.applyGroup(data, step.config);
      default:
        return data;
    }
  }

  private applyMap(data: unknown[], config: unknown): unknown[] {
    // In a real implementation, this would apply a custom map function
    return data;
  }

  private applyFilter(data: unknown[], config: unknown): unknown[] {
    // In a real implementation, this would apply a custom filter function
    return data;
  }

  private applySort(data: unknown[], config: unknown): unknown[] {
    const field = config && typeof config === 'object' && 'field' in config ? (config as { field: string }).field : undefined;
    if (!field) return data;

    return [...data].sort((a, b) => {
      const aVal = this.isObject(a) ? a[field] : a;
      const bVal = this.isObject(b) ? b[field] : b;
      if ((aVal as any) < (bVal as any)) return -1;
      if ((aVal as any) > (bVal as any)) return 1;
      return 0;
    }) as unknown[];
  }

  private applyGroup(data: unknown[], config: unknown): Record<string, unknown[]> {
    const field = config && typeof config === 'object' && 'field' in config ? (config as { field: string }).field : undefined;
    if (!field) return {};

    const grouped: Record<string, unknown[]> = {};
    for (const item of data) {
      const key = this.isObject(item) ? String(item[field]) : 'undefined';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    return grouped;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

// =============================================================================
// DATA LOADING
// =============================================================================

/**
 * Load data to a configured destination
 */
export class DataLoader {
  constructor(private config: DataDestinationConfig) {}

  /**
   * Load data to the configured destination
   */
  async load(data: unknown[]): Promise<{ success: number; failed: number }> {
    switch (this.config.type) {
      case DataDestinationType.MEMORY:
        return this.loadToMemory(data);
      case DataDestinationType.API:
        return this.loadToAPI(data);
      case DataDestinationType.FILE:
        return this.loadToFile(data);
      case DataDestinationType.DATABASE:
        return this.loadToDatabase(data);
      case DataDestinationType.STREAM:
        return this.loadToStream(data);
      default:
        throw new Error(`Unsupported data destination type: ${this.config.type}`);
    }
  }

  private async loadToMemory(data: unknown[]): Promise<{ success: number; failed: number }> {
    // Memory loading is a no-op - data is already in memory
    return { success: data.length, failed: 0 };
  }

  private async loadToAPI(data: unknown[]): Promise<{ success: number; failed: number }> {
    if (!this.config.endpoint) {
      throw new Error('API endpoint is required for API data destination');
    }

    let success = 0;
    let failed = 0;

    const batchSize = this.config.batchSize;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      try {
        const response = await fetch(this.config.endpoint, {
          method: this.config.upsert ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.config.headers,
          },
          body: JSON.stringify(batch),
        });

        if (response.ok) {
          success += batch.length;
        } else {
          failed += batch.length;
        }
      } catch (error) {
        failed += batch.length;
      }
    }

    return { success, failed };
  }

  private async loadToFile(data: unknown[]): Promise<{ success: number; failed: number }> {
    if (!this.config.filePath) {
      throw new Error('File path is required for file data destination');
    }

    // In a real implementation, this would write to the file system
    // For now, we'll return success
    throw new Error('File loading not implemented in this version');
  }

  private async loadToDatabase(data: unknown[]): Promise<{ success: number; failed: number }> {
    if (!this.config.connectionString) {
      throw new Error('Connection string is required for database data destination');
    }

    // In a real implementation, this would connect to a database
    // For now, we'll return success
    throw new Error('Database loading not implemented in this version');
  }

  private async loadToStream(data: unknown[]): Promise<{ success: number; failed: number }> {
    // In a real implementation, this would publish to a stream
    // For now, we'll return success
    throw new Error('Stream loading not implemented in this version');
  }
}

// =============================================================================
// DATA VALIDATION
// =============================================================================

/**
 * Validate data according to validation rules
 */
export class DataValidator {
  constructor(private config: ValidationConfig) {}

  /**
   * Validate a single record
   */
  validateRecord(record: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isObject(record)) {
      return { valid: false, errors: ['Record is not an object'] };
    }

    for (const rule of this.config.rules) {
      const value = record[rule.field];
      const error = this.applyValidationRule(value, rule);
      if (error) {
        errors.push(error);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate multiple records
   */
  validateRecords(records: unknown[]): { valid: boolean; errors: Array<{ record: unknown; errors: string[] }> } {
    const results = records.map(record => ({
      record,
      ...this.validateRecord(record),
    }));

    const valid = results.every(r => r.valid);
    return { valid, errors: results.filter(r => !r.valid) as Array<{ record: unknown; errors: string[] }> };
  }

  private applyValidationRule(value: unknown, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return rule.message || `Field '${rule.field}' is required`;
        }
        break;
      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          return rule.message || `Field '${rule.field}' must be at least ${rule.value}`;
        }
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          return rule.message || `Field '${rule.field}' must be at least ${rule.value} characters`;
        }
        break;
      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          return rule.message || `Field '${rule.field}' must be at most ${rule.value}`;
        }
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          return rule.message || `Field '${rule.field}' must be at most ${rule.value} characters`;
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value as string).test(value)) {
          return rule.message || `Field '${rule.field}' does not match the required pattern`;
        }
        break;
      case 'custom':
        // Custom validation would be implemented by the user
        break;
    }

    return null;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

// =============================================================================
// ETL PIPELINE
// =============================================================================

/**
 * Complete ETL pipeline orchestrator
 */
export class ETLPipeline {
  private extractor: DataExtractor;
  private transformer: DataTransformer;
  private loader: DataLoader;
  private validator?: DataValidator;

  constructor(private config: ETLPipelineConfig) {
    this.extractor = new DataExtractor(config.source);
    this.transformer = new DataTransformer(config.schemaMapping, config.transformations);
    this.loader = new DataLoader(config.destination);

    if (config.validation) {
      this.validator = new DataValidator(config.validation);
    }
  }

  /**
   * Execute the complete ETL pipeline
   */
  async execute(): Promise<ETLResult> {
    const startTime = new Date();
    const errors: Array<{ record: unknown; error: string; timestamp: Date }> = [];
    const warnings: string[] = [];

    let recordsProcessed = 0;
    let recordsSucceeded = 0;
    let recordsFailed = 0;

    try {
      // Extract
      const rawData = await this.extractor.extract();
      recordsProcessed = rawData.length;

      // Validate if configured
      let dataToTransform = rawData;
      if (this.validator) {
        const validation = this.validator.validateRecords(rawData);
        if (!validation.valid) {
          if (this.config.validation?.failOnError) {
            for (const { record, errors: recordErrors } of validation.errors) {
              errors.push({
                record,
                error: recordErrors.join(', '),
                timestamp: new Date(),
              });
            }
            recordsFailed = validation.errors.length;
            recordsSucceeded = recordsProcessed - recordsFailed;
          } else {
            warnings.push(`${validation.errors.length} records failed validation`);
            dataToTransform = rawData.filter((_: unknown, i: number) => 
              !validation.errors.some(e => e.record === rawData[i])
            );
          }
        }
      }

      // Transform
      const transformedData = this.transformer.transformRecords(dataToTransform);

      // Load
      const loadResult = await this.loader.load(transformedData);
      recordsSucceeded = loadResult.success;
      recordsFailed = loadResult.failed;

    } catch (error) {
      errors.push({
        record: null,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      });
      recordsFailed = recordsProcessed;
      recordsSucceeded = 0;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return {
      pipelineName: this.config.name,
      success: errors.length === 0,
      recordsProcessed,
      recordsSucceeded,
      recordsFailed,
      startTime,
      endTime,
      duration,
      errors,
      warnings,
    };
  }

  /**
   * Execute the pipeline with retry logic
   */
  async executeWithRetry(): Promise<ETLResult> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.config.retryAttempts) {
      try {
        const result = await this.execute();
        if (result.success || attempt === this.config.retryAttempts) {
          return result;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      attempt++;
      if (attempt <= this.config.retryAttempts) {
        await this.delay(this.config.retryDelay);
      }
    }

    throw lastError || new Error('Pipeline execution failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a simple ETL pipeline from memory data
 */
export function createMemoryETL(
  data: unknown[],
  destination: DataDestinationConfig,
  options?: {
    schemaMapping?: SchemaMappingConfig;
    validation?: ValidationConfig;
    transformations?: TransformationStep[];
  }
): ETLPipeline {
  const config: ETLPipelineConfig = {
    name: 'memory-etl',
    source: {
      type: DataSourceType.MEMORY,
      batchSize: 1000,
    },
    destination,
    schemaMapping: options?.schemaMapping,
    validation: options?.validation,
    transformations: options?.transformations || [],
    parallel: false,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  const pipeline = new ETLPipeline(config);
  // Override extractor to return provided data
  (pipeline as any).extractor = {
    async extract() {
      return data;
    },
  };

  return pipeline;
}

/**
 * Create a schema mapping from a simple object mapping
 */
export function createSchemaMapping(mapping: Record<string, string>): SchemaMappingConfig {
  return {
    mappings: Object.entries(mapping).map(([source, destination]) => ({
      source,
      destination,
      transform: 'identity' as const,
    })),
    ignoreUnmapped: false,
    strict: true,
  };
}

/**
 * Create validation rules for required fields
 */
export function createRequiredValidation(fields: string[]): ValidationConfig {
  return {
    rules: fields.map(field => ({
      field,
      type: 'required' as const,
      message: `Field '${field}' is required`,
    })),
    failOnError: true,
    logErrors: true,
  };
}
