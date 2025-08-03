# PRICING SYSTEM ENHANCEMENT - AGENT COLLABORATION SETUP

## Directory Structure for Agent Collaboration

Create the following directories to facilitate agent handoffs and output sharing:

```
.claudedocs/
├── phase1-analysis/
│   ├── system-architecture.md
│   ├── service-analysis.md
│   ├── integration-points.md
│   └── enhancement-plan.md
├── phase2-design/
│   ├── ui-specifications.md
│   ├── component-designs.md
│   ├── user-flows.md
│   └── material-ui-components.md
├── phase3-frontend/
│   ├── component-implementations.md
│   ├── api-integrations.md
│   ├── pricing-interfaces.md
│   └── quote-builder.md
├── phase4-backend/
│   ├── service-enhancements.md
│   ├── database-updates.md
│   ├── api-endpoints.md
│   └── invoice-service.md
└── troubleshooting/
    ├── quotes-service-503.md
    ├── frontend-deployment.md
    └── integration-issues.md
```

## Agent Context Requirements

### Input Files Each Agent Must Read:
1. **Current System Context**: `/home/arek/projects/enterprise/CLAUDE.md`
2. **Previous Phase Outputs**: `.claudedocs/phase[N-1]-*/` 
3. **Service Implementations**: Relevant service directories in `/home/arek/projects/enterprise/`
4. **Database Schema**: `/home/arek/projects/enterprise/database/`

### Output Requirements:
- Save all analysis and specifications to designated phase directories
- Include specific implementation instructions for next agent
- Document integration requirements and dependencies
- Provide clear handoff instructions

## Key Integration Points:
- **API Gateway**: Port 3000 - Service routing and authentication
- **Services Service**: Port 3007 - Pricing tiers and VAT management
- **Products Service**: Port 3004 - Margin calculations for 3450+ products
- **Quotes Service**: Port 3006 - Fix 503 errors + real-time calculations
- **Frontend**: Port 3333 - Deploy and add pricing interfaces
- **Database**: PostgreSQL with UUID primary keys
- **Polish Context**: NIP/REGON validation, VAT rates, PLN currency