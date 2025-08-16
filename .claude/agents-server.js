#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class AgentsServer {
  constructor() {
    this.agentsDir = '/var/www/enterprise/.claude/agents';
    this.agents = {};
    this.loadAgents();
  }

  loadAgents() {
    const agentFiles = fs.readdirSync(this.agentsDir)
      .filter(file => file.endsWith('.md'))
      .filter(file => ['backend-architect.md', 'frontend-developer.md', 'code-reviewer.md', 'test-automator.md'].includes(file));

    for (const file of agentFiles) {
      const filepath = path.join(this.agentsDir, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const agentName = path.basename(file, '.md');
      
      // Parse YAML front matter
      const match = content.match(/^---\n(.*?)\n---\n(.*)/s);
      if (match) {
        const [, frontMatter, body] = match;
        const metadata = this.parseFrontMatter(frontMatter);
        
        this.agents[agentName] = {
          name: metadata.name || agentName,
          description: metadata.description || '',
          model: metadata.model || 'sonnet',
          content: body.trim()
        };
      }
    }
  }

  parseFrontMatter(yaml) {
    const lines = yaml.split('\n');
    const result = {};
    
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        result[key.trim()] = value.trim();
      }
    }
    
    return result;
  }

  listAgents() {
    return Object.keys(this.agents).map(name => ({
      name,
      description: this.agents[name].description,
      model: this.agents[name].model
    }));
  }

  getAgent(name) {
    return this.agents[name] || null;
  }

  // MCP Server Protocol
  handleMessage(message) {
    try {
      const { method, params } = message;

      switch (method) {
        case 'initialize':
          return {
            serverInfo: {
              name: 'enterprise-agents',
              version: '1.0.0',
            },
            capabilities: {
              prompts: {}
            }
          };

        case 'prompts/list':
          return {
            prompts: this.listAgents().map(agent => ({
              name: agent.name,
              description: agent.description,
              arguments: []
            }))
          };

        case 'prompts/get':
          const agent = this.getAgent(params.name);
          if (!agent) {
            throw new Error(`Agent ${params.name} not found`);
          }
          
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `You are now the ${agent.name} agent.

Model: ${agent.model}
Description: ${agent.description}

${agent.content}

Please analyze the current context and provide guidance based on your expertise as described above.`
                }
              }
            ]
          };

        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      return {
        error: {
          code: -1,
          message: error.message
        }
      };
    }
  }
}

// Initialize server
const server = new AgentsServer();

// Handle JSON-RPC messages from stdin
process.stdin.setEncoding('utf-8');

let buffer = '';
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  
  let lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        const response = server.handleMessage(message);
        
        if (message.id) {
          response.id = message.id;
        }
        
        console.log(JSON.stringify(response));
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});