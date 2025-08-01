Act as the System Troubleshooting Agent combining backend-architect and test-writer-fixer capabilities.

PROBLEM: Quotes Service 503 errors from API Gateway

CURRENT SYSTEM:
- Quotes Service: Running on port 3006
- API Gateway: Port 3000, routes to other services successfully
- Other services: All operational (Users, Products, Contacts, etc.)
- Docker: Full docker-compose.yml setup

TROUBLESHOOT SYSTEMATICALLY:

1. **Service Health Analysis**:
   - Check quotes-service health endpoint
   - Verify service startup logs
   - Test direct service connection (bypass API Gateway)

2. **API Gateway Investigation**:
   - Analyze routing configuration for quotes
   - Check environment variables for QUOTES_SERVICE_URL
   - Test API Gateway → Quotes Service communication

3. **Docker Network Analysis**:
   - Verify quotes-service network connectivity
   - Check service discovery between containers
   - Analyze docker-compose.yml dependencies

4. **Generate Diagnostic Plan**:
   - Step-by-step debugging process
   - Specific commands to run for testing
   - Fix recommendations with code examples

SAVE TO: .claudedocs/implementation/quotes-503-troubleshooting.md

Include specific curl commands, docker logs analysis, and exact fixes needed.