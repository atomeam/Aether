/**
 * TypeScript types for ML Core functionality
 */

// ============================================================================
// Model Training Types
// ============================================================================

export type ModelType = 'classification' | 'regression' | 'clustering' | 'neural-network';

export type OptimizerType = 'sgd' | 'adam' | 'rmsprop' | 'adagrad';

export type LossFunction = 'mse' | 'mae' | 'cross-entropy' | 'hinge' | 'huber';

export type RegularizationType = 'l1' | 'l2' | 'elastic-net' | 'dropout';

export interface TrainingConfig {
  modelType: ModelType;
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: OptimizerType;
  lossFunction: LossFunction;
  regularization?: RegularizationType;
  regularizationStrength?: number;
  earlyStopping?: boolean;
  earlyStoppingPatience?: number;
  validationSplit?: number;
  shuffle?: boolean;
  seed?: number;
}

export interface TrainingProgress {
  epoch: number;
  loss: number;
  accuracy?: number;
  validationLoss?: number;
  validationAccuracy?: number;
  learningRate: number;
  timestamp: Date;
}

export interface TrainingResult {
  modelId: string;
  finalLoss: number;
  finalAccuracy?: number;
  epochsTrained: number;
  trainingTime: number;
  history: TrainingProgress[];
  metrics: ModelMetrics;
}

export interface ModelCheckpoint {
  epoch: number;
  modelState?: unknown;
  optimizerState?: unknown;
  metrics: ModelMetrics;
}

// ============================================================================
// Data Preprocessing Types
// ============================================================================

export type ScalingMethod = 'standard' | 'minmax' | 'robust' | 'normalizer';

export type EncodingMethod = 'one-hot' | 'label' | 'target' | 'binary';

export type ImputationStrategy = 'mean' | 'median' | 'mode' | 'constant' | 'knn';

export interface PreprocessingConfig {
  scaling?: ScalingMethod;
  encoding?: EncodingMethod;
  imputation?: ImputationStrategy;
  imputationValue?: number | string;
  handleMissing?: boolean;
  handleOutliers?: boolean;
  outlierMethod?: 'iqr' | 'zscore' | 'isolation';
  outlierThreshold?: number;
}

export interface DataPoint {
  features: number[];
  label?: number | string;
  metadata?: Record<string, unknown>;
}

export interface Dataset {
  data: DataPoint[];
  featureNames?: string[];
  labelNames?: string[];
  shape: [number, number];
}

export interface PreprocessingResult {
  processedData: DataPoint[];
  scaler?: ScalerState;
  encoder?: EncoderState;
  statistics?: DataStatistics;
}

export interface ScalerState {
  method: ScalingMethod;
  mean?: number[];
  std?: number[];
  min?: number[];
  max?: number[];
  median?: number[];
  q1?: number[];
  q3?: number[];
}

export interface EncoderState {
  method: EncodingMethod;
  mapping?: Record<string, number>;
  categories?: string[][];
}

export interface DataStatistics {
  mean: number[];
  std: number[];
  min: number[];
  max: number[];
  median: number[];
  missingCount: number[];
  missingPercentage: number[];
}

// ============================================================================
// Feature Engineering Types
// ============================================================================

export type FeatureType = 'numerical' | 'categorical' | 'text' | 'datetime' | 'boolean';

export interface Feature {
  name: string;
  type: FeatureType;
  importance?: number;
  selected?: boolean;
}

export interface FeatureConfig {
  polynomialDegree?: number;
  interactionTerms?: boolean;
  binning?: boolean;
  binCount?: number;
  textFeatures?: boolean;
  datetimeFeatures?: boolean;
  featureSelection?: boolean;
  maxFeatures?: number;
  selectionMethod?: 'variance' | 'correlation' | 'mutual-info' | 'chi2';
}

export interface FeatureEngineeringResult {
  features: Feature[];
  transformedData: DataPoint[];
  featureImportance?: number[];
  selectedFeatures?: string[];
}

export interface PolynomialFeatures {
  degree: number;
  includeBias: boolean;
  interactionOnly: boolean;
}

export interface BinningConfig {
  strategy: 'uniform' | 'quantile' | 'kmeans';
  bins: number;
  labels?: string[];
}

// ============================================================================
// Model Evaluation Types
// ============================================================================

export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  specificity?: number;
  auc?: number;
  confusionMatrix?: number[][];
  mse?: number;
  mae?: number;
  rmse?: number;
  r2Score?: number;
  adjustedR2?: number;
  logLoss?: number;
}

export interface EvaluationConfig {
  metrics: string[];
  crossValidation?: boolean;
  cvFolds?: number;
  stratified?: boolean;
  testSize?: number;
  randomState?: number;
}

export interface EvaluationResult {
  metrics: ModelMetrics;
  crossValidationScores?: number[];
  meanCvScore?: number;
  stdCvScore?: number;
  predictions: number[];
  actualLabels: number[];
}

export interface ConfusionMatrix {
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
}

export interface ROCPoint {
  falsePositiveRate: number;
  truePositiveRate: number;
  threshold: number;
}

// ============================================================================
// Model Serialization Types
// ============================================================================

export type SerializationFormat = 'json' | 'binary' | 'protobuf' | 'onnx';

export interface ModelMetadata {
  modelId: string;
  modelType: ModelType;
  version: string;
  createdAt: Date;
  trainingConfig: TrainingConfig;
  trainingResult: TrainingResult;
  framework?: string;
  frameworkVersion?: string;
  inputShape?: number[];
  outputShape?: number[];
}

export interface SerializedModel {
  metadata: ModelMetadata;
  modelState: unknown;
  format: SerializationFormat;
  size: number;
  checksum: string;
}

export interface SerializationConfig {
  format: SerializationFormat;
  compress?: boolean;
  encryption?: boolean;
  includeOptimizer?: boolean;
  includeTrainingHistory?: boolean;
}

export interface DeserializationResult {
  model: unknown;
  metadata: ModelMetadata;
  isValid: boolean;
  validationErrors?: string[];
}

// ============================================================================
// Common Types
// ============================================================================

export interface Prediction {
  input: number[];
  output: number | number[];
  confidence?: number;
  probabilities?: number[];
  timestamp: Date;
}

export interface BatchPrediction {
  predictions: Prediction[];
  batchSize: number;
  totalTime: number;
  averageTime: number;
}

export interface ModelVersion {
  version: string;
  modelId: string;
  createdAt: Date;
  isProduction: boolean;
  metrics: ModelMetrics;
}
