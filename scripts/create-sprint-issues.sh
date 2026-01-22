#!/bin/bash

# Script to create all sprint issues for Raynet MCP Server project
# Requires: GitHub CLI (gh) installed and authenticated

set -e

REPO="AiPulseInc/raynet-mcp-server"

echo "🚀 Creating Sprint Issues for Raynet MCP Server"
echo "================================================"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Function to create an issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local milestone="$4"

    gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" \
        --milestone "$milestone" || echo "⚠️  Failed to create: $title"
}

# Sprint 0: Project Setup (Days 1-2)
echo "📋 Creating Sprint 0 issues..."

create_issue \
    "[SPRINT-0] Initialize Node.js project with TypeScript" \
    "## Task Description
Create new Node.js project with TypeScript configuration

## Acceptance Criteria
- [ ] package.json created with correct dependencies
- [ ] TypeScript configured (tsconfig.json)
- [ ] ESLint and Prettier set up
- [ ] Project builds successfully

## Technical Notes
- Node.js 18+
- TypeScript 5.0+
- See implementation plan for dependency list" \
    "sprint-0,setup,sprint-task" \
    "Sprint 0: Setup"

create_issue \
    "[SPRINT-0] Set up project directory structure" \
    "## Task Description
Create the standardized directory structure for the project

## Acceptance Criteria
- [ ] src/ directory with all subdirectories
- [ ] tests/ directory structure
- [ ] Configuration files in place

## Structure
\`\`\`
src/
├── index.ts
├── server.ts
├── config/
├── api/
├── tools/
├── utils/
└── types/
\`\`\`" \
    "sprint-0,setup,sprint-task" \
    "Sprint 0: Setup"

create_issue \
    "[SPRINT-0] Configure testing framework (Vitest)" \
    "## Task Description
Set up Vitest testing framework with coverage

## Acceptance Criteria
- [ ] Vitest installed and configured
- [ ] Test utilities set up
- [ ] Coverage reporting configured
- [ ] Sample test runs successfully" \
    "sprint-0,testing,sprint-task" \
    "Sprint 0: Setup"

create_issue \
    "[SPRINT-0] Configure Railway deployment" \
    "## Task Description
Set up Railway deployment configuration

## Acceptance Criteria
- [ ] railway.json created
- [ ] Environment variables documented
- [ ] Health check endpoint planned
- [ ] Deployment process documented" \
    "sprint-0,deployment,sprint-task" \
    "Sprint 0: Setup"

# Sprint 0.5: API Discovery (Day 3)
echo "🔍 Creating Sprint 0.5 issues..."

create_issue \
    "[SPRINT-0.5] Validate Raynet API access" \
    "## Task Description
Test authentication and basic API access with provided credentials

## Acceptance Criteria
- [ ] Successfully authenticate with Raynet API
- [ ] X-Instance-Name header requirement verified
- [ ] All authentication methods tested
- [ ] Connection to correct server URL confirmed

## Testing
Use curl or Postman to test basic endpoints" \
    "sprint-0.5,api,sprint-task" \
    "Sprint 0.5: Discovery"

create_issue \
    "[SPRINT-0.5] Test core API endpoints" \
    "## Task Description
Test CRUD operations on company, person, and businessCase endpoints

## Acceptance Criteria
- [ ] GET /company/ works
- [ ] POST /company/ creates test record
- [ ] PUT /company/{id}/ updates record
- [ ] DELETE /company/{id}/ removes record
- [ ] Same for /person/ and /businessCase/" \
    "sprint-0.5,api,sprint-task" \
    "Sprint 0.5: Discovery"

create_issue \
    "[SPRINT-0.5] Document instance-specific configuration" \
    "## Task Description
Discover and document instance-specific settings

## Acceptance Criteria
- [ ] Available picklists documented
- [ ] Custom fields identified
- [ ] Required vs optional fields listed
- [ ] API_FINDINGS.md created" \
    "sprint-0.5,documentation,sprint-task" \
    "Sprint 0.5: Discovery"

create_issue \
    "[SPRINT-0.5] Test rate limiting behavior" \
    "## Task Description
Observe and document rate limiting headers and behavior

## Acceptance Criteria
- [ ] X-Ratelimit-* headers documented
- [ ] Concurrent connection limit tested (4 max)
- [ ] 429 response behavior observed
- [ ] Rate limit strategy planned" \
    "sprint-0.5,api,sprint-task" \
    "Sprint 0.5: Discovery"

# Sprint 1: Infrastructure (Days 4-6)
echo "🏗️  Creating Sprint 1 issues..."

create_issue \
    "[SPRINT-1] Implement Raynet API client" \
    "## Task Description
Create Axios-based HTTP client for Raynet API

## Acceptance Criteria
- [ ] Axios instance configured
- [ ] Basic Auth implemented
- [ ] X-Instance-Name header added to all requests
- [ ] Request/response interceptors working
- [ ] Error transformation implemented
- [ ] Response types defined" \
    "sprint-1,api,sprint-task" \
    "Sprint 1: Infrastructure"

create_issue \
    "[SPRINT-1] Implement rate limiting management" \
    "## Task Description
Build rate limiting system to respect Raynet API limits

## Acceptance Criteria
- [ ] Track X-Ratelimit-Remaining header
- [ ] Queue requests when < 100 remaining
- [ ] Enforce max 4 concurrent connections
- [ ] Handle 429 responses with retry
- [ ] Rate limit warnings logged" \
    "sprint-1,api,priority:high,sprint-task" \
    "Sprint 1: Infrastructure"

create_issue \
    "[SPRINT-1] Implement error handling system" \
    "## Task Description
Create custom error classes and error handling utilities

## Acceptance Criteria
- [ ] Custom error classes created
- [ ] Error formatter with Polish messages
- [ ] HTTP status code mapping
- [ ] Error response builder" \
    "sprint-1,error-handling,sprint-task" \
    "Sprint 1: Infrastructure"

create_issue \
    "[SPRINT-1] Set up Winston logger" \
    "## Task Description
Configure structured logging with Winston

## Acceptance Criteria
- [ ] Winston configured with proper levels
- [ ] Structured logging format
- [ ] File and console transports
- [ ] Request ID tracking
- [ ] No sensitive data in logs" \
    "sprint-1,logging,sprint-task" \
    "Sprint 1: Infrastructure"

create_issue \
    "[SPRINT-1] Implement MCP server with SSE" \
    "## Task Description
Set up MCP server with Server-Sent Events transport

## Acceptance Criteria
- [ ] MCP Server initialized
- [ ] Express app configured
- [ ] SSE endpoint (/sse) working
- [ ] CORS middleware added
- [ ] Health check endpoint (/health)
- [ ] Graceful shutdown handling" \
    "sprint-1,mcp,sprint-task" \
    "Sprint 1: Infrastructure"

echo ""
echo "✅ Sprint issues created!"
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/$REPO/issues"
echo "2. Set up project board: https://github.com/orgs/AiPulseInc/projects"
echo "3. Review and assign issues"
echo ""
echo "Note: This script created issues for Sprints 0, 0.5, and 1."
echo "      Run it again with sprint parameter to create more sprints."
