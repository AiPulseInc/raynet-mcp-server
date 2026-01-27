# MCP Best Practices Evaluation

**Project:** Raynet MCP Server
**Date:** 2026-01-26
**Total Tools:** 91

---

## Executive Summary

| Practice | Status | Score |
|----------|--------|-------|
| 1. Outcomes, Not Operations | Partial | 6/10 |
| 2. Flatten Your Arguments | Excellent | 9/10 |
| 3. Instructions are Context | Good | 7/10 |
| 4. Curate Ruthlessly | Needs Work | 4/10 |
| 5. Name Tools for Discovery | Excellent | 10/10 |
| 6. Paginate Large Results | Excellent | 9/10 |
| **Overall** | **Good** | **7.5/10** |

---

## Detailed Evaluation

### 1. Outcomes, Not Operations

**Score: 6/10 - Partial Compliance**

#### What We Do Well:
- **Outcome-oriented tools exist:**
  - `raynet_get_today_activities` - Gets today's tasks across all types
  - `raynet_get_overdue_activities` - Gets overdue tasks
  - `raynet_get_pipeline_value` - Gets aggregated pipeline statistics
  - `raynet_convert_lead` - Converts lead to company/contact/deal in one call
  - `raynet_get_lead_stats` - Gets lead conversion statistics

#### What Needs Improvement:
- **Most tools are CRUD operations** (1:1 API mapping):
  - `raynet_list_companies`, `raynet_get_company`, `raynet_create_company`...
  - This forces the agent to orchestrate multiple calls

#### Recommendations:
```
Add outcome-oriented tools like:
- raynet_get_company_overview(companyId)
  → Returns company + contacts + deals + activities in one call

- raynet_get_deal_summary(dealId)
  → Returns deal + company + contact + activities + offers

- raynet_find_inactive_deals(days: 30)
  → Returns deals with no activity in X days

- raynet_get_daily_sales_report()
  → Returns today's won deals, new leads, scheduled activities
```

---

### 2. Flatten Your Arguments

**Score: 9/10 - Excellent**

#### What We Do Well:
- **Zod schemas enforce flat, typed arguments:**
```typescript
// ✅ Good - Flat primitives with enums
export const ListDealsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: z.enum(['A_DRAFT', 'B_ACTIVE', 'C_WON', 'D_LOST', 'E_CANCELLED']).optional(),
  companyId: z.number().int().positive().optional(),
});
```

- **Enums constrain choices** - Status, ActivityType, etc.
- **Sensible defaults** - limit=20, offset=0
- **No nested objects** in most tool inputs

#### Minor Issues:
- `tags: z.array(z.string())` - Array could confuse agents
- Some tools require IDs that agent may not have

---

### 3. Instructions are Context

**Score: 7/10 - Good**

#### What We Do Well:
- **Descriptions explain when to use:**
```typescript
description: 'Wyszukuje szanse sprzedaży po nazwie w Raynet CRM.
              Użyj tego narzędzia, gdy użytkownik szuka szansy po nazwie.'
```

- **Error messages are helpful** (Polish, user-friendly):
```typescript
return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
```

- **Parameter descriptions are clear:**
```typescript
description: 'Filtruj po statusie: A_DRAFT (szkic), B_ACTIVE (aktywna)...'
```

#### What Needs Improvement:
- **Some descriptions are too brief:**
```typescript
// ❌ Could be more helpful
description: 'Pobiera listę produktów z Raynet CRM.'

// ✅ Better
description: 'Pobiera listę produktów z Raynet CRM. Użyj gdy użytkownik
              pyta o dostępne produkty, cennik lub katalog produktów.'
```

- **No guidance on argument formats:**
```typescript
// Missing: "Data w formacie YYYY-MM-DD"
scheduledFrom: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
```

---

### 4. Curate Ruthlessly

**Score: 4/10 - Needs Work**

#### Current State:
- **91 tools total** - Far exceeds recommended 5-15 per server
- **12 tool categories** - Could be split into separate servers

#### Tool Count by Category:
| Category | Tools | Assessment |
|----------|-------|------------|
| Companies | 6 | OK |
| Company Addresses | 5 | Could merge with Companies |
| Contacts | 7 | OK |
| Contact Relationships | 5 | Could merge with Contacts |
| Products | 7 | OK |
| Deals | 8 | OK |
| Offers | 9 | OK |
| Sales Orders | 10 | OK |
| Projects | 8 | OK |
| Leads | 9 | OK |
| Activities | 9 | OK |
| Enums | 8 | Could be internal helpers |

#### Recommendations:

**Option A: Split into Multiple Servers**
```
raynet-crm-core      → Companies, Contacts (18 tools)
raynet-crm-sales     → Deals, Leads, Offers, Sales Orders (36 tools)
raynet-crm-operations → Activities, Projects (17 tools)
raynet-crm-catalog   → Products (7 tools)
```

**Option B: Create Persona-Based Views**
```
raynet-sales-rep     → Deal management, lead follow-up (25 tools)
raynet-admin         → All CRUD operations (91 tools)
raynet-manager       → Reports, pipeline, statistics (15 tools)
```

**Option C: Reduce Enum Tools**
- Enum tools (`raynet_get_deal_phases`, etc.) could be internal
- Agent rarely needs to query enums directly

---

### 5. Name Tools for Discovery

**Score: 10/10 - Excellent**

#### What We Do Well:
- **Consistent `raynet_` prefix** on all tools
- **Action-oriented naming:** `{service}_{action}_{resource}`

```
✅ Excellent naming:
- raynet_list_companies
- raynet_search_deals
- raynet_create_contact
- raynet_update_deal_phase
- raynet_get_pipeline_value
- raynet_convert_lead
```

- **No generic names** like `create_item` or `get_data`
- **Clear differentiation** between list/search/get operations

---

### 6. Paginate Large Results

**Score: 9/10 - Excellent**

#### What We Do Well:
- **All list operations have pagination:**
```typescript
limit: z.number().int().min(1).max(100).optional().default(20),
offset: z.number().int().min(0).optional().default(0),
```

- **Returns metadata:**
```typescript
return {
  companies: result.companies,
  totalCount: result.totalCount,
  limit,
  offset,
};
```

- **Reasonable defaults:** 20 items (within 20-50 recommendation)
- **Max limit enforced:** 100 items

#### Minor Issue:
- **Missing `hasMore` flag** - Agent must calculate from totalCount

---

## Action Items

### High Priority

1. **Add Outcome-Oriented Tools**
   - [ ] `raynet_get_company_overview` - Full company context
   - [ ] `raynet_get_deal_summary` - Deal with all relationships
   - [ ] `raynet_get_daily_report` - Sales activity summary

2. **Consider Server Split**
   - [ ] Evaluate splitting into 3-4 focused servers
   - [ ] Or create persona-based tool subsets

3. **Improve Tool Descriptions**
   - [ ] Add "when to use" guidance to all tools
   - [ ] Add date format hints to date parameters

### Medium Priority

4. **Reduce Tool Count**
   - [ ] Make enum tools internal (not exposed to agent)
   - [ ] Merge address/relationship tools into parent entities

5. **Add `hasMore` to Pagination**
   - [ ] Include `hasMore: boolean` in list responses

### Low Priority

6. **Add Composite Tools**
   - [ ] `raynet_quick_create_deal` - Company + Contact + Deal in one call
   - [ ] `raynet_full_search` - Search across all entities

---

## Conclusion

The Raynet MCP Server follows most best practices well, particularly:
- Excellent tool naming with consistent `raynet_` prefix
- Flat, typed arguments with Zod validation
- Proper pagination on all list operations
- Helpful error messages

The main improvement area is **tool curation** - 91 tools is too many for a single server. Consider splitting into focused servers or adding more outcome-oriented tools that reduce the need for multi-step orchestration.

**Overall Assessment: Good (7.5/10)** - Production-ready but could be optimized for better agent experience.
