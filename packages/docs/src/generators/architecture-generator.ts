/**
 * Architecture Documentation Generator
 *
 * Generates system architecture documentation and diagrams
 */

import * as path from 'path';
import { FileUtils } from '../utils/file-utils';
import { FormatUtils } from '../utils/format-utils';
import { ArchitectureConfig, DocOutput } from '../types/index';

export class ArchitectureGenerator {
  private config: ArchitectureConfig;

  constructor(config: ArchitectureConfig) {
    this.config = config;
  }

  /**
   * Generate architecture documentation
   */
  async generate(): Promise<DocOutput[]> {
    const outputs: DocOutput[] = [];

    const markdown = this.generateMarkdown();
    const outputPath = path.join(this.config.outputDir, 'ARCHITECTURE.md');

    await FileUtils.writeFile(outputPath, markdown);

    outputs.push({
      path: outputPath,
      content: markdown,
      type: 'architecture',
      metadata: {
        generatedAt: new Date(),
        generatorVersion: '1.0.0',
        sourceFiles: [],
        itemCount: 1,
      },
    });

    return outputs;
  }

  /**
   * Generate markdown documentation
   */
  private generateMarkdown(): string {
    let markdown = '';

    markdown += FormatUtils.heading('Aether System Architecture', 1);
    markdown += this.generateOverview();
    markdown += this.generateHighLevelArchitecture();
    markdown += this.generateComponentDiagram();
    markdown += this.generateDataFlow();
    markdown += this.generateDeploymentArchitecture();
    markdown += this.generateTechnologyStack();

    return markdown;
  }

  /**
   * Generate overview section
   */
  private generateOverview(): string {
    let markdown = '';

    markdown += FormatUtils.heading('Overview', 2);
    markdown += `
Aether is a monorepo-based system built on the ALPHA stack (Astro, Lambda, PostgreSQL, Hono, Astro).
It consists of multiple applications and shared packages organized as npm workspaces.

## Key Principles

- **Modularity**: Each package is independently versioned and testable
- **Scalability**: Cloudflare Workers and Vercel for serverless deployment
- **Type Safety**: TypeScript throughout with shared Zod schemas
- **Security**: Default-deny curator for generated UI validation
- **Observability**: Comprehensive logging, metrics, and monitoring

`;

    return markdown;
  }

  /**
   * Generate high-level architecture
   */
  private generateHighLevelArchitecture(): string {
    let markdown = '';

    markdown += FormatUtils.heading('High-Level Architecture', 2);
    markdown += `
\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Frontend    │  │  Cockpit     │  │  Homebase    │     │
│  │  (Vite/React)│  │  (Dashboard) │  │  (Landing)   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────┐
│                    API Gateway Layer                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              API Gateway (Express)                    │    │
│  │  - Authentication                                     │    │
│  │  - Rate Limiting                                     │    │
│  │  - Request Routing                                   │    │
│  └──────────────────────┬───────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Backend  │  │  Bridge  │  │ Workers  │  │ Agents   │    │
│  │ (Vercel) │  │ (CF)     │  │ (CF)     │  │ (LLM)    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
┌───────┼─────────────┼─────────────┼─────────────┼───────────┐
│       │     ┌───────┴───────┐     │             │           │
│  ┌────┴────┐  │  Data Layer  │  ┌────┴────┐    │           │
│  │  KV     │  │              │  │  Queue  │    │           │
│  │ Store   │  │  PostgreSQL  │  │  Store  │    │           │
│  └─────────┘  │              │  └─────────┘    │           │
│               └──────────────┘                 │           │
│                                               ┌──┴────┐     │
│                                               │ LLM   │     │
│                                               │ APIs  │     │
│                                               └───────┘     │
└─────────────────────────────────────────────────────────────┘
\`\`\`

`;

    return markdown;
  }

  /**
   * Generate component diagram
   */
  private generateComponentDiagram(): string {
    let markdown = '';

    markdown += FormatUtils.heading('Component Architecture', 2);
    markdown += `
### Core Components

#### Frontend Applications
- **@aether/frontend**: Main React application (Vite)
- **@aether/cockpit**: Dashboard and monitoring interface
- **@aether/homebase**: Landing page and marketing site

#### Backend Services
- **@aether/backend**: Main Express API (Vercel)
- **@aether/bridge**: Cloudflare Worker for external integrations
- **@aether/api-gateway**: API routing and middleware

#### Worker Services
- **@aether/analytics-worker**: Data processing and analytics
- **@aether/notification-worker**: Email and push notifications
- **@aether/billing-worker**: Subscription and payment processing
- **@aether/backup-worker**: Data backup and retention

#### Agent System
- **@aether/executor**: Tool execution agent
- **@aether/evaluator**: Response evaluation agent
- **@aether/curator**: Default-deny security gate

#### Shared Packages
- **@aether/contracts**: Shared Zod schemas
- **@aether/logger**: Logging utilities
- **@aether/cache**: Caching layer
- **@aether/metrics**: Metrics collection

`;

    return markdown;
  }

  /**
   * Generate data flow documentation
   */
  private generateDataFlow(): string {
    let markdown = '';

    markdown += FormatUtils.heading('Data Flow', 2);
    markdown += `
### Request Flow

1. **User Request** → Frontend
2. **Frontend** → API Gateway (authentication, rate limiting)
3. **API Gateway** → Backend Service
4. **Backend** → Database/External APIs
5. **Response** → API Gateway → Frontend

### Event Flow

1. **Event Triggered** → Queue
2. **Worker** picks up event
3. **Worker** processes event
4. **Result** stored in KV/Database
5. **Notification** sent if needed

### Agent Flow

1. **User Request** → Curator (validation)
2. **Curator** → Executor (if approved)
3. **Executor** → Tools (file operations, API calls)
4. **Evaluator** → Quality check
5. **Response** → User

`;

    return markdown;
  }

  /**
   * Generate deployment architecture
   */
  private generateDeploymentArchitecture(): string {
    let markdown = '';

    markdown += FormatUtils.heading('Deployment Architecture', 2);
    markdown += `
### Vercel Deployment

- **Backend**: Deployed as serverless functions
- **Frontend**: Static site with edge caching
- **Environment Variables**: Managed via Vercel dashboard

### Cloudflare Workers

- **Bridge Worker**: External API integration
- **Workers**: Event-driven background processing
- **KV Store**: Fast key-value storage
- **Queues**: Reliable message delivery

### Infrastructure

- **Database**: PostgreSQL (managed service)
- **CDN**: Cloudflare for static assets
- **Monitoring**: Custom metrics and logging
- **CI/CD**: GitHub Actions

`;

    return markdown;
  }

  /**
   * Generate technology stack
   */
  private generateTechnologyStack(): string {
    let markdown = '';

    markdown += FormatUtils.heading('Technology Stack', 2);
    markdown += FormatUtils.table(
      ['Layer', 'Technology', 'Purpose'],
      [
        ['Frontend', 'React + Vite', 'UI framework and build tool'],
        ['Frontend', 'TypeScript', 'Type safety'],
        ['Backend', 'Express.js', 'API framework'],
        ['Backend', 'Cloudflare Workers', 'Serverless compute'],
        ['Database', 'PostgreSQL', 'Relational database'],
        ['Cache', 'Cloudflare KV', 'Key-value storage'],
        ['Queues', 'Cloudflare Queues', 'Message queuing'],
        ['Validation', 'Zod', 'Schema validation'],
        ['Build', 'Turborepo', 'Monorepo build system'],
        ['Deployment', 'Vercel', 'Frontend and backend hosting'],
        ['Monitoring', 'Custom', 'Metrics and logging'],
        ['AI', 'Gemini API', 'LLM integration'],
      ]
    );

    return markdown;
  }
}
