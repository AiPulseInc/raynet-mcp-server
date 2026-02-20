# Raynet MCP Server - Claude Context

**Last Updated:** 2026-02-19
**Project Status:** Production-Ready (Deployed to Railway with Auto-Deploy)
**Unit Tests:** 41/41 passing | **Integration Tests:** 90/90 passing (comprehensive-test-v2.ts)
**Deployment:** Railway with GitHub auto-deploy enabled

---

## Project Overview

This is a Model Context Protocol (MCP) server that integrates Claude AI with Raynet CRM. The server provides 91 MCP tools covering companies, contacts, deals, leads, activities, products, offers, sales orders, and projects management through natural language interactions.

**Key Technologies:**
- TypeScript 5.0+
- MCP SDK (@modelcontextprotocol/sdk)
- Axios for Raynet API integration
- Vitest for testing (41 unit tests across 4 files)
- express-rate-limit for rate limiting
- Node.js 18+

**API Base:** `https://app.raynet.cz/api/v2`

---

## Context Memory

When you face a hard problem during a session, update (or create if non-existent) `memory.md` with a summary of the issue and solution. This file provides context to future sessions when replicating similar functionality in other projects.

---

## Recent Session Summary (2026-02-19)

### What Was Accomplished

**Sprint 1 — Security Hardening**
**Files:** `src/types/index.ts`, `src/config/env.ts`, `src/api/activities.ts`, `src/server-http.ts`, `tests/unit/security.test.ts`

1. **CORS wildcard fixed** — `CORS_ORIGIN` default changed from `'*'` to `''`. Header falls back to `'null'` (blocks cross-origin) when env var not set. Added production warning when CORS_ORIGIN is unrestricted.
2. **Hardcoded owner ID=1 removed** — New env var `RAYNET_DEFAULT_OWNER_ID` (optional). If set: use that ID with a warning log. If not set: throws Polish error `"Nie można określić właściciela aktywności. Ustaw zmienną RAYNET_DEFAULT_OWNER_ID."` Added `getConfig` import to `activities.ts`.

**Sprint 2 — Tool Router Refactor**
**Files:** `src/tools/index.ts`

- Replaced 10 `require()` calls with top-level `import` statements.
- Replaced fragile string-matching router (e.g. `toolName.includes('activit')`) with pre-computed `Map<string, ToolHandler>` built at module load — O(1) lookup, no false positives. `raynet_deactivate_something` no longer routes to activity handler.
- Added `npm run lint:no-require` script to enforce no dynamic require in tools/index.ts.

**Sprint 3 — Performance + Rate Limiting**
**Files:** `src/api/activities.ts`, `src/server-http.ts`, `package.json`

- **Parallel activity queries**: `list()`, `search()`, `getToday()`, `getOverdue()` now use `Promise.all` for all 4 activity types — reduces ~30s bottleneck to ~8s. One failing endpoint no longer blocks others.
- **express-rate-limit added**: 120 req/min per IP on `/mcp` endpoints. `/health` exempt. 429 returns valid JSON-RPC error with Polish message.

**Bug Fix — null companyId crash in Telegram (Raymund workflow)**
**Files:** `src/tools/activities.ts` | **n8n:** Raymund system prompt updated

- **Root cause:** On 2026-02-18, user sent Telegram messages asking Raymund to log an email to "Bas-Pol sp. z o.o.". AI passed `companyId: null` (lost from memory between turns). Zod `.optional()` rejects `null` (only accepts `undefined`), causing 3 silent execution failures (IDs 3028, 3025, 3023).
- **Fix 1 — MCP Server:** Changed `companyId`, `contactId`, `dealId` in `ListActivitiesSchema` and `CreateActivitySchema` from `.optional()` to `.nullish()`. Added null→undefined normalization in handlers before passing to service.
- **Fix 2 — Raymund prompt:** Added `# CRM Rules` section via n8n API: "Before calling ANY tool that uses companyId, FIRST call `raynet_search_companies`. NEVER pass null for companyId."

**Test Results:** 41/41 unit tests passing (was 5; added 36 new tests across 3 files)
- New: `tests/unit/security.test.ts`, `tests/unit/tool-router.test.ts`, `tests/unit/performance.test.ts`

**Git Commits:**
- `49f61c3` — feat: v0.81.0 — security hardening, tool router refactor, parallel activity queries
- `9b32cb8` — fix: accept null for companyId/contactId/dealId in activity tools

**Other n8n Issues Found (not fixed this session):**
- szach-mat workflow: Postgres "Tenant or user not found" — credentials issue
- call for action: Webhook returns invalid JSON (target service may be down)
- LinkedIn Publisher: `fetch is not defined` in code node (Node.js version issue)
- LinkedIn Publisher: Airtable insufficient permissions / missing field "title"

**Next Session Priorities:**
1. Test Raymund workflow with Bas-Pol to confirm the null-companyId fix works end-to-end
2. Investigate szach-mat Postgres credential issue if needed
3. Optional: check LinkedIn Publisher Airtable schema issues

---

## Previous Session Summary (2026-01-29)

**Major Achievement:** Fixed activity filtering and owner assignment bugs. Configured Railway auto-deployment from GitHub.

**Bugs Fixed:**
1. Activity company filter: changed from `company[EQ]` to `companyContextFilter`
2. Activity owner not company-aware: activities now use company's CRM owner when `companyId` provided
3. InPost activities not linked to company: fixed Task 268 and Meeting 269

**Infrastructure:** GitHub → Railway auto-deploy configured. Bearer token auth verified. Raymund n8n prompt updated to require `companyId` when creating activities.

**Files Modified:** `src/api/activities.ts`

**Git Commits:** `14f320e`, `984f984`, `621b028`

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
│   ├── activities.ts       # Activity CRUD + parallel queries
│   ├── leads.ts            # Lead CRUD operations
│   ├── products.ts         # Product CRUD operations
│   ├── offers.ts           # Offer CRUD + items operations
│   ├── salesOrders.ts      # Sales Order CRUD + items operations
│   ├── projects.ts         # Project CRUD + participants operations
│   └── enums.ts            # Enum/lookup data
├── tools/                  # MCP tool implementations (91 total)
│   ├── index.ts            # Map-based router (O(1) lookup)
│   ├── companies.ts        # 11 company tools
│   ├── contacts.ts         # 12 contact tools
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

tests/
├── integration/
│   ├── comprehensive-test.ts     # Original test suite (47 tools)
│   └── comprehensive-test-v2.ts  # Full test suite (91 tools, 90 invocations)
├── unit/
│   ├── config.test.ts
│   ├── security.test.ts      # CORS, rate limit, auth tests (NEW)
│   ├── tool-router.test.ts   # Map router correctness tests (NEW)
│   └── performance.test.ts   # Parallel query tests (NEW)
└── setup.ts

docs/sessions/               # Historical session documentation
```

### Key Design Patterns

1. **Service Layer Pattern** — `api/` directory, one class per entity, shared Axios client.
2. **Map-Based Tool Router** — `tools/index.ts` builds a `Map<string, ToolHandler>` at load time; no string-matching.
3. **Error Handling** — Defensive null checking, try-catch everywhere, Polish user-facing messages.

---

## Critical Code Patterns & Conventions

### Date Handling (CRITICAL)

```typescript
// WRONG — ISO format causes "Błąd w danych wejściowych"
scheduledFrom: "2026-01-25T10:00:00.000Z"
// CORRECT — Raynet expects YYYY-MM-DD HH:mm
scheduledFrom: "2026-01-25 10:00"
function normalizeDate(isoDate: string): string {
  return isoDate.replace('T', ' ').slice(0, 16);
}
```

### Required Field Defaults (CRITICAL)

```typescript
// Company creation requires undocumented defaults
const payload = { name, state: 'A_POTENTIAL', role: 'A_PARTNER', rating: 'C', ...otherFields };
// Activity creation requires owner and deadline
const payload = { title, owner: { id: ownerId }, scheduledFrom: date, estimatedDuration: 60, completed: false, deadline: date };
```

### Zod nullish() for LLM-Facing Fields (CRITICAL)

LLMs pass `null` for unknown optional numeric fields. Zod `.optional()` rejects `null`; use `.nullish()`:

```typescript
// WRONG — LLM sends null, Zod rejects it silently
companyId: z.number().int().positive().optional()
// CORRECT
companyId: z.number().int().positive().nullish()
// Then normalize in handler before passing to service:
companyId: input.companyId ?? undefined
```

### Null Safety in Formatting Functions

```typescript
const ownerName = company.owner?.fullName ?? 'N/A';
```

### Unsupported Fields

`priority` field causes "unexpected error" on leads and activities — omit it entirely.

### Activity Filtering by Company (CRITICAL)

```typescript
// WRONG
params['company[EQ]'] = companyId;
// CORRECT — Raynet uses context filters for activities
params['companyContextFilter'] = companyId;
params['personContextFilter'] = contactId;
params['businessCaseContextFilter'] = dealId;
```

### Company-Aware Owner Assignment

```typescript
const companyOwnerId = await getCompanyOwnerId(companyId);
const ownerId = companyOwnerId ?? await getOwnerId(); // getOwnerId throws if RAYNET_DEFAULT_OWNER_ID not set
```

### Tool Router — Map Pattern

```typescript
// tools/index.ts — built once at module load
const toolHandlers = new Map<string, ToolHandler>([
  ['raynet_list_companies', companiesHandler],
  // ... all 91 tools explicitly listed
]);
export function getHandler(toolName: string): ToolHandler | undefined {
  return toolHandlers.get(toolName);
}
```

### n8n Execution Diagnosis

Check failed executions:
```bash
GET /api/v1/executions?limit=20&status=error
```
`"Received tool input did not match expected schema"` → Zod validation failure (check `.nullish()` vs `.optional()`).

---

## API Service Layer Conventions

### Error Handling Pattern

```typescript
export async function createEntity(data: any): Promise<any> {
  try {
    if (data.scheduledFrom) data.scheduledFrom = normalizeDate(data.scheduledFrom);
    const payload = { ...data, state: data.state || 'A_DEFAULT' };
    const response = await client.post('/entity/', payload);
    return response.data;
  } catch (error) {
    logger.error('Failed to create entity', { error, data });
    throw error;
  }
}
```

All API responses: `{ success: boolean, data: { id: number, ... }, totalCount?: number }`

---

## MCP Tool Layer Conventions

- Tool names in English (`raynet_verb_entity`)
- Input descriptions in English (for Claude)
- **Output text in Polish** (for end users)
- Always include try-catch; return `{ content: [{ type: "text", text: "..." }], isError: true }` on failure
- Use `.nullish()` not `.optional()` for any field an LLM might supply as `null`

---

## Testing Patterns

**Unit tests (Vitest):** `npx vitest run`
**Integration tests:** `npx tsx tests/integration/comprehensive-test-v2.ts`

Integration test structure: Phase 1 enums → Phase 2 companies → Phase 3 contacts → Phase 4 deals → Phase 5 leads → Phase 6 activities → Cleanup.

---

## Known Limitations & Workarounds

### 1. Activity Queries — RESOLVED (2026-02-19)

`getToday()` and `getOverdue()` previously took ~30s (sequential queries). Now use `Promise.all` for all 4 activity types — reduced to ~8s. One failing endpoint no longer blocks others.

### 2. ID Extraction from Formatted Text

Tools return Polish formatted text; extracting IDs requires regex. Better solution (return structured data alongside text) not yet implemented.

### 3. Relationship Endpoint Variations

- Contact → Company: `/company/{id}/relationship/person`
- Deal → Company: `/businessCase/{id}/relationship/company`

Always check Raynet API docs for the specific relationship endpoint pattern.

---

## Environment Variables

```bash
RAYNET_INSTANCE_URL=https://app.raynet.cz/api/v2
RAYNET_INSTANCE_NAME=your-instance-name
RAYNET_USERNAME=your-email@domain.com
RAYNET_API_KEY=your-api-key

# Optional
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# HTTP server authentication (required for Railway/n8n deployment)
MCP_AUTH_TOKEN=your-bearer-token

# Activity owner fallback — set to a valid CRM user ID.
# If not set, activity creation will throw a Polish error when company owner cannot be resolved.
RAYNET_DEFAULT_OWNER_ID=1

# CORS — set to your n8n/client origin. Defaults to '' (blocks cross-origin).
# WARNING: Do not set to '*' in production.
CORS_ORIGIN=https://your-n8n-instance.com
```

---

## Deployment

### Railway Deployment

- **Auto-deploy:** Push to main branch → Railway builds and deploys automatically
- **Start command:** `npm start` (HTTP server on port 3000)
- **Build command:** `npm install && npm run build`
- **Authentication:** Bearer token in Authorization header

**Environment Variables on Railway:** All Raynet credentials + MCP_AUTH_TOKEN + RAYNET_DEFAULT_OWNER_ID + CORS_ORIGIN + PORT + NODE_ENV=production

### Local Development

```bash
npm run dev          # STDIO transport
npm run dev:http     # HTTP server
npx vitest run       # Unit tests (41 tests)
```

---

## Common Debugging Patterns

1. **"Błąd w danych wejściowych"** — Date not in `YYYY-MM-DD HH:mm` format.
2. **"State cannot be null"** — Missing required defaults (state, role, rating).
3. **"Cannot read properties of undefined"** — Missing `?.` null check.
4. **"Wystąpił nieoczekiwany błąd"** — Sending unsupported field (e.g. `priority`).
5. **"Received tool input did not match expected schema"** — Zod `.optional()` received `null`; change to `.nullish()`.
6. **"Nie można określić właściciela"** — `RAYNET_DEFAULT_OWNER_ID` not set in env.

---

## Next Steps & Future Improvements

### Completed This Session (2026-02-19)
- ✅ CORS wildcard hardening
- ✅ Remove hardcoded owner ID=1 fallback
- ✅ Map-based tool router (O(1), no false positives)
- ✅ Parallel activity queries (~30s → ~8s)
- ✅ Rate limiting (120 req/min)
- ✅ Fix null companyId Zod crash
- ✅ 41/41 unit tests passing

### Future Enhancements

**Code Quality (Medium Priority):**
- [ ] Automatic semantic versioning
- [ ] Review against MCP best practices guide
- [ ] API response type validation
- [ ] Return structured data alongside formatted text

**Performance (Low Priority):**
- [ ] Response caching for enum data
- [ ] Retry logic with exponential backoff

**New Features (As Requested):**
- [ ] Bulk operations support
- [ ] Webhook support for real-time updates

---

## Critical Reference: Bug Fixes Applied

| # | Date | File | Issue | Fix |
|---|------|------|-------|-----|
| 1 | 2026-01-24 | `src/tools/companies.ts` | formatCompany crash on null owner | `owner?.fullName ?? 'N/A'` |
| 2 | 2026-01-24 | `src/api/companies.ts` | Missing required defaults | Added state/role/rating defaults |
| 3 | 2026-01-24 | `src/api/activities.ts` | ISO date format rejected | `normalizeDate()` → `YYYY-MM-DD HH:mm` |
| 4 | 2026-01-24 | `src/api/activities.ts` | Missing owner/deadline fields | Added required fields with defaults |
| 5 | 2026-01-24 | `src/api/contacts.ts` | Filter contacts by company broken | Use `/company/{id}/relationship/person` |
| 6-7 | 2026-01-24 | `src/api/leads.ts`, `activities.ts` | `priority` field causes API error | Removed unsupported field |
| 8 | 2026-01-26 | `src/tools/salesOrders.ts` | `dealId` silently ignored | Made `dealId` required in schema |
| 9 | 2026-01-26 | `src/api/projects.ts` | Wrong participant endpoint | `/participant/` → `/participants/` |
| 10 | 2026-01-26 | `src/api/projects.ts` | Wrong participant field | `role` → `note` |
| 11 | 2026-01-29 | `src/api/activities.ts` | Activity filter by company returns nothing | `company[EQ]` → `companyContextFilter` |
| 12 | 2026-01-29 | `src/api/activities.ts` | Activities assigned to default owner | Fetch company owner; fall back to default |
| 13 | 2026-02-19 | `src/tools/activities.ts` | LLM sends `null` for companyId, Zod rejects | `.optional()` → `.nullish()` + null→undefined normalization |
| 14 | 2026-02-19 | `src/api/activities.ts`, `src/config/env.ts` | Hardcoded `owner.id = 1` fallback | `RAYNET_DEFAULT_OWNER_ID` env var; throws Polish error if unset |
| 15 | 2026-02-19 | `src/server-http.ts` | CORS default was `'*'` (open) | Default `''`; falls back to `'null'` header value |

---

**Status:** Production-ready on Railway. 91 MCP tools fully functional. 41 unit tests + 90 integration test invocations passing.

**Current Tool Count:** 91 tools
- Companies: 11 | Contacts: 12 | Deals: 8 | Leads: 9 | Activities: 9
- Products: 7 | Offers: 9 | Sales Orders: 10 | Projects: 8 | Enums: 8

**Deployment Status:**
- Railway: Live and healthy (v0.81.0)
- Auto-deploy: Enabled (push to main → automatic deployment)
- n8n Integration: Working (Raynet-MCP and Raymund workflows)
- Authentication: Bearer token + rate limiting (120 req/min) enabled
- CORS: Restricted (no wildcard default)
- Unit Tests: 41/41 passing | Integration Tests: 90/90 passing
