# Enterprise MCP Configuration

This directory contains MCP (Model Context Protocol) server configuration for Claude Code integration.

## 📁 Directory Structure

```
.claude/
├── claude_desktop_config.json  # MCP server configuration
├── setup-mcp.sh               # Installation script  
├── README.md                   # This file
├── mcp/                        # MCP server data
├── logs/                       # Server logs
├── memory/                     # Persistent memory
└── temp/                       # Temporary files
```

## 🚀 Quick Setup

```bash
cd /var/www/enterprise/.claude
./setup-mcp.sh
```

## 🔧 Configured MCP Servers

### 1. Filesystem Server
- **Purpose**: Secure file operations within project
- **Access**: `/var/www/enterprise` directory only
- **Capabilities**: Read/write files, directory traversal

### 2. Memory Server  
- **Purpose**: Persistent knowledge across sessions
- **Storage**: Knowledge graph in `.claude/memory/`
- **Capabilities**: Store architectural decisions, patterns

### 3. Sequential Thinking Server
- **Purpose**: Structured problem-solving workflows
- **Capabilities**: Step-by-step analysis, decision trees

### 4. Everything Server
- **Purpose**: Reference server with all MCP features
- **Capabilities**: Comprehensive tooling for testing

### 5. PostgreSQL Server
- **Purpose**: Database operations and analysis
- **Connection**: Local enterprise database
- **Capabilities**: Query execution, schema analysis

### 6. Enterprise Agents Server ✨ NEW
- **Purpose**: Specialized development agents for enterprise workflow
- **Agents**: Backend Architect, Frontend Developer, Code Reviewer, Test Automator
- **Models**: Sonnet for balanced cost/performance
- **Usage**: Proactive development assistance and code quality improvement

## 📋 Usage in Claude Code

After setup, you can use these commands in Claude Code:

```
# File operations
"Read the main configuration files and analyze the architecture"
"Update the API routes based on the new requirements" 

# Database operations
"Show me the database schema for the contacts table"
"Analyze slow queries in the enterprise database"

# Memory operations  
"Remember this architectural decision for future reference"
"What coding patterns have we established for this project?"

# Problem solving
"Help me debug this complex authentication issue step by step"
"Analyze the impact of changing the database schema"

# Enterprise Agents (NEW)
"Use the backend-architect agent to review our microservices structure"
"Use the frontend-developer agent to create responsive components"
"Use the code-reviewer agent to analyze security vulnerabilities"
"Use the test-automator agent to improve test coverage"
```

## 🔐 Security

- File access restricted to project directory only
- Database uses existing connection (read-only recommended for safety)
- No external API keys required for basic functionality
- All data stored locally within `.claude/` directory

## 🔄 Updates

To update MCP servers:
```bash
npm update -g @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-memory @modelcontextprotocol/server-sequential-thinking @modelcontextprotocol/server-everything @henkey/postgres-mcp-server
```

## 🐛 Troubleshooting

### MCP servers not appearing
1. Check Claude Desktop has MCP indicator (bottom-right)
2. Verify config file syntax: `jq . claude_desktop_config.json`
3. Restart Claude Desktop completely

### Permission issues
```bash
chmod 755 /var/www/enterprise/.claude
chmod -R 644 /var/www/enterprise/.claude/*
chmod +x /var/www/enterprise/.claude/setup-mcp.sh
```

### Database connection issues
- Verify PostgreSQL is running: `docker compose -f docker-compose.dev.yml ps postgres`
- Test connection: `psql postgresql://postgres:devpassword123@localhost:5432/enterprise_crm -c "\dt"`

## 📖 Documentation

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Enterprise Project Documentation](../CLAUDE.md)