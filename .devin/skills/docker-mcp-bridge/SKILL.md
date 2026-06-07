# Docker MCP Bridge Skill

Bridge between Devin AI and Docker MCP servers for direct tool access.

## Description

This skill provides direct access to Docker MCP servers running on the local system, allowing Devin to use MCP tools like DuckDuckGo search, filesystem operations, and other MCP capabilities without requiring external MCP client configuration.

## When to Use

Use this skill when:
- Need web search capabilities via DuckDuckGo
- Need to fetch webpage content
- Need filesystem operations via MCP
- Want to use other Docker MCP servers
- Need research capabilities with current web data

## Capabilities

- ✅ DuckDuckGo web search
- ✅ Webpage content fetching
- ✅ Filesystem operations (when filesystem server is running)
- ✅ Direct MCP protocol communication
- ✅ Error handling and validation
- ✅ Clean resource management

## Usage

### Web Search
```bash
.\.devin\skills\docker-mcp-bridge\skill.ps1 -Search "your search query"
```

### Fetch Webpage Content
```bash
.\.devin\skills\docker-mcp-bridge\skill.ps1 -Fetch "https://example.com"
```

### List Available Tools
```bash
.\.devin\skills\docker-mcp-bridge\skill.ps1 -ListTools
```

### Check Server Status
```bash
.\.devin\skills\docker-mcp-bridge\skill.ps1 -Status
```

## Parameters

- `-Search <query>`: Perform DuckDuckGo web search
- `-Fetch <url>`: Fetch and extract webpage content
- `-ListTools`: List available MCP tools
- `-Status`: Check MCP server status
- `-MaxResults <number>`: Set max search results (default: 10)

## Requirements

- Docker must be running
- MCP server containers must be started (use docker-mcp-setup skill)
- Network connectivity for web operations

## Notes

- Uses Docker MCP servers via stdio protocol
- Automatically manages container lifecycle
- Handles MCP protocol communication
- Returns structured results in JSON format
- SafeSearch is set to MODERATE by default