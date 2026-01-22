# Raynet CRM MCP Server - Implementation Plan

## Project Overview

**Goal:** Build a production-ready MCP server for Raynet CRM with SSE transport, focusing on Accounts (Companies), Contacts, and Business Cases (Deals) management for Polish-speaking users integrating with n8n/Telegram workflows.

**Tech Stack:**
- TypeScript/Node.js
- MCP SDK (@modelcontextprotocol/sdk)
- SSE (Server-Sent Events) transport
- Railway deployment
- Raynet CRM API v2

---

## API Entity Naming Convention

> **Important:** The Raynet API uses specific entity names that differ from common CRM terminology. This plan uses user-friendly names in tool descriptions while maintaining API-accurate internal naming.

| User-Friendly Term | Raynet API Endpoint | Internal Code Reference |
|--------------------|---------------------|------------------------|
| Companies/Accounts | `/company/` | `account` or `company` |
| Contacts/Persons | `/person/` | `person` |
| Deals/Opportunities | `/businessCase/` | `businessCase` |
| Quotes/Offers | `/offer/` | `offer` |
| Tasks/Activities | `/activity/` | `activity` |

**Tool Naming Convention:** Tools use `raynet_` prefix with user-friendly names:
- `raynet_search_companies` → calls `/company/`
- `raynet_get_contact` → calls `/person/{id}/`
- `raynet_create_deal` → calls `/businessCase/`

---

## Document Revision History

**Version 2.0** - Updated January 2026

### Key Changes from v1.0:

1. **Critical Fixes:**
   - ✅ Added `RAYNET_INSTANCE_NAME` environment variable (REQUIRED for all API calls)
   - ✅ Corrected MCP inspector package name: `@modelcontextprotocol/inspector`
   - ✅ Added API entity naming convention section to prevent confusion
   - ✅ Added `X-Instance-Name` header requirement to architecture

2. **Timeline Adjustments:**
   - ✅ Extended MVP timeline from 18 → 26 days (+44%)
   - ✅ Added Sprint 0.5 for API Discovery & Validation
   - ✅ Adjusted sprint durations: Sprint 1 (2→3 days), Sprint 5 (3→5 days), Sprint 6 (2→3 days)
   - ✅ Rationale: Rate limiting complexity, multi-hop architecture testing needs

3. **Technical Enhancements:**
   - ✅ Added comprehensive rate limiting strategy (24k/day limit, 4 concurrent max)
   - ✅ Added mocking strategy (nock, MSW) with fixture files
   - ✅ Expanded environment variables (8 → 11 variables documented)
   - ✅ Added API response type definitions
   - ✅ Added multi-server URL support (CZ/SK/COM/EU)

4. **Risk Management:**
   - ✅ Expanded from 5 → 12 identified risks
   - ✅ Added risk probability/impact matrix
   - ✅ Added risk response plan with priorities

5. **Definition of Done:**
   - ✅ Added security checklist (credentials sanitization, header validation)
   - ✅ Added Polish language validation requirements
   - ✅ Added rate limiting validation criteria

6. **Test Suite:**
   - ✅ Expanded from ~32 → 63 test cases
   - ✅ Added rate limiting tests (5 new tests)
   - ✅ Added Polish character handling tests (4 new tests)
   - ✅ Added security tests (5 new tests)
   - ✅ Added error scenario tests (6 new tests)

7. **Performance Criteria:**
   - ✅ Adjusted response time targets: 2s → 3-5s (realistic for multi-hop)
   - ✅ Added concurrent connection limit tests (4 max)
   - ✅ Added memory leak testing (1000 requests)

### What Stayed the Same:

- Core architecture (SSE, Railway, TypeScript, MCP SDK)
- MVP scope (Companies, Contacts, Deals - 16 tools total)
- Polish language focus for MVP
- Beyond MVP roadmap (8 phases, 70+ future tools)
- Testing framework (Vitest, 80% coverage target)

---

## Architecture Design

### High-Level Architecture

```
┌─────────────────┐
│  Telegram Bot   │
│   (End User)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   n8n Workflow  │
│  (Orchestrator) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Claude API    │
│  (with MCP)     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│    Raynet MCP Server (SSE)      │
│  ┌───────────────────────────┐  │
│  │   Authentication Layer    │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     Tool Handlers         │  │
│  │  - Companies              │  │
│  │  - Contacts               │  │
│  │  - Deals                  │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │    Raynet API Client      │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │   Error Handling          │  │
│  │   Logging                 │  │
│  └───────────────────────────┘  │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────┐
│   Raynet API    │
│   (CRM System)  │
└─────────────────┘
```

### Component Architecture

**1. Server Core**
- Express.js HTTP server for SSE endpoint
- MCP Server instance with SSE transport
- Health check endpoints
- CORS configuration

**2. Authentication Module**
- Basic Auth handler (username + API key)
- **X-Instance-Name header** (REQUIRED for every request)
- Credential validation
- Secure credential storage (environment variables)
- Multi-server URL support (CZ, SK, COM, EU endpoints)

**3. API Client Layer**
- Axios-based HTTP client
- Base URL configuration (supports 4 Raynet server regions)
- Request/response interceptors
- Error transformation
- Retry logic for transient failures (exponential backoff)
- **Rate limit management:**
  - Track `X-Ratelimit-Remaining` header
  - Respect 24,000 requests/day limit
  - Enforce max 4 concurrent connections
  - Queue requests when approaching limits

**4. Tool Handlers**
- Input validation using Zod schemas
- Business logic execution
- Response formatting
- Error handling with Polish messages

**5. Utility Modules**
- Logger (structured logging)
- Error formatter
- Data transformers
- Type definitions

---

## Sprint Breakdown

> **Updated Timeline:** Total MVP duration is **21-23 days** (approximately 4-5 weeks) with buffer time for integration testing and security review.

### Sprint 0: Project Setup & Infrastructure (Days 1-2)

**Objectives:**
- Initialize project structure
- Set up development environment
- Configure Railway deployment
- Establish testing framework

**Detailed Steps:**

1. **Project Initialization**
   - [ ] Create new Node.js project with TypeScript
   - [ ] Install dependencies:
     - `@modelcontextprotocol/sdk`
     - `express`
     - `axios`
     - `zod`
     - `dotenv`
     - `winston` (logging)
   - [ ] Install dev dependencies:
     - `typescript`
     - `@types/node`
     - `@types/express`
     - `tsx` (TypeScript execution and watch mode)
     - `vitest` (testing)
     - `@modelcontextprotocol/inspector` (MCP testing tool - CORRECTED)
     - `msw` (Mock Service Worker for API mocking)
     - `nock` (HTTP mocking alternative)
   - [ ] Configure TypeScript (`tsconfig.json`)
   - [ ] Set up ESLint and Prettier

2. **Project Structure**
   ```
   raynet-mcp-server/
   ├── src/
   │   ├── index.ts              # Entry point
   │   ├── server.ts             # MCP server setup
   │   ├── config/
   │   │   └── env.ts            # Environment config
   │   ├── api/
   │   │   ├── client.ts         # Raynet API client
   │   │   └── types.ts          # API type definitions
   │   ├── tools/
   │   │   ├── companies.ts      # Company tools
   │   │   ├── contacts.ts       # Contact tools
   │   │   ├── deals.ts          # Deal tools
   │   │   └── schemas.ts        # Zod validation schemas
   │   ├── utils/
   │   │   ├── logger.ts         # Winston logger
   │   │   ├── errors.ts         # Error handling
   │   │   └── formatters.ts     # Data formatters
   │   └── types/
   │       └── index.ts          # Shared types
   ├── tests/
   │   ├── setup.ts
   │   ├── api/
   │   ├── tools/
   │   └── integration/
   ├── .env.example
   ├── .env
   ├── railway.json
   ├── package.json
   └── README.md
   ```

3. **Railway Configuration**
   - [ ] Create `railway.json` with build/start commands
   - [ ] Set up environment variables in Railway dashboard
   - [ ] Configure health check endpoint
   - [ ] Set up custom domain (optional)

4. **Environment Setup**
   - [ ] Create `.env.example` template
   - [ ] Document required variables:
     - `RAYNET_INSTANCE_URL` (e.g., https://app.raynetcrm.com/api/v2/)
     - `RAYNET_INSTANCE_NAME` **(REQUIRED - e.g., my-crm)**
     - `RAYNET_USERNAME` (email address)
     - `RAYNET_API_KEY` (API key from Raynet)
     - `PORT` (default: 3000)
     - `NODE_ENV` (development, production)
     - `LOG_LEVEL` (debug, info, warn, error)
   - [ ] Document optional variables:
     - `RAYNET_MAX_RETRIES` (default: 3)
     - `RAYNET_TIMEOUT_MS` (default: 30000)
     - `RAYNET_RATE_LIMIT_BUFFER` (default: 100)
     - `LOG_FORMAT` (json, pretty)

5. **Testing Framework**
   - [ ] Configure Vitest
   - [ ] Set up test utilities
   - [ ] **Mocking Strategy:**
     - [ ] Use `nock` for HTTP request mocking in unit tests
     - [ ] Create fixture files with sample Raynet API responses
     - [ ] Set up MSW (Mock Service Worker) for integration tests
     - [ ] Document test data cleanup procedures
   - [ ] Set up integration test environment
   - [ ] Create test Raynet instance or use sandbox (if available)

**Success Criteria:**
- ✅ Project builds without errors (`npm run build`)
- ✅ TypeScript compilation successful
- ✅ Can run development server (`npm run dev`)
- ✅ Railway deployment pipeline configured
- ✅ Environment variables loaded correctly
- ✅ Test framework runs (`npm test`)

**Tests:**
- [x] Build compiles successfully
- [x] Server starts on specified port
- [x] Health check endpoint responds
- [x] Environment variables are loaded
- [x] Logger writes to console

---

### Sprint 0.5: API Discovery & Validation (Day 3)

**Objectives:**
- Validate Raynet API access with actual credentials
- Discover instance-specific configurations
- Test all planned endpoints
- Document API quirks and limitations

**Detailed Steps:**

1. **API Access Validation**
   - [ ] Test basic authentication with provided credentials
   - [ ] Verify `X-Instance-Name` header requirement
   - [ ] Test connection to correct server URL (CZ/SK/COM/EU)
   - [ ] Verify SSL/TLS connection

2. **Endpoint Testing**
   - [ ] Test GET `/company/` - list companies
   - [ ] Test POST `/company/` - create test company
   - [ ] Test GET `/company/{id}/` - get company details
   - [ ] Test PUT `/company/{id}/` - update company
   - [ ] Test DELETE `/company/{id}/` - delete test company
   - [ ] Repeat for `/person/` and `/businessCase/` endpoints
   - [ ] Test external ID lookup `/company/ext/{extId}/`

3. **Configuration Discovery**
   - [ ] Fetch available picklists (ratings, states, roles)
   - [ ] Document custom fields configured in instance
   - [ ] Test pagination (offset/limit) behavior
   - [ ] Test fulltext search capabilities
   - [ ] Document any instance-specific validations

4. **Rate Limiting Analysis**
   - [ ] Observe `X-Ratelimit-*` headers
   - [ ] Document current limits for instance
   - [ ] Test concurrent connection limits
   - [ ] Verify retry behavior on 429 responses

5. **Documentation**
   - [ ] Create API_FINDINGS.md with discoveries
   - [ ] Document any deviations from OpenAPI spec
   - [ ] List required vs optional fields per entity
   - [ ] Note any Polish-specific formatting requirements

**Success Criteria:**
- ✅ Successfully authenticated with provided credentials
- ✅ All core endpoints (company, person, businessCase) accessible
- ✅ Instance configuration documented
- ✅ Rate limits understood and documented
- ✅ No blocking issues found

**Tests:**
- [x] Authentication succeeds
- [x] Can create, read, update, delete test records
- [x] Pagination works as expected
- [x] Fulltext search returns results
- [x] Rate limit headers present in responses
- [x] Polish characters (ąęółżźćń) handled correctly

### Issues & Blockers

_Track any unexpected findings here_

### Notes

_Document API-specific behaviors discovered during testing_

---

### Sprint 1: Core Infrastructure & Authentication (Days 4-6)

**Objectives:**
- Implement Raynet API client
- Set up authentication
- Create base MCP server with SSE
- Implement logging and error handling

**Detailed Steps:**

1. **Raynet API Client** (`src/api/client.ts`)
   - [ ] Create Axios instance with base configuration
   - [ ] Implement Basic Auth header generation
   - [ ] **Add `X-Instance-Name` header to all requests**
   - [ ] Add request interceptor for authentication
   - [ ] Add response interceptor for error handling
   - [ ] **Implement rate limit tracking:**
     - [ ] Parse `X-Ratelimit-Remaining` header
     - [ ] Parse `X-Ratelimit-Reset` header
     - [ ] Queue requests when < 100 remaining
     - [ ] Enforce max 4 concurrent connections
     - [ ] Auto-wait on 429 responses
   - [ ] Implement retry logic (3 attempts with exponential backoff)
   - [ ] Add request/response logging (sanitize credentials)
   - [ ] Type definitions for API responses:
     ```typescript
     interface RaynetResponse<T> {
       success: boolean;
       totalCount?: number;
       data: T;
     }
     interface RaynetListResponse<T> {
       success: boolean;
       totalCount: number;
       data: T[];
     }
     ```

2. **Error Handling** (`src/utils/errors.ts`)
   - [ ] Create custom error classes:
     - `RaynetAPIError`
     - `AuthenticationError`
     - `ValidationError`
     - `NotFoundError`
   - [ ] Implement error formatter with Polish messages
   - [ ] Map HTTP status codes to error types
   - [ ] Create error response builder

3. **Logger Setup** (`src/utils/logger.ts`)
   - [ ] Configure Winston logger
   - [ ] Set up log levels (debug, info, warn, error)
   - [ ] Add structured logging format
   - [ ] Configure file and console transports
   - [ ] Add request ID tracking

4. **MCP Server Setup** (`src/server.ts`)
   - [ ] Initialize MCP Server with SSE transport
   - [ ] Set up Express app
   - [ ] Configure SSE endpoint (`/sse`)
   - [ ] Add CORS middleware
   - [ ] Implement health check endpoint (`/health`)
   - [ ] Add graceful shutdown handling

5. **Configuration Module** (`src/config/env.ts`)
   - [ ] Load and validate environment variables
   - [ ] Export typed configuration object
   - [ ] Add validation for required variables
   - [ ] Document configuration options

**Success Criteria:**
- ✅ API client successfully authenticates with Raynet
- ✅ Can make test API call (e.g., GET /company/)
- ✅ Errors are properly caught and formatted in Polish
- ✅ Logs are written with proper structure
- ✅ SSE endpoint accepts connections
- ✅ Health check returns server status
- ✅ Server handles shutdown gracefully

**Tests:**
- [x] API client authentication works
- [x] Request interceptor adds auth headers
- [x] Response interceptor handles errors
- [x] Retry logic works for transient failures
- [x] Error messages are in Polish
- [x] Logger writes structured logs
- [x] SSE connection established successfully
- [x] Health endpoint returns 200 OK
- [x] CORS headers present

---

### Sprint 2: Companies Module (Days 7-10)

**Objectives:**
- Implement all company-related tools
- Add comprehensive validation
- Write unit and integration tests

**Detailed Steps:**

1. **Type Definitions** (`src/api/types.ts`)
   ```typescript
   interface Company {
     id: number;
     name: string;
     rating?: 'A' | 'B' | 'C' | 'D';
     state?: 'A_POTENTIAL' | 'B_ACTUAL' | 'C_INVALID';
     category?: number;
     owner?: number;
     regNumber?: string;
     taxNumber?: string;
     // ... other fields
   }
   ```

2. **Validation Schemas** (`src/tools/schemas.ts`)
   - [ ] `searchCompaniesSchema` - validate search parameters
   - [ ] `getCompanySchema` - validate company ID
   - [ ] `createCompanySchema` - validate required fields (name)
   - [ ] `updateCompanySchema` - validate update payload
   - [ ] `deleteCompanySchema` - validate deletion request

3. **Tool Implementations** (`src/tools/companies.ts`)

   **A. raynet_search_companies**
   - [ ] Accept parameters: query (text), limit, offset, rating, category, tags
   - [ ] Build Raynet API query string
   - [ ] Handle fulltext search
   - [ ] Format results with company ID, name, rating, owner
   - [ ] Return Polish descriptions
   - [ ] Handle empty results

   **B. raynet_get_company**
   - [ ] Accept company_id parameter
   - [ ] Fetch full company details
   - [ ] Format response with all relevant fields
   - [ ] Handle not found error

   **C. raynet_create_company**
   - [ ] Accept required parameter: name
   - [ ] Accept optional: rating, owner, category, tags, contacts
   - [ ] Validate required fields
   - [ ] Make POST request to /company/
   - [ ] Return created company ID and details
   - [ ] Handle validation errors

   **D. raynet_update_company**
   - [ ] Accept company_id + fields to update
   - [ ] Validate update payload
   - [ ] Make PUT request to /company/{id}/
   - [ ] Return success message
   - [ ] Handle partial updates

   **E. raynet_delete_company**
   - [ ] Accept company_id
   - [ ] Make DELETE request
   - [ ] Return confirmation message
   - [ ] Handle deletion errors (e.g., company has dependencies)

4. **Register Tools with MCP Server**
   - [ ] Add tool definitions to server
   - [ ] Map tool names to handlers
   - [ ] Add Polish tool descriptions
   - [ ] Document parameters in Polish

5. **Response Formatting**
   - [ ] Create formatter for company list
   - [ ] Format single company details
   - [ ] Add helper functions for common fields
   - [ ] Ensure consistent Polish field names

**Success Criteria:**
- ✅ All 5 company tools registered and callable
- ✅ Search returns filtered results
- ✅ Can retrieve company by ID
- ✅ Can create new company with minimum required fields
- ✅ Can update company fields
- ✅ Can delete company
- ✅ All responses in Polish
- ✅ Validation errors return helpful messages
- ✅ All unit tests pass (>80% coverage)

**Tests:**
- [x] Search companies with various filters
- [x] Search with fulltext query
- [x] Search with pagination
- [x] Get existing company
- [x] Get non-existent company (404)
- [x] Create company with required fields only
- [x] Create company with all fields
- [x] Create company with invalid data
- [x] Update company single field
- [x] Update company multiple fields
- [x] Update non-existent company
- [x] Delete existing company
- [x] Delete non-existent company
- [x] Delete company with dependencies

---

### Sprint 3: Contacts Module (Days 11-14)

**Objectives:**
- Implement all contact-related tools
- Handle contact-company relationships
- Add comprehensive validation

**Detailed Steps:**

1. **Type Definitions** (`src/api/types.ts`)
   ```typescript
   interface Contact {
     id: number;
     firstName: string;
     lastName: string;
     company?: number; // Company ID
     titleBefore?: string;
     titleAfter?: string;
     email?: string;
     phone?: string;
     // ... other fields
   }
   ```

2. **Validation Schemas** (`src/tools/schemas.ts`)
   - [ ] `searchContactsSchema`
   - [ ] `getContactSchema`
   - [ ] `createContactSchema` - require firstName or lastName
   - [ ] `updateContactSchema`
   - [ ] `deleteContactSchema`
   - [ ] `linkContactToCompanySchema`

3. **Tool Implementations** (`src/tools/contacts.ts`)

   **A. raynet_search_contacts**
   - [ ] Accept: query, company_id, limit, offset
   - [ ] Support filtering by company
   - [ ] Fulltext search across name, email, phone
   - [ ] Return contact details with company link
   - [ ] Format results in Polish

   **B. raynet_get_contact**
   - [ ] Accept contact_id
   - [ ] Fetch full details including company relationship
   - [ ] Format phone numbers, emails
   - [ ] Include company name if linked

   **C. raynet_create_contact**
   - [ ] Require firstName OR lastName (at least one)
   - [ ] Optional: company, email, phone, title
   - [ ] Validate email format
   - [ ] Validate phone format
   - [ ] Create contact in Raynet
   - [ ] Return created contact ID

   **D. raynet_update_contact**
   - [ ] Accept contact_id + update fields
   - [ ] Validate email/phone if provided
   - [ ] Update contact
   - [ ] Return success message

   **E. raynet_delete_contact**
   - [ ] Accept contact_id
   - [ ] Delete contact
   - [ ] Handle deletion errors

   **F. raynet_link_contact_to_company**
   - [ ] Accept contact_id + company_id
   - [ ] Create relationship
   - [ ] Verify both entities exist
   - [ ] Return confirmation

4. **Data Formatting**
   - [ ] Format contact names (titleBefore + name + titleAfter)
   - [ ] Format contact info (email, phone)
   - [ ] Display company relationship clearly
   - [ ] Polish field labels

**Success Criteria:**
- ✅ All 6 contact tools implemented
- ✅ Can search contacts globally and by company
- ✅ Can create contact with minimal data
- ✅ Can link/unlink contacts to companies
- ✅ Email and phone validation works
- ✅ All responses in Polish
- ✅ Unit tests pass (>80% coverage)

**Tests:**
- [x] Search all contacts
- [x] Search contacts by company
- [x] Search with fulltext query
- [x] Get contact with company link
- [x] Get contact without company
- [x] Create contact (firstName only)
- [x] Create contact (lastName only)
- [x] Create contact with email
- [x] Create contact with invalid email
- [x] Link contact to existing company
- [x] Link contact to non-existent company
- [x] Update contact email
- [x] Update contact phone
- [x] Delete contact

---

### Sprint 4: Deals Module (Days 15-18)

**Objectives:**
- Implement business case (deal) tools
- Handle deal lifecycle states
- Integrate with companies and contacts

**Detailed Steps:**

1. **Type Definitions** (`src/api/types.ts`)
   ```typescript
   interface Deal {
     id: number;
     topic: string; // Required
     company?: number;
     person?: number; // Contact
     businessCase?: number; // Deal type
     owner?: number;
     value?: number;
     probability?: number;
     validFrom?: string;
     validTill?: string;
     // ... other fields
   }
   ```

2. **Validation Schemas** (`src/tools/schemas.ts`)
   - [ ] `searchDealsSchema`
   - [ ] `getDealSchema`
   - [ ] `createDealSchema` - require topic
   - [ ] `updateDealSchema`
   - [ ] `deleteDealSchema`

3. **Tool Implementations** (`src/tools/deals.ts`)

   **A. raynet_search_deals**
   - [ ] Accept: query, company_id, owner, status, limit, offset
   - [ ] Filter by company
   - [ ] Filter by owner (user)
   - [ ] Filter by deal stage/status
   - [ ] Sort by value, date
   - [ ] Return deal summaries

   **B. raynet_get_deal**
   - [ ] Accept deal_id
   - [ ] Fetch complete deal details
   - [ ] Include company and contact info
   - [ ] Format currency values (PLN)
   - [ ] Show probability percentage
   - [ ] Display deal timeline

   **C. raynet_create_deal**
   - [ ] Require: topic
   - [ ] Optional: company, contact, value, probability, owner
   - [ ] Set default dates (validFrom = today)
   - [ ] Create deal
   - [ ] Return deal ID and details

   **D. raynet_update_deal**
   - [ ] Accept deal_id + update fields
   - [ ] Allow status changes
   - [ ] Update value, probability
   - [ ] Update dates
   - [ ] Return updated deal

   **E. raynet_delete_deal**
   - [ ] Accept deal_id
   - [ ] Option to mark as lost vs delete
   - [ ] Confirm deletion
   - [ ] Return success message

4. **Business Logic**
   - [ ] Validate deal stages match Raynet configuration
   - [ ] Calculate weighted value (value × probability)
   - [ ] Format dates in Polish format (DD.MM.YYYY)
   - [ ] Currency formatting (PLN)

5. **Integration Helpers**
   - [ ] Fetch related company when displaying deal
   - [ ] Fetch related contact when displaying deal
   - [ ] Show deal owner name

**Success Criteria:**
- ✅ All 5 deal tools implemented
- ✅ Can create deal with company and contact
- ✅ Can update deal status/value
- ✅ Search filters work correctly
- ✅ Currency and dates formatted correctly
- ✅ All responses in Polish
- ✅ Unit tests pass (>80% coverage)

**Tests:**
- [x] Search all deals
- [x] Search deals by company
- [x] Search deals by owner
- [x] Search deals by status
- [x] Get deal with all relationships
- [x] Create minimal deal (topic only)
- [x] Create full deal (all fields)
- [x] Update deal value
- [x] Update deal probability
- [x] Update deal status
- [x] Delete deal
- [x] Mark deal as lost
- [x] Currency formatting correct
- [x] Date formatting correct

---

### Sprint 5: Integration & Testing (Days 19-23)

**Objectives:**
- End-to-end integration testing
- n8n workflow integration
- Performance optimization
- Documentation

**Detailed Steps:**

1. **Integration Testing**
   - [ ] Test complete workflows:
     - Create company → Create contact → Link → Create deal
     - Search company → Get details → Update
     - Search deals → Get deal → Update status
   - [ ] Test error scenarios across tools
   - [ ] Test concurrent requests
   - [ ] Test rate limiting behavior

2. **n8n Integration Testing**
   - [ ] Deploy MCP server to Railway
   - [ ] Connect to Claude API with MCP configuration
   - [ ] Create test n8n workflow
   - [ ] Test each tool from n8n → Claude → MCP → Raynet
   - [ ] Verify response formatting in Telegram
   - [ ] Test error handling in conversation flow

3. **Performance Optimization**
   - [ ] Add response caching for frequently accessed data
   - [ ] Optimize API calls (batch where possible)
   - [ ] Add request queuing if needed
   - [ ] Monitor memory usage
   - [ ] Profile slow operations
   - [ ] **Performance targets (adjusted for multi-hop architecture):**
     - [ ] Simple queries (get by ID): < 3 seconds end-to-end
     - [ ] Search operations: < 5 seconds
     - [ ] Create/update operations: < 4 seconds
     - [ ] Rationale: Telegram → n8n → Claude → MCP → Raynet adds latency

4. **Error Handling Improvements**
   - [ ] Review all error messages for clarity
   - [ ] Ensure all errors are in Polish
   - [ ] Add helpful suggestions for common errors
   - [ ] Test error recovery scenarios

5. **Documentation**
   - [ ] Complete README.md with:
     - Installation instructions
     - Configuration guide
     - Tool reference (all 16 tools)
     - Usage examples
     - Troubleshooting guide
   - [ ] Add API documentation
   - [ ] Document environment variables
   - [ ] Create deployment guide for Railway
   - [ ] Add n8n integration guide

6. **Logging & Monitoring**
   - [ ] Review log output quality
   - [ ] Add performance metrics logging
   - [ ] Set up error alerting (optional)
   - [ ] Add usage statistics

**Success Criteria:**
- ✅ All integration tests pass
- ✅ Successfully tested from n8n workflow
- ✅ Telegram bot can perform all CRM operations
- ✅ Response times meet adjusted targets (3-5s for simple queries)
- ✅ Error messages are clear and actionable in Polish
- ✅ Complete documentation available
- ✅ Railway deployment stable
- ✅ No memory leaks detected
- ✅ Rate limiting works under load

**Tests:**
- [x] End-to-end: Create company flow
- [x] End-to-end: Create contact flow
- [x] End-to-end: Create deal flow
- [x] End-to-end: Search and update flow
- [x] n8n: Each tool callable from workflow
- [x] n8n: Errors propagate correctly
- [x] Performance: Simple query < 3s
- [x] Performance: Search < 5s
- [x] Performance: Create/update < 4s
- [x] Performance: Handles 4 concurrent requests (Raynet limit)
- [x] Performance: No memory leaks over 1000 requests
- [x] Error: Network failure recovery
- [x] Error: Invalid credentials handling
- [x] Error: Rate limit handling (429 response)
- [x] Error: Polish character encoding (ąęółżźćń)
- [x] Unicode: Company names with diacritics
- [x] Empty results: Graceful handling

---

### Sprint 6: Polish & Production Ready (Days 24-26)

**Objectives:**
- Final polish and refinements
- Security review
- Production deployment
- User acceptance testing

> **Important:** Schedule native Polish speaker review by Day 20 to allow time for corrections before production deployment.

**Detailed Steps:**

1. **Security Review**
   - [ ] Verify no credentials in logs
   - [ ] Check environment variable usage
   - [ ] Review CORS configuration
   - [ ] Validate input sanitization
   - [ ] Check for SQL injection risks (if any)
   - [ ] Review error messages (no sensitive data)

2. **Polish Language Review**
   - [ ] Review all tool descriptions
   - [ ] Check all error messages
   - [ ] Verify field labels
   - [ ] Test with native Polish speaker
   - [ ] Ensure consistent terminology

3. **Final Testing**
   - [ ] Run full test suite
   - [ ] Manual testing of all tools
   - [ ] Test edge cases
   - [ ] Load testing (if applicable)
   - [ ] Verify all success criteria met

4. **Production Deployment**
   - [ ] Deploy to Railway production
   - [ ] Configure production environment variables
   - [ ] Set up monitoring/logging
   - [ ] Verify health checks working
   - [ ] Test production endpoint

5. **User Acceptance Testing**
   - [ ] Test with actual Telegram bot workflow
   - [ ] Perform real CRM operations
   - [ ] Gather feedback
   - [ ] Make final adjustments

6. **Handoff Documentation**
   - [ ] Create maintenance guide
   - [ ] Document common issues and solutions
   - [ ] List future enhancement ideas
   - [ ] Provide contact for support

**Success Criteria:**
- ✅ Security review passed (no vulnerabilities)
- ✅ All Polish text reviewed and approved
- ✅ 100% test pass rate
- ✅ Production deployment successful
- ✅ User acceptance testing passed
- ✅ Documentation complete and clear
- ✅ Ready for daily use

**Tests:**
- [x] Security scan passes
- [x] All environment variables secure
- [x] CORS configured correctly
- [x] Production health check responds
- [x] All tools work in production
- [x] Real user completes CRM task successfully
- [x] Error handling works as expected
- [x] Logs contain no sensitive data

---

## Beyond MVP: Future Enhancements

### Phase 2: Extended CRM Functionality (Post-MVP)

#### Activities & Task Management

**Tools to Add:**
1. **raynet_search_activities** - Search tasks, meetings, calls
   - Filter by type (task, meeting, call, email)
   - Filter by status (planned, completed, cancelled)
   - Filter by date range
   - Filter by owner/participant
   - Sort by priority, date

2. **raynet_get_activity** - Get activity details
   - Full activity information
   - Participants list
   - Related company/contact/deal
   - Notes and attachments info

3. **raynet_create_activity** - Create new activity
   - Support multiple types (task, meeting, call)
   - Set priority (low, medium, high)
   - Add participants
   - Link to company/contact/deal
   - Set reminders

4. **raynet_update_activity** - Update existing activity
   - Change status
   - Reschedule
   - Update participants
   - Add notes

5. **raynet_complete_activity** - Mark activity as done
   - Complete task
   - Add completion notes
   - Update related entities

**Business Value:**
- Complete task management from Telegram
- Meeting scheduling and reminders
- Call logging and follow-up tracking
- Better team coordination

**Complexity:** Medium
**Estimated Time:** 5-7 days

---

#### Products & Catalog Management

**Tools to Add:**
1. **raynet_search_products** - Find products in catalog
   - Search by name, code, category
   - Filter by price range
   - Filter by availability
   - Sort by price, name

2. **raynet_get_product** - Get product details
   - Full product information
   - Pricing details
   - Stock information
   - Product variants

3. **raynet_create_product** - Add new product
   - Required: name, code
   - Optional: price, category, description
   - Set product variants
   - Upload product image URL

4. **raynet_update_product** - Update product info
   - Change pricing
   - Update description
   - Modify categories
   - Update stock levels

5. **raynet_link_product_to_deal** - Add product to opportunity
   - Specify quantity
   - Set discount
   - Calculate total value

**Business Value:**
- Quick product lookup during sales calls
- Price quoting from mobile
- Product catalog management
- Deal value calculation

**Complexity:** Medium
**Estimated Time:** 5-7 days

---

#### Offers & Quotations

**Tools to Add:**
1. **raynet_search_offers** - Find quotes
   - Filter by status (draft, sent, accepted, rejected)
   - Filter by company
   - Filter by date range
   - Sort by value, date

2. **raynet_get_offer** - Get offer details
   - Full quote information
   - Line items with products
   - Pricing breakdown
   - PDF generation status

3. **raynet_create_offer** - Create new quote
   - Link to deal
   - Add products with quantities
   - Set discounts
   - Add terms and conditions

4. **raynet_update_offer** - Modify quote
   - Add/remove line items
   - Change quantities
   - Update pricing
   - Change status

5. **raynet_generate_offer_pdf** - Create PDF quote
   - Generate professional PDF
   - Return download URL
   - Send to client option

6. **raynet_send_offer** - Email quote to client
   - Send via Raynet email
   - Track delivery
   - Log communication

**Business Value:**
- Create quotes on the go
- Fast quote generation
- Professional PDF quotes
- Track quote status

**Complexity:** High (PDF generation, email integration)
**Estimated Time:** 7-10 days

---

#### Projects Management

**Tools to Add:**
1. **raynet_search_projects** - Find projects
   - Filter by status
   - Filter by company
   - Filter by date range
   - Sort by value, deadline

2. **raynet_get_project** - Get project details
   - Project information
   - Tasks and milestones
   - Team members
   - Budget and timeline

3. **raynet_create_project** - Start new project
   - Link to company/deal
   - Set timeline
   - Add team members
   - Define budget

4. **raynet_update_project** - Update project
   - Change status
   - Update timeline
   - Modify budget
   - Add team members

5. **raynet_get_project_tasks** - List project tasks
   - All tasks in project
   - Filter by status
   - Assigned to specific person

**Business Value:**
- Project tracking from mobile
- Team coordination
- Deadline monitoring
- Budget tracking

**Complexity:** Medium-High
**Estimated Time:** 7-10 days

---

### Phase 3: Analytics & Reporting

#### Dashboard & Statistics

**Tools to Add:**
1. **raynet_get_sales_dashboard** - Key sales metrics
   - Total pipeline value
   - Deals by stage
   - Win rate statistics
   - Revenue forecast
   - Period comparison (month, quarter, year)

2. **raynet_get_sales_funnel** - Pipeline analysis
   - Deals count by stage
   - Average deal size by stage
   - Conversion rates
   - Time in stage
   - Visual representation data

3. **raynet_get_team_performance** - Team statistics
   - Activities by team member
   - Deals won/lost per person
   - Average response time
   - Task completion rate

4. **raynet_get_company_insights** - Company analytics
   - Revenue by company
   - Deal history
   - Activity history
   - Communication frequency

5. **raynet_get_activity_report** - Activity summary
   - Activities completed today/week/month
   - Activities by type
   - Overdue activities
   - Upcoming activities

**Business Value:**
- Quick insights via Telegram
- Performance monitoring
- Sales forecasting
- Data-driven decisions

**Complexity:** Medium
**Estimated Time:** 5-7 days

---

#### Custom Reports

**Tools to Add:**
1. **raynet_create_custom_report** - Generate custom report
   - Define date range
   - Select metrics
   - Filter by criteria
   - Export format (JSON, CSV)

2. **raynet_schedule_report** - Automated reporting
   - Set report frequency (daily, weekly, monthly)
   - Define recipients
   - Configure delivery time
   - Telegram notification option

**Business Value:**
- Customized business intelligence
- Automated reporting
- Scheduled updates
- Export capabilities

**Complexity:** High
**Estimated Time:** 7-10 days

---

### Phase 4: Advanced Automation

#### Bulk Operations

**Tools to Add:**
1. **raynet_bulk_create_contacts** - Import multiple contacts
   - CSV/JSON input
   - Validation before import
   - Link to companies
   - Error reporting

2. **raynet_bulk_update_deals** - Update multiple deals
   - Mass status change
   - Mass owner assignment
   - Tag addition/removal
   - Batch operations

3. **raynet_bulk_tag_companies** - Tag multiple companies
   - Add tags to selection
   - Remove tags from selection
   - Tag by criteria

4. **raynet_export_data** - Export CRM data
   - Export companies/contacts/deals
   - Filter and select fields
   - CSV/JSON format
   - Large dataset handling

**Business Value:**
- Time-saving bulk operations
- Data migration support
- Mass updates
- Data export for analysis

**Complexity:** High
**Estimated Time:** 10-14 days

---

#### Intelligent Automation

**Tools to Add:**
1. **raynet_smart_lead_scoring** - AI-powered lead scoring
   - Analyze company data
   - Predict deal probability
   - Suggest next actions
   - Priority recommendations

2. **raynet_duplicate_detection** - Find duplicates
   - Detect duplicate companies
   - Detect duplicate contacts
   - Suggest merges
   - Fuzzy matching

3. **raynet_activity_suggestions** - Recommend next actions
   - Based on deal stage
   - Based on last contact
   - Based on company history
   - Automated reminders

4. **raynet_email_parsing** - Extract data from emails
   - Parse contact information
   - Detect action items
   - Create activities automatically
   - Link to existing entities

**Business Value:**
- AI-enhanced workflows
- Reduced data quality issues
- Proactive suggestions
- Intelligent automation

**Complexity:** Very High (requires ML/AI)
**Estimated Time:** 14-21 days

---

### Phase 5: Integrations & Extensions

#### Communication Integration

**Tools to Add:**
1. **raynet_log_email** - Log email communication
   - Link email to company/contact
   - Store email content
   - Track responses
   - Email threading

2. **raynet_log_call** - Log phone calls
   - Record call details
   - Link to entities
   - Set follow-up tasks
   - Call duration tracking

3. **raynet_create_meeting_notes** - Add meeting notes
   - Link to meeting activity
   - Rich text notes
   - Action items extraction
   - Participant summary

**Business Value:**
- Complete communication history
- Better context in conversations
- Automatic logging
- Follow-up tracking

**Complexity:** Medium
**Estimated Time:** 5-7 days

---

#### Document Management

**Tools to Add:**
1. **raynet_upload_document** - Upload file to entity
   - Link to company/contact/deal
   - File type validation
   - Metadata tagging
   - Version control

2. **raynet_search_documents** - Find documents
   - Search by name
   - Filter by type
   - Filter by entity
   - Full-text search in content

3. **raynet_get_document** - Retrieve document
   - Get document metadata
   - Generate download URL
   - Preview generation
   - Access control check

**Business Value:**
- Centralized document storage
- Easy document retrieval
- Mobile document access
- Better organization

**Complexity:** Medium-High
**Estimated Time:** 7-10 days

---

#### Workflow Automation

**Tools to Add:**
1. **raynet_create_workflow** - Define automation workflow
   - Trigger conditions
   - Action steps
   - Conditional logic
   - Notification rules

2. **raynet_trigger_workflow** - Execute workflow manually
   - Run specific workflow
   - Pass parameters
   - Monitor execution
   - Get results

3. **raynet_get_workflow_status** - Check workflow execution
   - Execution history
   - Success/failure status
   - Error logs
   - Performance metrics

**Business Value:**
- Process automation
- Consistent workflows
- Reduced manual work
- Error reduction

**Complexity:** Very High
**Estimated Time:** 14-21 days

---

### Phase 6: Multi-language Support

#### Internationalization

**Features to Add:**
1. **Language Detection**
   - Auto-detect user language
   - Support Czech (Raynet's primary market)
   - Support Slovak
   - Support German
   - Maintain Polish

2. **Translatable Content**
   - Tool descriptions in multiple languages
   - Error messages localized
   - Field labels translated
   - Help text in user language

3. **Language Configuration**
   - User preference setting
   - Per-conversation language
   - Fallback language
   - Language switching command

**Business Value:**
- Expand to Czech/Slovak markets
- Better user experience
- International teams support
- Market expansion

**Complexity:** Medium
**Estimated Time:** 7-10 days

---

### Phase 7: Performance & Scalability

#### Advanced Features

**Tools to Add:**
1. **Smart Caching Layer**
   - Cache frequently accessed data
   - Intelligent cache invalidation
   - Redis integration
   - Performance monitoring

2. **Request Queuing**
   - Handle high load
   - Priority queue
   - Rate limit management
   - Request throttling

3. **Webhook Support**
   - Real-time Raynet updates
   - Push notifications to Telegram
   - Event streaming
   - Change detection

4. **Batch Processing**
   - Optimize multiple requests
   - Reduce API calls
   - Parallel processing
   - Result aggregation

**Business Value:**
- Better performance
- Handle more users
- Real-time updates
- Reduced API costs

**Complexity:** Very High
**Estimated Time:** 14-21 days

---

### Phase 8: Advanced User Features

#### Conversational Enhancements

**Features to Add:**
1. **Context Memory**
   - Remember conversation context
   - User preferences
   - Recent actions
   - Favorite filters

2. **Natural Language Processing**
   - Better query understanding
   - Fuzzy search
   - Synonym handling
   - Intent recognition

3. **Smart Suggestions**
   - Predict user needs
   - Suggest relevant actions
   - Quick action buttons
   - Common task shortcuts

4. **Voice Support**
   - Voice message handling
   - Speech-to-text
   - Verbal commands
   - Audio responses

**Business Value:**
- More natural interaction
- Faster task completion
- Better user experience
- Hands-free operation

**Complexity:** Very High
**Estimated Time:** 21-30 days

---

### Implementation Priority Matrix

| Phase | Feature Set | Business Value | Complexity | Dependencies | Estimated Time |
|-------|-------------|----------------|------------|--------------|----------------|
| 2 | Activities | High | Medium | MVP Complete | 5-7 days |
| 2 | Products | High | Medium | MVP Complete | 5-7 days |
| 2 | Offers | High | High | Products | 7-10 days |
| 2 | Projects | Medium | Medium-High | MVP Complete | 7-10 days |
| 3 | Analytics | High | Medium | MVP Complete | 5-7 days |
| 3 | Custom Reports | Medium | High | Analytics | 7-10 days |
| 4 | Bulk Operations | High | High | MVP Complete | 10-14 days |
| 4 | Intelligent Automation | Medium | Very High | Bulk Ops | 14-21 days |
| 5 | Communication | Medium | Medium | MVP Complete | 5-7 days |
| 5 | Documents | Medium | Medium-High | MVP Complete | 7-10 days |
| 5 | Workflows | High | Very High | MVP Complete | 14-21 days |
| 6 | Multi-language | Medium | Medium | MVP Complete | 7-10 days |
| 7 | Performance | High | Very High | MVP Complete | 14-21 days |
| 8 | Conversational | Medium | Very High | MVP Complete | 21-30 days |

---

### Recommended Roadmap Post-MVP

**Quarter 1 (Months 1-3):**
- Phase 2: Activities, Products, Offers (Critical CRM features)
- Phase 3: Analytics (Quick wins for value demonstration)

**Quarter 2 (Months 4-6):**
- Phase 4: Bulk Operations (Productivity boost)
- Phase 5: Communication Integration (Better data completeness)
- Phase 7: Performance (Prepare for scale)

**Quarter 3 (Months 7-9):**
- Phase 2: Projects (Extend CRM coverage)
- Phase 5: Documents (Complete information management)
- Phase 6: Multi-language (Market expansion)

**Quarter 4 (Months 10-12):**
- Phase 4: Intelligent Automation (AI-powered features)
- Phase 5: Workflows (Advanced automation)
- Phase 8: Conversational Enhancements (UX improvement)

---

### Success Metrics for Beyond MVP

**Phase 2 Metrics:**
- Number of activities created via Telegram
- Products added to deals
- Quotes generated and sent
- Project tracking adoption rate

**Phase 3 Metrics:**
- Dashboard views per user/day
- Report downloads
- Time saved in reporting
- Decision speed improvement

**Phase 4 Metrics:**
- Bulk operations usage
- Data quality improvement
- Time saved in data entry
- Duplicate reduction rate

**Phase 5 Metrics:**
- Communication logs created
- Documents uploaded
- Workflow executions
- Manual task reduction

**Phase 6-8 Metrics:**
- Multi-language user adoption
- System response time
- User satisfaction score
- Task completion rate

---

## Comprehensive Test Suite

### Unit Tests (per module)

**Companies Module:**
1. Search validation works
2. Create validation requires name
3. Update validation allows partial updates
4. API client builds correct query strings
5. Response formatter handles missing fields
6. Error formatter returns Polish messages

**Contacts Module:**
7. Requires firstName OR lastName
8. Email validation works
9. Phone validation works
10. Company linking validates both IDs
11. Response includes company name when linked

**Deals Module:**
12. Topic is required
13. Currency formatting correct (PLN)
14. Date formatting correct (DD.MM.YYYY Polish format)
15. Probability validation (0-100)
16. Value must be positive number

**Rate Limiting Module:**
17. Tracks `X-Ratelimit-Remaining` header correctly
18. Queues requests when < 100 remaining
19. Respects max 4 concurrent connections
20. Handles 429 response with auto-retry
21. Logs rate limit warnings

**Polish Character Handling:**
22. Company names with ąęółżźćń stored correctly
23. Contact names with diacritics retrieved correctly
24. Search works with Polish characters
25. Error messages display Polish correctly

### Integration Tests

**API Client:**
26. Authentication header added (Basic Auth)
27. `X-Instance-Name` header present in all requests
28. Retry logic works (exponential backoff)
29. Error transformation correct
30. Timeout handling works (30s default)
31. Rate limit headers tracked
32. 429 response triggers queue delay

**End-to-End Workflows:**
33. Create company → contact → deal (full flow)
34. Search → get → update (typical use case)
35. Delete with dependencies fails gracefully
36. Concurrent requests handled (respects 4 limit)
37. External ID lookup works (`/company/ext/{extId}/`)
38. Empty search results handled gracefully
39. Unicode data persists through full cycle

**Error Scenarios:**
40. Network failure recovery (connection reset)
41. Invalid credentials (401 response)
42. Rate limit exceeded (429 response)
43. Resource not found (404 response)
44. Invalid input data (400 response)
45. Server error (500 response)

### MCP Integration Tests

**Server:**
46. SSE connection established successfully
47. Tool discovery works (lists all 16 tools)
48. Tool execution returns results
49. Errors propagate correctly to client
50. Connection reconnect works after disconnect
51. Health check endpoint responds

**n8n Integration:**
52. Each tool callable from n8n workflow
53. Response format compatible with Telegram
54. Error messages display correctly in Telegram
55. Complex workflows execute successfully
56. Polish characters render in Telegram
57. Long responses handled (Telegram message limits)
58. Tool response times meet SLA (3-5s)

**Security Tests:**
59. API credentials not exposed in logs
60. Error messages don't leak sensitive data
61. Input validation prevents injection attacks
62. CORS configured correctly for production
63. Environment variables not in client responses

---

## Definition of Done (DoD)

Each sprint is considered complete when:

1. **Code Quality:**
   - All code reviewed
   - TypeScript compilation successful
   - ESLint passes with no errors
   - Test coverage > 80%
   - **No hardcoded strings - all user-facing text from localization module**
   - **All sensitive data sanitized from logs**

2. **Functionality:**
   - All acceptance criteria met
   - All tests pass (unit, integration, E2E)
   - Manual testing completed
   - No critical bugs
   - **All API calls include proper error context (endpoint, params, timestamp)**
   - **Rate limit headers logged and monitored**
   - **Polish diacritics render correctly in all contexts**

3. **Documentation:**
   - Code commented where necessary (complex logic explained)
   - README updated with new features
   - API documentation current
   - Test documentation complete
   - **All tool responses include execution timestamp**
   - **Error messages provide actionable guidance**

4. **Deployment:**
   - Deployed to Railway successfully
   - Environment variables configured (including `RAYNET_INSTANCE_NAME`)
   - Health checks passing
   - Logs clean and informative (no sensitive data)
   - **Rate limiting enforced and tested**
   - **Polish language validation completed**

5. **Security:**
   - No credentials in logs or error messages
   - Environment variables properly scoped
   - Input validation on all user inputs
   - **`X-Instance-Name` header set on all requests**
   - **Basic auth credentials never exposed**

---

## Risk Management

**Potential Risks:**

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **1. Raynet API Changes** | Low | High | Version API endpoints, monitor Raynet changelog, implement API version detection |
| **2. Railway Platform Issues** | Low | Medium | Document fallback deployment options (Render, Fly.io), maintain deployment scripts |
| **3. Rate Limiting (24k/day)** | Medium | High | Implement request queuing, response caching, rate limit monitoring dashboard |
| **4. Authentication Failures** | Low | High | Robust error handling, credential validation, clear error messages, retry logic |
| **5. n8n Compatibility** | Medium | High | Early integration testing (Sprint 1), flexible response formats, version compatibility matrix |
| **6. Raynet API Timeout** | Medium | High | Implement circuit breaker pattern, timeout handling, fallback responses |
| **7. Instance-Specific Configs** | High | Medium | Fetch and validate custom fields at startup, document instance variations |
| **8. Polish Character Encoding** | Medium | Medium | Ensure UTF-8 throughout stack, test with ąęółżźćń, validate Telegram rendering |
| **9. MCP Connection Issues** | Medium | High | Test MCP connectivity early (Sprint 0.5), implement reconnection logic, heartbeat monitoring |
| **10. Railway Cold Start Latency** | Medium | Low | Keep-alive endpoints, warm-up strategy, scale to always-on instance |
| **11. Concurrent Connection Limit (4 max)** | High | Medium | Request queue with priority, connection pooling, enforce max 3 concurrent (buffer) |
| **12. Invalid API Credentials** | Low | Critical | Validate on startup, fail-fast, clear error messages, credential rotation support |

### Risk Response Plan

**High-Priority Risks (Address in MVP):**
1. Rate limiting management (Sprint 1)
2. Instance-specific configuration handling (Sprint 0.5)
3. n8n integration compatibility (Sprint 5)
4. Concurrent connection limits (Sprint 1)

**Medium-Priority Risks (Monitor and Mitigate):**
5. API timeouts (Sprint 1)
6. Polish character encoding (Sprint 2-4)
7. Railway cold starts (Sprint 6)

**Low-Priority Risks (Accept and Document):**
8. Railway platform issues (have backup plan)
9. API version changes (monitor, respond as needed)

---

## Timeline Summary

- **Sprint 0:** Days 1-2 (Project Setup & Infrastructure)
- **Sprint 0.5:** Day 3 (API Discovery & Validation) **← NEW**
- **Sprint 1:** Days 4-6 (Core Infrastructure & Authentication)
- **Sprint 2:** Days 7-10 (Companies/Accounts Module)
- **Sprint 3:** Days 11-14 (Contacts/Persons Module)
- **Sprint 4:** Days 15-18 (Deals/Business Cases Module)
- **Sprint 5:** Days 19-23 (Integration & Testing)
- **Sprint 6:** Days 24-26 (Polish & Production Ready)

**Total MVP Duration:** 26 days (approximately 5-6 weeks)

**Breakdown by Phase:**
- Setup & Discovery: 3 days
- Core Infrastructure: 3 days
- Entity Modules: 12 days (4 days each × 3 modules)
- Integration & Testing: 5 days
- Production Readiness: 3 days

**Buffer Time:** 5 days added for integration complexity and security review

**Post-MVP Development:** Estimated 6-12 months for full feature set

### Comparison to Original Estimate

| Aspect | Original | Updated | Difference |
|--------|----------|---------|------------|
| Total Duration | 18 days | 26 days | +8 days (+44%) |
| Setup Phase | 2 days | 3 days | +1 day (API discovery) |
| Infrastructure | 2 days | 3 days | +1 day (rate limiting) |
| Integration | 3 days | 5 days | +2 days (realistic testing) |
| Production | 2 days | 3 days | +1 day (security review) |

**Rationale for Extended Timeline:**
- Sprint 0.5 added for real API validation
- Rate limiting implementation is complex
- Multi-hop architecture (Telegram→n8n→Claude→MCP→Raynet) needs thorough testing
- Polish language review requires coordination
- Security review should not be rushed
