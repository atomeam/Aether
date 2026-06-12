/**
 * Zod schemas for ML Core functionality
 */

import { z } from 'zod';

// ============================================================================
// Model Training Schemas
// ============================================================================

export const ModelTypeSchema = z.enum([
  'classification',
  'regression',
  'clustering',
  'neural-network',
]);

export const OptimizerTypeSchema = z.enum([
  'sgd',
  'adam',
  'rmsprop',
  'adagrad',
]);

export const LossFunctionSchema = z.enum([
  'mse',
  'mae',
  'cross-entropy',
  'hinge',
  'huber',
]);

export const RegularizationTypeSchema = z.enum([
  'l1',
  'l2',
  'elastic-net',
  'dropout',
]);

export const TrainingConfigSchema = z.object({
  modelType: ModelTypeSchema,
  epochs: z.number().int().positive(),
  batchSize: z.number().int().positive(),
  learningRate: z.number().positive(),
  optimizer: OptimizerTypeSchema,
  lossFunction: LossFunctionSchema,
  regularization: RegularizationTypeSchema.optional(),
  regularizationStrength: z.number().nonnegative().optional(),
  earlyStopping: z.boolean().optional(),
  earlyStoppingPatience: z.number().int().positive().optional(),
  validationSplit: z.number().min(0).max(1).optional(),
  shuffle: z.boolean().optional(),
  seed: z.number().int().optional(),
});

export const TrainingProgressSchema = z.object({
  epoch: z.number().int().nonnegative(),
  loss: z.number().nonnegative(),
  accuracy: z.number().min(0).max(1).optional(),
  validationLoss: z.number().nonnegative().optional(),
  validationAccuracy: z.number().min(0).max(1).optional(),
  learningRate: z.number().positive(),
  timestamp: z.coerce.date(),
});

export const ModelMetricsSchema = z.object({
  accuracy: z.number().min(0).max(1).optional(),
  precision: z.number().min(0).max(1).optional(),
  recall: z.number().min(0).max(1).optional(),
  f1Score: z.number().min(0).max(1).optional(),
  specificity: z.number().min(0).max(1).optional(),
  auc: z.number().min(0).max(1).optional(),
  confusionMatrix: z.array(z.array(z.number())).optional(),
  mse: z.number().nonnegative().optional(),
  mae: z.number().nonnegative().optional(),
  rmse: z.number().nonnegative().optional(),
  r2Score: z.number().optional(),
  adjustedR2: z.number().optional(),
  logLoss: z.number().nonnegative().optional(),
});

export const TrainingResultSchema = z.object({
  modelId: z.string().uuid(),
  finalLoss: z.number().nonnegative(),
  finalAccuracy: z.number().min(0).max(1).optional(),
  epochsTrained: z.number().int().positive(),
  trainingTime: z.number().nonnegative(),
  history: z.array(TrainingProgressSchema),
  metrics: ModelMetricsSchema,
});

export const ModelCheckpointSchema = z.object({
  epoch: z.number().int().nonnegative(),
  modelState: z.unknown().optional(),
  optimizerState: z.unknown().optional(),
  metrics: ModelMetricsSchema,
});

// ============================================================================
// Data Preprocessing Schemas
// ============================================================================

export const ScalingMethodSchema = z.enum([
  'standard',
  'minmax',
  'robust',
  'normalizer',
]);

export const EncodingMethodSchema = z.enum([
  'one-hot',
  'label',
  'target',
  'binary',
]);

export const ImputationStrategySchema = z.enum([
  'mean',
  'median',
  'mode',
  'constant',
  'knn',
]);

export const PreprocessingConfigSchema = z.object({
  scaling: ScalingMethodSchema.optional(),
  encoding: EncodingMethodSchema.optional(),
  imputation: ImputationStrategySchema.optional(),
  imputationValue: z.union([z.number(), z.string()]).optional(),
  handleMissing: z.boolean().optional(),
  handleOutliers: z.boolean().optional(),
  outlierMethod: z.enum(['iqr', 'zscore', 'isolation']).optional(),
  outlierThreshold: z.number().positive().optional(),
});

export const DataPointSchema = z.object({
  features: z.array(z.number()),
  label: z.union([z.number(), z.string()]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const DatasetSchema = z.object({
  data: z.array(DataPointSchema),
  featureNames: z.array(z.string()).optional(),
  labelNames: z.array(z.string()).optional(),
  shape: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
});

export const ScalerStateSchema = z.object({
  method: ScalingMethodSchema,
  mean: z.array(z.number()).optional(),
  std: z.array(z.number()).optional(),
  min: z.array(z.number()).optional(),
  max: z.array(z.number()).optional(),
  median: z.array(z.number()).optional(),
  q1: z.array(z.number()).optional(),
  q3: z.array(z.number()).optional(),
});

export const EncoderStateSchema = z.object({
  method: EncodingMethodSchema,
  mapping: z.record(z.number()).optional(),
  categories: z.array(z.array(z.string())).optional(),
});

export const DataStatisticsSchema = z.object({
  mean: z.array(z.number()),
  std: z.array(z.number()),
  min: z.array(z.number()),
  max: z.array(z.number()),
  median: z.array(z.number()),
  missingCount: z.array(z.number().int().nonnegative()),
  missingPercentage: z.array(z.number().min(0).max(1)),
});

export const PreprocessingResultSchema = z.object({
  processedData: z.array(DataPointSchema),
  scaler: ScalerStateSchema.optional(),
  encoder: EncoderStateSchema.optional(),
  statistics: DataStatisticsSchema.optional(),
});

// ============================================================================
// Feature Engineering Schemas
// ============================================================================

export const FeatureTypeSchema = z.enum([
  'numerical',
  'categorical',
  'text',
  'datetime',
  'boolean',
]);

export const FeatureSchema = z.object({
  name: z.string(),
  type: FeatureTypeSchema,
  importance: z.number().min(0).max(1).optional(),
  selected: z.boolean().optional(),
});

export const FeatureConfigSchema = z.object({
  polynomialDegree: z.number().int().positive().optional(),
  interactionTerms: z.boolean().optional(),
  binning: z.boolean().optional(),
  binCount: z.number().int().positive().optional(),
  textFeatures: z.boolean().optional(),
  datetimeFeatures: z.boolean().optional(),
  featureSelection: z.boolean().optional(),
  maxFeatures: z.number().int().positive().optional(),
  selectionMethod: z.enum(['variance', 'correlation', 'mutual-info', 'chi2']).optional(),
});

export const FeatureEngineeringResultSchema = z.object({
  features: z.array(FeatureSchema),
  transformedData: z.array(DataPointSchema),
  featureImportance: z.array(z.number()).optional(),
  selectedFeatures: z.array(z.string()).optional(),
});

export const PolynomialFeaturesSchema = z.object({
  degree: z.number().int().positive(),
  includeBias: z.boolean(),
  interactionOnly: z.boolean(),
});

export const BinningConfigSchema = z.object({
  strategy: z.enum(['uniform', 'quantile', 'kmeans']),
  bins: z.number().int().positive(),
  labels: z.array(z.string()).optional(),
});

// ============================================================================
// Model Evaluation Schemas
// ============================================================================

export const EvaluationConfigSchema = z.object({
  metrics: z.array(z.string()),
  crossValidation: z.boolean().optional(),
  cvFolds: z.number().int().positive().optional(),
  stratified: z.boolean().optional(),
  testSize: z.number().min(0).max(1).optional(),
  randomState: z.number().int().optional(),
});

export const EvaluationResultSchema = z.object({
  metrics: ModelMetricsSchema,
  crossValidationScores: z.array(z.number()).optional(),
  meanCvScore: z.number().optional(),
  stdCvScore: z.number().nonnegative().optional(),
  predictions: z.array(z.number()),
  actualLabels: z.array(z.number()),
});

export const ConfusionMatrixSchema = z.object({
  truePositive: z.number().int().nonnegative(),
  trueNegative: z.number().int().nonnegative(),
  falsePositive: z.number().int().nonnegative(),
  falseNegative: z.number().int().nonnegative(),
});

export const ROCPointSchema = z.object({
  falsePositiveRate: z.number().min(0).max(1),
  truePositiveRate: z.number().min(0).max(1),
  threshold: z.number(),
});

// ============================================================================
// Model Serialization Schemas
// ============================================================================

export const SerializationFormatSchema = z.enum([
  'json',
  'binary',
  'protobuf',
  'onnx',
]);

export const ModelMetadataSchema = z.object({
  modelId: z.string().uuid(),
  modelType: ModelTypeSchema,
  version: z.string(),
  createdAt: z.coerce.date(),
  trainingConfig: TrainingConfigSchema,
  trainingResult: TrainingResultSchema,
  framework: z.string().optional(),
  frameworkVersion: z.string().optional(),
  inputShape: z.array(z.number().int().positive()).optional(),
  outputShape: z.array(z.number().int().positive()).optional(),
});

export const SerializedModelSchema = z.object({
  metadata: ModelMetadataSchema,
  modelState: z.unknown(),
  format: SerializationFormatSchema,
  size: z.number().int().nonnegative(),
  checksum: z.string(),
});

export const SerializationConfigSchema = z.object({
  format: SerializationFormatSchema,
  compress: z.boolean().optional(),
  encryption: z.boolean().optional(),
  includeOptimizer: z.boolean().optional(),
  includeTrainingHistory: z.boolean().optional(),
});

export const DeserializationResultSchema = z.object({
  model: z.unknown(),
  metadata: ModelMetadataSchema,
  isValid: z.boolean(),
  validationErrors: z.array(z.string()).optional(),
});

// ============================================================================
// Common Schemas
// ============================================================================

export const PredictionSchema = z.object({
  input: z.array(z.number()),
  output: z.union([z.number(), z.array(z.number())]),
  confidence: z.number().min(0).max(1).optional(),
  probabilities: z.array(z.number().min(0).max(1)).optional(),
  timestamp: z.coerce.date(),
});

export const BatchPredictionSchema = z.object({
  predictions: z.array(PredictionSchema),
  batchSize: z.number().int().positive(),
  totalTime: z.number().nonnegative(),
  averageTime: z.number().nonnegative(),
});

export const ModelVersionSchema = z.object({
  version: z.string(),
  modelId: z.string().uuid(),
  createdAt: z.coerce.date(),
  isProduction: z.boolean(),
  metrics: ModelMetricsSchema,
});
