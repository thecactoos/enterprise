#!/bin/bash

echo "🚀 Setting up MCP servers in .claude directory..."

# Create directory structure
mkdir -p /var/www/enterprise/.claude/{mcp,logs,memory,temp}

echo "📦 Installing verified MCP servers..."

# Install only confirmed available packages
npm install -g \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-memory \
  @modelcontextprotocol/server-sequential-thinking \
  @modelcontextprotocol/server-everything \
  @henkey/postgres-mcp-server

echo "🧪 Testing MCP servers..."

# Test each server
echo "Testing filesystem server..."
if npx @modelcontextprotocol/server-filesystem --help > /dev/null 2>&1; then
    echo "✅ Filesystem MCP Server - OK"
else
    echo "❌ Filesystem MCP Server - FAILED"
fi

echo "Testing memory server..."
if npx @modelcontextprotocol/server-memory --help > /dev/null 2>&1; then
    echo "✅ Memory MCP Server - OK"  
else
    echo "❌ Memory MCP Server - FAILED"
fi

echo "Testing sequential thinking server..."
if npx @modelcontextprotocol/server-sequential-thinking --help > /dev/null 2>&1; then
    echo "✅ Sequential Thinking MCP Server - OK"
else
    echo "❌ Sequential Thinking MCP Server - FAILED"
fi

echo "Testing everything server..."  
if npx @modelcontextprotocol/server-everything --help > /dev/null 2>&1; then
    echo "✅ Everything MCP Server - OK"
else
    echo "❌ Everything MCP Server - FAILED"
fi

echo "Testing postgres server..."
if npx @henkey/postgres-mcp-server --help > /dev/null 2>&1; then
    echo "✅ PostgreSQL MCP Server - OK"
else
    echo "❌ PostgreSQL MCP Server - FAILED"
fi

echo "✅ MCP Setup Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy .claude/claude_desktop_config.json to your Claude Desktop config"
echo "2. Restart Claude Desktop"
echo "3. Look for MCP indicator in Claude Code"