# @aether/infrastructure

Infrastructure as Code package for the Aether monorepo. Provides Terraform templates, CloudFormation templates, Kubernetes manifests, Docker configuration, and environment management with full TypeScript type safety and Zod validation.

## Features

- **Terraform Templates**: Pre-configured Terraform modules for common infrastructure patterns
- **CloudFormation Templates**: AWS CloudFormation stack templates and configuration
- **Kubernetes Manifests**: Kubernetes deployment, service, and ingress manifests
- **Docker Configuration**: Dockerfile templates and Docker Compose configurations
- **Environment Management**: Environment variable management and validation
- **Type Safety**: Full TypeScript types for all infrastructure configurations
- **Runtime Validation**: Zod schemas for validating infrastructure configurations

## Installation

```bash
npm install @aether/infrastructure
```

## Usage

### Terraform Configuration

```typescript
import { TerraformConfig, generateTerraform } from '@aether/infrastructure';

const terraformConfig: TerraformConfig = {
  provider: 'aws',
  region: 'us-east-1',
  resources: [
    {
      type: 'aws_instance',
      name: 'web_server',
      config: {
        ami: 'ami-12345678',
        instance_type: 't2.micro',
      },
    },
  ],
};

const terraformCode = generateTerraform(terraformConfig);
```

### CloudFormation Templates

```typescript
import { CloudFormationConfig, generateCloudFormation } from '@aether/infrastructure';

const cfConfig: CloudFormationConfig = {
  description: 'Web server stack',
  parameters: {
    InstanceType: {
      type: 'String',
      default: 't2.micro',
    },
  },
  resources: [
    {
      type: 'AWS::EC2::Instance',
      properties: {
        InstanceType: { Ref: 'InstanceType' },
        ImageId: 'ami-12345678',
      },
    },
  ],
};

const template = generateCloudFormation(cfConfig);
```

### Kubernetes Manifests

```typescript
import { KubernetesConfig, generateKubernetesManifest } from '@aether/infrastructure';

const k8sConfig: KubernetesConfig = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'web-app',
    namespace: 'default',
  },
  spec: {
    replicas: 3,
    selector: {
      matchLabels: { app: 'web' },
    },
    template: {
      metadata: { labels: { app: 'web' } },
      spec: {
        containers: [
          {
            name: 'web',
            image: 'nginx:latest',
            ports: [{ containerPort: 80 }],
          },
        ],
      },
    },
  },
};

const manifest = generateKubernetesManifest(k8sConfig);
```

### Docker Configuration

```typescript
import { DockerConfig, generateDockerfile } from '@aether/infrastructure';

const dockerConfig: DockerConfig = {
  baseImage: 'node:18-alpine',
  workDir: '/app',
  copyFiles: ['package.json', 'package-lock.json'],
  installCommand: 'npm ci --only=production',
  copyApp: '.',
  buildCommand: 'npm run build',
  exposePort: 3000,
  startCommand: 'node dist/index.js',
};

const dockerfile = generateDockerfile(dockerConfig);
```

### Environment Management

```typescript
import { EnvironmentConfig, validateEnvironment } from '@aether/infrastructure';

const envConfig: EnvironmentConfig = {
  name: 'production',
  variables: {
    NODE_ENV: 'production',
    API_URL: 'https://api.example.com',
    DATABASE_URL: 'postgresql://...',
  },
  required: ['NODE_ENV', 'DATABASE_URL'],
};

const validated = validateEnvironment(envConfig);
```

## API Reference

### Types

- `TerraformConfig` - Configuration for Terraform templates
- `CloudFormationConfig` - Configuration for CloudFormation templates
- `KubernetesConfig` - Configuration for Kubernetes manifests
- `DockerConfig` - Configuration for Dockerfile generation
- `EnvironmentConfig` - Configuration for environment management
- `InfrastructureResult` - Result of infrastructure generation

### Functions

- `generateTerraform(config: TerraformConfig)` - Generate Terraform configuration
- `generateCloudFormation(config: CloudFormationConfig)` - Generate CloudFormation template
- `generateKubernetesManifest(config: KubernetesConfig)` - Generate Kubernetes manifest
- `generateDockerfile(config: DockerConfig)` - Generate Dockerfile
- `generateDockerCompose(config: DockerComposeConfig)` - Generate docker-compose.yml
- `validateEnvironment(config: EnvironmentConfig)` - Validate environment configuration

## Validation

All configurations are validated using Zod schemas at runtime:

```typescript
import { TerraformConfigSchema } from '@aether/infrastructure';

const result = TerraformConfigSchema.safeParse(terraformConfig);
if (!result.success) {
  console.error('Invalid terraform config:', result.error);
}
```

## Testing

```bash
npm run test
```

## License

MIT
