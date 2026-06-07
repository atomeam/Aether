# Docker MCP Setup Guide

## Quick Start

1. Start the MCP server:
   \docker-compose -f docker-compose.mcp.yml up -d\

2. Add to your MCP client config (see mcp-client-config.json)

3. Restart your MCP client

4. Test the connection

## Troubleshooting

**Docker daemon errors:**
- Make sure Docker Desktop is running
- Check Docker Desktop settings

**MCP client can't connect:**
- Verify container is running: \docker ps\
- Check container logs: \docker logs mcp-<server-name>\
- Ensure client config matches examples

## Available MCP Servers

- duckduckgo: Web search
- brave: Alternative web search
- youtube-transcript: YouTube transcripts
- atlassian: Jira/Confluence
- github: GitHub operations
- slack: Slack integration
- filesystem: File operations
- postgres: PostgreSQL operations
