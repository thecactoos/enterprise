# Enterprise Agents - Usage Guide

## 🤖 Installed Tier 1 Agents

### **Backend Architect** (Sonnet Model)
- **Purpose**: RESTful API design, microservice boundaries, database schemas
- **Use for**: New backend services, API endpoints, architecture decisions
- **Proactive triggers**: Creating new services, scaling decisions, performance bottlenecks

### **Frontend Developer** (Sonnet Model)  
- **Purpose**: React components, responsive layouts, state management
- **Use for**: UI components, frontend performance, accessibility improvements
- **Proactive triggers**: New UI features, responsive design fixes, performance optimization

### **Code Reviewer** (Sonnet Model)
- **Purpose**: Code quality, security, configuration safety analysis
- **Use for**: Every commit, PR reviews, configuration changes
- **Proactive triggers**: After writing/modifying code, especially config changes

### **Test Automator** (Sonnet Model)
- **Purpose**: Comprehensive test suites, CI pipelines, test coverage
- **Use for**: Unit tests, integration tests, E2E test setup
- **Proactive triggers**: New features, test coverage gaps, CI/CD setup

## 🚀 How to Use in Claude Code

### 1. Agent Activation
```
# In Claude Code, these agents are available as prompts:
- backend-architect
- frontend-developer  
- code-reviewer
- test-automator
```

### 2. Usage Examples

#### Backend Architecture Review:
```
Use the backend-architect agent to review our microservices structure and suggest improvements for the contacts-service API endpoints.
```

#### Frontend Component Development:
```
Use the frontend-developer agent to create a responsive contact management component with proper state management for the Next.js frontend.
```

#### Code Security Review:
```
Use the code-reviewer agent to analyze the recent changes in api-gateway authentication module for security vulnerabilities.
```

#### Test Coverage Improvement:
```
Use the test-automator agent to create comprehensive tests for the OCR service integration with proper mocking strategies.
```

## 📋 Weekly Agent Schedule (Recommended)

### **Monday: Planning & Architecture**
- **Backend Architect**: Review sprint planning, design new endpoints
- **Code Reviewer**: Architecture review for upcoming changes

### **Tuesday-Thursday: Development**
- **Frontend Developer**: Component building, responsive fixes
- **Backend Architect**: Service implementation guidance
- **Test Automator**: Test coverage improvement

### **Friday: Quality & Review**  
- **Code Reviewer**: PR review and security analysis
- **Test Automator**: CI pipeline optimization
- **All agents**: Sprint retrospective and improvements

## 🎯 Integration with Enterprise Stack

### **Current Project Alignment:**
- **Users Service** → Backend Architect + Code Reviewer
- **OCR Service** → Test Automator + Backend Architect
- **Frontend Next.js** → Frontend Developer + Code Reviewer
- **API Gateway** → Backend Architect + Code Reviewer (security focus)

### **Proactive Usage Triggers:**
1. **After any code change** → Code Reviewer
2. **New microservice** → Backend Architect
3. **UI component changes** → Frontend Developer  
4. **Before deployment** → Test Automator + Code Reviewer
5. **Performance issues** → Backend Architect + Frontend Developer

## 💡 Cost-Effective Model Usage

All Tier 1 agents use **Sonnet model** for balanced cost/performance:
- More powerful than Haiku for complex decisions
- More cost-effective than Opus for regular development
- Optimal for daily development workflow

## 🔄 Next Phase: Tier 2 Agents

Ready to add when needed:
- DevOps Troubleshooter (Docker, deployment issues)
- Security Auditor (OWASP compliance, vulnerabilities)  
- Performance Engineer (optimization, bottleneck analysis)
- Database Architect (PostgreSQL optimization, scaling)

## 📊 Success Metrics

Track agent effectiveness:
- Code quality scores improvement
- Security vulnerability reduction  
- Development velocity increase
- Test coverage percentage increase
- Production incident reduction

## 🛠 Technical Setup

- **MCP Server**: Custom Node.js server (`agents-server.js`)
- **Configuration**: `claude_desktop_config.json`
- **Agent Definitions**: Individual `.md` files in `agents/` directory  
- **Protocol**: JSON-RPC over stdin/stdout
- **Restart**: Restart Claude Desktop after configuration changes