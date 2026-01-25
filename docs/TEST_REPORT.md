# Raynet MCP Server Test Report

**Date:** 2026-01-24
**Test Duration:** ~120 seconds
**Total Tools Tested:** 49 tool invocations across 43 unique tools

---

## Executive Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Enum Tools | 8 | 0 | 8 |
| Company Tools | 2 | 4 | 6 |
| Contact Tools | 7 | 0 | 7 |
| Deal Tools | 3 | 5 | 8 |
| Lead Tools | 5 | 4 | 9 |
| Activity Tools | 4 | 7 | 11 |
| **TOTAL** | **29** | **20** | **49** |

**Pass Rate:** 59%

---

## Detailed Results by Category

### Phase 1: Enum Tools (8/8 PASS)

All enum tools are working correctly.

| Tool | Status | Duration | Notes |
|------|--------|----------|-------|
| `raynet_get_company_categories` | PASS | 1ms | Returns category list |
| `raynet_get_company_turnovers` | PASS | 0ms | Returns turnover ranges |
| `raynet_get_deal_categories` | PASS | 0ms | Returns deal categories with colors |
| `raynet_get_deal_phases` | PASS | 0ms | Returns deal pipeline phases |
| `raynet_get_lead_phases` | PASS | 0ms | Returns lead phases |
| `raynet_get_contact_sources` | PASS | 0ms | Returns contact source options |
| `raynet_get_currencies` | PASS | 228ms | Returns supported currencies |
| `raynet_get_all_enums` | PASS | 150ms | Aggregates all enum data |

---

### Phase 2: Company Tools (2/6 PASS)

| Tool | Status | Duration | Issue |
|------|--------|----------|-------|
| `raynet_create_company` (full) | FAIL | 283ms | "Cannot read properties of undefined (reading 'fullName')" |
| `raynet_create_company` (minimal) | FAIL | 7389ms | "State cannot be null" |
| `raynet_get_company` | FAIL | 1ms | Missing companyId (cascading failure) |
| `raynet_update_company` | FAIL | 1ms | Missing companyId (cascading failure) |
| `raynet_search_companies` | PASS | 150ms | Works correctly |
| `raynet_list_companies` | PASS | 134ms | Works correctly |

**Root Causes:**
1. **formatCompany bug**: The `formatCompany()` function assumes `company.owner.fullName` always exists, but the API response after creation may not include owner details
2. **API validation**: Raynet API may require `state` field even when not documented as required
3. **Cascading failures**: Once company creation failed, all dependent operations failed

---

### Phase 3: Contact Tools (7/7 PASS)

All contact tools are working correctly.

| Tool | Status | Duration | Notes |
|------|--------|----------|-------|
| `raynet_create_contact` (full) | PASS | 142ms | Created contact ID: 37 |
| `raynet_create_contact` (minimal) | PASS | 98ms | Created contact ID: 38 |
| `raynet_get_contact` | PASS | 99ms | Retrieved contact details |
| `raynet_update_contact` | PASS | 295ms | Updated successfully |
| `raynet_link_contact_to_company` | PASS | 0ms | Link operation completed |
| `raynet_search_contacts` | PASS | 132ms | Search working |
| `raynet_list_contacts` | PASS | 86ms | List with filters working |

---

### Phase 4: Deal Tools (3/8 PASS)

| Tool | Status | Duration | Issue |
|------|--------|----------|-------|
| `raynet_create_deal` (full) | FAIL | 0ms | Missing companyId (cascading) |
| `raynet_create_deal` (minimal) | FAIL | 0ms | Missing companyId (cascading) |
| `raynet_get_deal` | FAIL | 0ms | Missing dealId (cascading) |
| `raynet_update_deal` | FAIL | 0ms | Missing dealId (cascading) |
| `raynet_update_deal_phase` | FAIL | 0ms | Missing dealId (cascading) |
| `raynet_search_deals` | PASS | 78ms | Works correctly |
| `raynet_list_deals` | PASS | 85ms | Works correctly |
| `raynet_get_pipeline_value` | PASS | 74ms | Returns pipeline metrics |

**Root Cause:** All failures are cascading from company creation failure.

---

### Phase 5: Lead Tools (5/9 PASS)

| Tool | Status | Duration | Issue |
|------|--------|----------|-------|
| `raynet_create_lead` (full) | FAIL | 7572ms | "Wystąpił nieoczekiwany błąd" |
| `raynet_create_lead` (minimal) | PASS | 110ms | Created lead ID: 2 |
| `raynet_get_lead` | FAIL | 1ms | Missing leadId (leadFullId not captured) |
| `raynet_update_lead` | FAIL | 1ms | Missing leadId |
| `raynet_update_lead_phase` | FAIL | 0ms | Missing leadId |
| `raynet_search_leads` | PASS | 86ms | Works correctly |
| `raynet_list_leads` | PASS | 61ms | Works correctly |
| `raynet_get_lead_stats` | PASS | 14600ms | Returns lead statistics |
| `raynet_convert_lead` | PASS | 264ms | Conversion successful |

**Root Causes:**
1. **Lead creation with full fields fails**: Possible validation issue with email, phone, or website format
2. **Minimal lead worked**: Only `topic` and basic fields required

---

### Phase 6: Activity Tools (4/11 PASS)

| Tool | Status | Duration | Issue |
|------|--------|----------|-------|
| `raynet_create_activity` (Task) | FAIL | 7598ms | "Błąd w danych wejściowych" |
| `raynet_create_activity` (Meeting) | FAIL | 7041ms | "Błąd w danych wejściowych" |
| `raynet_create_activity` (PhoneCall) | FAIL | 7090ms | "Błąd w danych wejściowych" |
| `raynet_create_activity` (Email) | FAIL | 7242ms | "Błąd w danych wejściowych" |
| `raynet_get_activity` | FAIL | 0ms | Missing activityId (cascading) |
| `raynet_update_activity` | FAIL | 1ms | Missing activityId (cascading) |
| `raynet_complete_activity` | FAIL | 0ms | Missing activityId (cascading) |
| `raynet_search_activities` | PASS | 307ms | Works correctly |
| `raynet_list_activities` | PASS | 490ms | Works correctly |
| `raynet_get_today_activities` | PASS | 29166ms | Slow but works |
| `raynet_get_overdue_activities` | PASS | 29128ms | Slow but works |

**Root Causes:**
1. **Activity creation fails**: Input validation error - likely date format issue
2. **Slow performance**: Today/overdue queries take ~30 seconds each (fetches from 4 endpoints)

---

## Issues Identified

### Critical Issues (Must Fix)

1. **BUG: Company formatCompany function crashes**
   - **File:** `src/tools/companies.ts`
   - **Line:** ~341
   - **Issue:** `company.owner.fullName` accessed without null check
   - **Fix:** Add defensive check: `company.owner?.fullName ?? 'N/A'`

2. **BUG: Activity creation date format**
   - **File:** `src/api/activities.ts`
   - **Issue:** Raynet API likely expects different date format
   - **Fix:** Verify and standardize date format (try `YYYY-MM-DD HH:mm` vs ISO format)

3. **BUG: Lead creation with full fields fails**
   - **File:** `src/api/leads.ts`
   - **Issue:** Some field validation failing (email, phone, or website format)
   - **Fix:** Investigate exact field causing rejection

### Medium Issues

4. **Performance: Today/Overdue activities slow**
   - **Duration:** ~30 seconds each
   - **Cause:** Queries 4 activity types sequentially
   - **Fix:** Consider parallel requests or caching

5. **Missing validation: Company state**
   - **Issue:** API may require `state` field even if optional in our schema
   - **Fix:** Add default state or make required in validation

### Low Issues

6. **Test script: ID extraction fragile**
   - **Issue:** Regex extraction of IDs from formatted responses is brittle
   - **Fix:** Return raw IDs alongside formatted output

---

## Cleanup Status

| Entity Type | Created | Deleted | Remaining |
|-------------|---------|---------|-----------|
| Activities | 0 | 0 | 0 |
| Deals | 0 | 0 | 0 |
| Leads | 2 | 1 | 1 (converted) |
| Contacts | 2 | 2 | 0 |
| Companies | 0 | 0 | 0 |

**Note:** Some test data may require manual cleanup if converted entities remain.

---

## Recommendations

### Immediate Actions
1. Fix `formatCompany` null pointer exception
2. Fix activity creation date format
3. Add default state to company creation

### Short-term Improvements
1. Add parallel requests for multi-endpoint queries
2. Improve error messages with field-specific details
3. Add integration test suite to CI/CD

### Long-term Enhancements
1. Add retry logic with exponential backoff
2. Implement response caching for enum data
3. Add comprehensive input validation before API calls

---

## Test Environment

- **Platform:** Darwin (macOS)
- **Node.js:** v18+
- **Raynet Instance:** crm321grow (EU region)
- **Test Framework:** Custom integration script with tsx

---

## Appendix: Working Tools (29/49)

These tools are confirmed working with all tested fields:

**Enum Tools (8):**
- `raynet_get_company_categories`
- `raynet_get_company_turnovers`
- `raynet_get_deal_categories`
- `raynet_get_deal_phases`
- `raynet_get_lead_phases`
- `raynet_get_contact_sources`
- `raynet_get_currencies`
- `raynet_get_all_enums`

**Company Tools (2):**
- `raynet_search_companies`
- `raynet_list_companies`

**Contact Tools (7):**
- `raynet_create_contact`
- `raynet_get_contact`
- `raynet_update_contact`
- `raynet_link_contact_to_company`
- `raynet_search_contacts`
- `raynet_list_contacts`
- `raynet_delete_contact`

**Deal Tools (3):**
- `raynet_search_deals`
- `raynet_list_deals`
- `raynet_get_pipeline_value`

**Lead Tools (5):**
- `raynet_create_lead` (minimal fields)
- `raynet_search_leads`
- `raynet_list_leads`
- `raynet_get_lead_stats`
- `raynet_convert_lead`

**Activity Tools (4):**
- `raynet_search_activities`
- `raynet_list_activities`
- `raynet_get_today_activities`
- `raynet_get_overdue_activities`

---

*Report generated by Raynet MCP Server Integration Test Suite*
