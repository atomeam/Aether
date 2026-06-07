# DOOM + Norton Commander Integration

## Purpose
Seamlessly integrate DOOM and Norton Commander so they work together as one unified retro environment.

## Integration Concept

**Unified Retro Environment:**
- Norton Commander as the file manager and launcher
- DOOM as the game
- Both running in the same DOS environment
- Seamless navigation between file management and gaming

## Setup

### 1. Norton Commander 5.0
- **Source:** Symantec Norton Commander 5.0 (1993)
- **Format:** ARJ archive extracted to doom-dosbox directory
- **Location:** C:\Users\adamm\Downloads\doom-dosbox\NC\
- **Main Executable:** NC.EXE

### 2. DOOM
- **Source:** DOOM.WAD (id Software 1993)
- **Location:** C:\Users\adamm\Downloads\doom-dosbox\DOOM.WAD
- **Launcher:** GZDoom (modern source port)

### 3. DOSBox Configuration
- **Config File:** C:\Users\adamm\Downloads\doom-dosbox\dosbox.conf
- **Mount Point:** C: drive mounted to doom-dosbox directory
- **Auto-start:** Norton Commander launches automatically
- **Path:** C:\NC added to PATH

### 4. Desktop Shortcut
- **Name:** DOOM + Norton Commander
- **Target:** DOSBox with custom configuration
- **Arguments:** -conf C:\Users\adamm\Downloads\doom-dosbox\dosbox.conf
- **Description:** DOOM + Norton Commander - Integrated Retro Environment

## DOSBox Configuration

```ini
[autoexec]
# Mount the doom-dosbox directory as C:
mount c C:\Users\adamm\Downloads\doom-dosbox

# Set up path
PATH C:\;C:\NC

# Set up Norton Commander
SET TEMP=C:\TEMP
SET TMP=C:\TEMP

# Start Norton Commander by default
C:\NC\NC.EXE
```

## How It Works

### User Experience
1. Double-click "DOOM + Norton Commander" shortcut
2. DOSBox launches with custom configuration
3. Norton Commander starts automatically
4. User sees Norton Commander file interface
5. DOOM.WAD is visible in the file list
6. User can navigate files using Norton Commander
7. User can launch DOOM from Norton Commander
8. Both apps work seamlessly together

### Norton Commander Features
- **Dual-pane file manager** - Left and right panels
- **Keyboard navigation** - F1-F10 function keys
- **File operations** - Copy, move, delete, rename
- **Built-in viewer** - View files without leaving
- **Archive support** - View and extract archives
- **FTP client** - Network file transfer
- **Terminal emulator** - Command-line interface
- **Custom menus** - User-defined commands

### DOOM Integration
- **File visibility** - DOOM.WAD visible in Norton Commander
- **Easy launch** - Select DOOM.WAD and launch
- **Mod support** - Navigate to WAD files
- **Save management** - Manage DOOM save files
- **Configuration** - Edit DOOM configuration files

## Unified Features

### File Management + Gaming
- Use Norton Commander to organize DOOM files
- Create directories for different DOOM versions
- Manage WAD files and mods
- Backup save files
- Edit configuration files

### Dual-Pane Interface
- Left panel: DOOM files
- Right panel: Norton Commander tools
- Drag and drop between panels
- Quick file operations

### Keyboard Shortcuts
- F3: View file
- F4: Edit file
- F5: Copy file
- F6: Rename/move file
- F7: Create directory
- F8: Delete file
- F9: Menu
- F10: Quit

## Benefits

### Seamless Integration
- Both apps in one environment
- No switching between applications
- Unified interface
- Consistent experience

### Enhanced Productivity
- File management while gaming
- Quick access to DOOM files
- Easy mod management
- Save file organization

### Retro Authenticity
- Authentic 1990s experience
- Original Norton Commander interface
- DOS environment
- Period-correct workflow

## Technical Details

### Norton Commander 5.0 Features
- **File Viewer:** 123VIEW.EXE, ARCVIEW.EXE, DBVIEW.EXE
- **Image Tools:** BITMAP.EXE, CLP2DIB.EXE, ICO2DIB.EXE
- **Archive Tools:** NCZIP.EXE, PACKER.EXE
- **Network Tools:** NCNET.EXE, TERM95.EXE
- **Editor:** NCEDIT.EXE
- **Utilities:** NCCLEAN.EXE, NCDD.EXE

### DOOM Integration Points
- **WAD Management:** View and organize WAD files
- **Save Files:** Manage DOOM save files
- **Configuration:** Edit DOOM configuration
- **Mods:** Organize custom WAD files
- **Screenshots:** View and organize screenshots

## Usage Example

### Typical Workflow
1. Launch "DOOM + Norton Commander"
2. Norton Commander starts
3. Navigate to DOOM directory
4. View DOOM.WAD information
5. Launch DOOM
6. Play DOOM
7. Exit DOOM
8. Back in Norton Commander
9. Manage save files
10. Organize mods
11. Edit configuration
12. Repeat

## Knowledge Base Integration

### New Knowledge Item
```typescript
{
  id: 'doom-nc-integration',
  title: 'DOOM + Norton Commander Integration',
  type: 'integration',
  source: 'Unified Retro Environment',
  extractedAt: '2026-06-07T02:40:00Z',
  insights: [
    'Seamless DOOM and Norton Commander integration',
    'Unified DOS environment with dual functionality',
    'File management and gaming in one interface',
    'Authentic 1990s retro experience',
    'Enhanced productivity with keyboard shortcuts'
  ],
  related: ['doom-launcher', 'doom-v19'],
  tags: ['integration', 'doom', 'norton-commander', 'retro', 'dosbox']
}
```

## Rule of Thumb

**APPS WORK TOGETHER SEAMLESSLY.**

Integration is not just about running apps. It's about making them work together as if they were always connected. Unified interface. Shared environment. Enhanced features.

**SEAMLESS INTEGRATION = ONE PERFECT APP.**
