/**
 * @aether/cloud-providers
 * 
 * Cloud provider abstraction types for AWS, GCP, Azure, and multi-cloud operations.
 */

// ============================================================================
// Cloud Provider Types
// ============================================================================

export type CloudProvider = 'aws' | 'gcp' | 'azure';

export type CloudRegion = 
  // AWS Regions
  | 'us-east-1' | 'us-east-2' | 'us-west-1' | 'us-west-2'
  | 'eu-west-1' | 'eu-west-2' | 'eu-west-3' | 'eu-central-1'
  | 'ap-northeast-1' | 'ap-northeast-2' | 'ap-southeast-1' | 'ap-southeast-2'
  | 'ap-south-1' | 'ca-central-1' | 'sa-east-1'
  // GCP Regions
  | 'us-central1' | 'us-east1' | 'us-west1' | 'us-west2'
  | 'europe-west1' | 'europe-west2' | 'europe-west3' | 'europe-west4'
  | 'asia-east1' | 'asia-northeast1' | 'asia-southeast1' | 'asia-south1'
  | 'australia-southeast1' | 'southamerica-east1'
  // Azure Regions
  | 'eastus' | 'eastus2' | 'westus' | 'westus2'
  | 'centralus' | 'northcentralus' | 'southcentralus'
  | 'westeurope' | 'northeurope' | 'eastasia' | 'southeastasia'
  | 'japaneast' | 'japanwest' | 'australiaeast' | 'australiasoutheast';

export type CloudServiceType = 
  | 'compute'
  | 'storage'
  | 'database'
  | 'network'
  | 'cdn'
  | 'function'
  | 'container'
  | 'analytics'
  | 'ai'
  | 'iot';

// ============================================================================
// Provider Configuration
// ============================================================================

export interface CloudProviderConfig {
  provider: CloudProvider;
  credentials: ProviderCredentials;
  region: CloudRegion;
  defaultServiceTier?: 'basic' | 'standard' | 'premium';
  tags?: Record<string, string>;
}

export interface ProviderCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  subscriptionId?: string;
}

// ============================================================================
// AWS Types
// ============================================================================

export interface AWSServiceConfig {
  service: 'ec2' | 's3' | 'rds' | 'lambda' | 'ecs' | 'eks' | 'dynamodb' | 'cloudfront';
  region: CloudRegion;
  instanceType?: string;
  storageClass?: 'STANDARD' | 'STANDARD_IA' | 'ONEZONE_IA' | 'GLACIER' | 'DEEP_ARCHIVE';
  engine?: string;
  engineVersion?: string;
  allocatedStorage?: number;
  iops?: number;
  throughput?: number;
  multiAZ?: boolean;
  backupRetentionPeriod?: number;
}

export interface AWSInstanceConfig {
  instanceType: string;
  amiId?: string;
  keyName?: string;
  securityGroups?: string[];
  subnetId?: string;
  userData?: string;
  tags?: Record<string, string>;
  monitoring?: boolean;
  ebsOptimized?: boolean;
  placement?: {
    availabilityZone?: string;
    tenancy?: 'default' | 'dedicated' | 'host';
  };
}

export interface AWSS3Config {
  bucketName: string;
  region: CloudRegion;
  storageClass?: 'STANDARD' | 'STANDARD_IA' | 'ONEZONE_IA' | 'GLACIER' | 'DEEP_ARCHIVE';
  versioning?: boolean;
  encryption?: 'AES256' | 'aws:kms';
  publicAccess?: 'public' | 'private' | 'authenticated';
  lifecycleRules?: S3LifecycleRule[];
  cors?: S3CORSRule[];
}

export interface S3LifecycleRule {
  id: string;
  status: 'Enabled' | 'Disabled';
  transitions?: {
    days?: number;
    storageClass?: string;
  }[];
  expiration?: {
    days?: number;
  };
}

export interface S3CORSRule {
  allowedOrigins: string[];
  allowedMethods: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD')[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAgeSeconds?: number;
}

// ============================================================================
// GCP Types
// ============================================================================

export interface GCPServiceConfig {
  service: 'compute' | 'storage' | 'sql' | 'functions' | 'gke' | 'bigquery' | 'pubsub' | 'cloudrun';
  region: CloudRegion;
  zone?: string;
  machineType?: string;
  storageClass?: 'STANDARD' | 'NEARLINE' | 'COLDLINE' | 'ARCHIVE';
  tier?: 'db-f1-micro' | 'db-g1-small' | 'db-n1-standard' | 'db-n1-highmem' | 'db-n1-highcpu';
  databaseVersion?: string;
  diskSize?: number;
  diskType?: 'pd-standard' | 'pd-ssd' | 'pd-balanced';
  highAvailability?: boolean;
  backupRetention?: number;
}

export interface GCPComputeConfig {
  machineType: string;
  image?: string;
  network?: string;
  subnetwork?: string;
  tags?: string[];
  metadata?: Record<string, string>;
  serviceAccount?: string;
  scopes?: string[];
  preemptible?: boolean;
  disks?: GCPDisk[];
}

export interface GCPDisk {
  type: 'pd-standard' | 'pd-ssd' | 'pd-balanced';
  size: number;
  boot?: boolean;
  autoDelete?: boolean;
}

export interface GCPStorageConfig {
  bucketName: string;
  location: CloudRegion;
  storageClass?: 'STANDARD' | 'NEARLINE' | 'COLDLINE' | 'ARCHIVE';
  versioning?: boolean;
  encryption?: 'default' | 'customer-managed';
  uniformBucketLevelAccess?: boolean;
  lifecycleRules?: GCPLifecycleRule[];
  cors?: GCPCORSRule[];
}

export interface GCPLifecycleRule {
  action: {
    type: 'Delete' | 'SetStorageClass';
    storageClass?: string;
  };
  condition: {
    age?: number;
    createdBefore?: string;
    matchesStorageClass?: string[];
  };
}

export interface GCPCORSRule {
  origin: string[];
  method: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD')[];
  responseHeader?: string[];
  maxAgeSeconds?: number;
}

// ============================================================================
// Azure Types
// ============================================================================

export interface AzureServiceConfig {
  service: 'vm' | 'storage' | 'sql' | 'functions' | 'aks' | 'cosmosdb' | 'cdn' | 'appservice';
  region: CloudRegion;
  resourceGroup: string;
  vmSize?: string;
  storageAccountType?: 'Standard_LRS' | 'Standard_GRS' | 'Standard_RAGRS' | 'Premium_LRS' | 'Standard_ZRS';
  tier?: 'Basic' | 'Standard' | 'Premium';
  databaseEdition?: string;
  computeGeneration?: string;
  capacity?: number;
  highAvailability?: boolean;
  backupRetention?: number;
}

export interface AzureVMConfig {
  vmSize: string;
  image?: string;
  adminUsername?: string;
  sshPublicKey?: string;
  networkInterface?: string;
  subnet?: string;
  publicIp?: boolean;
  tags?: Record<string, string>;
  osDisk?: {
    caching: 'ReadWrite' | 'ReadOnly' | 'None';
    storageAccountType: 'Standard_LRS' | 'StandardSSD_LRS' | 'Premium_LRS';
  };
}

export interface AzureStorageConfig {
  accountName: string;
  resourceGroup: string;
  location: CloudRegion;
  accountType?: 'Standard_LRS' | 'Standard_GRS' | 'Standard_RAGRS' | 'Premium_LRS' | 'Standard_ZRS';
  kind?: 'StorageV2' | 'Storage' | 'BlobStorage';
  accessTier?: 'Hot' | 'Cool';
  httpsOnly?: boolean;
  blobServices?: AzureBlobService[];
}

export interface AzureBlobService {
  containerName: string;
  publicAccess?: 'Container' | 'Blob' | 'None';
  cors?: AzureCORSRule[];
}

export interface AzureCORSRule {
  allowedOrigins: string[];
  allowedMethods: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD' | 'PATCH')[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAgeInSeconds?: number;
}

// ============================================================================
// Multi-Cloud Types
// ============================================================================

export interface MultiCloudConfig {
  providers: CloudProviderConfig[];
  primaryProvider: CloudProvider;
  failoverStrategy: 'active-passive' | 'active-active' | 'geo-distributed';
  loadBalancing?: LoadBalancingConfig;
  dataReplication?: DataReplicationConfig;
  costOptimization?: CostOptimizationConfig;
}

export interface LoadBalancingConfig {
  strategy: 'round-robin' | 'weighted' | 'least-connections' | 'geo-based';
  weights?: Record<CloudProvider, number>;
  healthCheck?: HealthCheckConfig;
}

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
  path?: string;
  port?: number;
}

export interface DataReplicationConfig {
  strategy: 'sync' | 'async' | 'eventual';
  regions: CloudRegion[];
  consistencyLevel?: 'strong' | 'eventual' | 'bounded';
  conflictResolution?: 'last-write-wins' | 'custom' | 'manual';
}

// ============================================================================
// Cost Optimization Types
// ============================================================================

export interface CostOptimizationConfig {
  enabled: boolean;
  strategy: 'reserved' | 'spot' | 'savings-plan' | 'hybrid';
  budgetAlerts?: BudgetAlert[];
  resourceOptimization?: ResourceOptimizationConfig;
  scheduling?: SchedulingConfig;
}

export interface BudgetAlert {
  name: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  threshold: number;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'pagerduty';
  target: string;
  message?: string;
}

export interface ResourceOptimizationConfig {
  rightSizing: boolean;
  idleResourceDetection: boolean;
  unattachedResourceCleanup: boolean;
  storageTierOptimization: boolean;
  snapshotManagement: boolean;
}

export interface SchedulingConfig {
  enabled: boolean;
  timezone: string;
  schedules: Schedule[];
}

export interface Schedule {
  name: string;
  resources: string[];
  startTime: string;
  endTime: string;
  days: number[];
  action: 'start' | 'stop' | 'scale';
}

// ============================================================================
// Cost Analysis Types
// ============================================================================

export interface CostReport {
  provider: CloudProvider;
  period: {
    start: Date;
    end: Date;
  };
  totalCost: number;
  currency: string;
  breakdown: CostBreakdown[];
  recommendations: CostRecommendation[];
}

export interface CostBreakdown {
  service: string;
  region: CloudRegion;
  cost: number;
  usage: {
    unit: string;
    amount: number;
  };
}

export interface CostRecommendation {
  type: 'right-size' | 'reserved' | 'spot' | 'savings-plan' | 'cleanup';
  resource: string;
  currentCost: number;
  projectedSavings: number;
  confidence: number;
  description: string;
  actionItems: string[];
}

// ============================================================================
// Common Types
// ============================================================================

export interface DeploymentResult {
  success: boolean;
  resourceId?: string;
  region?: CloudRegion;
  provider?: CloudProvider;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ResourceStatus {
  resourceId: string;
  provider: CloudProvider;
  region: CloudRegion;
  status: 'running' | 'stopped' | 'pending' | 'failed' | 'terminating';
  uptime?: number;
  metrics?: ResourceMetrics;
}

export interface ResourceMetrics {
  cpuUtilization?: number;
  memoryUtilization?: number;
  diskUtilization?: number;
  networkIn?: number;
  networkOut?: number;
  requestCount?: number;
  errorRate?: number;
  timestamp: Date;
}
