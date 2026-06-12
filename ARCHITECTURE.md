# Aether System Architecture

This document describes the architecture of the Aether system, including its components, data flows, deployment patterns, and technology stack.

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Agent System Architecture](#agent-system-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Technology Stack](#technology-stack)
- [Security Architecture](#security-architecture)
- [Scalability Patterns](#scalability-patterns)
- [Monitoring and Observability](#monitoring-and-observability)

## Overview

Aether is a monorepo-based system built on the ALPHA stack (Astro, Lambda, PostgreSQL, Hono, Astro). It follows a modular architecture with 205+ shared packages, multiple applications, and advanced agent systems.

### Architectural Principles

1. **Modularity**: Each package is independently versioned and testable
2. **Type Safety**: End-to-end TypeScript with shared Zod schemas
3. **Serverless**: Leverages Vercel and Cloudflare Workers for scalability
4. **Event-Driven**: Uses Cloudflare Queues for background processing
5. **Security-First**: Default-deny validation and comprehensive security measures
6. **Observability**: Built-in logging, metrics, and monitoring

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web Browser │  │  Mobile App  │  │  API Clients │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────┐
│                    Frontend Layer                            │
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
│  │  - Authentication (JWT)                               │    │
│  │  - Rate Limiting                                      │    │
│  │  - Request Routing                                   │    │
│  │  - CORS Handling                                      │    │
│  │  - Error Handling                                    │    │
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
```

## Component Architecture

### Frontend Applications

#### @aether/frontend
- **Framework**: React + Vite
- **Purpose**: Main user interface
- **Features**:
  - Component-based architecture
  - State management with React hooks
  - Type-safe API calls with shared contracts
  - Real-time updates via WebSocket

#### @aether/cockpit
- **Framework**: React + Vite
- **Purpose**: Administrative dashboard
- **Features**:
  - System monitoring
  - Metrics visualization
  - Log viewing
  - Configuration management

#### @aether/homebase
- **Framework**: React + Vite
- **Purpose**: Landing page and marketing
- **Features**:
  - Static content
  - SEO optimization
  - Fast loading with edge caching

### Backend Services

#### @aether/backend
- **Framework**: Express.js
- **Deployment**: Vercel (serverless functions)
- **Purpose**: Main API server
- **Features**:
  - RESTful API endpoints
  - Authentication middleware
  - Request validation with Zod
  - Error handling and logging

#### @aether/bridge
- **Framework**: Cloudflare Workers
- **Purpose**: External API integration
- **Features**:
  - Edge computing
  - API proxying
  - Request transformation
  - Rate limiting

#### @aether/api-gateway
- **Framework**: Express.js
- **Purpose**: API routing and middleware
- **Features**:
  - Request routing
  - Authentication
  - Rate limiting
  - CORS handling

### Worker Services

40+ background processing services including:

#### @aether/analytics-worker
- **Purpose**: Data processing and analytics
- **Trigger**: Queue events
- **Features**:
  - Data aggregation
  - Metric calculation
  - Report generation

#### @aether/notification-worker
- **Purpose**: Email and push notifications
- **Trigger**: Queue events
- **Features**:
  - Email sending
  - Push notifications
  - Notification templates

#### @aether/billing-worker
- **Purpose**: Subscription and payment processing
- **Trigger**: Queue events
- **Features**:
  - Subscription management
  - Payment processing
  - Invoice generation

#### @aether/backup-worker
- **Purpose**: Data backup and retention
- **Trigger**: Scheduled
- **Features**:
  - Database backups
  - File backups
  - Retention policies

### Agent System

#### @aether/executor
- **Purpose**: Tool execution agent
- **Features**:
  - MCP tool registry
  - File operations
  - API calls
  - Git operations

#### @aether/evaluator
- **Purpose**: Response evaluation agent
- **Features**:
  - Quality assessment
  - Validation
  - Scoring

#### @aether/curator
- **Purpose**: Default-deny security gate
- **Features**:
  - Allow-list validation
  - Rate limiting
  - Action filtering

### Shared Packages

#### @aether/contracts
- **Purpose**: Shared Zod schemas
- **Content**:
  - API request/response schemas
  - Component schemas
  - Validation schemas

#### @aether/logger
- **Purpose**: Structured logging
- **Features**:
  - Multiple transports
  - Log levels
  - Structured output

#### @aether/cache
- **Purpose**: Caching layer
- **Features**:
  - Multi-layer caching
  - TTL support
  - LRU eviction
  - Distributed support

#### @aether/metrics
- **Purpose**: Metrics collection
- **Features**:
  - Counter, gauge, histogram
  - Prometheus export
  - Custom metrics

## Data Flow

### Request Flow

```
1. User Request
   ↓
2. Frontend (React)
   ↓
3. API Gateway (Express)
   - Authentication
   - Rate Limiting
   - Validation
   ↓
4. Backend Service
   - Business Logic
   - Data Access
   ↓
5. Database/External APIs
   ↓
6. Response
   ↓
7. API Gateway
   - Transformation
   ↓
8. Frontend
   ↓
9. User
```

### Event Flow

```
1. Event Triggered
   ↓
2. Queue (Cloudflare)
   ↓
3. Worker picks up event
   ↓
4. Worker processes event
   ↓
5. Result stored in KV/Database
   ↓
6. Notification sent (if needed)
   ↓
7. Event acknowledged
```

### Agent Flow

```
1. User Request
   ↓
2. Curator (validation)
   - Check allow-list
   - Rate limit check
   ↓
3a. Approved → Executor
   - Tool execution
   - File operations
   - API calls
   ↓
4. Evaluator
   - Quality check
   - Validation
   ↓
5. Response → User

3b. Rejected → 422 Error
   - Reason provided
   - User notified
```

## Agent System Architecture

### Two-Agent System

```
User Request
    ↓
Curator (Security Gate)
    ↓
    ├─→ Approved → Executor → Tools → Ledger
    │                           ↓
    │                      Evaluator
    │                           ↓
    │                      Response
    │
    └─→ Rejected → 422 Error
```

### Components

#### Curator
- **Location**: `packages/curator`
- **Purpose**: Default-deny security gate
- **Validation**:
  - Allow-list: `['stat', 'chart', 'list', 'status', 'gauge']`
  - Rate limit: max 10 actions per response
  - Returns 422 on denial

#### Executor
- **Location**: `apps/backend/src/agents/executor.ts`
- **Purpose**: Tool execution
- **Tools**:
  - `file_read` - Read files
  - `file_write` - Write files
  - `git_status` - Git status
  - `git_commit` - Git commit
  - `http_request` - HTTP requests (GET/HEAD)

#### Evaluator
- **Location**: `apps/backend/src/agents/evaluator.ts`
- **Purpose**: Quality assessment
- **Features**:
  - Response validation
  - Quality scoring
  - Pattern matching

#### Ledger
- **Purpose**: Agent communication and state
- **Features**:
  - Pattern suggestions
  - State tracking
  - History

## Deployment Architecture

### Vercel Deployment

#### Backend
- **Type**: Serverless functions
- **Regions**: Global edge network
- **Scaling**: Automatic
- **Environment Variables**:
  - `GEMINI_API_KEY`
  - `ALLOW_DEGRADED=1`
  - `NODE_ENV=production`

#### Frontend
- **Type**: Static site with edge caching
- **Regions**: Global edge network
- **CDN**: Vercel Edge Network
- **Build**: Static HTML/CSS/JS

### Cloudflare Workers Deployment

#### Bridge Worker
- **Type**: Edge worker
- **Regions**: Global edge network
- **Scaling**: Automatic
- **Deployment**: CI/CD only

#### Workers
- **Type**: Event-driven workers
- **Triggers**: Queue events
- **Scaling**: Automatic
- **Deployment**: CI/CD only

### Infrastructure

#### Database
- **Type**: PostgreSQL
- **Deployment**: Managed service
- **Backups**: Automated
- **Replication**: Multi-region

#### Cache
- **Type**: Cloudflare KV
- **Deployment**: Global edge
- **TTL**: Configurable
- **Replication**: Automatic

#### Queues
- **Type**: Cloudflare Queues
- **Deployment**: Global edge
- **Retention**: Configurable
- **Delivery**: At-least-once

#### CDN
- **Type**: Cloudflare
- **Coverage**: Global
- **Caching**: Smart caching
- **DDoS Protection**: Built-in

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | Latest |
| Vite | Build Tool | Latest |
| TypeScript | Type Safety | 5.3+ |
| Zod | Validation | Latest |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| Express.js | API Framework | Latest |
| TypeScript | Type Safety | 5.3+ |
| Zod | Validation | Latest |
| Node.js | Runtime | 18.0+ |

### Cloudflare Workers

| Technology | Purpose | Version |
|------------|---------|---------|
| Workers Runtime | Edge Compute | Latest |
| KV | Key-Value Store | Latest |
| Queues | Message Queuing | Latest |

### Database

| Technology | Purpose | Version |
|------------|---------|---------|
| PostgreSQL | Relational Database | Latest |
| Prisma | ORM | Latest |

### Build Tools

| Technology | Purpose | Version |
|------------|---------|---------|
| Turborepo | Monorepo Build | 2.9+ |
| npm | Package Manager | 10.9+ |
| TypeScript | Compiler | 5.3+ |

### Testing

| Technology | Purpose | Version |
|------------|---------|---------|
| Vitest | Test Runner | Latest |
| TypeScript | Type Checking | 5.3+ |

### Monitoring

| Technology | Purpose | Version |
|------------|---------|---------|
| Custom Metrics | Metrics Collection | Internal |
| Structured Logging | Log Aggregation | Internal |

## Security Architecture

### Authentication

- **Method**: JWT (JSON Web Tokens)
- **Implementation**: Middleware in API Gateway
- **Token Storage**: HttpOnly cookies
- **Refresh**: Token rotation

### Authorization

- **Method**: Role-based access control (RBAC)
- **Implementation**: Middleware in API Gateway
- **Roles**: Admin, User, Guest
- **Permissions**: Fine-grained

### Input Validation

- **Method**: Zod schemas
- **Location**: @aether/contracts
- **Scope**: All API endpoints
- **Validation**: Request and response

### Rate Limiting

- **Method**: Token bucket algorithm
- **Implementation**: Middleware in API Gateway
- **Limits**: Per endpoint, per user
- **Storage**: Redis/KV

### Security Headers

- **CORS**: Configured per origin
- **CSP**: Content Security Policy
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Clickjacking protection

### Curator Security

- **Method**: Default-deny allow-list
- **Scope**: Generated UI components
- **Validation**: Component types, actions
- **Rate Limit**: Max 10 actions per response

## Scalability Patterns

### Horizontal Scaling

- **Frontend**: Edge CDN (Vercel)
- **Backend**: Serverless functions (Vercel)
- **Workers**: Cloudflare Workers
- **Database**: Read replicas

### Vertical Scaling

- **Database**: Connection pooling
- **Cache**: Multi-layer caching
- **Queue**: Batch processing

### Caching Strategy

- **Level 1**: Browser cache
- **Level 2**: Edge cache (CDN)
- **Level 3**: Application cache (KV)
- **Level 4**: Database cache

### Load Balancing

- **Frontend**: CDN edge locations
- **Backend**: Vercel automatic scaling
- **Workers**: Cloudflare automatic scaling

## Monitoring and Observability

### Logging

- **Format**: Structured JSON
- **Levels**: Debug, Info, Warn, Error
- **Transports**: Console, File, External
- **Aggregation**: Centralized log viewer

### Metrics

- **Types**: Counter, Gauge, Histogram
- **Collection**: Custom metrics package
- **Export**: Prometheus-compatible
- **Visualization**: Dashboard

### Tracing

- **Method**: Distributed tracing
- **Scope**: Request lifecycle
- **Correlation**: Request IDs
- **Storage**: External service

### Health Checks

- **Endpoints**: `/health`, `/ready`
- **Checks**: Database, cache, external services
- **Frequency**: Configurable
- **Alerting**: On failure

### Alerting

- **Channels**: Email, Slack, PagerDuty
- **Triggers**: Metrics thresholds, error rates
- **Escalation**: Configurable rules
- **Incidents**: Automated creation

---

For more information, see:
- [README.md](./README.md) - Project overview
- [API.md](./API.md) - API documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](./SECURITY.md) - Security guidelines
