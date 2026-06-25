/**
 * @aether/infrastructure - Infrastructure as Code package
 * 
 * Provides Terraform templates, CloudFormation templates, Kubernetes manifests,
 * Docker configuration, and environment management with full TypeScript
 * type safety and Zod validation.
 * 
 * @version 1.0.0
 */

import { z } from 'zod';

// =============================================================================
// TERRAFORM TYPES AND SCHEMAS
// =============================================================================

/**
 * Terraform provider configuration
 */
export const TerraformProviderSchema = z.enum(['aws', 'azure', 'gcp', 'digitalocean', 'custom']);

export type TerraformProvider = z.infer<typeof TerraformProviderSchema>;

/**
 * Terraform resource definition
 */
export const TerraformResourceSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  config: z.record(z.unknown()),
  dependsOn: z.array(z.string()).optional(),
  count: z.number().int().optional(),
  for_each: z.record(z.unknown()).optional(),
});

export type TerraformResource = z.infer<typeof TerraformResourceSchema>;

/**
 * Terraform variable definition
 */
export const TerraformVariableSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  default: z.unknown().optional(),
  description: z.string().optional(),
  sensitive: z.boolean().optional().default(false),
});

export type TerraformVariable = z.infer<typeof TerraformVariableSchema>;

/**
 * Terraform output definition
 */
export const TerraformOutputSchema = z.object({
  name: z.string().min(1),
  value: z.unknown(),
  description: z.string().optional(),
  sensitive: z.boolean().optional().default(false),
});

export type TerraformOutput = z.infer<typeof TerraformOutputSchema>;

/**
 * Complete Terraform configuration
 */
export const TerraformConfigSchema = z.object({
  provider: TerraformProviderSchema,
  region: z.string().min(1).optional(),
  version: z.string().optional(),
  backend: z.object({
    type: z.string(),
    config: z.record(z.string()),
  }).optional(),
  requiredProviders: z.record(z.object({
    source: z.string(),
    version: z.string().optional(),
  })).optional(),
  variables: z.array(TerraformVariableSchema).optional(),
  outputs: z.array(TerraformOutputSchema).optional(),
  resources: z.array(TerraformResourceSchema).optional(),
  dataSources: z.array(TerraformResourceSchema).optional(),
  modules: z.array(z.object({
    source: z.string(),
    name: z.string(),
    config: z.record(z.unknown()).optional(),
  })).optional(),
});

export type TerraformConfig = z.infer<typeof TerraformConfigSchema>;

// =============================================================================
// CLOUDFORMATION TYPES AND SCHEMAS
// =============================================================================

/**
 * CloudFormation parameter definition
 */
export const CloudFormationParameterSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  default: z.unknown().optional(),
  description: z.string().optional(),
  allowedValues: z.array(z.unknown()).optional(),
  noEcho: z.boolean().optional().default(false),
});

export type CloudFormationParameter = z.infer<typeof CloudFormationParameterSchema>;

/**
 * CloudFormation resource definition
 */
export const CloudFormationResourceSchema = z.object({
  type: z.string().min(1),
  properties: z.record(z.unknown()),
  dependsOn: z.array(z.string()).optional(),
  condition: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CloudFormationResource = z.infer<typeof CloudFormationResourceSchema>;

/**
 * CloudFormation output definition
 */
export const CloudFormationOutputSchema = z.object({
  name: z.string().min(1),
  value: z.unknown(),
  description: z.string().optional(),
  export: z.object({
    name: z.string(),
  }).optional(),
});

export type CloudFormationOutput = z.infer<typeof CloudFormationOutputSchema>;

/**
 * Complete CloudFormation configuration
 */
export const CloudFormationConfigSchema = z.object({
  description: z.string().optional(),
  parameters: z.record(CloudFormationParameterSchema).optional(),
  mappings: z.record(z.record(z.unknown())).optional(),
  conditions: z.record(z.string()).optional(),
  resources: z.record(CloudFormationResourceSchema),
  outputs: z.record(CloudFormationOutputSchema).optional(),
  transform: z.string().optional(),
});

export type CloudFormationConfig = z.infer<typeof CloudFormationConfigSchema>;

// =============================================================================
// KUBERNETES TYPES AND SCHEMAS
// =============================================================================

/**
 * Kubernetes container definition
 */
export const KubernetesContainerSchema = z.object({
  name: z.string().min(1),
  image: z.string().min(1),
  ports: z.array(z.object({
    containerPort: z.number().int().positive(),
    protocol: z.enum(['TCP', 'UDP']).optional().default('TCP'),
  })).optional(),
  env: z.array(z.object({
    name: z.string().min(1),
    value: z.string().optional(),
    valueFrom: z.record(z.unknown()).optional(),
  })).optional(),
  resources: z.object({
    requests: z.record(z.string()).optional(),
    limits: z.record(z.string()).optional(),
  }).optional(),
  volumeMounts: z.array(z.object({
    name: z.string(),
    mountPath: z.string(),
  })).optional(),
});

export type KubernetesContainer = z.infer<typeof KubernetesContainerSchema>;

/**
 * Kubernetes pod specification
 */
export const KubernetesPodSpecSchema = z.object({
  containers: z.array(KubernetesContainerSchema).min(1),
  volumes: z.array(z.object({
    name: z.string(),
    configMap: z.object({ name: z.string() }).optional(),
    secret: z.object({ secretName: z.string() }).optional(),
    emptyDir: z.record(z.unknown()).optional(),
  })).optional(),
  restartPolicy: z.enum(['Always', 'OnFailure', 'Never']).optional().default('Always'),
  imagePullSecrets: z.array(z.object({ name: z.string() })).optional(),
});

export type KubernetesPodSpec = z.infer<typeof KubernetesPodSpecSchema>;

/**
 * Kubernetes metadata
 */
export const KubernetesMetadataSchema = z.object({
  name: z.string().min(1),
  namespace: z.string().optional().default('default'),
  labels: z.record(z.string()).optional(),
  annotations: z.record(z.string()).optional(),
});

export type KubernetesMetadata = z.infer<typeof KubernetesMetadataSchema>;

/**
 * Kubernetes deployment specification
 */
export const KubernetesDeploymentSpecSchema = z.object({
  replicas: z.number().int().positive().optional().default(1),
  selector: z.object({
    matchLabels: z.record(z.string()),
  }),
  template: z.object({
    metadata: z.object({
      labels: z.record(z.string()),
    }),
    spec: KubernetesPodSpecSchema,
  }),
  strategy: z.object({
    type: z.enum(['RollingUpdate', 'Recreate']).optional().default('RollingUpdate'),
    rollingUpdate: z.object({
      maxUnavailable: z.union([z.string(), z.number()]).optional(),
      maxSurge: z.union([z.string(), z.number()]).optional(),
    }).optional(),
  }).optional(),
});

export type KubernetesDeploymentSpec = z.infer<typeof KubernetesDeploymentSpecSchema>;

/**
 * Kubernetes service specification
 */
export const KubernetesServiceSpecSchema = z.object({
  type: z.enum(['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName']).optional().default('ClusterIP'),
  selector: z.record(z.string()),
  ports: z.array(z.object({
    port: z.number().int().positive(),
    targetPort: z.union([z.number(), z.string()]).optional(),
    protocol: z.enum(['TCP', 'UDP']).optional().default('TCP'),
    name: z.string().optional(),
  })).min(1),
  sessionAffinity: z.enum(['None', 'ClientIP']).optional().default('None'),
});

export type KubernetesServiceSpec = z.infer<typeof KubernetesServiceSpecSchema>;

/**
 * Kubernetes ingress specification
 */
export const KubernetesIngressSpecSchema = z.object({
  rules: z.array(z.object({
    host: z.string().optional(),
    http: z.object({
      paths: z.array(z.object({
        path: z.string().optional().default('/'),
        pathType: z.enum(['Prefix', 'Exact', 'ImplementationSpecific']).optional().default('Prefix'),
        backend: z.object({
          service: z.object({
            name: z.string(),
            port: z.object({
              number: z.number().optional(),
              name: z.string().optional(),
            }),
          }),
        }),
      })),
    }),
  })),
  tls: z.array(z.object({
    hosts: z.array(z.string()),
    secretName: z.string(),
  })).optional(),
});

export type KubernetesIngressSpec = z.infer<typeof KubernetesIngressSpecSchema>;

/**
 * Complete Kubernetes configuration
 */
export const KubernetesConfigSchema = z.object({
  apiVersion: z.string().min(1),
  kind: z.enum(['Deployment', 'Service', 'Ingress', 'ConfigMap', 'Secret', 'Pod']),
  metadata: KubernetesMetadataSchema,
  spec: z.union([
    KubernetesDeploymentSpecSchema,
    KubernetesServiceSpecSchema,
    KubernetesIngressSpecSchema,
    KubernetesPodSpecSchema,
    z.record(z.unknown()),
  ]),
});

export type KubernetesConfig = z.infer<typeof KubernetesConfigSchema>;

// =============================================================================
// DOCKER TYPES AND SCHEMAS
// =============================================================================

/**
 * Docker configuration
 */
export const DockerConfigSchema = z.object({
  baseImage: z.string().min(1),
  workDir: z.string().optional().default('/app'),
  copyFiles: z.array(z.string()).optional(),
  installCommand: z.string().optional(),
  copyApp: z.string().optional(),
  buildCommand: z.string().optional(),
  exposePort: z.number().int().positive().optional(),
  startCommand: z.string().min(1),
  envVars: z.array(z.string()).optional(),
  labels: z.record(z.string()).optional(),
  healthCheck: z.object({
    command: z.array(z.string()),
    interval: z.string().optional(),
    timeout: z.string().optional(),
    retries: z.number().int().optional(),
  }).optional(),
  user: z.string().optional(),
  multiStage: z.boolean().optional().default(false),
  stages: z.array(z.object({
    name: z.string(),
    baseImage: z.string(),
    commands: z.array(z.string()),
  })).optional(),
});

export type DockerConfig = z.infer<typeof DockerConfigSchema>;

/**
 * Docker Compose service configuration
 */
export const DockerComposeServiceSchema = z.object({
  image: z.string().optional(),
  build: z.union([z.string(), z.object({
    context: z.string(),
    dockerfile: z.string().optional(),
    args: z.record(z.string()).optional(),
  })]).optional(),
  command: z.union([z.string(), z.array(z.string())]).optional(),
  ports: z.array(z.string()).optional(),
  environment: z.union([z.array(z.string()), z.record(z.string())]).optional(),
  volumes: z.array(z.string()).optional(),
  dependsOn: z.array(z.string()).optional(),
  networks: z.array(z.string()).optional(),
  restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).optional().default('unless-stopped'),
  healthcheck: z.object({
    test: z.array(z.string()),
    interval: z.string().optional(),
    timeout: z.string().optional(),
    retries: z.number().int().optional(),
  }).optional(),
});

export type DockerComposeService = z.infer<typeof DockerComposeServiceSchema>;

/**
 * Docker Compose configuration
 */
export const DockerComposeConfigSchema = z.object({
  version: z.string().optional().default('3.8'),
  services: z.record(DockerComposeServiceSchema),
  networks: z.record(z.object({
    driver: z.string().optional(),
    ipam: z.record(z.unknown()).optional(),
  })).optional(),
  volumes: z.record(z.object({
    driver: z.string().optional(),
    driver_opts: z.record(z.string()).optional(),
  })).optional(),
});

export type DockerComposeConfig = z.infer<typeof DockerComposeConfigSchema>;

// =============================================================================
// ENVIRONMENT MANAGEMENT TYPES AND SCHEMAS
// =============================================================================

/**
 * Environment variable definition
 */
export const EnvironmentVariableSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
  required: z.boolean().optional().default(false),
  secret: z.boolean().optional().default(false),
  description: z.string().optional(),
  validation: z.object({
    pattern: z.string().optional(),
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    enum: z.array(z.string()).optional(),
  }).optional(),
});

export type EnvironmentVariable = z.infer<typeof EnvironmentVariableSchema>;

/**
 * Environment configuration
 */
export const EnvironmentConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  variables: z.record(z.string()),
  required: z.array(z.string()).optional(),
  secrets: z.array(z.string()).optional(),
});

export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

/**
 * Environment validation result
 */
export const EnvironmentValidationResultSchema = z.object({
  valid: z.boolean(),
  missing: z.array(z.string()),
  invalid: z.array(z.object({
    name: z.string(),
    reason: z.string(),
  })),
});

export type EnvironmentValidationResult = z.infer<typeof EnvironmentValidationResultSchema>;

// =============================================================================
// VALIDATOR FUNCTIONS
// =============================================================================

/**
 * Parse and validate Terraform configuration
 */
export function parseTerraformConfig(data: unknown): TerraformConfig {
  return TerraformConfigSchema.parse(data);
}

/**
 * Parse and validate CloudFormation configuration
 */
export function parseCloudFormationConfig(data: unknown): CloudFormationConfig {
  return CloudFormationConfigSchema.parse(data);
}

/**
 * Parse and validate Kubernetes configuration
 */
export function parseKubernetesConfig(data: unknown): KubernetesConfig {
  return KubernetesConfigSchema.parse(data);
}

/**
 * Parse and validate Docker configuration
 */
export function parseDockerConfig(data: unknown): DockerConfig {
  return DockerConfigSchema.parse(data);
}

/**
 * Parse and validate Docker Compose configuration
 */
export function parseDockerComposeConfig(data: unknown): DockerComposeConfig {
  return DockerComposeConfigSchema.parse(data);
}

/**
 * Parse and validate environment configuration
 */
export function parseEnvironmentConfig(data: unknown): EnvironmentConfig {
  return EnvironmentConfigSchema.parse(data);
}

// =============================================================================
// TERRAFORM GENERATION
// =============================================================================

/**
 * Generate Terraform configuration code
 */
export function generateTerraform(config: TerraformConfig): string {
  const validated = parseTerraformConfig(config);
  let output = '';

  // Provider block
  output += `terraform {\n`;
  output += `  required_version = ">= 1.0"\n`;
  if (validated.requiredProviders) {
    output += `  required_providers {\n`;
    for (const [name, provider] of Object.entries(validated.requiredProviders)) {
      output += `    ${name} = {\n`;
      output += `      source  = "${provider.source}"\n`;
      if (provider.version) {
        output += `      version = "${provider.version}"\n`;
      }
      output += `    }\n`;
    }
    output += `  }\n`;
  }
  if (validated.backend) {
    output += `  backend "${validated.backend.type}" {\n`;
    for (const [key, value] of Object.entries(validated.backend.config)) {
      output += `    ${key} = "${value}"\n`;
    }
    output += `  }\n`;
  }
  output += `}\n\n`;

  // Provider block
  output += `provider "${validated.provider}" {\n`;
  if (validated.region) {
    output += `  region = "${validated.region}"\n`;
  }
  output += `}\n\n`;

  // Variables
  if (validated.variables) {
    for (const variable of validated.variables) {
      output += `variable "${variable.name}" {\n`;
      if (variable.type) {
        output += `  type = ${variable.type}\n`;
      }
      if (variable.default !== undefined) {
        output += `  default = ${JSON.stringify(variable.default)}\n`;
      }
      if (variable.description) {
        output += `  description = "${variable.description}"\n`;
      }
      if (variable.sensitive) {
        output += `  sensitive = true\n`;
      }
      output += `}\n\n`;
    }
  }

  // Resources
  if (validated.resources) {
    for (const resource of validated.resources) {
      output += `resource "${resource.type}" "${resource.name}" {\n`;
      for (const [key, value] of Object.entries(resource.config)) {
        output += `  ${key} = ${JSON.stringify(value)}\n`;
      }
      if (resource.dependsOn) {
        output += `  depends_on = [${resource.dependsOn.map(d => `"${d}"`).join(', ')}]\n`;
      }
      output += `}\n\n`;
    }
  }

  // Outputs
  if (validated.outputs) {
    for (const outputDef of validated.outputs) {
      output += `output "${outputDef.name}" {\n`;
      output += `  value = ${JSON.stringify(outputDef.value)}\n`;
      if (outputDef.description) {
        output += `  description = "${outputDef.description}"\n`;
      }
      if (outputDef.sensitive) {
        output += `  sensitive = true\n`;
      }
      output += `}\n\n`;
    }
  }

  return output;
}

// =============================================================================
// CLOUDFORMATION GENERATION
// =============================================================================

/**
 * Generate CloudFormation template
 */
export function generateCloudFormation(config: CloudFormationConfig): string {
  const validated = parseCloudFormationConfig(config);
  const template: Record<string, unknown> = {
    AWSTemplateFormatVersion: '2010-09-09',
  };

  if (validated.description) {
    template.Description = validated.description;
  }

  if (validated.parameters) {
    template.Parameters = {};
    for (const [name, param] of Object.entries(validated.parameters)) {
      (template.Parameters as Record<string, unknown>)[name] = {
        Type: param.type,
        Default: param.default,
        Description: param.description,
        AllowedValues: param.allowedValues,
        NoEcho: param.noEcho,
      };
    }
  }

  if (validated.mappings) {
    template.Mappings = validated.mappings;
  }

  if (validated.conditions) {
    template.Conditions = validated.conditions;
  }

  template.Resources = {};
  for (const [name, resource] of Object.entries(validated.resources)) {
    (template.Resources as Record<string, unknown>)[name] = {
      Type: resource.type,
      Properties: resource.properties,
      DependsOn: resource.dependsOn,
      Condition: resource.condition,
      Metadata: resource.metadata,
    };
  }

  if (validated.outputs) {
    template.Outputs = {};
    for (const [name, output] of Object.entries(validated.outputs)) {
      (template.Outputs as Record<string, unknown>)[name] = {
        Value: output.value,
        Description: output.description,
        Export: output.export,
      };
    }
  }

  if (validated.transform) {
    template.Transform = validated.transform;
  }

  return JSON.stringify(template, null, 2);
}

// =============================================================================
// KUBERNETES GENERATION
// =============================================================================

/**
 * Generate Kubernetes manifest
 */
export function generateKubernetesManifest(config: KubernetesConfig): string {
  const validated = parseKubernetesConfig(config);
  const manifest: Record<string, unknown> = {
    apiVersion: validated.apiVersion,
    kind: validated.kind,
    metadata: validated.metadata,
    spec: validated.spec,
  };

  return JSON.stringify(manifest, null, 2);
}

// =============================================================================
// DOCKER GENERATION
// =============================================================================

/**
 * Generate Dockerfile
 */
export function generateDockerfile(config: DockerConfig): string {
  const validated = parseDockerConfig(config);
  let dockerfile = '';

  if (validated.multiStage && validated.stages) {
    // Multi-stage build
    for (const stage of validated.stages) {
      dockerfile += `FROM ${stage.baseImage} AS ${stage.name}\n`;
      for (const command of stage.commands) {
        dockerfile += `${command}\n`;
      }
      dockerfile += '\n';
    }
    dockerfile += `FROM ${validated.baseImage}\n`;
  } else {
    // Single stage
    dockerfile += `FROM ${validated.baseImage}\n`;
  }

  dockerfile += `WORKDIR ${validated.workDir}\n`;

  if (validated.copyFiles && validated.copyFiles.length > 0) {
    dockerfile += `COPY ${validated.copyFiles.join(' ')} ./\n`;
  }

  if (validated.installCommand) {
    dockerfile += `RUN ${validated.installCommand}\n`;
  }

  if (validated.copyApp) {
    dockerfile += `COPY ${validated.copyApp} ./\n`;
  }

  if (validated.buildCommand) {
    dockerfile += `RUN ${validated.buildCommand}\n`;
  }

  if (validated.envVars && validated.envVars.length > 0) {
    for (const env of validated.envVars) {
      dockerfile += `ENV ${env}\n`;
    }
  }

  if (validated.exposePort) {
    dockerfile += `EXPOSE ${validated.exposePort}\n`;
  }

  if (validated.healthCheck) {
    dockerfile += `HEALTHCHECK `;
    if (validated.healthCheck.interval) {
      dockerfile += `--interval=${validated.healthCheck.interval} `;
    }
    if (validated.healthCheck.timeout) {
      dockerfile += `--timeout=${validated.healthCheck.timeout} `;
    }
    if (validated.healthCheck.retries) {
      dockerfile += `--retries=${validated.healthCheck.retries} `;
    }
    dockerfile += `${validated.healthCheck.command.join(' ')}\n`;
  }

  if (validated.user) {
    dockerfile += `USER ${validated.user}\n`;
  }

  dockerfile += `CMD ${validated.startCommand}\n`;

  return dockerfile;
}

/**
 * Generate docker-compose.yml
 */
export function generateDockerCompose(config: DockerComposeConfig): string {
  const validated = parseDockerComposeConfig(config);
  return `version: "${validated.version}"\n\nservices:\n${Object.entries(validated.services)
    .map(([name, service]) => {
      let serviceYaml = `  ${name}:\n`;
      if (service.image) {
        serviceYaml += `    image: ${service.image}\n`;
      }
      if (service.build) {
        if (typeof service.build === 'string') {
          serviceYaml += `    build: ${service.build}\n`;
        } else {
          serviceYaml += `    build:\n`;
          serviceYaml += `      context: ${service.build.context}\n`;
          if (service.build.dockerfile) {
            serviceYaml += `      dockerfile: ${service.build.dockerfile}\n`;
          }
          if (service.build.args) {
            serviceYaml += `      args:\n`;
            for (const [key, value] of Object.entries(service.build.args)) {
              serviceYaml += `        ${key}: ${value}\n`;
            }
          }
        }
      }
      if (service.command) {
        serviceYaml += `    command: ${Array.isArray(service.command) ? JSON.stringify(service.command) : service.command}\n`;
      }
      if (service.ports) {
        serviceYaml += `    ports:\n`;
        for (const port of service.ports) {
          serviceYaml += `      - "${port}"\n`;
        }
      }
      if (service.environment) {
        serviceYaml += `    environment:\n`;
        if (Array.isArray(service.environment)) {
          for (const env of service.environment) {
            serviceYaml += `      - ${env}\n`;
          }
        } else {
          for (const [key, value] of Object.entries(service.environment)) {
            serviceYaml += `      - ${key}=${value}\n`;
          }
        }
      }
      if (service.volumes) {
        serviceYaml += `    volumes:\n`;
        for (const volume of service.volumes) {
          serviceYaml += `      - ${volume}\n`;
        }
      }
      if (service.dependsOn) {
        serviceYaml += `    depends_on:\n`;
        for (const dep of service.dependsOn) {
          serviceYaml += `      - ${dep}\n`;
        }
      }
      if (service.networks) {
        serviceYaml += `    networks:\n`;
        for (const network of service.networks) {
          serviceYaml += `      - ${network}\n`;
        }
      }
      if (service.restart) {
        serviceYaml += `    restart: ${service.restart}\n`;
      }
      if (service.healthcheck) {
        serviceYaml += `    healthcheck:\n`;
        serviceYaml += `      test: ${JSON.stringify(service.healthcheck.test)}\n`;
        if (service.healthcheck.interval) {
          serviceYaml += `      interval: ${service.healthcheck.interval}\n`;
        }
        if (service.healthcheck.timeout) {
          serviceYaml += `      timeout: ${service.healthcheck.timeout}\n`;
        }
        if (service.healthcheck.retries) {
          serviceYaml += `      retries: ${service.healthcheck.retries}\n`;
        }
      }
      return serviceYaml;
    })
    .join('\n')}${validated.networks ? `\nnetworks:\n${Object.entries(validated.networks)
    .map(([name, network]) => {
      let networkYaml = `  ${name}:\n`;
      if (network.driver) {
        networkYaml += `    driver: ${network.driver}\n`;
      }
      return networkYaml;
    })
    .join('\n')}` : ''}${validated.volumes ? `\nvolumes:\n${Object.entries(validated.volumes)
    .map(([name, volume]) => {
      let volumeYaml = `  ${name}:\n`;
      if (volume.driver) {
        volumeYaml += `    driver: ${volume.driver}\n`;
      }
      return volumeYaml;
    })
    .join('\n')}` : ''}`;
}

// =============================================================================
// ENVIRONMENT MANAGEMENT
// =============================================================================

/**
 * Validate environment configuration
 */
export function validateEnvironment(config: EnvironmentConfig): EnvironmentValidationResult {
  const validated = parseEnvironmentConfig(config);
  const missing: string[] = [];
  const invalid: Array<{ name: string; reason: string }> = [];

  // Check required variables
  if (validated.required) {
    for (const required of validated.required) {
      if (!validated.variables[required]) {
        missing.push(required);
      }
    }
  }

  // Validate variable values
  for (const [name, value] of Object.entries(validated.variables)) {
    if (value === '' || value === undefined) {
      invalid.push({ name, reason: 'Value is empty' });
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

/**
 * Get environment variables as process.env compatible object
 */
export function getEnvironmentVariables(config: EnvironmentConfig): Record<string, string> {
  const validated = parseEnvironmentConfig(config);
  return validated.variables;
}

// =============================================================================
// EXPORTS
// =============================================================================
// All schemas are exported inline where they are defined
