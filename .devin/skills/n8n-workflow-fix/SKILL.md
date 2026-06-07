# n8n Workflow Fix Skill

Diagnoses and provides manual fix instructions for n8n AI Agent workflow errors.

## Description

This skill helps fix the "A Chat Model sub-node must be connected and enabled" error in n8n AI Agent workflows by:
- Diagnosing the connection issue
- Identifying missing Chat Model connections
- Providing step-by-step manual fix instructions
- Verifying the fix after manual changes

## When to Use

Use this skill when:
- n8n AI Agent workflows show "Chat Model sub-node must be connected" error
- AI Agent nodes are missing required Chat Model connections
- Need to diagnose workflow connection issues
- Want to verify workflow fixes

## Capabilities

- ✅ Diagnose AI Agent connection issues
- ✅ Identify Chat Model nodes
- ✅ Check if Chat Model is connected to AI Agent
- ✅ Provide manual fix instructions
- ✅ Verify fixes after manual changes
- ✅ List all workflows

## Usage

### Diagnose Workflow
```bash
.\.devin\skills\n8n-workflow-fix\skill.ps1 -CheckConnections -WorkflowId <id>
```

### Fix Workflow (provides manual guide)
```bash
.\.devin\skills\n8n-workflow-fix\skill.ps1 -FixAgent -WorkflowId <id>
```

### List Workflows
```bash
.\.devin\skills\n8n-workflow-fix\skill.ps1 -ListWorkflows
```

### Get Workflow Details
```bash
.\.devin\skills\n8n-workflow-fix\skill.ps1 -GetWorkflow -WorkflowId <id>
```

## Parameters

- `-CheckConnections`: Check AI Agent connections
- `-FixAgent`: Diagnose and provide manual fix guide
- `-ListWorkflows`: List all n8n workflows
- `-GetWorkflow`: Get workflow details
- `-WorkflowId <id>`: Workflow ID to diagnose/fix

## Notes

- Requires n8n cloud API key in .env
- Due to n8n's strict API validation, manual fixing is recommended
- The skill provides clear step-by-step instructions
- Works with any Chat Model provider (OpenRouter, OpenAI, etc.)
- Automatically identifies Chat Model nodes in workflows