# Raynet MCP Server - Claude Context

**Last Updated:** 2026-01-29
**Project Status:** Production-Ready (Deployed to Railway with Auto-Deploy)
**Test Pass Rate:** 100% (90/90 tests passing)
**Deployment:** Railway with GitHub auto-deploy enabled

---

## Project Overview

This is a Model Context Protocol (MCP) server that integrates Claude AI with Raynet CRM. The server provides 91 MCP tools covering companies, contacts, deals, leads, activities, products, offers, sales orders, and projects management through natural language interactions.

**Key Technologies:**
- TypeScript 5.0+
- MCP SDK (@modelcontextprotocol/sdk)
- Axios for Raynet API integration
- Vitest for testing
- Node.js 18+

**API Base:** `https://app.raynet.cz/api/v2`

---

## Recent Session Summary (2026-01-29)

### What Was Accomplished

**Major Achievement:** Fixed activity filtering and owner assignment bugs. Configured Railway auto-deployment from GitHub. Updated n8n workflow prompts to ensure proper company context when creating activities.

**Bugs Fixed:**
1. **Activity company filter incorrect** - Changed from `company[EQ]` to `companyContextFilter` (Raynet API uses special context filters for activities)
2. **Activity owner assignment not company-aware** - Activities now automatically use the company's CRM owner when `companyId` is provided
3. **InPost activities not linked to company** - Fixed Task 268 and Meeting 269 to properly link to InPost company (ID 46)

**Infrastructure Updates:**
- **GitHub auto-deploy to Railway** - Configured Railway to automatically deploy on push to main branch (no more manual `railway up` needed)
- **Bearer token authentication** - Verified HTTP server properly authenticates requests
- **n8n workflow updates** - Updated Raymund workflow CRM Agent prompt via n8n API to require `companyId` when creating activities

**Testing & Verification:**
- Verified activity creation with company context works correctly
- Confirmed owner assignment uses company's CRM owner
- Tested GitHub → Railway auto-deployment pipeline
- All systems operational on Railway

**Files Modified:**
- `src/api/activities.ts` - Fixed company filter and added company-aware owner assignment

**Git Commits:**
- `14f320e` - Verify GitHub auto-deploy
- `984f984` - Assign activities to company's CRM owner
- `621b028` - Fix activity company filter - use companyContextFilter

---

## Previous Session Summary (2026-01-26)

### What Was Accomplished

**Major Achievement:** Added 44 new MCP tools and fixed 3 API bugs. The server now has 91 total tools with a 100% test pass rate (90/90 tests).

**New Tools Added (44 total):**
- **Products:** 7 tools - CRUD operations, search, and listing
- **Company Addresses:** 5 tools - add, list, update, set primary, delete
- **Contact Relationships:** 5 tools - add, list, update, set primary, delete
- **Offers:** 9 tools - CRUD, items management, search, list
- **Sales Orders:** 10 tools - CRUD, items management, search, list
- **Projects:** 8 tools - CRUD, participant management, search, list

**Bugs Fixed:**
1. **Sales Order `dealId` required** - Made dealId a required field in schemas (Raynet API requires businessCase for sales orders)
2. **Project participant endpoint incorrect** - Changed from `/participant/` to `/participants/` (plural)
3. **Project participant field name incorrect** - Changed from `role` to `note` to match Raynet API

**Testing:**
- Created comprehensive test suite v2 (`tests/integration/comprehensive-test-v2.ts`)
- Tested all 91 MCP tools with both minimal and full field sets
- Updated test results in docs/TEST_REPORT.md
- All 90 test invocations pass (100% pass rate)

**Files Added:**
- `src/api/products.ts` - Product API service
- `src/api/offers.ts` - Offer API service
- `src/api/salesOrders.ts` - Sales Order API service
- `src/api/projects.ts` - Project API service
- `src/tools/products.ts` - Product MCP tools
- `src/tools/offers.ts` - Offer MCP tools
- `src/tools/salesOrders.ts` - Sales Order MCP tools
- `src/tools/projects.ts` - Project MCP tools
- `tests/integration/comprehensive-test-v2.ts` - New test suite

**Files Modified:**
- `src/api/companies.ts` - Added address management functions
- `src/api/contacts.ts` - Added relationship management functions
- `src/api/enums.ts` - Added product category enum
- `src/api/index.ts` - Export new modules
- `src/tools/companies.ts` - Added address tools
- `src/tools/contacts.ts` - Added relationship tools
- `src/tools/index.ts` - Export new tools
- `src/types/index.ts` - Added types for new entities
- `docs/TEST_REPORT.md` - Updated test documentation

**Git Commit:** 2f32eb8

---

## Previous Session Summary (2026-01-24)

### What Was Accomplished

**Major Achievement:** Fixed all 7 critical bugs that were preventing API operations from working correctly. The server achieved 100% test pass rate (49/49 tests).

**Bugs Fixed:**
1. **Company formatCompany null pointer crash** - Fixed owner?.fullName undefined access
2. **Company creation missing required defaults** - Added state, role, rating defaults
3. **Activity date format issue** - Normalized ISO dates to YYYY-MM-DD HH:mm format
4. **Activity creation missing owner/deadline** - Added required fields with proper defaults
5. **Contact list filter by company unsupported** - Switched to relationship endpoint
6. **Lead priority field not supported** - Removed unsupported field from API calls
7. **Activity priority field not supported** - Removed unsupported field from API calls

**Git Commit:** 770c425

---

## Architecture & Code Organization

### Directory Structure

```
src/
├── index.ts                 # Entry point
├── server.ts                # MCP server setup
├── config/
│   └── env.ts              # Environment configuration
├── api/                    # Raynet API service layer
│   ├── client.ts           # Axios client with auth
│   ├── companies.ts        # Company CRUD + address operations
│   ├── contacts.ts         # Contact CRUD + relationship operations
│   ├── deals.ts            # Deal CRUD operations
│   ├── activities.ts       # Activity CRUD operations
│   ├── leads.ts            # Lead CRUD operations
│   ├── products.ts         # Product CRUD operations
│   ├── offers.ts           # Offer CRUD + items operations
│   ├── salesOrders.ts      # Sales Order CRUD + items operations
│   ├── projects.ts         # Project CRUD + participants operations
│   └── enums.ts            # Enum/lookup data
├── tools/                  # MCP tool implementations (91 total)
│   ├── companies.ts        # 11 company tools (6 base + 5 address)
│   ├── contacts.ts         # 12 contact tools (7 base + 5 relationship)
│   ├── deals.ts            # 8 deal tools
│   ├── activities.ts       # 9 activity tools
│   ├── leads.ts            # 9 lead tools
│   ├── products.ts         # 7 product tools
│   ├── offers.ts           # 9 offer tools
│   ├── salesOrders.ts      # 10 sales order tools
│   ├── projects.ts         # 8 project tools
│   └── enums.ts            # 8 enum tools
├── utils/
│   ├── logger.ts           # Winston logger
│   └── errors.ts           # Error handling utilities
└── types/
    └── index.ts            # TypeScript type definitions

docs/
├── RAYNET-API.md            # Raynet API documentation
├── TEST_REPORT.md           # Integration test results
├── implementation-plan.md   # Project implementation plan
├── test-results.md          # Historical test results
├── openapi-spec.json        # Raynet OpenAPI specification
├── api-exploration-results.json
└── sessions/                # Session documentation
    ├── SESSION_LOG.md
    ├── NEXT_SESSION.md
    └── SESSION_SUMMARY_*.md

scripts/
├── explore-api.js           # API exploration utility
├── create-sprint-issues.sh  # GitHub issue creation
└── manual-tests/            # Manual API test scripts
    ├── test-activities.js
    ├── test-companies.js
    ├── test-contacts.js
    ├── test-deals.js
    ├── test-leads.js
    ├── test-connection.js
    └── test-instance-names.js

tests/
├── integration/
│   ├── comprehensive-test.ts     # Original test suite (47 tools)
│   └── comprehensive-test-v2.ts  # Full test suite (91 tools)
├── unit/
│   └── config.test.ts
└── setup.ts
```

### Key Design Patterns

**1. Service Layer Pattern**
- `api/` directory contains service classes for each entity
- Each service handles all CRUD operations for its entity type
- Services use the shared Axios client with authentication

**2. Tool Layer Pattern**
- `tools/` directory contains MCP tool definitions
- Each tool calls the appropriate service method
- Tools handle input validation (via Zod schemas) and output formatting
- Tools format responses in Polish for end users

**3. Error Handling**
- Defensive null checking (e.g., `owner?.fullName ?? 'N/A'`)
- Try-catch blocks in all API calls
- Polish error messages for user-facing errors
- Detailed error logging for debugging

---

## Critical Code Patterns & Conventions

### Date Handling (CRITICAL)

The Raynet API is very particular about date formats:

```typescript
// WRONG - ISO format causes "Błąd w danych wejściowych"
scheduledFrom: "2026-01-25T10:00:00.000Z"

// CORRECT - Raynet expects YYYY-MM-DD HH:mm
scheduledFrom: "2026-01-25 10:00"

// Implementation pattern:
function normalizeDate(isoDate: string): string {
  return isoDate.replace('T', ' ').slice(0, 16); // "YYYY-MM-DD HH:mm"
}
```

**Rule:** Always normalize dates before sending to Raynet API.

### Required Field Defaults (CRITICAL)

Many Raynet API endpoints require fields even when documentation says they're optional:

```typescript
// Company creation - requires these defaults
const payload = {
  name: companyName,
  state: 'A_POTENTIAL',      // REQUIRED (not in docs)
  role: 'A_PARTNER',          // REQUIRED (not in docs)
  rating: 'C',                // REQUIRED (not in docs)
  ...otherFields
};

// Activity creation - requires owner and deadline
const payload = {
  title: title,
  owner: owner || { id: 1 }, // Default to system user
  scheduledFrom: date,
  estimatedDuration: 60,
  completed: false,
  deadline: date              // REQUIRED for activities
};
```

**Rule:** Always provide sensible defaults for fields that might be "required but undocumented."

### Null Safety in Formatting Functions

```typescript
// WRONG - will crash if owner is undefined
const ownerName = company.owner.fullName;

// CORRECT - defensive null checking
const ownerName = company.owner?.fullName ?? 'N/A';

// Pattern for nested object access
const contactName = contact.person?.firstName
  ? `${contact.person.firstName} ${contact.person.lastName || ''}`
  : 'N/A';
```

**Rule:** Use optional chaining (`?.`) and nullish coalescing (`??`) for all nested object access.

### Unsupported Fields

Some fields are documented but not supported by the API:

```typescript
// WRONG - these cause "unexpected error"
const leadPayload = {
  topic: "Test Lead",
  priority: "HIGH"  // NOT SUPPORTED - remove this
};

const activityPayload = {
  title: "Call client",
  priority: "HIGH"  // NOT SUPPORTED - remove this
};

// CORRECT - omit unsupported fields
const leadPayload = {
  topic: "Test Lead"
  // priority field removed
};
```

**Rule:** If you encounter "unexpected error" with no details, check if you're sending unsupported fields.

### Contact-Company Relationship

```typescript
// WRONG - filtering contacts by company ID doesn't work
GET /contact/?company=123

// CORRECT - use the relationship endpoint
GET /company/123/relationship/person
```

**Rule:** Use relationship endpoints when filtering by parent entities.

### Activity Filtering by Company (CRITICAL)

The Raynet API uses special "context filters" for activities instead of standard query operators:

```typescript
// WRONG - standard query operators don't work for activities
params['company[EQ]'] = companyId;
params['person[EQ]'] = contactId;
params['businessCase[EQ]'] = dealId;

// CORRECT - use context filters
params['companyContextFilter'] = companyId;
params['personContextFilter'] = contactId;
params['businessCaseContextFilter'] = dealId;
```

**Rule:** Always use `*ContextFilter` parameters when filtering activities by related entities.

### Company-Aware Owner Assignment

When creating activities for a specific company, the activity should be assigned to that company's CRM owner:

```typescript
// Get company's owner
const companyOwnerId = await getCompanyOwnerId(companyId);

// Use company owner, or fall back to default
const ownerId = companyOwnerId ?? await getOwnerId();
```

**Rule:** Activities should inherit ownership from their parent company when possible.

---

## API Service Layer Conventions

### Error Handling Pattern

```typescript
export async function createEntity(data: any): Promise<any> {
  try {
    logger.info('Creating entity', { data });

    // Normalize dates
    if (data.scheduledFrom) {
      data.scheduledFrom = normalizeDate(data.scheduledFrom);
    }

    // Add required defaults
    const payload = {
      ...data,
      state: data.state || 'A_DEFAULT',
    };

    const response = await client.post('/entity/', payload);
    logger.info('Entity created', { id: response.data.data.id });

    return response.data;
  } catch (error) {
    logger.error('Failed to create entity', { error, data });
    throw error;
  }
}
```

### Response Format Pattern

All API responses follow this structure:

```typescript
{
  success: boolean,
  data: {
    id: number,
    // ... entity fields
  },
  totalCount?: number  // For list operations
}
```

---

## MCP Tool Layer Conventions

### Tool Definition Pattern

```typescript
server.tool(
  "raynet_action_entity",
  "Description in English for Claude",
  {
    // Zod schema for input validation
    field: z.string().describe("Field description in English"),
    optionalField: z.string().optional().describe("Optional field")
  },
  async ({ field, optionalField }) => {
    try {
      // Call service layer
      const result = await EntityService.performAction(field, optionalField);

      // Format response in POLISH for user
      return {
        content: [{
          type: "text",
          text: `✅ Akcja wykonana pomyślnie\n\nDetale:\n- Pole: ${field}`
        }]
      };
    } catch (error) {
      logger.error('Tool execution failed', { error });
      return {
        content: [{
          type: "text",
          text: `❌ Błąd: ${error.message}`
        }],
        isError: true
      };
    }
  }
);
```

**Key Points:**
- Tool names in English (raynet_verb_entity)
- Tool descriptions in English (for Claude to understand)
- Input field descriptions in English (for Claude to understand)
- **Output text in Polish** (for end users)
- Always include try-catch for error handling
- Use emojis for visual clarity (✅ ❌ 📊 📅 etc.)

---

## Testing Patterns

### Integration Test Structure

The comprehensive test suite (`tests/integration/comprehensive-test.ts`) follows this pattern:

```typescript
// Phase 1: Test enum tools (no dependencies)
// Phase 2: Test company tools
// Phase 3: Test contact tools (depends on companies)
// Phase 4: Test deal tools (depends on companies)
// Phase 5: Test lead tools
// Phase 6: Test activity tools
// Cleanup: Delete all created entities
```

**Pattern:**
1. Create entities with both minimal and full field sets
2. Capture IDs from response text (regex extraction)
3. Use IDs for get/update operations
4. Clean up at the end

**Run tests:**
```bash
npx tsx tests/integration/comprehensive-test.ts
```

---

## Known Limitations & Workarounds

### 1. Slow Activity Queries

`raynet_get_today_activities` and `raynet_get_overdue_activities` take ~30 seconds because they query 4 activity types sequentially.

**Current Implementation:**
```typescript
// Queries each type sequentially
const tasks = await getActivities({ activityType: 'TASK', ... });
const meetings = await getActivities({ activityType: 'MEETING', ... });
const calls = await getActivities({ activityType: 'PHONE_CALL', ... });
const emails = await getActivities({ activityType: 'EMAIL', ... });
```

**Potential Improvement:** Use `Promise.all()` for parallel requests (not implemented yet).

### 2. ID Extraction from Formatted Text

Some tools return formatted Polish text, making it hard to extract IDs for subsequent operations.

**Current Workaround:** Regex extraction from response text
**Better Solution:** Return structured data with both formatted text and raw IDs (not implemented yet)

### 3. Relationship Endpoint Variations

Some relationships use different endpoint patterns:
- Contact → Company: `/company/{id}/relationship/person`
- Deal → Company: `/businessCase/{id}/relationship/company`

**Rule:** Always check Raynet API docs for the specific relationship endpoint pattern.

---

## Environment Variables

Required configuration (`.env` file or Claude Desktop config):

```bash
RAYNET_INSTANCE_URL=https://app.raynet.cz/api/v2
RAYNET_INSTANCE_NAME=your-instance-name
RAYNET_USERNAME=your-email@domain.com
RAYNET_API_KEY=your-api-key

# Optional
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# For HTTP server with authentication
MCP_AUTH_TOKEN=your-bearer-token  # Required for Railway/n8n deployment
```

---

## Deployment

### Railway Deployment

The MCP server is deployed on Railway with automatic deployment from GitHub.

**Configuration:**
- **Auto-deploy:** Enabled on push to main branch
- **Start command:** `npm start` (runs HTTP server on port 3000)
- **Build command:** `npm install && npm run build`
- **Authentication:** Bearer token required in Authorization header

**Environment Variables on Railway:**
- All Raynet credentials (RAYNET_INSTANCE_URL, RAYNET_INSTANCE_NAME, RAYNET_USERNAME, RAYNET_API_KEY)
- MCP_AUTH_TOKEN for request authentication
- PORT (provided by Railway)
- NODE_ENV=production

**Deployment Process:**
1. Push code to GitHub main branch
2. Railway automatically detects changes
3. Railway builds and deploys new version
4. Service restarts with zero downtime

**Access:**
- Public URL provided by Railway
- Use Bearer token in Authorization header
- n8n workflows connect via HTTP JSON-RPC

### Local Development

For local development with STDIO transport:

```bash
npm run dev
```

For local development with HTTP server:

```bash
npm run dev:http
```

---

## Common Debugging Patterns

### 1. Date Format Issues

**Symptom:** "Błąd w danych wejściowych" (Input data error)

**Check:** Are you sending dates in YYYY-MM-DD HH:mm format?

```bash
# Good date
"2026-01-25 10:00"

# Bad date (will fail)
"2026-01-25T10:00:00.000Z"
```

### 2. Required Field Issues

**Symptom:** "State cannot be null" or similar validation errors

**Check:** Add defaults for potentially required fields:

```typescript
const payload = {
  ...userInput,
  state: userInput.state || 'A_POTENTIAL',
  role: userInput.role || 'A_PARTNER',
  rating: userInput.rating || 'C'
};
```

### 3. Null Pointer Exceptions

**Symptom:** "Cannot read properties of undefined"

**Check:** Are you accessing nested objects without null checks?

```typescript
// Add optional chaining and nullish coalescing
const name = entity.owner?.fullName ?? 'N/A';
```

### 4. Unexpected API Errors

**Symptom:** "Wystąpił nieoczekiwany błąd" (Unexpected error)

**Check:** Are you sending unsupported fields like `priority`?

```typescript
// Remove fields that cause errors
delete payload.priority; // Not supported by Raynet
```

---

## Next Steps & Future Improvements

### Immediate Priorities (All Complete)
- ✅ Fix formatCompany null pointer
- ✅ Fix activity date format
- ✅ Add company required field defaults
- ✅ Remove unsupported priority fields
- ✅ Fix contact filtering by company
- ✅ Create comprehensive test suite
- ✅ Achieve 100% test pass rate

### Future Enhancements

**Performance Optimizations (Low Priority):**
- [ ] Parallel requests for activity queries (reduce 30s → ~8s)
- [ ] Response caching for enum data
- [ ] Add retry logic with exponential backoff
- [ ] Add rate limit tracking and warnings

**Code Quality & Testing (Medium Priority):**
- [ ] Automatic semantic versioning
- [ ] Review against MCP best practices guide
- [ ] Security audit (API key handling, input validation, error messages)
- [ ] Comprehensive unit test coverage
- [ ] API response type validation
- [ ] Return structured data alongside formatted text

**New Features (As Requested):**
- [ ] Bulk operations support
- [ ] Advanced filtering and search
- [ ] Custom reporting tools
- [ ] Webhook support for real-time updates

---

## Critical Reference: Bug Fixes Applied

### Bug 1: formatCompany Crash
**File:** `src/tools/companies.ts` (line ~341)
**Before:**
```typescript
const owner = company.owner.fullName;
```
**After:**
```typescript
const owner = company.owner?.fullName ?? 'N/A';
```

### Bug 2: Missing Company Defaults
**File:** `src/api/companies.ts` (createCompany function)
**After:**
```typescript
const companyData = {
  name,
  state: 'A_POTENTIAL',
  role: 'A_PARTNER',
  rating: 'C',
  ...otherFields
};
```

### Bug 3: Activity Date Format
**File:** `src/api/activities.ts`
**Added:**
```typescript
function normalizeDate(isoDate: string): string {
  return isoDate.replace('T', ' ').slice(0, 16);
}
// Apply to scheduledFrom and deadline fields
```

### Bug 4: Activity Missing Fields
**File:** `src/api/activities.ts` (createActivity function)
**Added:**
```typescript
owner: owner || { id: 1 },
deadline: scheduledFrom,
estimatedDuration: estimatedDuration || 60
```

### Bug 5: Contact Filter by Company
**File:** `src/api/contacts.ts` (listContacts function)
**Changed:**
```typescript
// From: GET /contact/?company=${companyId}
// To: GET /company/${companyId}/relationship/person
```

### Bug 6 & 7: Remove Priority Field
**Files:** `src/api/leads.ts`, `src/api/activities.ts`
**Removed:**
```typescript
// Delete this field before API calls
delete activityData.priority;
delete leadData.priority;
```

### Bug 8: Sales Order `dealId` Required (2026-01-26)
**Files:** `src/tools/salesOrders.ts`, `src/types/index.ts`
**Issue:** Creating sales orders without `dealId` returned "Blad w danych wejsciowych"
**Fix:** Made `dealId` a required field in CreateSalesOrderSchema and CreateSalesOrderWithItemsSchema

### Bug 9: Project Participant Endpoint (2026-01-26)
**File:** `src/api/projects.ts`
**Before:**
```typescript
const response = await client.post(`/project/${projectId}/participant/`, { ... });
```
**After:**
```typescript
const response = await client.post(`/project/${projectId}/participants/`, { ... });
```

### Bug 10: Project Participant Field Name (2026-01-26)
**Files:** `src/api/projects.ts`, `src/tools/projects.ts`, `src/types/index.ts`
**Before:**
```typescript
{ person: { id: personId }, role: 'Developer' }
```
**After:**
```typescript
{ person: { id: personId }, note: 'Developer' }
```

### Bug 11: Activity Company Filter Incorrect (2026-01-29)
**File:** `src/api/activities.ts`
**Issue:** Filtering activities by company ID returned no results
**Root Cause:** Raynet API uses special context filters (`companyContextFilter`) instead of standard query operators (`company[EQ]`)
**Before:**
```typescript
if (companyId) params['company[EQ]'] = companyId;
if (contactId) params['person[EQ]'] = contactId;
if (dealId) params['businessCase[EQ]'] = dealId;
```
**After:**
```typescript
// Raynet API uses companyContextFilter for filtering activities by company
if (companyId) params['companyContextFilter'] = companyId;
if (contactId) params['personContextFilter'] = contactId;
if (dealId) params['businessCaseContextFilter'] = dealId;
```

### Bug 12: Activity Owner Assignment Not Company-Aware (2026-01-29)
**File:** `src/api/activities.ts`
**Issue:** All activities were assigned to a default owner, not the company's CRM owner
**Root Cause:** Activity creation didn't check company ownership before assigning
**Added:**
```typescript
/**
 * Get the owner ID for a specific company.
 * Returns the CRM user who manages/owns this company account.
 */
private async getCompanyOwnerId(companyId: number): Promise<number | null> {
  try {
    const response = await this.client.getOne<{ owner?: { id: number } }>(`/company/${companyId}/`);
    if (response.data?.owner?.id) {
      logger.info('Found company owner', { companyId, ownerId: response.data.owner.id });
      return response.data.owner.id;
    }
  } catch (error) {
    logger.warn('Failed to get owner ID for company', { companyId, error });
  }
  return null;
}

// In createActivity:
let ownerId: number;
if (companyId) {
  const companyOwnerId = await this.getCompanyOwnerId(companyId);
  ownerId = companyOwnerId ?? await this.getOwnerId();
  logger.info('Using company owner for activity', { companyId, ownerId });
} else {
  ownerId = await this.getOwnerId();
}
```

---

## Session Close Checklist

- [x] All critical bugs fixed
- [x] All tests passing (100% pass rate)
- [x] Changes committed to git
- [x] Changes pushed to GitHub (auto-deploys to Railway)
- [x] Railway deployment verified and working
- [x] Test report documented (docs/TEST_REPORT.md)
- [x] Code quality maintained (defensive programming)
- [x] No technical debt introduced
- [x] Session documented in CLAUDE.md

---

**Status:** Project is production-ready, deployed to Railway with auto-deploy from GitHub. All 91 MCP tools are fully functional and tested.

**Current Tool Count:** 91 tools (47 original + 44 new)
- Companies: 11 tools (6 base + 5 address management)
- Contacts: 12 tools (7 base + 5 relationship management)
- Deals: 8 tools
- Leads: 9 tools
- Activities: 9 tools
- Products: 7 tools
- Offers: 9 tools
- Sales Orders: 10 tools
- Projects: 8 tools
- Enums: 8 tools

**Deployment Status:**
- Railway: Live and healthy
- Auto-deploy: Enabled (pushes to main → automatic deployment)
- n8n Integration: Working (Raynet-MCP and Raymund workflows)
- Authentication: Bearer token enabled

**Next Session Priorities:**
1. Automatic semantic versioning
2. MCP best practices review
3. Security audit
4. Optional performance optimizations
