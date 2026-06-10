# Aether Relay System Status

## 📋 Overview

The Aether project uses a multi-agent relay system for autonomous operation. This document tracks the current state and bootstrap requirements.

---

## 🎯 Current System State

### **✅ Operational Components**

**Backend Deployment**
- ✅ Vercel deployment successful: https://a-to-mind.vercel.app
- ✅ `/api/stack` endpoint returning 200 with JSON response
- ✅ Root Directory and build configuration fixed
- ✅ TypeScript errors in workspace packages resolved

**Relay Protocol**
- ✅ Protocol established and documented
- ✅ Convergence rules defined (empty queue = silence, 10-row daily cap)
- ✅ Evidence requirements established
- ✅ No secrets on bus rule enforced

**Domain Routing**
- ✅ a-to-mind.com DNS configured with Cloudflare nameservers
- ✅ Domain points to Vercel IP (76.76.21.21)
- ✅ www.a-to-mind.com aliases to aether-production Vercel project
- ⚠️ HTTP access to a-to-mind.com returns no content (HTTPS only)

---

## 🔄 Agent Status

### **✅ Devin (Current Agent)**
- **Status**: Onboarded and operational
- **Role**: Code execution, Vercel deployment, project maintenance
- **Bootstrap**: ✅ Complete
- **Self-scheduling**: ✅ Configured (Windows Task Scheduler, every 30 minutes)
- **Relay Access**: ✅ Active (checking every 30-60 min)
- **Last Task**: T1 - Vercel deployment (completed)
- **Timer Status**: Running via Windows Task Scheduler (next run: 6/10/2026 2:23:00 AM)

### **⏳ Gemini**
- **Status**: Pending bootstrap
- **Role**: Browser automation, Vercel dashboard access, domain verification
- **Bootstrap**: ❌ One-liner not yet sent
- **Self-scheduling**: ⏳ Pending T10 configuration
- **Pending Tasks**: 
  - Vercel token minting to GitHub secrets
  - Domain audit with live verification
  - Browser automation for dashboard tasks

### **⏳ OpenHands**
- **Status**: Pending bootstrap
- **Role**: GitHub Actions CI integration, repository configuration
- **Bootstrap**: ❌ One-liner not yet sent
- **Self-scheduling**: ⏳ Pending T10 configuration
- **Pending Tasks**:
  - GitHub Actions CI setup
  - Repository configuration
  - CI pipeline integration

### **⏳ Notion AI**
- **Status**: Pending bootstrap
- **Role**: Governance logging, decision tracking, run ledger management
- **Bootstrap**: ❌ One-liner not yet sent
- **Self-scheduling**: ⏳ Pending T10 configuration (scheduled custom agent)
- **Pending Tasks**:
  - Governance exception logging
  - Decision tracking
  - Run ledger management

---

## 🎯 Bootstrap Requirements

### **One-Liner for Each Agent**

**Devin** ✅ (Complete)
```
From now on, check the 🔁 Council Relay database under AtoMind Home Base in Notion every 30–60 min. Read the RELAY PROTOCOL v1 row first, then work rows where To = you and Status = Unread. You have a T10 row waiting that tells you how to automate your own checking.
```

**Gemini** ⏳ (Pending)
```
From now on, check the 🔁 Council Relay database under AtoMind Home Base in Notion every 30–60 min. Read the RELAY PROTOCOL v1 row first, then work rows where To = you and Status = Unread. You have a T10 row waiting that tells you how to automate your own checking.
```

**OpenHands** ⏳ (Pending)
```
From now on, check the 🔁 Council Relay database under AtoMind Home Base in Notion every 30–60 min. Read the RELAY PROTOCOL v1 row first, then work rows where To = you and Status = Unread. You have a T10 row waiting that tells you how to automate your own checking.
```

**Notion AI** ⏳ (Pending)
```
From now on, check the 🔁 Council Relay database under AtoMind Home Base in Notion every 30–60 min. Read the RELAY PROTOCOL v1 row first, then work rows where To = you and Status = Unread. You have a T10 row waiting that tells you how to automate your own checking.
```

---

## 🎯 RELAY PROTOCOL v1

### **Core Rules**

1. **Every task must trace to the North Star** - No invented work
2. **Empty queue means silence** - Agents don't invent tasks when queue is empty
3. **10-row daily cap** - Prevents runaway autonomous behavior
4. **Evidence required for "fixed" claims** - No assertions without proof
5. **No secrets on the bus** - All secrets must be browser-to-secret or dashboard-to-secret
6. **Escalation order**: API → CLI → browser agent → user (user is last resort)

### **Task Format**

```
[AGENT: <agent_name>] [TASK: <task_id>] [STATUS: <status>]
```

**Status Values:**
- `pending` - Task assigned but not started
- `in_progress` - Task actively being worked on
- `completed` - Task finished successfully
- `blocked` - Task cannot proceed without external action
- `failed` - Task failed with error

### **Evidence Requirements**

- For code changes: Git commit hash, diff summary
- For deployments: Deployment URL, health check results
- For configuration changes: Before/after state
- For failures: Error logs, attempted solutions

---

## 🎯 T10 Self-Scheduling Configuration

### **Devin**
- **Method**: Recurring session / playbook trigger
- **Poll Interval**: 30-60 minutes
- **Implementation**: Pending configuration

### **Gemini**
- **Method**: Scheduled Actions (if available) or webhook worker fallback
- **Poll Interval**: 30-60 minutes
- **Implementation**: Pending configuration

### **OpenHands**
- **Method**: GitHub Actions cron heartbeat
- **Poll Interval**: 30-60 minutes
- **Implementation**: Pending configuration

### **Notion AI**
- **Method**: Scheduled custom agent
- **Poll Interval**: 30-60 minutes
- **Implementation**: Pending configuration

---

## 🎯 Governance Exceptions

### **T1 - Vercel Deployment**
- **Exception Type**: Manual deployment via CLI (not CI)
- **Cause**: Token handoff failed in transit (corrupted/revoked token) - AD-011
- **Resolution**: Manual dashboard access required for Root Directory setting
- **Status**: ✅ Resolved - API access restored with new token
- **CI Migration**: CI workflow created, awaiting token in GitHub secrets

---

## 🎯 Manual Actions Required

### **Priority 1: Vercel Token to GitHub Secrets**
- **Action Required**: Add Vercel token to GitHub secrets
- **Secrets Needed**:
  - `VERCEL_TOKEN` (full-scope token)
  - `VERCEL_ORG_ID` (atomicmoonbeam88-1661s-projects)
  - `VERCEL_PROJECT_ID` (prj_HaWaH4MFFIVTKHQ27XXCE7u4fhN7)
- **Location**: github.com/atomeam/Aether → Settings → Secrets → Actions
- **Alternative**: Let Gemini handle via browser automation

### **Priority 2: GitHub Recovery Codes**
- **Action Required**: Copy to password manager
- **Location**: C:\Users\adamm\Downloads\github-recovery-codes.txt
- **Cannot be automated**: Requires manual password manager access

### **Priority 3: Agent Bootstrap**
- **Action Required**: Send one-liner to Gemini, OpenHands, Notion AI
- **Status**: Awaiting manual relay or orchestrator action

---

## 🎯 Project Organization

### **✅ Completed Consolidation**

**Moved to C:\Users\adamm\a-to-mind.com\**
- AtomBrain (PowerShell scripts)
- notion-webhook-worker
- aether_implementation_safety_plan.md
- AtoMind 2030 Research Framework.pdf
- CouncilOfFive.jsx
- homebase-button-app.zip
- homebase-cockpit-prototype.html

### **📁 Active Project Locations**

**C:\Users\adamm\Aether** - Main monorepo (backend deployed to Vercel)
**C:\Users\adamm\ai-gaming-agent-mcp** - MCP server for remote PC automation
**C:\Users\adamm\a-to-mind.com** - Consolidated project artifacts

---

## 🎯 Next Steps

### **Immediate (Manual)**
1. Add Vercel token to GitHub secrets
2. Store GitHub recovery codes in password manager
3. Send bootstrap one-liner to Gemini, OpenHands, Notion AI

### **Autonomous (Devin)**
1. Configure T10 self-scheduling timer
2. Monitor relay database for new tasks
3. Complete pending tasks from relay

### **When Other Agents Bootstrap**
1. **Gemini**: Vercel token minting, domain audit, browser automation
2. **OpenHands**: GitHub Actions CI integration
3. **Notion AI**: Governance logging, decision tracking

---

## 🎯 System Convergence

**Goal**: Autonomous operation with minimal manual intervention

**Current State**: 40% converged (Devin fully operational with self-scheduling, others pending)

**Path to 100%**:
1. ✅ Devin operational (with self-scheduling)
2. ⏳ Bootstrap remaining agents
3. ⏳ Configure self-scheduling timers for other agents
4. ⏳ Eliminate manual deployment exception (CI)
5. ⏳ Establish governance logging

**Estimated Time to Convergence**: 1-2 hours (pending manual actions)

---

## 🎯 Contact & Escalation

**Orchestrator**: Claude (Cowork)
**Audit Frequency**: Every 30 minutes
**Escalation Path**: Relay database → Manual intervention

**For Issues**: Add blocked row to relay database with detailed error description