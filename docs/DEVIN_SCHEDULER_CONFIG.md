# Devin Self-Scheduling Configuration

## 🎯 Purpose
This document configures Devin's autonomous polling of the Council Relay database for task execution.

## 📋 Current Configuration

**Agent**: Devin
**Poll Interval**: 30-60 minutes
**Relay Database**: Council Relay under AtoMind Home Base in Notion
**Protocol**: RELAY PROTOCOL v1 (see RELAY_SYSTEM_STATUS.md)

## 🔄 Scheduling Options

### **Option 1: Windows Task Scheduler (Recommended for Windows)**
```powershell
# Create a scheduled task
schtasks /create /tn "Devin Relay Poller" /tr "node C:\Users\adamm\Aether\relay_poller.js" /sc minute /mo 30
```

### **Option 2: cron (if available on system)**
```bash
# Add to crontab
*/30 * * * * cd /c/Users/adamm/Aether && node relay_poller.js
```

### **Option 3: GitHub Actions (Alternative)**
Create a workflow that runs the poller on a schedule:
```yaml
name: Devin Relay Poller
on:
  schedule:
    - cron: '*/30 * * * *'
jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Relay Poller
        run: node relay_poller.js
```

### **Option 4: Manual/Background Process**
```bash
# Run in background with nohup
nohup node relay_poller.js > relay_poller.log 2>&1 &
```

## 🎯 Recommended Setup

**For Windows (Current System):**
Use Windows Task Scheduler with Option 1.

**Command:**
```powershell
schtasks /create /tn "Devin Relay Poller" /tr "node C:\Users\adamm\Aether\relay_poller.js" /sc minute /mo 30
```

**To Start Immediately:**
```powershell
schtasks /run /tn "Devin Relay Poller"
```

**To Stop:**
```powershell
schtasks /end /tn "Devin Relay Poller"
```

**To Delete:**
```powershell
schtasks /delete /tn "Devin Relay Poller" /f
```

## 📋 Monitoring

**Check Poller Status:**
```powershell
schtasks /query /tn "Devin Relay Poller"
```

**View Logs:**
```bash
# If running in background
tail -f relay_poller.log
```

## 🎯 Integration with Relay Protocol

When the poller finds tasks where:
- `To` = "Devin"
- `Status` = "Unread"

It will:
1. Read the RELAY PROTOCOL v1 row first
2. Execute the task according to protocol rules
3. Update task status to "in_progress" → "completed" or "failed"
4. Provide evidence as required by protocol

## 🎯 Convergence Rules

The poller follows these rules from RELAY PROTOCOL v1:
- ✅ Empty queue = silence (no invented work)
- ✅ 10-row daily cap (prevents runaway behavior)
- ✅ Evidence required for "fixed" claims
- ✅ No secrets on the bus
- ✅ Escalation order: API → CLI → browser agent → user

## 🎯 Next Steps

1. Choose scheduling method (Windows Task Scheduler recommended)
2. Set up the scheduled task
3. Monitor first few polling cycles
4. Verify autonomous operation
5. Update RELAY_SYSTEM_STATUS.md with timer configuration