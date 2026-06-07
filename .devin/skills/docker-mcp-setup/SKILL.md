# Docker MCP Setup Skill

Automated setup of Docker MCP servers and gateway for AI agent tool integration.

## Description

This skill automates the complete setup of Docker MCP (Model Context Protocol) servers, including:
- Docker installation verification
- MCP CLI installation verification
- Docker MCP Gateway setup
- MCP server image pulling
- Docker Compose configuration creation
- Client connection configuration generation

## When to Use

Use this skill when:
- Setting up Docker MCP servers for AI agents
- Configuring MCP Toolkit gateway
- Adding new MCP servers from Docker catalog
- Troubleshooting MCP server connectivity
- Setting up development environment with MCP tools

## Capabilities

- ✅ Verify Docker installation and status
- ✅ Install/verify MCP CLI tools
- ✅ Pull Docker MCP server images
- ✅ Create Docker Compose configurations
- ✅ Generate MCP client connection configs
- ✅ Test MCP server connectivity
- ✅ Provide troubleshooting guidance

## Usage

### Basic Setup
```bash
.\.devin\skills\docker-mcp-setup\skill.ps1 -Setup
```

### Add Specific Server
```bash
.\.devin\skills\docker-mcp-setup\skill.ps1 -AddServer duckduckgo
```

### Verify Installation
```bash
.\.devin\skills\docker-mcp-setup\skill.ps1 -Verify
```

### Generate Client Config
```bash
.\.devin\skills\docker-mcp-setup\skill.ps1 -ClientConfig
```

## Parameters

- `-Setup`: Complete Docker MCP setup
- `-AddServer <server_name>`: Add specific MCP server from catalog
- `-Verify`: Verify Docker and MCP installation
- `-ClientConfig`: Generate MCP client configuration
- `-Troubleshoot`: Run diagnostics and troubleshooting

## MCP Server Catalog

Available servers from Docker MCP Catalog:
- duckduckgo: Web search ✅ (tested)
- filesystem: File system operations
- postgres: PostgreSQL database operations
- sqlite: SQLite database operations
- sequential-thinking: Chain-of-thought reasoning
- memory: Memory management
- e2b: Code execution environment
- fetch: HTTP requests
- git: Git operations
- github: GitHub API operations

Note: Not all servers may be available in the Docker catalog. Use -AddServer to test availability.

## Output

- Docker Compose configuration file
- MCP client configuration examples
- Setup verification report
- Troubleshooting guide
- Connection test results

## Dependencies

- Docker Desktop or Docker Engine
- PowerShell 5.1+
- Internet connection for pulling images
- MCP client (Claude Desktop, Cline, etc.)

## Notes

- Requires Docker to be running
- Some MCP servers may require API keys/secrets
- Windows-specific implementation
- Uses Docker Compose for orchestration