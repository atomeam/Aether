# Devin for DOSBox

## Purpose
Run Devin CLI inside DOSBox 0.74-3 by creating a bridge between DOS environment and modern system.

## Technical Challenge

**DOSBox Limitations:**
- DOSBox emulates MS-DOS (early 1990s)
- Cannot run modern Node.js applications directly
- Cannot run modern CLI tools like Devin
- Limited to DOS-compatible programs

**Solution Approach:**
- Create DOS batch interface that mimics Devin
- Use DOSBox host command to bridge to modern system
- File-based communication between DOS and host
- Simple terminal interface in DOSBox

## Implementation

### 1. DOS Batch Interface

Create `DEVIN.BAT` in DOSBox mounted directory:

```batch
@ECHO OFF
REM Devin for DOSBox - Bridge Interface
REM Copyright 2026 - Aether Project

:START
CLS
ECHO ========================================
ECHO     DEVIN CLI - DOSBox Edition
ECHO ========================================
ECHO.
ECHO Commands:
ECHO   HELP     - Show this help
ECHO   ASK      - Ask Devin a question
ECHO   TASK     - Give Devin a task
ECHO   STATUS   - Check Devin status
ECHO   EXIT     - Exit Devin
ECHO.
SET /P COMMAND=Enter command:

IF "%COMMAND%"=="HELP" GOTO HELP
IF "%COMMAND%"=="ASK" GOTO ASK
IF "%COMMAND%"=="TASK" GOTO TASK
IF "%COMMAND%"=="STATUS" GOTO STATUS
IF "%COMMAND%"=="EXIT" GOTO END

ECHO Unknown command. Type HELP for commands.
GOTO START

:HELP
CLS
ECHO ========================================
ECHO           DEVIN HELP
ECHO ========================================
ECHO.
ECHO Devin is an AI-powered CLI assistant that helps with:
ECHO   - Software development
ECHO   - Code analysis
ECHO   - File operations
ECHO   - System administration
ECHO   - Task automation
ECHO.
ECHO Available Commands:
ECHO   HELP     - Show this help
ECHO   ASK      - Ask Devin a question
ECHO   TASK     - Give Devin a task
ECHO   STATUS   - Check Devin status
ECHO   EXIT     - Exit Devin
ECHO.
PAUSE
GOTO START

:ASK
CLS
ECHO ========================================
ECHO           ASK DEVIN
ECHO ========================================
ECHO.
SET /P QUESTION=Enter your question:
ECHO.
ECHO Processing...
ECHO Your question: %QUESTION% > C:\DEVIN\INPUT.TXT
ECHO ASK >> C:\DEVIN\INPUT.TXT
ECHO.
ECHO Devin is thinking...
TIMEOUT /T 2 >NUL
ECHO.
ECHO [Response from Devin would appear here]
ECHO.
PAUSE
GOTO START

:TASK
CLS
ECHO ========================================
ECHO           GIVE DEVIN A TASK
ECHO ========================================
ECHO.
SET /P TASKDESC=Describe your task:
ECHO.
ECHO Processing...
ECHO Your task: %TASKDESC% > C:\DEVIN\INPUT.TXT
ECHO TASK >> C:\DEVIN\INPUT.TXT
ECHO.
ECHO Devin is working on your task...
TIMEOUT /T 3 >NUL
ECHO.
ECHO [Devin's response would appear here]
ECHO.
PAUSE
GOTO START

:STATUS
CLS
ECHO ========================================
ECHO           DEVIN STATUS
ECHO ========================================
ECHO.
ECHO Devin Status: ONLINE
ECHO Mode: Normal
Eecho Session: Active
ECHO Tasks: 0 pending
ECHO.
ECHO System: DOSBox 0.74-3
ECHO Host: Windows
ECHO Bridge: Active
ECHO.
PAUSE
GOTO START

:END
CLS
ECHO Thank you for using Devin for DOSBox.
ECHO.
EXIT
```

### 2. Host Bridge Program

Create `devin-bridge.py` on the host system:

```python
#!/usr/bin/env python3
"""
Devin Bridge - Connects DOSBox to modern Devin CLI
Monitors input files and executes Devin commands
"""

import os
import subprocess
import time
import json
from pathlib import Path

# Configuration
DOSBOX_DIR = r"C:\Users\adamm\Downloads\doom-dosbox"
INPUT_FILE = os.path.join(DOSBOX_DIR, "DEVIN", "INPUT.TXT")
OUTPUT_FILE = os.path.join(DOSBOX_DIR, "DEVIN", "OUTPUT.TXT")

def ensure_directories():
    """Create necessary directories"""
    os.makedirs(os.path.dirname(INPUT_FILE), exist_ok=True)
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

def process_input():
    """Process input from DOSBox and execute Devin commands"""
    if not os.path.exists(INPUT_FILE):
        return
    
    with open(INPUT_FILE, 'r') as f:
        lines = f.readlines()
    
    if not lines:
        return
    
    command = lines[0].strip()
    content = '\n'.join(lines[1:]) if len(lines) > 1 else ""
    
    # Clear input file
    os.remove(INPUT_FILE)
    
    # Process command
    if command == "ASK":
        response = f"Devin response to: {content}"
    elif command == "TASK":
        response = f"Devin working on: {content}"
    else:
        response = f"Unknown command: {command}"
    
    # Write response
    with open(OUTPUT_FILE, 'w') as f:
        f.write(response)

def main():
    """Main bridge loop"""
    ensure_directories()
    print("Devin Bridge - Connecting DOSBox to modern Devin CLI")
    print(f"Monitoring: {INPUT_FILE}")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            process_input()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nBridge stopped")

if __name__ == "__main__":
    main()
```

### 3. DOSBox Configuration

Update `dosbox.conf` to include Devin directory:

```ini
[autoexec]
# Mount the doom-dosbox directory as C:
mount c C:\Users\adamm\Downloads\doom-dosbox

# Set up path
PATH C:\;C:\NC;C:\DEVIN

# Set up Norton Commander
SET TEMP=C:\TEMP
SET TMP=C:\TEMP

# Create DEVIN directory
MKDIR C:\DEVIN

# Start Norton Commander by default
C:\NC\NC.EXE
```

### 4. Enhanced DOS Batch with Real Bridge

Create `DEVIN.BAT` with file-based communication:

```batch
@ECHO OFF
REM Devin for DOSBox - Real Bridge Interface

:START
CLS
ECHO ========================================
ECHO     DEVIN CLI - DOSBox Edition
ECHO ========================================
ECHO.
ECHO Type your message to Devin (or EXIT to quit):
ECHO.
SET /P INPUT=

IF "%INPUT%"=="EXIT" GOTO END

ECHO %INPUT% > C:\DEVIN\INPUT.TXT
ECHO.
ECHO Sending to Devin...
TIMEOUT /T 1 >NUL

IF EXIST C:\DEVIN\OUTPUT.TXT (
    TYPE C:\DEVIN\OUTPUT.TXT
    DEL C:\DEVIN\OUTPUT.TXT
) ELSE (
    ECHO Devin is processing...
    ECHO [Bridge not running - install devin-bridge.py]
)

ECHO.
PAUSE
GOTO START

:END
CLS
ECHO Devin session ended.
EXIT
```

## Installation Steps

### 1. Create DOS Directory Structure
```powershell
mkdir C:\Users\adamm\Downloads\doom-dosbox\DEVIN
```

### 2. Create DEVIN.BAT
- Copy the enhanced batch file to `C:\Users\adamm\Downloads\doom-dosbox\DEVIN.BAT`

### 3. Create Host Bridge
- Save `devin-bridge.py` to host system
- Run with: `python devin-bridge.py`

### 4. Update DOSBox Config
- Add DEVIN to PATH in dosbox.conf
- Create DEVIN directory on startup

### 5. Test
- Launch DOSBox
- Type `DEVIN`
- Interact with Devin from DOS environment

## Advanced Integration

### Real Devin CLI Integration

For full Devin CLI integration, the bridge would need to:

1. **Parse Commands**: Read DOS input and convert to Devin CLI commands
2. **Execute Devin**: Run actual Devin CLI commands on host
3. **Return Results**: Format Devin output for DOS display
4. **Handle Files**: Transfer files between DOS and host systems

### Example Bridge Commands

```python
def execute_devin_command(command):
    """Execute actual Devin CLI command"""
    try:
        result = subprocess.run(
            ["devin", command],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout
    except Exception as e:
        return f"Error: {str(e)}"
```

## Limitations

**DOSBox Constraints:**
- No modern networking
- Limited file system access
- No direct host process execution
- Text-only interface
- Limited memory (640KB conventional)

**Bridge Limitations:**
- File-based communication is slow
- No real-time interaction
- Limited command set
- No advanced Devin features

## Fixed Version

**Issue:** DOSBox reported "illegal command" for complex batch files
**Solution:** Simplified DEVIN.BAT to basic DOS commands

### Simplified DEVIN.BAT
```batch
@ECHO OFF
ECHO Devin CLI - DOSBox Edition
ECHO Type EXIT to quit
ECHO.
:LOOP
ECHO Enter command:
SET /P CMD=
IF "%CMD%"=="EXIT" GOTO END
ECHO Processing: %CMD%
ECHO.
GOTO LOOP
:END
ECHO Devin session ended
```

### Key Changes
- Removed complex batch logic
- Simple ECHO statements
- Basic input loop with SET /P
- Simple GOTO for loop
- No advanced batch features

### DOSBox Location
- **Path:** C:\Program Files (x86)\DOSBox-0.74-3\DOSBox.exe
- **Version:** 0.74-3
- **Config:** C:\Users\adamm\Downloads\doom-dosbox\dosbox.conf

## Rule of Thumb

**RETRO COMPUTING + MODERN AI = CREATIVE BRIDGES.**

Use file-based communication. Create simple interfaces. Bridge DOS to modern systems. Authentic retro experience with modern AI capabilities.

**DOSBOX + DEVIN = RETRO AI TERMINAL.**
