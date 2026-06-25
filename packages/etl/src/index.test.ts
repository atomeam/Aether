/**
 * Tests for @aether/etl
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DataSourceType,
  DataDestinationType,
  parseDataSourceConfig,
  parseDataDestinationConfig,
  parseETLPipelineConfig,
  parseETLResult,
  DataExtractor,
  DataTransformer,
  DataLoader,
  DataValidator,
  ETLPipeline,
  createMemoryETL,
  createSchemaMapping,
  createRequiredValidation,
  type DataSourceConfig,
  type DataDestinationConfig,
  type ETLPipelineConfig,
  type ETLResult,
} from './index';

describe('@aether/etl', () => {
  describe('Schema Validation', () => {
    it('should validate data source config', () => {
      const config = {
        type: DataSourceType.API,
        endpoint: 'https://api.example.com/data',
        headers: { Authorization: 'Bearer token' },
        batchSize: 500,
      };

      const result = parseDataSourceConfig(config);
      expect(result.type).toBe(DataSourceType.API);
      expect(result.endpoint).toBe('https://api.example.com/data');
      expect(result.batchSize).toBe(500);
    });

    it('should validate data destination config', () => {
      const config = {
        type: DataDestinationType.API,
        endpoint: 'https://api.example.com/data',
        batchSize: 1000,
        upsert: true,
      };

      const result = parseDataDestinationConfig(config);
      expect(result.type).toBe(DataDestinationType.API);
      expect(result.upsert).toBe(true);
    });

    it('should validate ETL pipeline config', () => {
      const config = {
        name: 'test-pipeline',
        source: {
          type: DataSourceType.MEMORY,
        },
        destination: {
          type: DataDestinationType.MEMORY,
        },
      };

      const result = parseETLPipelineConfig(config);
      expect(result.name).toBe('test-pipeline');
      expect(result.parallel).toBe(false);
      expect(result.retryAttempts).toBe(3);
    });

    it('should validate ETL result', () => {
      const result = {
        pipelineName: 'test',
        success: true,
        recordsProcessed: 100,
        recordsSucceeded: 100,
        recordsFailed: 0,
        startTime: new Date(),
        endTime: new Date(),
        duration: 1000,
        errors: [],
        warnings: [],
      };

      const parsed = parseETLResult(result);
      expect(parsed.success).toBe(true);
      expect(parsed.recordsProcessed).toBe(100);
    });
  });

  describe('DataExtractor', () => {
    it('should create extractor with config', () => {
      const config: DataSourceConfig = {
        type: DataSourceType.MEMORY,
        batchSize: 1000,
      };
      const extractor = new DataExtractor(config);
      expect(extractor).toBeDefined();
    });

    it('should extract from memory', async () => {
      const config: DataSourceConfig = {
        type: DataSourceType.MEMORY,
        batchSize: 1000,
      };
      const extractor = new DataExtractor(config);
      const data = await extractor.extract();
      expect(data).toEqual([]);
    });

    it('should throw error for API without endpoint', async () => {
      const config: DataSourceConfig = {
        type: DataSourceType.API,
        batchSize: 1000,
      };
      const extractor = new DataExtractor(config);
      await expect(extractor.extract()).rejects.toThrow('API endpoint is required');
    });

    it('should throw error for file without path', async () => {
      const config: DataSourceConfig = {
        type: DataSourceType.FILE,
        batchSize: 1000,
      };
      const extractor = new DataExtractor(config);
      await expect(extractor.extract()).rejects.toThrow('File path is required');
    });

    it('should throw error for database without connection string', async () => {
      const config: DataSourceConfig = {
        type: DataSourceType.DATABASE,
        batchSize: 1000,
      };
      const extractor = new DataExtractor(config);
      await expect(extractor.extract()).rejects.toThrow('Connection string is required');
    });
  });

  describe('DataTransformer', () => {
    it('should transform record without mapping', () => {
      const transformer = new DataTransformer();
      const record = { name: 'John', age: 30 };
      const result = transformer.transformRecord(record);
      expect(result).toEqual(record);
    });

    it('should apply schema mapping', () => {
      const transformer = new DataTransformer({
        mappings: [
          { source: 'name', destination: 'fullName', transform: 'identity' },
          { source: 'age', destination: 'userAge', transform: 'identity' },
        ],
        ignoreUnmapped: false,
        strict: true,
      });

      const record = { name: 'John', age: 30 };
      const result = transformer.transformRecord(record);

      expect(result).toEqual({
        fullName: 'John',
        userAge: 30,
      });
    });

    it('should apply uppercase transform', () => {
      const transformer = new DataTransformer({
        mappings: [
          { source: 'name', destination: 'name', transform: 'uppercase' },
        ],
        ignoreUnmapped: false,
        strict: true,
      });

      const record = { name: 'john' };
      const result = transformer.transformRecord(record) as { name: string };

      expect(result.name).toBe('JOHN');
    });

    it('should apply lowercase transform', () => {
      const transformer = new DataTransformer({
        mappings: [
          { source: 'name', destination: 'name', transform: 'lowercase' },
        ],
        ignoreUnmapped: false,
        strict: true,
      });

      const record = { name: 'JOHN' };
      const result = transformer.transformRecord(record) as { name: string };

      expect(result.name).toBe('john');
    });

    it('should apply trim transform', () => {
      const transformer = new DataTransformer({
        mappings: [
          { source: 'name', destination: 'name', transform: 'trim' },
        ],
        ignoreUnmapped: false,
        strict: true,
      });

      const record = { name: '  John  ' };
      const result = transformer.transformRecord(record) as { name: string };

      expect(result.name).toBe('John');
    });

    it('should apply number transform', () => {
      const transformer = new DataTransformer({
        mappings: [
          { source: 'age', destination: 'age', transform: 'number' },
        ],
        ignoreUnmapped: false,
        strict: true,
      });

      const record = { age: '30' };
      const result = transformer.transformRecord(record) as { age: number };

      expect(result.age).toBe(30);
    });

    it('should apply boolean transform', () => {
      const transformer = new DataTransformer({
        mappings: [
          { source: 'active', destination: 'active', transform: 'boolean' },
        ],
        ignoreUnmapped: false,
        strict: true,
      });

      const record = { active: 'true' };
      const result = transformer.transformRecord(record) as { active: boolean };

      expect(result.active).toBe(true);
    });

    it('should use default value for missing field', () => {
      const transformer = new DataTransformer({
        mappings: [
          { source: 'name', destination: 'name', transform: 'identity' },
          { source: 'age', destination: 'age', defaultValue: 0, transform: 'identity' },
        ],
        ignoreUnmapped: false,
        strict: true,
      });

      const record = { name: 'John' };
      const result = transformer.transformRecord(record) as { name: string; age: number };

      expect(result.age).toBe(0);
    });

    it('should transform multiple records', () => {
      const transformer = new DataTransformer({
        mappings: [
          { source: 'name', destination: 'fullName', transform: 'identity' },
        ],
        ignoreUnmapped: false,
        strict: true,
      });

      const records = [
        { name: 'John' },
        { name: 'Jane' },
      ];

      const result = transformer.transformRecords(records) as Array<{ fullName: string }>;

      expect(result).toEqual([
        { fullName: 'John' },
        { fullName: 'Jane' },
      ]);
    });

    it('should apply sort transformation', () => {
      const transformer = new DataTransformer(undefined, [
        { name: 'sort', type: 'sort', config: { field: 'age' } },
      ]);

      const records = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 },
      ];

      const result = transformer.transformRecords(records) as Array<{ name: string; age: number }>;

      expect(result).toEqual([
        { name: 'Jane', age: 25 },
        { name: 'John', age: 30 },
        { name: 'Bob', age: 35 },
      ]);
    });

    it('should apply group transformation', () => {
      const transformer = new DataTransformer(undefined, [
        { name: 'group', type: 'group', config: { field: 'category' } },
      ]);

      const records = [
        { name: 'Item1', category: 'A' },
        { name: 'Item2', category: 'B' },
        { name: 'Item3', category: 'A' },
      ];

      const result = transformer.transformRecords(records) as unknown as Record<string, unknown[]>;

      expect(result.A).toHaveLength(2);
      expect(result.B).toHaveLength(1);
    });
  });

  describe('DataValidator', () => {
    it('should validate required field', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'name', type: 'required' },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ name: 'John' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required field', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'name', type: 'required' },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ age: 30 });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate min number', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'age', type: 'min', value: 18 },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ age: 25 });
      expect(result.valid).toBe(true);
    });

    it('should fail validation for number below min', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'age', type: 'min', value: 18 },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ age: 15 });
      expect(result.valid).toBe(false);
    });

    it('should validate max number', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'age', type: 'max', value: 100 },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ age: 50 });
      expect(result.valid).toBe(true);
    });

    it('should fail validation for number above max', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'age', type: 'max', value: 100 },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ age: 150 });
      expect(result.valid).toBe(false);
    });

    it('should validate string length min', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'name', type: 'min', value: 3 },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ name: 'John' });
      expect(result.valid).toBe(true);
    });

    it('should fail validation for string below min length', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'name', type: 'min', value: 3 },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ name: 'Jo' });
      expect(result.valid).toBe(false);
    });

    it('should validate pattern', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'email', type: 'pattern', value: '^[^@]+@[^@]+$' },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ email: 'test@example.com' });
      expect(result.valid).toBe(true);
    });

    it('should fail validation for pattern mismatch', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'email', type: 'pattern', value: '^[^@]+@[^@]+$' },
        ],
        failOnError: true,
        logErrors: true,
      });

      const result = validator.validateRecord({ email: 'invalid' });
      expect(result.valid).toBe(false);
    });

    it('should validate multiple records', () => {
      const validator = new DataValidator({
        rules: [
          { field: 'name', type: 'required' },
        ],
        failOnError: true,
        logErrors: true,
      });

      const records = [
        { name: 'John' },
        { name: 'Jane' },
        { age: 30 },
      ];

      const result = validator.validateRecords(records);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('DataLoader', () => {
    it('should create loader with config', () => {
      const config: DataDestinationConfig = {
        type: DataDestinationType.MEMORY,
        batchSize: 1000,
        upsert: false,
      };
      const loader = new DataLoader(config);
      expect(loader).toBeDefined();
    });

    it('should load to memory', async () => {
      const config: DataDestinationConfig = {
        type: DataDestinationType.MEMORY,
        batchSize: 1000,
        upsert: false,
      };
      const loader = new DataLoader(config);
      const result = await loader.load([{ name: 'John' }]);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should throw error for API without endpoint', async () => {
      const config: DataDestinationConfig = {
        type: DataDestinationType.API,
        batchSize: 1000,
        upsert: false,
      };
      const loader = new DataLoader(config);
      await expect(loader.load([])).rejects.toThrow('API endpoint is required');
    });

    it('should throw error for file without path', async () => {
      const config: DataDestinationConfig = {
        type: DataDestinationType.FILE,
        batchSize: 1000,
        upsert: false,
      };
      const loader = new DataLoader(config);
      await expect(loader.load([])).rejects.toThrow('File path is required');
    });
  });

  describe('ETLPipeline', () => {
    it('should create pipeline with config', () => {
      const config: ETLPipelineConfig = {
        name: 'test-pipeline',
        source: { type: DataSourceType.MEMORY, batchSize: 1000 },
        destination: { type: DataDestinationType.MEMORY, batchSize: 1000, upsert: false },
        transformations: [],
        parallel: false,
        retryAttempts: 3,
        retryDelay: 1000,
      };
      const pipeline = new ETLPipeline(config);
      expect(pipeline).toBeDefined();
    });

    it('should execute pipeline successfully', async () => {
      const config: ETLPipelineConfig = {
        name: 'test-pipeline',
        source: { type: DataSourceType.MEMORY, batchSize: 1000 },
        destination: { type: DataDestinationType.MEMORY, batchSize: 1000, upsert: false },
        transformations: [],
        parallel: false,
        retryAttempts: 3,
        retryDelay: 1000,
      };

      const pipeline = new ETLPipeline(config);
      (pipeline as any).extractor = {
        async extract() {
          return [{ name: 'John', age: 30 }];
        },
      };

      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.recordsProcessed).toBe(1);
      expect(result.recordsSucceeded).toBe(1);
      expect(result.recordsFailed).toBe(0);
    });

    it('should handle extraction errors', async () => {
      const config: ETLPipelineConfig = {
        name: 'test-pipeline',
        source: { type: DataSourceType.MEMORY, batchSize: 1000 },
        destination: { type: DataDestinationType.MEMORY, batchSize: 1000, upsert: false },
        transformations: [],
        parallel: false,
        retryAttempts: 3,
        retryDelay: 1000,
      };

      const pipeline = new ETLPipeline(config);
      (pipeline as any).extractor = {
        async extract() {
          throw new Error('Extraction failed');
        },
      };

      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Extraction failed');
    });

    it('should apply transformations during execution', async () => {
      const config: ETLPipelineConfig = {
        name: 'test-pipeline',
        source: { type: DataSourceType.MEMORY, batchSize: 1000 },
        destination: { type: DataDestinationType.MEMORY, batchSize: 1000, upsert: false },
        schemaMapping: {
          mappings: [
            { source: 'name', destination: 'fullName', transform: 'identity' },
          ],
          ignoreUnmapped: false,
          strict: true,
        },
        transformations: [],
        parallel: false,
        retryAttempts: 3,
        retryDelay: 1000,
      };

      const pipeline = new ETLPipeline(config);
      (pipeline as any).extractor = {
        async extract() {
          return [{ name: 'John', age: 30 }];
        },
      };

      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.recordsSucceeded).toBe(1);
    });

    it('should apply validation during execution', async () => {
      const config: ETLPipelineConfig = {
        name: 'test-pipeline',
        source: { type: DataSourceType.MEMORY, batchSize: 1000 },
        destination: { type: DataDestinationType.MEMORY, batchSize: 1000, upsert: false },
        validation: {
          rules: [
            { field: 'name', type: 'required' },
          ],
          failOnError: true,
          logErrors: true,
        },
        transformations: [],
        parallel: false,
        retryAttempts: 3,
        retryDelay: 1000,
      };

      const pipeline = new ETLPipeline(config);
      (pipeline as any).extractor = {
        async extract() {
          return [{ name: 'John' }, { age: 30 }];
        },
      };

      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.recordsFailed).toBe(1);
    });

    it('should retry on failure', async () => {
      const config: ETLPipelineConfig = {
        name: 'test-pipeline',
        source: { type: DataSourceType.MEMORY, batchSize: 1000 },
        destination: { type: DataDestinationType.MEMORY, batchSize: 1000, upsert: false },
        retryAttempts: 2,
        retryDelay: 10,
        transformations: [],
        parallel: false,
      };

      const pipeline = new ETLPipeline(config);
      let attempts = 0;
      (pipeline as any).extractor = {
        async extract() {
          attempts++;
          if (attempts < 2) {
            throw new Error('Temporary failure');
          }
          return [{ name: 'John' }];
        },
      };

      const result = await pipeline.executeWithRetry();

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  describe('Utility Functions', () => {
    it('should create memory ETL pipeline', () => {
      const data = [{ name: 'John' }];
      const destination: DataDestinationConfig = {
        type: DataDestinationType.MEMORY,
        batchSize: 1000,
        upsert: false,
      };

      const pipeline = createMemoryETL(data, destination);
      expect(pipeline).toBeDefined();
    });

    it('should create schema mapping from object', () => {
      const mapping = createSchemaMapping({
        name: 'fullName',
        age: 'userAge',
      });

      expect(mapping.mappings).toHaveLength(2);
      expect(mapping.mappings[0].source).toBe('name');
      expect(mapping.mappings[0].destination).toBe('fullName');
    });

    it('should create required validation', () => {
      const validation = createRequiredValidation(['name', 'email']);

      expect(validation.rules).toHaveLength(2);
      expect(validation.rules[0].type).toBe('required');
      expect(validation.failOnError).toBe(true);
    });
  });
});
