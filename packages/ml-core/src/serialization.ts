/**
 * Model serialization utilities
 */

import type {
  SerializationConfig,
  SerializedModel,
  ModelMetadata,
  DeserializationResult,
  SerializationFormat,
  ModelType,
} from './types';
import {
  SerializationConfigSchema,
  SerializedModelSchema,
  ModelMetadataSchema,
  DeserializationResultSchema,
} from './schemas';

/**
 * Validates serialization configuration
 */
export function validateSerializationConfig(config: unknown): SerializationConfig {
  return SerializationConfigSchema.parse(config);
}

/**
 * Creates a default serialization configuration
 */
export function createDefaultSerializationConfig(): SerializationConfig {
  return {
    format: 'json',
    compress: false,
    encryption: false,
    includeOptimizer: true,
    includeTrainingHistory: true,
  };
}

/**
 * Generates a checksum for data
 */
export function generateChecksum(data: string): string {
  // Simple hash function (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Serializes a model to JSON format
 */
export function serializeModel(
  model: unknown,
  metadata: ModelMetadata,
  config: SerializationConfig
): SerializedModel {
  const validatedConfig = validateSerializationConfig(config);
  
  let modelState = model;
  
  // Include optimizer state if configured
  if (validatedConfig.includeOptimizer && metadata.trainingResult) {
    modelState = {
      model: model,
      trainingHistory: validatedConfig.includeTrainingHistory 
        ? metadata.trainingResult.history 
        : undefined,
    };
  }

  // Convert to string based on format
  let serialized: string;
  let size = 0;

  switch (validatedConfig.format) {
    case 'json':
      serialized = JSON.stringify(modelState, null, 2);
      size = serialized.length;
      break;
    case 'binary':
      // In a real implementation, this would use binary serialization
      serialized = JSON.stringify(modelState);
      size = serialized.length;
      break;
    case 'protobuf':
      // In a real implementation, this would use protobuf
      serialized = JSON.stringify(modelState);
      size = serialized.length;
      break;
    case 'onnx':
      // In a real implementation, this would use ONNX format
      serialized = JSON.stringify(modelState);
      size = serialized.length;
      break;
    default:
      serialized = JSON.stringify(modelState);
      size = serialized.length;
  }

  // Apply compression if configured
  if (validatedConfig.compress) {
    // In a real implementation, this would use compression libraries
    serialized = serialized; // Placeholder
  }

  // Apply encryption if configured
  if (validatedConfig.encryption) {
    // In a real implementation, this would use encryption libraries
    serialized = serialized; // Placeholder
  }

  const checksum = generateChecksum(serialized);

  const result = {
    metadata,
    modelState: serialized as unknown,
    format: validatedConfig.format,
    size,
    checksum,
  };

  return SerializedModelSchema.parse(result) as SerializedModel;
}

/**
 * Deserializes a model from serialized format
 */
export function deserializeModel(
  serialized: SerializedModel
): DeserializationResult {
  const validationErrors: string[] = [];
  let isValid = true;

  // Verify checksum
  const modelStateString = typeof serialized.modelState === 'string' 
    ? serialized.modelState 
    : JSON.stringify(serialized.modelState);
  const expectedChecksum = generateChecksum(modelStateString);
  
  if (expectedChecksum !== serialized.checksum) {
    validationErrors.push('Checksum mismatch - data may be corrupted');
    isValid = false;
  }

  // Parse model state
  let model: unknown = null;
  try {
    model = JSON.parse(modelStateString);
  } catch (error) {
    validationErrors.push(`Failed to parse model state: ${error}`);
    isValid = false;
    model = null;
  }

  // Validate metadata
  try {
    ModelMetadataSchema.parse(serialized.metadata);
  } catch (error) {
    validationErrors.push(`Invalid metadata: ${error}`);
    isValid = false;
  }

  const result = {
    model: model as unknown,
    metadata: serialized.metadata,
    isValid,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
  };

  return DeserializationResultSchema.parse(result) as DeserializationResult;
}

/**
 * Creates model metadata
 */
export function createModelMetadata(
  modelId: string,
  modelType: ModelType,
  version: string,
  trainingConfig: ModelMetadata['trainingConfig'],
  trainingResult: ModelMetadata['trainingResult'],
  framework?: string,
  frameworkVersion?: string,
  inputShape?: number[],
  outputShape?: number[]
): ModelMetadata {
  const metadata: ModelMetadata = {
    modelId,
    modelType,
    version,
    createdAt: new Date(),
    trainingConfig,
    trainingResult,
    framework,
    frameworkVersion,
    inputShape,
    outputShape,
  };

  return ModelMetadataSchema.parse(metadata);
}

/**
 * Saves a model to a file (placeholder)
 */
export async function saveModelToFile(
  model: SerializedModel,
  filePath: string
): Promise<void> {
  // In a real implementation, this would write to the file system
  console.log(`Saving model to ${filePath}`);
}

/**
 * Loads a model from a file (placeholder)
 */
export async function loadModelFromFile(filePath: string): Promise<SerializedModel> {
  // In a real implementation, this would read from the file system
  console.log(`Loading model from ${filePath}`);
  throw new Error('File system operations not implemented in this environment');
}

/**
 * Converts model between serialization formats
 */
export function convertModelFormat(
  model: SerializedModel,
  targetFormat: SerializationFormat
): SerializedModel {
  if (model.format === targetFormat) {
    return model;
  }

  // Deserialize first
  const deserialized = deserializeModel(model);
  if (!deserialized.isValid) {
    throw new Error('Cannot convert invalid model');
  }

  // Re-serialize with new format
  return serializeModel(
    deserialized.model,
    model.metadata,
    { ...model, format: targetFormat }
  );
}

/**
 * Gets model file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Validates serialized model
 */
export function validateSerializedModel(model: unknown): SerializedModel {
  return SerializedModelSchema.parse(model) as SerializedModel;
}

/**
 * Validates model metadata
 */
export function validateModelMetadata(metadata: unknown): ModelMetadata {
  return ModelMetadataSchema.parse(metadata);
}
