# Taskwarrior Integration

Wraps Taskwarrior in WSL to produce clean, agent-consumable JSON. Avoids the mixed stderr/stdout and expression parsing quirks in task 2.6.2.

## Prerequisites

- WSL Ubuntu with `task` installed (`sudo apt install taskwarrior`)
- `jq` installed in WSL (`sudo apt install jq`)

## Commands

| Command | Description | Output |
|---------|-------------|--------|
| `list [filter]` | List tasks as clean JSON | Array of task objects |
| `get <uuid>` | Get single task by UUID | Object or `{error: "not found"}` |
| `create <desc> [tags]` | Create a task with comma-separated tags | Created task object |
| `done <uuid>` | Mark task done | `{"uuid","id","status":"completed","action":"done"}` |

## JSON Output Shape

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "description": "My task",
  "status": "pending",
  "entry": "20260718T040000Z",
  "end": null,
  "tags": ["+taco-test"],
  "project": null,
  "priority": null,
  "due": null,
  "waiting": null,
  "modify": null,
  "start": null
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Usage error (missing args, invalid UUID) |
| 2 | Taskwarrior internal error |

## Security

- UUID format validated before passing to WSL
- No shell interpolation — argument arrays only
- Export writes to temp file, cleaned up after read
- No secrets or real configuration committed

## Files

- `adapter.sh` — Bash bridge (WSL side, core logic)
- `adapter.ps1` — PowerShell entry point (Windows side)
