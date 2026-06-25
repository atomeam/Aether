# @aether/etl

ETL (Extract, Transform, Load) data processing library for the Aether ecosystem.

## Features

- **Data Extraction**: Extract data from various sources (API, Database, File, Stream, Memory)
- **Data Transformation**: Apply schema mappings, field transformations, and custom transformation steps
- **Data Loading**: Load data to various destinations (API, Database, File, Stream, Memory)
- **Schema Mapping**: Map fields between source and destination schemas with automatic type conversion
- **Data Validation**: Validate data with configurable rules (required, min, max, pattern, custom)
- **Pipeline Orchestration**: Complete ETL pipeline with retry logic and error handling
- **TypeScript Support**: Full TypeScript types and Zod schemas for runtime validation

## Installation

```bash
npm install @aether/etl
```

## Quick Start

```typescript
import { ETLPipeline, DataSourceType, DataDestinationType } from '@aether/etl';

// Create a simple ETL pipeline
const pipeline = new ETLPipeline({
  name: 'user-sync',
  source: {
    type: DataSourceType.API,
    endpoint: 'https://api.example.com/users',
    headers: { Authorization: 'Bearer token' },
  },
  destination: {
    type: DataSourceType.DATABASE,
    connectionString: 'postgresql://localhost/mydb',
  },
  schemaMapping: {
    mappings: [
      { source: 'user_name', destination: 'name', transform: 'trim' },
      { source: 'user_email', destination: 'email', transform: 'lowercase' },
    ],
  },
  validation: {
    rules: [
      { field: 'name', type: 'required' },
      { field: 'email', type: 'required' },
    ],
    failOnError: true,
  },
});

// Execute the pipeline
const result = await pipeline.execute();
console.log(`Processed ${result.recordsProcessed} records`);
console.log(`Success: ${result.success}`);
```

## Data Extraction

### Memory Extraction

```typescript
import { DataExtractor, DataSourceType } from '@aether/etl';

const extractor = new DataExtractor({
  type: DataSourceType.MEMORY,
});

const data = await extractor.extract();
```

### API Extraction

```typescript
const extractor = new DataExtractor({
  type: DataSourceType.API,
  endpoint: 'https://api.example.com/data',
  headers: { Authorization: 'Bearer token' },
  batchSize: 1000,
});

const data = await extractor.extract();
```

### File Extraction

```typescript
const extractor = new DataExtractor({
  type: DataSourceType.FILE,
  filePath: './data.json',
  format: 'json',
});

const data = await extractor.extract();
```

## Data Transformation

### Schema Mapping

```typescript
import { DataTransformer } from '@aether/etl';

const transformer = new DataTransformer({
  mappings: [
    { source: 'first_name', destination: 'firstName' },
    { source: 'last_name', destination: 'lastName' },
    { source: 'email', destination: 'email', transform: 'lowercase' },
    { source: 'age', destination: 'age', transform: 'number' },
    { source: 'active', destination: 'active', transform: 'boolean' },
  ],
  ignoreUnmapped: false,
  strict: false,
});

const transformed = transformer.transformRecords(rawData);
```

### Transformation Steps

```typescript
const transformer = new DataTransformer(undefined, [
  { name: 'sort', type: 'sort', config: { field: 'createdAt' } },
  { name: 'group', type: 'group', config: { field: 'category' } },
  { name: 'filter', type: 'filter', config: { field: 'active', value: true } },
]);

const transformed = transformer.transformRecords(data);
```

### Field Transforms

Available field transforms:
- `identity` - No transformation (default)
- `uppercase` - Convert string to uppercase
- `lowercase` - Convert string to lowercase
- `trim` - Remove whitespace from string
- `date` - Convert to Date object
- `number` - Convert to number
- `boolean` - Convert to boolean

## Data Validation

```typescript
import { DataValidator } from '@aether/etl';

const validator = new DataValidator({
  rules: [
    { field: 'name', type: 'required' },
    { field: 'email', type: 'required' },
    { field: 'age', type: 'min', value: 18 },
    { field: 'age', type: 'max', value: 100 },
    { field: 'email', type: 'pattern', value: '^[^@]+@[^@]+$' },
  ],
  failOnError: true,
  logErrors: true,
});

const result = validator.validateRecord(record);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Data Loading

### Memory Loading

```typescript
import { DataLoader, DataDestinationType } from '@aether/etl';

const loader = new DataLoader({
  type: DataDestinationType.MEMORY,
});

const result = await loader.load(data);
console.log(`Loaded ${result.success} records`);
```

### API Loading

```typescript
const loader = new DataLoader({
  type: DataDestinationType.API,
  endpoint: 'https://api.example.com/data',
  headers: { Authorization: 'Bearer token' },
  batchSize: 500,
  upsert: true,
});

const result = await loader.load(data);
```

## Complete Pipeline

```typescript
import { ETLPipeline, DataSourceType, DataDestinationType } from '@aether/etl';

const pipeline = new ETLPipeline({
  name: 'daily-sync',
  source: {
    type: DataSourceType.API,
    endpoint: 'https://api.example.com/users',
    headers: { Authorization: 'Bearer token' },
    batchSize: 1000,
  },
  destination: {
    type: DataDestinationType.DATABASE,
    connectionString: 'postgresql://localhost/mydb',
    batchSize: 500,
    upsert: true,
  },
  schemaMapping: {
    mappings: [
      { source: 'user_name', destination: 'name', transform: 'trim' },
      { source: 'user_email', destination: 'email', transform: 'lowercase' },
    ],
  },
  validation: {
    rules: [
      { field: 'name', type: 'required' },
      { field: 'email', type: 'required' },
    ],
    failOnError: false,
  },
  transformations: [
    { name: 'sort', type: 'sort', config: { field: 'createdAt' } },
  ],
  parallel: false,
  retryAttempts: 3,
  retryDelay: 1000,
});

const result = await pipeline.execute();
console.log(`Pipeline: ${result.pipelineName}`);
console.log(`Success: ${result.success}`);
console.log(`Processed: ${result.recordsProcessed}`);
console.log(`Succeeded: ${result.recordsSucceeded}`);
console.log(`Failed: ${result.recordsFailed}`);
console.log(`Duration: ${result.duration}ms`);
```

## Retry Logic

```typescript
const pipeline = new ETLPipeline({
  name: 'resilient-pipeline',
  source: { type: DataSourceType.MEMORY },
  destination: { type: DataDestinationType.MEMORY },
  retryAttempts: 5,
  retryDelay: 2000,
});

const result = await pipeline.executeWithRetry();
```

## Utility Functions

### Create Memory ETL

```typescript
import { createMemoryETL } from '@aether/etl';

const data = [{ name: 'John', age: 30 }];
const pipeline = createMemoryETL(data, {
  type: DataDestinationType.MEMORY,
});

const result = await pipeline.execute();
```

### Create Schema Mapping

```typescript
import { createSchemaMapping } from '@aether/etl';

const mapping = createSchemaMapping({
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email_address',
});
```

### Create Required Validation

```typescript
import { createRequiredValidation } from '@aether/etl';

const validation = createRequiredValidation(['name', 'email', 'age']);
```

## API Reference

### Types

- `DataSourceType` - Enum of supported data source types
- `DataDestinationType` - Enum of supported destination types
- `DataSourceConfig` - Configuration for data source
- `DataDestinationConfig` - Configuration for data destination
- `FieldMapping` - Field mapping configuration
- `SchemaMappingConfig` - Schema mapping configuration
- `ValidationRule` - Validation rule configuration
- `ValidationConfig` - Validation configuration
- `TransformationStep` - Transformation step configuration
- `ETLPipelineConfig` - Complete ETL pipeline configuration
- `ETLResult` - Result of ETL pipeline execution

### Classes

- `DataExtractor` - Extract data from configured source
- `DataTransformer` - Transform data according to mappings and steps
- `DataValidator` - Validate data according to rules
- `DataLoader` - Load data to configured destination
- `ETLPipeline` - Complete ETL pipeline orchestrator

### Functions

- `parseDataSourceConfig()` - Validate data source config
- `parseDataDestinationConfig()` - Validate destination config
- `parseETLPipelineConfig()` - Validate pipeline config
- `parseETLResult()` - Validate ETL result
- `createMemoryETL()` - Create ETL pipeline from memory data
- `createSchemaMapping()` - Create schema mapping from object
- `createRequiredValidation()` - Create validation for required fields

## License

MIT
