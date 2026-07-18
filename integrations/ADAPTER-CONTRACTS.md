# Adapter Contracts

Consistent JSON shapes and exit-code semantics for all Aether CLI adapters.

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — command completed as expected |
| 1 | Usage error — missing args, invalid UUID, bad filter syntax |
| 2 | Runtime error — target tool returned non-zero or crashed |
| 3 | Permission/target error — adapter refused to run (e.g., wuzz against prod) |
| 4 | Not found — requested UUID does not exist |

---

## Thyme (`integrations/thyme/adapter.ps1`)

```
exit 0: start/pause/resume/stop completed
exit 1: missing tmux session, invalid config
exit 2: thyme binary returned non-zero
```

**Outputs:**
- `start` → `{ "status": "started", "session": "aether-thyme" }`
- `status` → `{ "session": "aether-thyme", "running": true, "attached": true }`
- `pause` → `{ "status": "paused", "session": "aether-thyme" }`
- `resume` → `{ "status": "resumed", "session": "aether-thyme" }`
- `stop` → `{ "status": "stopped", "session": "aether-thyme" }`
- `logs` → plain text output, not JSON

---

## Wuzz (`integrations/wuzz/adapter.ps1`)

```
exit 0: wuzz launched or target inspected
exit 1: missing binary, bad arguments
exit 3: production target blocked by approval gate
```

**Outputs:**
- `launch` → `{ "status": "launched", "target": "http://127.0.0.1:3000" }`
- `target` → `{ "url": "http://...", "allowed": true }`

---

## FX (`integrations/fx/adapter.ps1`)

```
exit 0: inspect, query, or transform-preview succeeded
exit 1: bad arguments, missing file
exit 2: jq/fx parse error on the input
```

**Outputs:**
- `inspect` → `{ "path": "C:\\...", "size": 1234, "lines": 56, "type": "json" }`
- `query` → plain fx output to stdout (not wrapped)
- `transform-preview` → `{ "status": "preview_only", "source": "C:\\...", "preview": "C:\\...\\preview-....json", "diff": { "before": 12, "after": 14 } }`

---

## Taskwarrior (`integrations/taskwarrior/adapter.ps1`)

```
exit 0: command succeeded
exit 1: missing args, invalid UUID format
exit 2: task export or task add failed internally
exit 4: UUID not found in task database
```

**Outputs:**
- `list [filter]` → `[{ uuid, description, status, entry, end, tags, project, priority, due, waiting, modify, start }]`
- `get <uuid>` → `{ uuid, description, status, entry, end, tags, project, priority, due, waiting, modify, start }` or `{ "error": "not found", "uuid": "..." }`
- `create <desc> [tags]` → `{ id, description, entry, modified, status, uuid }`
- `done <uuid>` → `{ "uuid": "...", "id": 1, "status": "completed", "action": "done" }` or `{ "error": "not found", "uuid": "..." }`

**Notes:**
- Filters (`status:pending`, `project:NAME`, `+tag`) are applied via jq after full export (task 2.6.2 expression bug)
- Tags passed to `create` without `+` prefix — adapter adds it
- All outputs are valid JSON on stdout; errors go to stderr

---

## Common Patterns

1. **Errors always include `"error"` key** with human-readable message
2. **UUID validation** happens before passing to WSL/target tool
3. **No shell interpolation** — argument arrays only
4. **Temp files** written to `/tmp/` (WSL) or system temp (Windows), cleaned up after read
5. **Production targets** blocked at adapter level (wuzz gate), not by target tool
