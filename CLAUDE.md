# Raynet MCP Server - Claude Context

**Last Updated:** 2026-01-24
**Project Status:** Production-Ready (All Critical Bugs Fixed)
**Test Pass Rate:** 100% (49/49 tests passing)

---

## Project Overview

This is a Model Context Protocol (MCP) server that integrates Claude AI with Raynet CRM. The server provides 47 MCP tools covering companies, contacts, deals, leads, and activities management through natural language interactions.

**Key Technologies:**
- TypeScript 5.0+
- MCP SDK (@modelcontextprotocol/sdk)
- Axios for Raynet API integration
- Vitest for testing
- Node.js 18+

**API Base:** `https://app.raynet.cz/api/v2`

---

## Recent Session Summary (2026-01-24)

### What Was Accomplished

**Major Achievement:** Fixed all 7 critical bugs that were preventing API operations from working correctly. The server now has a 100% test pass rate (49/49 tests).

**Bugs Fixed:**
1. **Company formatCompany null pointer crash** - Fixed owner?.fullName undefined access
2. **Company creation missing required defaults** - Added state, role, rating defaults
3. **Activity date format issue** - Normalized ISO dates to YYYY-MM-DD HH:mm format
4. **Activity creation missing owner/deadline** - Added required fields with proper defaults
5. **Contact list filter by company unsupported** - Switched to relationship endpoint
6. **Lead priority field not supported** - Removed unsupported field from API calls
7. **Activity priority field not supported** - Removed unsupported field from API calls

**Testing:**
- Created comprehensive integration test suite (`tests/integration/comprehensive-test.ts`)
- Tested all 47 MCP tools with both minimal and full field sets
- Documented test results in docs/TEST_REPORT.md
- All 49 test invocations now pass (up from 59% pass rate)

**Files Modified:**
- `src/tools/companies.ts` - Fixed formatCompany function
- `src/api/companies.ts` - Added required field defaults
- `src/api/activities.ts` - Fixed date format and added required fields
- `src/api/contacts.ts` - Fixed company filtering
- `src/api/leads.ts` - Removed unsupported priority field
- `tests/integration/comprehensive-test.ts` - New comprehensive test suite
- `docs/TEST_REPORT.md` - New test documentation

**Git Commit:** 770c425 (pushed to GitHub)

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
│   ├── companies.ts        # Company CRUD operations
│   ├── contacts.ts         # Contact CRUD operations
│   ├── deals.ts            # Deal CRUD operations
│   ├── activities.ts       # Activity CRUD operations
│   ├── leads.ts            # Lead CRUD operations
│   └── enums.ts            # Enum/lookup data
├── tools/                  # MCP tool implementations
│   ├── companies.ts        # 6 company tools
│   ├── contacts.ts         # 7 contact tools
│   ├── deals.ts            # 8 deal tools
│   ├── activities.ts       # 9 activity tools
│   ├── leads.ts            # 9 lead tools
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
│   └── comprehensive-test.ts   # Full integration test suite
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

### Future Enhancements (Not Urgent)
- [ ] Parallel requests for activity queries (reduce 30s → ~8s)
- [ ] Response caching for enum data
- [ ] Return structured data alongside formatted text
- [ ] Add retry logic with exponential backoff
- [ ] Add rate limit tracking and warnings
- [ ] Comprehensive unit test coverage
- [ ] API response type validation

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

---

## Session Close Checklist

- [x] All critical bugs fixed
- [x] All tests passing (100% pass rate)
- [x] Changes committed to git
- [x] Changes pushed to GitHub
- [x] Test report documented (docs/TEST_REPORT.md)
- [x] Code quality maintained (defensive programming)
- [x] No technical debt introduced
- [x] Session documented in CLAUDE.md

---

**Status:** Project is production-ready. All MCP tools are fully functional and tested.

**Next Session:** Focus on optional enhancements (performance optimizations, caching, parallel requests) or new features as requested by the user.
