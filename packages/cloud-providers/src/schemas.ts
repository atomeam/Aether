/**
 * @aether/cloud-providers
 * 
 * Zod schemas for cloud provider configuration and validation.
 */

import { z } from 'zod';

// ============================================================================
// Cloud Provider Schemas
// ============================================================================

export const CloudProviderSchema = z.enum(['aws', 'gcp', 'azure']);

export const CloudRegionSchema = z.enum([
  // AWS Regions
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
  'ap-south-1', 'ca-central-1', 'sa-east-1',
  // GCP Regions
  'us-central1', 'us-east1', 'us-west1', 'us-west2',
  'europe-west1', 'europe-west2', 'europe-west3', 'europe-west4',
  'asia-east1', 'asia-northeast1', 'asia-southeast1', 'asia-south1',
  'australia-southeast1', 'southamerica-east1',
  // Azure Regions
  'eastus', 'eastus2', 'westus', 'westus2',
  'centralus', 'northcentralus', 'southcentralus',
  'westeurope', 'northeurope', 'eastasia', 'southeastasia',
  'japaneast', 'japanwest', 'australiaeast', 'australiasoutheast'
]);

export const CloudServiceTypeSchema = z.enum([
  'compute', 'storage', 'database', 'network', 'cdn', 'function', 'container', 'analytics', 'ai', 'iot'
]);

// ============================================================================
// Provider Configuration Schemas
// ============================================================================

export const ProviderCredentialsSchema = z.object({
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  sessionToken: z.string().optional(),
  projectId: z.string().optional(),
  clientEmail: z.string().optional(),
  privateKey: z.string().optional(),
  tenantId: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  subscriptionId: z.string().optional(),
});

export const CloudProviderConfigSchema = z.object({
  provider: CloudProviderSchema,
  credentials: ProviderCredentialsSchema,
  region: CloudRegionSchema,
  defaultServiceTier: z.enum(['basic', 'standard', 'premium']).optional(),
  tags: z.record(z.string()).optional(),
});

// ============================================================================
// AWS Schemas
// ============================================================================

export const AWSServiceConfigSchema = z.object({
  service: z.enum(['ec2', 's3', 'rds', 'lambda', 'ecs', 'eks', 'dynamodb', 'cloudfront']),
  region: CloudRegionSchema,
  instanceType: z.string().optional(),
  storageClass: z.enum(['STANDARD', 'STANDARD_IA', 'ONEZONE_IA', 'GLACIER', 'DEEP_ARCHIVE']).optional(),
  engine: z.string().optional(),
  engineVersion: z.string().optional(),
  allocatedStorage: z.number().min(0).optional(),
  iops: z.number().min(0).optional(),
  throughput: z.number().min(0).optional(),
  multiAZ: z.boolean().optional(),
  backupRetentionPeriod: z.number().min(0).max(35).optional(),
});

export const AWSInstanceConfigSchema = z.object({
  instanceType: z.string(),
  amiId: z.string().optional(),
  keyName: z.string().optional(),
  securityGroups: z.array(z.string()).optional(),
  subnetId: z.string().optional(),
  userData: z.string().optional(),
  tags: z.record(z.string()).optional(),
  monitoring: z.boolean().optional(),
  ebsOptimized: z.boolean().optional(),
  placement: z.object({
    availabilityZone: z.string().optional(),
    tenancy: z.enum(['default', 'dedicated', 'host']).optional(),
  }).optional(),
});

export const S3LifecycleRuleSchema = z.object({
  id: z.string(),
  status: z.enum(['Enabled', 'Disabled']),
  transitions: z.array(z.object({
    days: z.number().min(0).optional(),
    storageClass: z.string().optional(),
  })).optional(),
  expiration: z.object({
    days: z.number().min(0).optional(),
  }).optional(),
});

export const S3CORSRuleSchema = z.object({
  allowedOrigins: z.array(z.string()),
  allowedMethods: z.array(z.enum(['GET', 'PUT', 'POST', 'DELETE', 'HEAD'])),
  allowedHeaders: z.array(z.string()).optional(),
  exposedHeaders: z.array(z.string()).optional(),
  maxAgeSeconds: z.number().min(0).optional(),
});

export const AWSS3ConfigSchema = z.object({
  bucketName: z.string().min(3).max(63),
  region: CloudRegionSchema,
  storageClass: z.enum(['STANDARD', 'STANDARD_IA', 'ONEZONE_IA', 'GLACIER', 'DEEP_ARCHIVE']).optional(),
  versioning: z.boolean().optional(),
  encryption: z.enum(['AES256', 'aws:kms']).optional(),
  publicAccess: z.enum(['public', 'private', 'authenticated']).optional(),
  lifecycleRules: z.array(S3LifecycleRuleSchema).optional(),
  cors: z.array(S3CORSRuleSchema).optional(),
});

// ============================================================================
// GCP Schemas
// ============================================================================

export const GCPServiceConfigSchema = z.object({
  service: z.enum(['compute', 'storage', 'sql', 'functions', 'gke', 'bigquery', 'pubsub', 'cloudrun']),
  region: CloudRegionSchema,
  zone: z.string().optional(),
  machineType: z.string().optional(),
  storageClass: z.enum(['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE']).optional(),
  tier: z.enum(['db-f1-micro', 'db-g1-small', 'db-n1-standard', 'db-n1-highmem', 'db-n1-highcpu']).optional(),
  databaseVersion: z.string().optional(),
  diskSize: z.number().min(0).optional(),
  diskType: z.enum(['pd-standard', 'pd-ssd', 'pd-balanced']).optional(),
  highAvailability: z.boolean().optional(),
  backupRetention: z.number().min(0).optional(),
});

export const GCPDiskSchema = z.object({
  type: z.enum(['pd-standard', 'pd-ssd', 'pd-balanced']),
  size: z.number().min(0),
  boot: z.boolean().optional(),
  autoDelete: z.boolean().optional(),
});

export const GCPComputeConfigSchema = z.object({
  machineType: z.string(),
  image: z.string().optional(),
  network: z.string().optional(),
  subnetwork: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional(),
  serviceAccount: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  preemptible: z.boolean().optional(),
  disks: z.array(GCPDiskSchema).optional(),
});

export const GCPLifecycleRuleSchema = z.object({
  action: z.object({
    type: z.enum(['Delete', 'SetStorageClass']),
    storageClass: z.string().optional(),
  }),
  condition: z.object({
    age: z.number().min(0).optional(),
    createdBefore: z.string().optional(),
    matchesStorageClass: z.array(z.string()).optional(),
  }),
});

export const GCPCORSRuleSchema = z.object({
  origin: z.array(z.string()),
  method: z.array(z.enum(['GET', 'PUT', 'POST', 'DELETE', 'HEAD'])),
  responseHeader: z.array(z.string()).optional(),
  maxAgeSeconds: z.number().min(0).optional(),
});

export const GCPStorageConfigSchema = z.object({
  bucketName: z.string().min(3).max(63),
  location: CloudRegionSchema,
  storageClass: z.enum(['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE']).optional(),
  versioning: z.boolean().optional(),
  encryption: z.enum(['default', 'customer-managed']).optional(),
  uniformBucketLevelAccess: z.boolean().optional(),
  lifecycleRules: z.array(GCPLifecycleRuleSchema).optional(),
  cors: z.array(GCPCORSRuleSchema).optional(),
});

// ============================================================================
// Azure Schemas
// ============================================================================

export const AzureServiceConfigSchema = z.object({
  service: z.enum(['vm', 'storage', 'sql', 'functions', 'aks', 'cosmosdb', 'cdn', 'appservice']),
  region: CloudRegionSchema,
  resourceGroup: z.string().min(1),
  vmSize: z.string().optional(),
  storageAccountType: z.enum(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Premium_LRS', 'Standard_ZRS']).optional(),
  tier: z.enum(['Basic', 'Standard', 'Premium']).optional(),
  databaseEdition: z.string().optional(),
  computeGeneration: z.string().optional(),
  capacity: z.number().min(0).optional(),
  highAvailability: z.boolean().optional(),
  backupRetention: z.number().min(0).optional(),
});

export const AzureVMConfigSchema = z.object({
  vmSize: z.string(),
  image: z.string().optional(),
  adminUsername: z.string().optional(),
  sshPublicKey: z.string().optional(),
  networkInterface: z.string().optional(),
  subnet: z.string().optional(),
  publicIp: z.boolean().optional(),
  tags: z.record(z.string()).optional(),
  osDisk: z.object({
    caching: z.enum(['ReadWrite', 'ReadOnly', 'None']),
    storageAccountType: z.enum(['Standard_LRS', 'StandardSSD_LRS', 'Premium_LRS']),
  }).optional(),
});

export const AzureCORSRuleSchema = z.object({
  allowedOrigins: z.array(z.string()),
  allowedMethods: z.array(z.enum(['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'PATCH'])),
  allowedHeaders: z.array(z.string()).optional(),
  exposedHeaders: z.array(z.string()).optional(),
  maxAgeInSeconds: z.number().min(0).optional(),
});

export const AzureBlobServiceSchema = z.object({
  containerName: z.string().min(3).max(63),
  publicAccess: z.enum(['Container', 'Blob', 'None']).optional(),
  cors: z.array(AzureCORSRuleSchema).optional(),
});

export const AzureStorageConfigSchema = z.object({
  accountName: z.string().min(3).max(24),
  resourceGroup: z.string().min(1),
  location: CloudRegionSchema,
  accountType: z.enum(['Standard_LRS', 'Standard_GRS', 'Standard_RAGRS', 'Premium_LRS', 'Standard_ZRS']).optional(),
  kind: z.enum(['StorageV2', 'Storage', 'BlobStorage']).optional(),
  accessTier: z.enum(['Hot', 'Cool']).optional(),
  httpsOnly: z.boolean().optional(),
  blobServices: z.array(AzureBlobServiceSchema).optional(),
});

// ============================================================================
// Multi-Cloud Schemas
// ============================================================================

export const HealthCheckConfigSchema = z.object({
  interval: z.number().min(1),
  timeout: z.number().min(1),
  unhealthyThreshold: z.number().min(1),
  healthyThreshold: z.number().min(1),
  path: z.string().optional(),
  port: z.number().min(1).max(65535).optional(),
});

export const LoadBalancingConfigSchema = z.object({
  strategy: z.enum(['round-robin', 'weighted', 'least-connections', 'geo-based']),
  weights: z.record(z.enum(['aws', 'gcp', 'azure']), z.number().min(0)).optional(),
  healthCheck: HealthCheckConfigSchema.optional(),
});

export const DataReplicationConfigSchema = z.object({
  strategy: z.enum(['sync', 'async', 'eventual']),
  regions: z.array(CloudRegionSchema).min(1),
  consistencyLevel: z.enum(['strong', 'eventual', 'bounded']).optional(),
  conflictResolution: z.enum(['last-write-wins', 'custom', 'manual']).optional(),
});

export const MultiCloudConfigSchema = z.object({
  providers: z.array(CloudProviderConfigSchema).min(1),
  primaryProvider: CloudProviderSchema,
  failoverStrategy: z.enum(['active-passive', 'active-active', 'geo-distributed']),
  loadBalancing: LoadBalancingConfigSchema.optional(),
  dataReplication: DataReplicationConfigSchema.optional(),
  costOptimization: z.object({
    enabled: z.boolean(),
    strategy: z.enum(['reserved', 'spot', 'savings-plan', 'hybrid']),
  }).optional(),
});

// ============================================================================
// Cost Optimization Schemas
// ============================================================================

export const AlertActionSchema = z.object({
  type: z.enum(['email', 'webhook', 'slack', 'pagerduty']),
  target: z.string().url(),
  message: z.string().optional(),
});

export const BudgetAlertSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  threshold: z.number().min(0).max(100),
  actions: z.array(AlertActionSchema).min(1),
});

export const ResourceOptimizationConfigSchema = z.object({
  rightSizing: z.boolean(),
  idleResourceDetection: z.boolean(),
  unattachedResourceCleanup: z.boolean(),
  storageTierOptimization: z.boolean(),
  snapshotManagement: z.boolean(),
});

export const ScheduleSchema = z.object({
  name: z.string().min(1),
  resources: z.array(z.string()).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  days: z.array(z.number().min(0).max(6)).min(1),
  action: z.enum(['start', 'stop', 'scale']),
});

export const SchedulingConfigSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string(),
  schedules: z.array(ScheduleSchema).min(1),
});

export const CostOptimizationConfigSchema = z.object({
  enabled: z.boolean(),
  strategy: z.enum(['reserved', 'spot', 'savings-plan', 'hybrid']),
  budgetAlerts: z.array(BudgetAlertSchema).optional(),
  resourceOptimization: ResourceOptimizationConfigSchema.optional(),
  scheduling: SchedulingConfigSchema.optional(),
});

// ============================================================================
// Cost Analysis Schemas
// ============================================================================

export const CostBreakdownSchema = z.object({
  service: z.string(),
  region: CloudRegionSchema,
  cost: z.number().min(0),
  usage: z.object({
    unit: z.string(),
    amount: z.number().min(0),
  }),
});

export const CostRecommendationSchema = z.object({
  type: z.enum(['right-size', 'reserved', 'spot', 'savings-plan', 'cleanup']),
  resource: z.string(),
  currentCost: z.number().min(0),
  projectedSavings: z.number().min(0),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  actionItems: z.array(z.string()).min(1),
});

export const CostReportSchema = z.object({
  provider: CloudProviderSchema,
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  totalCost: z.number().min(0),
  currency: z.string(),
  breakdown: z.array(CostBreakdownSchema),
  recommendations: z.array(CostRecommendationSchema),
});

// ============================================================================
// Common Schemas
// ============================================================================

export const DeploymentResultSchema = z.object({
  success: z.boolean(),
  resourceId: z.string().optional(),
  region: CloudRegionSchema.optional(),
  provider: CloudProviderSchema.optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ResourceMetricsSchema = z.object({
  cpuUtilization: z.number().min(0).max(100).optional(),
  memoryUtilization: z.number().min(0).max(100).optional(),
  diskUtilization: z.number().min(0).max(100).optional(),
  networkIn: z.number().min(0).optional(),
  networkOut: z.number().min(0).optional(),
  requestCount: z.number().min(0).optional(),
  errorRate: z.number().min(0).max(100).optional(),
  timestamp: z.date(),
});

export const ResourceStatusSchema = z.object({
  resourceId: z.string(),
  provider: CloudProviderSchema,
  region: CloudRegionSchema,
  status: z.enum(['running', 'stopped', 'pending', 'failed', 'terminating']),
  uptime: z.number().min(0).optional(),
  metrics: ResourceMetricsSchema.optional(),
});

// ============================================================================
// Input Types for Schema Inference
// ============================================================================

export type CloudProviderInput = z.infer<typeof CloudProviderSchema>;
export type CloudRegionInput = z.infer<typeof CloudRegionSchema>;
export type CloudServiceTypeInput = z.infer<typeof CloudServiceTypeSchema>;
export type ProviderCredentialsInput = z.infer<typeof ProviderCredentialsSchema>;
export type CloudProviderConfigInput = z.infer<typeof CloudProviderConfigSchema>;
export type AWSServiceConfigInput = z.infer<typeof AWSServiceConfigSchema>;
export type AWSInstanceConfigInput = z.infer<typeof AWSInstanceConfigSchema>;
export type AWSS3ConfigInput = z.infer<typeof AWSS3ConfigSchema>;
export type GCPServiceConfigInput = z.infer<typeof GCPServiceConfigSchema>;
export type GCPComputeConfigInput = z.infer<typeof GCPComputeConfigSchema>;
export type GCPStorageConfigInput = z.infer<typeof GCPStorageConfigSchema>;
export type AzureServiceConfigInput = z.infer<typeof AzureServiceConfigSchema>;
export type AzureVMConfigInput = z.infer<typeof AzureVMConfigSchema>;
export type AzureStorageConfigInput = z.infer<typeof AzureStorageConfigSchema>;
export type MultiCloudConfigInput = z.infer<typeof MultiCloudConfigSchema>;
export type CostOptimizationConfigInput = z.infer<typeof CostOptimizationConfigSchema>;
export type CostReportInput = z.infer<typeof CostReportSchema>;
export type DeploymentResultInput = z.infer<typeof DeploymentResultSchema>;
export type ResourceStatusInput = z.infer<typeof ResourceStatusSchema>;
