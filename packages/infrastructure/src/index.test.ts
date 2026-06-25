/**
 * Tests for @aether/infrastructure
 */

import { describe, it, expect } from 'vitest';
import {
  TerraformConfigSchema,
  TerraformVariableSchema,
  CloudFormationConfigSchema,
  CloudFormationParameterSchema,
  KubernetesConfigSchema,
  KubernetesMetadataSchema,
  DockerConfigSchema,
  DockerComposeConfigSchema,
  DockerComposeServiceSchema,
  EnvironmentConfigSchema,
  EnvironmentVariableSchema,
  parseTerraformConfig,
  parseCloudFormationConfig,
  parseKubernetesConfig,
  parseDockerConfig,
  parseDockerComposeConfig,
  parseEnvironmentConfig,
  generateTerraform,
  generateCloudFormation,
  generateKubernetesManifest,
  generateDockerfile,
  generateDockerCompose,
  validateEnvironment,
  getEnvironmentVariables,
  type TerraformConfig,
  type CloudFormationConfig,
  type KubernetesConfig,
  type DockerConfig,
  type DockerComposeConfig,
  type EnvironmentConfig,
} from './index';

describe('TerraformConfigSchema', () => {
  it('parses a valid terraform configuration', () => {
    const valid: TerraformConfig = {
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

    const result = TerraformConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider).toBe('aws');
      expect(result.data.region).toBe('us-east-1');
    }
  });

  it('rejects terraform without provider', () => {
    const invalid = {
      region: 'us-east-1',
    };

    const result = TerraformConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('parses terraform with variables', () => {
    const valid: TerraformConfig = {
      provider: 'aws',
      region: 'us-east-1',
      variables: [
        {
          name: 'instance_type',
          type: 'string',
          default: 't2.micro',
          description: 'EC2 instance type',
          sensitive: false,
        },
      ],
    };

    const result = TerraformConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variables).toHaveLength(1);
    }
  });
});

describe('CloudFormationConfigSchema', () => {
  it('parses a valid cloudformation configuration', () => {
    const valid: CloudFormationConfig = {
      description: 'Web server stack',
      resources: {
        WebServer: {
          type: 'AWS::EC2::Instance',
          properties: {
            ImageId: 'ami-12345678',
            InstanceType: 't2.micro',
          },
        },
      },
    };

    const result = CloudFormationConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Web server stack');
    }
  });

  it('rejects cloudformation without resources', () => {
    const invalid = {
      description: 'Test stack',
    };

    const result = CloudFormationConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('parses cloudformation with parameters', () => {
    const valid: CloudFormationConfig = {
      description: 'Web server stack',
      parameters: {
        InstanceType: {
          name: 'InstanceType',
          type: 'String',
          default: 't2.micro',
          description: 'EC2 instance type',
          noEcho: false,
        },
      },
      resources: {
        WebServer: {
          type: 'AWS::EC2::Instance',
          properties: {
            ImageId: 'ami-12345678',
            InstanceType: { Ref: 'InstanceType' },
          },
        },
      },
    };

    const result = CloudFormationConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parameters).toBeDefined();
    }
  });
});

describe('KubernetesConfigSchema', () => {
  it('parses a valid kubernetes deployment configuration', () => {
    const valid: KubernetesConfig = {
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

    const result = KubernetesConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe('Deployment');
    }
  });

  it('rejects kubernetes without apiVersion', () => {
    const invalid = {
      kind: 'Deployment',
      metadata: { name: 'test' },
      spec: {},
    };

    const result = KubernetesConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('parses kubernetes service configuration', () => {
    const valid: KubernetesConfig = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: 'web-service',
        namespace: 'default',
      },
      spec: {
        type: 'ClusterIP',
        selector: { app: 'web' },
        ports: [
          {
            port: 80,
            targetPort: 8080,
          },
        ],
      },
    };

    const result = KubernetesConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe('Service');
    }
  });
});

describe('DockerConfigSchema', () => {
  it('parses a valid docker configuration', () => {
    const valid: DockerConfig = {
      baseImage: 'node:18-alpine',
      workDir: '/app',
      copyFiles: ['package.json'],
      installCommand: 'npm ci --only=production',
      multiStage: false,
      copyApp: '.',
      buildCommand: 'npm run build',
      exposePort: 3000,
      startCommand: 'node dist/index.js',
    };

    const result = DockerConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.baseImage).toBe('node:18-alpine');
    }
  });

  it('rejects docker without baseImage', () => {
    const invalid = {
      startCommand: 'node index.js',
    };

    const result = DockerConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects docker without startCommand', () => {
    const invalid = {
      baseImage: 'node:18-alpine',
    };

    const result = DockerConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default workDir', () => {
    const partial = {
      baseImage: 'node:18-alpine',
      startCommand: 'node index.js',
    };

    const result = DockerConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workDir).toBe('/app');
    }
  });

  it('parses a valid docker configuration with multiStage: false', () => {
    const valid = {
      baseImage: 'node:18-alpine',
      workDir: '/app',
      copyFiles: ['package.json'],
      installCommand: 'npm ci --only=production',
      copyApp: '.',
      buildCommand: 'npm run build',
      exposePort: 3000,
      startCommand: 'node dist/index.js',
      multiStage: false,
    };

    const result = DockerConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.multiStage).toBe(false);
    }
  });

  it('applies default multiStage: false', () => {
    const partial = {
      baseImage: 'node:18-alpine',
      startCommand: 'node index.js',
    };

    const result = DockerConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.multiStage).toBe(false);
    }
  });
});

describe('DockerComposeConfigSchema', () => {
  it('parses a valid docker-compose configuration', () => {
    const valid: DockerComposeConfig = {
      version: '3.8',
      services: {
        web: {
          image: 'nginx:latest',
          ports: ['80:80'],
          restart: 'always',
        },
        db: {
          image: 'postgres:13',
          environment: ['POSTGRES_PASSWORD=secret'],
          restart: 'always',
        },
      },
    };

    const result = DockerComposeConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.services).toBeDefined();
      expect(Object.keys(result.data.services)).toHaveLength(2);
    }
  });

  it('rejects docker-compose without services', () => {
    const invalid = {
      version: '3.8',
    };

    const result = DockerComposeConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('applies default version', () => {
    const partial = {
      services: {
        web: {
          image: 'nginx:latest',
        },
      },
    };

    const result = DockerComposeConfigSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe('3.8');
    }
  });

  it('parses a valid docker-compose service with restart: "always"', () => {
    const valid = {
      image: 'nginx:latest',
      ports: ['80:80'],
      restart: 'always' as const,
    };

    const result = DockerComposeServiceSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.restart).toBe('always');
    }
  });

  it('applies default restart: "unless-stopped" for docker-compose service', () => {
    const partial = {
      image: 'nginx:latest',
    };

    const result = DockerComposeServiceSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.restart).toBe('unless-stopped');
    }
  });
});

describe('EnvironmentConfigSchema', () => {
  it('parses a valid environment configuration', () => {
    const valid: EnvironmentConfig = {
      name: 'production',
      variables: {
        NODE_ENV: 'production',
        API_URL: 'https://api.example.com',
      },
      required: ['NODE_ENV'],
    };

    const result = EnvironmentConfigSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('production');
    }
  });

  it('rejects environment without name', () => {
    const invalid = {
      variables: {},
    };

    const result = EnvironmentConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects environment without variables', () => {
    const invalid = {
      name: 'production',
    };

    const result = EnvironmentConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('TerraformVariableSchema', () => {
  it('parses a valid terraform variable with sensitive: false', () => {
    const valid = {
      name: 'instance_type',
      type: 'string',
      default: 't2.micro',
      description: 'EC2 instance type',
      sensitive: false,
    };

    const result = TerraformVariableSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sensitive).toBe(false);
    }
  });

  it('applies default sensitive: false', () => {
    const partial = {
      name: 'instance_type',
      type: 'string',
    };

    const result = TerraformVariableSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sensitive).toBe(false);
    }
  });
});

describe('CloudFormationParameterSchema', () => {
  it('parses a valid cloudformation parameter with name and noEcho: false', () => {
    const valid = {
      name: 'InstanceType',
      type: 'String',
      default: 't2.micro',
      description: 'EC2 instance type',
      noEcho: false,
    };

    const result = CloudFormationParameterSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('InstanceType');
      expect(result.data.noEcho).toBe(false);
    }
  });

  it('applies default noEcho: false', () => {
    const partial = {
      name: 'InstanceType',
      type: 'String',
    };

    const result = CloudFormationParameterSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.noEcho).toBe(false);
    }
  });
});

describe('KubernetesMetadataSchema', () => {
  it('parses a valid kubernetes metadata with namespace: "default"', () => {
    const valid = {
      name: 'web-app',
      namespace: 'default',
    };

    const result = KubernetesMetadataSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('web-app');
      expect(result.data.namespace).toBe('default');
    }
  });

  it('applies default namespace: "default"', () => {
    const partial = {
      name: 'web-app',
    };

    const result = KubernetesMetadataSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.namespace).toBe('default');
    }
  });
});

describe('EnvironmentVariableSchema', () => {
  it('parses a valid environment variable with secret: false', () => {
    const valid = {
      name: 'API_URL',
      value: 'https://api.example.com',
      required: true,
      secret: false,
    };

    const result = EnvironmentVariableSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.secret).toBe(false);
    }
  });

  it('applies default secret: false', () => {
    const partial = {
      name: 'API_URL',
      value: 'https://api.example.com',
    };

    const result = EnvironmentVariableSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.secret).toBe(false);
    }
  });
});

describe('Validator Functions', () => {
  it('parseTerraformConfig throws on invalid data', () => {
    expect(() => parseTerraformConfig({})).toThrow();
  });

  it('parseTerraformConfig returns parsed data on success', () => {
    const input = {
      provider: 'aws',
      region: 'us-east-1',
    };
    const result = parseTerraformConfig(input);
    expect(result.provider).toBe('aws');
  });

  it('parseCloudFormationConfig throws on invalid data', () => {
    expect(() => parseCloudFormationConfig({})).toThrow();
  });

  it('parseKubernetesConfig throws on invalid data', () => {
    expect(() => parseKubernetesConfig({})).toThrow();
  });

  it('parseDockerConfig throws on invalid data', () => {
    expect(() => parseDockerConfig({})).toThrow();
  });

  it('parseDockerComposeConfig throws on invalid data', () => {
    expect(() => parseDockerComposeConfig({})).toThrow();
  });

  it('parseEnvironmentConfig throws on invalid data', () => {
    expect(() => parseEnvironmentConfig({})).toThrow();
  });
});

describe('generateTerraform', () => {
  it('generates terraform configuration', () => {
    const config: TerraformConfig = {
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

    const output = generateTerraform(config);
    expect(output).toContain('terraform');
    expect(output).toContain('provider "aws"');
    expect(output).toContain('region = "us-east-1"');
    expect(output).toContain('resource "aws_instance" "web_server"');
  });

  it('validates config before generation', () => {
    const invalid = {} as TerraformConfig;
    expect(() => generateTerraform(invalid)).toThrow();
  });
});

describe('generateCloudFormation', () => {
  it('generates cloudformation template', () => {
    const config: CloudFormationConfig = {
      description: 'Web server stack',
      resources: {
        WebServer: {
          type: 'AWS::EC2::Instance',
          properties: {
            ImageId: 'ami-12345678',
            InstanceType: 't2.micro',
          },
        },
      },
    };

    const output = generateCloudFormation(config);
    const parsed = JSON.parse(output);
    expect(parsed.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(parsed.Description).toBe('Web server stack');
    expect(parsed.Resources).toBeDefined();
  });

  it('validates config before generation', () => {
    const invalid = {} as CloudFormationConfig;
    expect(() => generateCloudFormation(invalid)).toThrow();
  });
});

describe('generateKubernetesManifest', () => {
  it('generates kubernetes manifest', () => {
    const config: KubernetesConfig = {
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
              },
            ],
          },
        },
      },
    };

    const output = generateKubernetesManifest(config);
    const parsed = JSON.parse(output);
    expect(parsed.apiVersion).toBe('apps/v1');
    expect(parsed.kind).toBe('Deployment');
    expect(parsed.metadata.name).toBe('web-app');
  });

  it('validates config before generation', () => {
    const invalid = {} as KubernetesConfig;
    expect(() => generateKubernetesManifest(invalid)).toThrow();
  });
});

describe('generateDockerfile', () => {
  it('generates dockerfile', () => {
    const config: DockerConfig = {
      baseImage: 'node:18-alpine',
      workDir: '/app',
      copyFiles: ['package.json'],
      installCommand: 'npm ci',
      copyApp: '.',
      exposePort: 3000,
      startCommand: 'node index.js',
      multiStage: false,
    };

    const output = generateDockerfile(config);
    expect(output).toContain('FROM node:18-alpine');
    expect(output).toContain('WORKDIR /app');
    expect(output).toContain('COPY package.json');
    expect(output).toContain('RUN npm ci');
    expect(output).toContain('EXPOSE 3000');
    expect(output).toContain('CMD node index.js');
  });

  it('validates config before generation', () => {
    const invalid = {} as DockerConfig;
    expect(() => generateDockerfile(invalid)).toThrow();
  });
});

describe('generateDockerCompose', () => {
  it('generates docker-compose.yml', () => {
    const config: DockerComposeConfig = {
      services: {
        web: {
          image: 'nginx:latest',
          ports: ['80:80'],
          restart: 'always' as const,
        },
      },
    };

    const output = generateDockerCompose(config);
    expect(output).toContain('version:');
    expect(output).toContain('services:');
    expect(output).toContain('web:');
    expect(output).toContain('image: nginx:latest');
    expect(output).toContain('ports:');
  });

  it('validates config before generation', () => {
    const invalid = {} as DockerComposeConfig;
    expect(() => generateDockerCompose(invalid)).toThrow();
  });
});

describe('validateEnvironment', () => {
  it('validates environment with all required variables', () => {
    const config: EnvironmentConfig = {
      name: 'production',
      variables: {
        NODE_ENV: 'production',
        API_URL: 'https://api.example.com',
      },
      required: ['NODE_ENV', 'API_URL'],
    };

    const result = validateEnvironment(config);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
  });

  it('detects missing required variables', () => {
    const config: EnvironmentConfig = {
      name: 'production',
      variables: {
        NODE_ENV: 'production',
      },
      required: ['NODE_ENV', 'API_URL'],
    };

    const result = validateEnvironment(config);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('API_URL');
  });

  it('validates config before validation', () => {
    const invalid = {} as EnvironmentConfig;
    expect(() => validateEnvironment(invalid)).toThrow();
  });
});

describe('getEnvironmentVariables', () => {
  it('returns environment variables as object', () => {
    const config: EnvironmentConfig = {
      name: 'production',
      variables: {
        NODE_ENV: 'production',
        API_URL: 'https://api.example.com',
      },
    };

    const result = getEnvironmentVariables(config);
    expect(result.NODE_ENV).toBe('production');
    expect(result.API_URL).toBe('https://api.example.com');
  });

  it('validates config before retrieval', () => {
    const invalid = {} as EnvironmentConfig;
    expect(() => getEnvironmentVariables(invalid)).toThrow();
  });
});
