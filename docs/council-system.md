# Council System

## Overview

The Council is a multi-agent deliberation system that evaluates proposals, generates lessons, and coordinates decisions across the AtoMind platform.

## Architecture

```
Notion (SSOT) → Bridge Worker → Council Package → Decisions
                    ↓
              Proposals → Deliberation → Vote → Outcome
                    ↓
              Lessons → Knowledge Base → Future Decisions
```

## Components

### 1. Council Package (`@aether/council`)

**Role:** Core deliberation logic.

**Responsibilities:**
- Parse proposals from Notion
- Run deliberation rounds
- Collect votes from council members
- Record decisions
- Generate lessons

### 2. Convene Package (`@aether/convene`)

**Role:** Triggers council deliberation.

**Responsibilities:**
- Detect when convene is needed
- Gather council members
- Start deliberation session
- Timeout handling

### 3. Bridge Worker Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/proposals` | GET | List all proposals |
| `/proposals` | POST | Create new proposal |
| `/api/proposals/review` | POST | Approve/reject proposal |
| `/lessons` | GET | List all lessons |
| `/lessons` | POST | Create new lesson |
| `/api/council/log` | POST | Log council conversation |

### 4. n8n Integration

From [council/round-1-n8n-orchestration.md](../.agents/council/round-1-n8n-orchestration.md):

- Notion as SSOT with n8n as orchestrator
- monday.com upsert with External ID column
- Evidence gate for completion verification

## Proposal Lifecycle

```
1. Created (Notion webhook) → pending_review
2. Council deliberation → approved/rejected
3. If approved → Implementation → Done
4. If rejected → Archived with reason
```

### Proposal Schema

```typescript
interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'done';
  createdAt: string;
  reviewedAt?: string;
  reviewer?: string;
  reason?: string;
}
```

### Review Endpoint

```bash
# Approve
POST /api/proposals/review
{ "id": "proposal-123", "action": "approve" }

# Reject
POST /api/proposals/review
{ "id": "proposal-123", "action": "reject", "reason": "Duplicate" }
```

## Lessons System

### Lesson Schema

```typescript
interface Lesson {
  id: string;
  title: string;
  category: string;
  content: string;
  source: string;
  createdAt: string;
}
```

### Writing Lessons

```bash
POST /lessons
{
  "title": "Always verify wrangler bindings",
  "category": "infrastructure",
  "content": "Before deploying, cross-reference wrangler.toml with actual Cloudflare resources.",
  "source": "agent-self-audit"
}
```

## Council Members

### Roles

| Role | Responsibility |
|------|---------------|
| Builder | Proposes solutions and implementations |
| Critic | Identifies risks and flaws |
| Integrator | Ensures consistency across systems |
| Evaluator | Measures outcomes and accuracy |

### Voting

- Majority rules (2/3 threshold)
- Dissent is recorded
- Confidence scores are assigned
- Outcomes are tracked

## Deliberation Flow

1. **Proposal received** — from Notion webhook
2. **Council convened** — members activated
3. **Builder proposes** — solution/implementation
4. **Critic evaluates** — identifies risks
5. **Integrator checks** — consistency with existing systems
6. **Vote taken** — majority rules
7. **Decision recorded** — in D1 + Notion
8. **Outcome tracked** — did the decision work?

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /proposals` | GET | List proposals (with status filter) |
| `POST /proposals` | POST | Create proposal |
| `POST /api/proposals/review` | POST | Review proposal |
| `GET /lessons` | GET | List lessons (with category filter) |
| `POST /lessons` | POST | Create lesson |
| `POST /api/council/log` | POST | Log deliberation |

## Monitoring

### Metrics

- Proposals pending review
- Approval/rejection rate
- Average deliberation time
- Lesson count by category
- Council member participation

### Health

- Council availability
- Deliberation success rate
- Notion webhook delivery rate