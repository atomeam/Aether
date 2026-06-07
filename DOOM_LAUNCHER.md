# DOOM Launcher Skill

Create desktop shortcuts for running DOOM and other retro games.

## DOOM Setup

### Installation
- Installed DOSBox (MS-DOS emulator)
- Installed GZDoom (modern DOOM source port)
- Copied DOOM.WAD to GZDoom directory

### GZDoom Location
```
C:\Users\adamm\AppData\Local\Programs\gzdoom\gzdoom.exe
```

### DOOM.WAD Location
```
C:\Users\adamm\AppData\Local\Programs\gzdoom\DOOM.WAD
```

## Create Desktop Shortcut

### PowerShell Script
```powershell
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\DOOM.lnk")
$Shortcut.TargetPath = "C:\Users\adamm\AppData\Local\Programs\gzdoom\gzdoom.exe"
$Shortcut.WorkingDirectory = "C:\Users\adamm\AppData\Local\Programs\gzdoom"
$Shortcut.Description = "DOOM - id Software 1993"
$Shortcut.Save()
```

### Execute
```powershell
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\DOOM.lnk")
$Shortcut.TargetPath = "C:\Users\adamm\AppData\Local\Programs\gzdoom\gzdoom.exe"
$Shortcut.WorkingDirectory = "C:\Users\adamm\AppData\Local\Programs\gzdoom"
$Shortcut.Description = "DOOM - id Software 1993"
$Shortcut.Save()
```

## Uniapp Integration

### Add DOOM Launcher to OneHub
```typescript
{
  id: 'doom-launcher',
  title: 'DOOM Launcher',
  type: 'launcher',
  source: 'Desktop Shortcut',
  extractedAt: '2026-06-07T02:35:00Z',
  insights: [
    'Desktop shortcut created',
    'GZDoom source port installed',
    'DOOM.WAD configured',
    'One-click DOOM launch',
    'Modern DOOM experience'
  ],
  related: ['doom-v19', 'cracky-coco'],
  tags: ['launcher', 'doom', 'gaming', 'desktop']
}
```

### Add Launch Button to OneHub
```typescript
// Add launch button to DOOM card
<Button onClick={() => launchDOOM()}>
  Launch DOOM
</Button>

const launchDOOM = () => {
  window.open('C:\\Users\\adamm\\AppData\\Local\\Programs\\gzdoom\\gzdoom.exe');
};
```

## Running DOOM

### Direct Launch
```powershell
Start-Process "C:\Users\adamm\AppData\Local\Programs\gzdoom\gzdoom.exe"
```

### From Desktop
- Double-click "DOOM" shortcut on desktop

### From OneHub
- Click "Launch DOOM" button in OneHub

## Other Retro Games

### Citra Emulator
- Location: `C:\Users\adamm\Downloads\citra-windows-mingw\citra-qt.exe`
- Create similar shortcut

### DOSBox Games
- Location: `C:\Program Files\DOSBox\DOSBox.exe`
- Configure with game files

## Universal Launcher Pattern

### Launcher Schema
```typescript
{
  id: string;
  title: string;
  type: 'launcher';
  source: string;
  extractedAt: string;
  insights: string[];
  related: string[];
  tags: string[];
  launchPath: string;  // Path to executable
  workingDirectory: string;  // Working directory
}
```

### Launch Function
```typescript
const launchApp = (launchPath: string, workingDirectory: string) => {
  // Use backend API to launch app
  fetch('/api/launch', {
    method: 'POST',
    body: JSON.stringify({ launchPath, workingDirectory })
  });
};
```

### Backend Launch Endpoint
```typescript
app.post('/api/launch', (req, res) => {
  const { launchPath, workingDirectory } = req.body;
  exec(`Start-Process "${launchPath}" -WorkingDirectory "${workingDirectory}"`);
  res.json({ success: true });
});
```

## Rule of Thumb

**ALL APPS RUN TOGETHER.**

Create launchers for all apps. Add shortcuts to desktop. Integrate into OneHub. One-click launch from unified interface.

**UNIAPP = ONE PERFECT APP WITH REAL APPS.**
