# Automation Orchestrator Dashboard

A beautiful web-based dashboard for monitoring and controlling your automation orchestrator.

## Features

- 🎨 **Modern UI**: Gradient-based design with glassmorphism effects
- 📊 **Real-time Stats**: Active workflows, success rates, system uptime
- 🔄 **Live Updates**: Auto-refreshes every 30 seconds
- ▶️ **Manual Control**: Execute workflows on demand
- 📋 **Run History**: View recent workflow executions
- 🚨 **Status Monitoring**: Visual health indicators

## Quick Start

### Option 1: Node.js Server (Recommended)
```bash
cd dashboard
npm start
```

### Option 2: Python Server
```bash
cd dashboard
python -m http.server 8080
```

### Option 3: PowerShell Script
```powershell
cd dashboard
.\start-dashboard.ps1
```

### Option 4: Batch File
```cmd
cd dashboard
start-dashboard.bat
```

Then open http://localhost:8080 in your browser.

## Requirements

- **Node.js** (for Node.js server) OR
- **Python** (for Python server) OR
- **PowerShell** (for PowerShell script)

## Configuration

The dashboard connects to the orchestrator API at `http://localhost:3333` by default. To change this:

1. Open `index.html`
2. Find the line: `const API_BASE = 'http://localhost:3333';`
3. Change the URL to match your orchestrator's address

## Icon Generation

To create icon files in different sizes:

```powershell
cd dashboard
.\create-icon.ps1
```

This requires ImageMagick. If not installed, the script will offer to install it via winget.

## Dashboard Features

### System Status
- Online/Offline indicator
- System uptime display
- Connection status to orchestrator

### Statistics Cards
- Active workflows count
- Total runs executed
- Success rate percentage
- System uptime

### Workflow Management
- List all scheduled workflows
- Execute workflows manually
- View workflow status
- Schedule information

### Run History
- Recent workflow executions
- Status indicators (completed/failed/started)
- Execution duration
- Trigger type (manual/scheduled)
- Timestamp information

## Troubleshooting

### Dashboard won't connect to orchestrator
1. Ensure the orchestrator is running: `cd .. && ./start.ps1`
2. Check the orchestrator is on the correct port (default: 3333)
3. Verify the API_BASE URL in index.html

### Port already in use
Change the port in the respective server file:
- Node.js: Edit `server.js`, change `const PORT = 8080;`
- Python: Use `python -m http.server 8081` instead
- PowerShell: Edit the script to use a different port

### Icons not displaying
- The SVG icon works natively in browsers
- For PNG/ICO files, run `create-icon.ps1` with ImageMagick installed

## Development

To modify the dashboard:

1. Edit `index.html` for UI changes
2. Edit the JavaScript section for functionality changes
3. Modify the CSS in the `<style>` section for styling
4. Refresh the browser to see changes

## Security Notes

- The dashboard is currently designed for local use
- For production deployment, consider:
  - Adding authentication
  - Using HTTPS
  - Implementing CORS properly
  - Adding rate limiting

---

**Generated**: 2026-05-26  
**Version**: 1.0.0