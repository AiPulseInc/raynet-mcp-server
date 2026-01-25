# Raynet API Coverage Report

> Generated: 2026-01-25
> MCP Server Version: 1.0.0

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total API Endpoints Identified** | ~180+ |
| **Endpoints with MCP Tool Coverage** | 42 |
| **Overall API Coverage** | ~23% |
| **Core CRM Entity Coverage** | ~75% |
| **MCP Tools Implemented** | 46 |

The MCP server focuses on core CRM functionality (Companies, Contacts, Deals, Leads, Activities) which represents the most commonly used features. Advanced features like Documents, Invoices, Projects, Mass Emails, and administrative endpoints are not yet implemented.

---

## Coverage by Entity

### Companies (Firmy) - 75% Covered

| Endpoint | Method | Status | MCP Tool | Notes |
|----------|--------|--------|----------|-------|
| `/company/` | GET | Implemented | `raynet_list_companies` | Full pagination and filtering |
| `/company/` | PUT | Implemented | `raynet_create_company` | Creates new company |
| `/company/{id}/` | GET | Implemented | `raynet_get_company` | Full details |
| `/company/{id}/` | POST | Implemented | `raynet_update_company` | Partial update with version lock |
| `/company/{id}/` | DELETE | Implemented | `raynet_delete_company` | Hard delete |
| `/company/ext/{extId}/` | GET | Not Implemented | - | Get by external ID |
| `/company/{id}/lock` | POST | Not Implemented | - | Lock record |
| `/company/{id}/unlock` | POST | Not Implemented | - | Unlock record |
| `/company/{id}/invalid` | POST | Not Implemented | - | Mark as invalid |
| `/company/{id}/valid` | POST | Not Implemented | - | Mark as valid |
| `/company/{id}/anonymize/` | POST | Not Implemented | - | GDPR anonymization |
| `/company/{id}/address/` | GET/PUT | Not Implemented | - | Address management |
| `/company/{id}/address/{addressId}/` | GET/POST/DELETE | Not Implemented | - | Single address operations |
| `/company/{id}/address/{addressId}/setPrimary/` | POST | Not Implemented | - | Set primary address |
| `/company/{id}/address/{addressId}/setContact/` | POST | Not Implemented | - | Set contact address |
| `/company/{id}/relationship/` | GET/PUT | Partial | - | Used internally for contacts |
| `/company/{id}/relationship/{relId}/` | GET/POST/DELETE | Not Implemented | - | Single relationship |
| `/company/{id}/merge/{sourceId}/` | POST | Not Implemented | - | Merge companies |
| `/company/{id}/priceList/` | GET | Not Implemented | - | Get assigned price lists |
| `/company/{id}/image/` | GET/PUT/DELETE | Not Implemented | - | Company logo |

**Additional Implemented Features:**
- `raynet_search_companies` - Fulltext search by name
- `findByRegNumber()` - Find by registration number (API service level)
- `findByOwner()` - Filter by owner (API service level)

---

### Contacts/Persons (Kontakty) - 70% Covered

| Endpoint | Method | Status | MCP Tool | Notes |
|----------|--------|--------|----------|-------|
| `/person/` | GET | Implemented | `raynet_list_contacts` | With company filtering |
| `/person/` | PUT | Implemented | `raynet_create_contact` | With company relationship |
| `/person/{id}/` | GET | Implemented | `raynet_get_contact` | Full details |
| `/person/{id}/` | POST | Implemented | `raynet_update_contact` | Partial update |
| `/person/{id}/` | DELETE | Implemented | `raynet_delete_contact` | Hard delete |
| `/person/ext/{extId}/` | GET | Not Implemented | - | Get by external ID |
| `/person/{id}/lock` | POST | Not Implemented | - | Lock record |
| `/person/{id}/unlock` | POST | Not Implemented | - | Unlock record |
| `/person/{id}/invalid` | POST | Not Implemented | - | Mark as invalid |
| `/person/{id}/valid` | POST | Not Implemented | - | Mark as valid |
| `/person/{id}/anonymize/` | POST | Not Implemented | - | GDPR anonymization |
| `/person/{id}/relationship/` | GET/PUT | Partial | `raynet_link_contact_to_company` | Create relationship |
| `/person/{id}/relationship/{relId}/` | GET/POST/DELETE | Not Implemented | - | Manage relationships |
| `/person/{id}/relationship/{relId}/setPrimary/` | POST | Not Implemented | - | Set primary relationship |
| `/person/{id}/merge/{sourceId}/` | POST | Not Implemented | - | Merge contacts |
| `/person/{id}/image/` | GET/PUT/DELETE | Not Implemented | - | Contact photo |

**Additional Implemented Features:**
- `raynet_search_contacts` - Fulltext search
- `findByEmail()` - Find by email (API service level)
- `getKeyContacts()` - Get keyman contacts (API service level)

---

### Deals/Business Cases (Szanse sprzedazy) - 80% Covered

| Endpoint | Method | Status | MCP Tool | Notes |
|----------|--------|--------|----------|-------|
| `/businessCase/` | GET | Implemented | `raynet_list_deals` | With status/phase filtering |
| `/businessCase/` | PUT | Implemented | `raynet_create_deal` | Full create |
| `/businessCase/createWithItems` | PUT | Not Implemented | - | Create with line items |
| `/businessCase/{id}/` | GET | Implemented | `raynet_get_deal` | Full details |
| `/businessCase/{id}/` | POST | Implemented | `raynet_update_deal` | Partial update |
| `/businessCase/{id}/` | DELETE | Implemented | `raynet_delete_deal` | Hard delete |
| `/businessCase/ext/{extId}/` | GET | Not Implemented | - | Get by external ID |
| `/businessCase/{id}/lock` | POST | Not Implemented | - | Lock record |
| `/businessCase/{id}/unlock` | POST | Not Implemented | - | Unlock record |
| `/businessCase/{id}/invalid` | POST | Not Implemented | - | Mark as invalid |
| `/businessCase/{id}/valid` | POST | Not Implemented | - | Mark as valid |
| `/businessCase/{id}/pdfExport` | GET | Not Implemented | - | Export to PDF |
| `/businessCase/{id}/item/` | GET/PUT | Not Implemented | - | Line items management |
| `/businessCase/{id}/item/{itemId}/` | GET/POST/DELETE | Not Implemented | - | Single item operations |
| `/businessCase/{id}/participants/` | GET/PUT | Not Implemented | - | Participant management |
| `/businessCase/{id}/participants/{partId}` | DELETE | Not Implemented | - | Remove participant |
| `/businessCase/{id}/phaseChanges` | GET | Not Implemented | - | Phase change history |

**Additional Implemented Features:**
- `raynet_search_deals` - Fulltext search
- `raynet_update_deal_phase` - Change phase (via update)
- `raynet_get_pipeline_value` - Calculate pipeline totals
- `markAsWon()` / `markAsLost()` - Status helpers (API service level)
- `findByCode()` - Find by deal code (API service level)

---

### Leads (Leady) - 85% Covered

| Endpoint | Method | Status | MCP Tool | Notes |
|----------|--------|--------|----------|-------|
| `/lead/` | GET | Implemented | `raynet_list_leads` | With status/phase filtering |
| `/lead/` | PUT | Implemented | `raynet_create_lead` | Full create |
| `/lead/{id}/` | GET | Implemented | `raynet_get_lead` | Full details |
| `/lead/{id}/` | POST | Implemented | `raynet_update_lead` | Partial update |
| `/lead/{id}/` | DELETE | Implemented | `raynet_delete_lead` | Hard delete |
| `/lead/ext/{extId}/` | GET | Not Implemented | - | Get by external ID |
| `/lead/{id}/lock` | POST | Not Implemented | - | Lock record |
| `/lead/{id}/unlock` | POST | Not Implemented | - | Unlock record |
| `/lead/{id}/anonymize/` | POST | Not Implemented | - | GDPR anonymization |
| `/lead/{id}/merge/{sourceId}/` | POST | Not Implemented | - | Merge leads |
| `/lead/{id}/convert/` | POST | Partial | `raynet_convert_lead` | Status change only |

**Additional Implemented Features:**
- `raynet_search_leads` - Fulltext search
- `raynet_update_lead_phase` - Change phase
- `raynet_get_lead_stats` - Statistics by status
- `findByCode()` - Find by lead code (API service level)

---

### Activities (Aktywnosci) - 80% Covered

Activities span 4 types: Task, PhoneCall, Meeting, Email

| Endpoint Pattern | Status | MCP Tool | Notes |
|------------------|--------|----------|-------|
| `/{type}/` GET | Implemented | `raynet_list_activities` | Aggregates all types |
| `/{type}/` PUT | Implemented | `raynet_create_activity` | All 4 types |
| `/{type}/{id}/` GET | Implemented | `raynet_get_activity` | Requires type |
| `/{type}/{id}/` POST | Implemented | `raynet_update_activity` | Partial update |
| `/{type}/{id}/` DELETE | Implemented | `raynet_delete_activity` | Hard delete |
| `/activity/` GET | Implemented | - | Generic list endpoint |
| `/{type}/ext/{extId}/` GET | Not Implemented | - | Get by external ID |

**Additional Implemented Features:**
- `raynet_search_activities` - Search across all types
- `raynet_complete_activity` - Mark as completed with solution
- `raynet_get_today_activities` - Today's scheduled activities
- `raynet_get_overdue_activities` - Overdue activities
- `cancel()` - Cancel activity (API service level)

---

### Enums/Lookups (Slowniki) - 50% Covered

| Endpoint | Status | MCP Tool | Notes |
|----------|--------|----------|-------|
| `/companyCategory/` | Implemented | `raynet_get_company_categories` | List only |
| `/companyCategory/{id}/` | Not Implemented | - | CRUD not needed |
| `/companyTurnover/` | Implemented | `raynet_get_company_turnovers` | List only |
| `/businessCaseCategory/` | Implemented | `raynet_get_deal_categories` | List only |
| `/businessCasePhase/` | Implemented | `raynet_get_deal_phases` | List only |
| `/leadPhase/` | Implemented | `raynet_get_lead_phases` | List only |
| `/contactSource/` | Implemented | `raynet_get_contact_sources` | List only |
| `/currency/` | Implemented | `raynet_get_currencies` | List only |
| `/activityCategory/` | Partial | - | API service only |
| `/personCategory/` | Partial | - | API service only |
| `/leadCategory/` | Not Implemented | - | |
| `/paymentTerm/` | Not Implemented | - | |
| `/economyActivity/` | Not Implemented | - | |
| `/territory/` | Not Implemented | - | |
| `/language/` | Not Implemented | - | |
| `/maritalStatus/` | Not Implemented | - | |
| `/productCategory/` | Not Implemented | - | |
| `/productLine/` | Not Implemented | - | |
| `/businessCaseType/` | Not Implemented | - | |
| `/businessCaseRelationshipCategory/` | Not Implemented | - | |
| `/losingCategory/` | Not Implemented | - | |
| `/telType/` | Not Implemented | - | |
| `/offerCategory/` | Not Implemented | - | |
| `/salesOrderCategory/` | Not Implemented | - | |
| `/projectCategory/` | Not Implemented | - | |
| `/projectRelationshipCategory/` | Not Implemented | - | |
| `/priceListCategory/` | Not Implemented | - | |
| `/offerStatus/` | Not Implemented | - | |
| `/salesOrderStatus/` | Not Implemented | - | |
| `/projectStatus/` | Not Implemented | - | |
| `/taxRate/` | Not Implemented | - | |
| `/documentCategory/` | Not Implemented | - | |

**Additional Implemented Features:**
- `raynet_get_all_enums` - Fetch all common enums at once

---

### Not Implemented Entities

#### Offers (Oferty) - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/offer/` | GET/PUT | List and create offers |
| `/offer/createWithItems` | PUT | Create with line items |
| `/offer/{id}/` | GET/POST/DELETE | CRUD operations |
| `/offer/{id}/pdfExport` | GET | Export to PDF |
| `/offer/{id}/item/` | GET/PUT | Line items |
| `/offer/{id}/sync` | POST | Sync with deal |

#### Sales Orders (Zamowienia) - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/salesOrder/` | GET/PUT | List and create orders |
| `/salesOrder/createWithItems` | PUT | Create with line items |
| `/salesOrder/{id}/` | GET/POST/DELETE | CRUD operations |
| `/salesOrder/{id}/pdfExport` | GET | Export to PDF |
| `/salesOrder/{id}/item/` | GET/PUT | Line items |
| `/salesOrder/{id}/sync` | POST | Sync with deal |

#### Projects (Projekty) - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/project/` | GET/PUT | List and create projects |
| `/project/{id}/` | GET/POST/DELETE | CRUD operations |
| `/project/{id}/participants/` | GET/PUT | Participant management |

#### Products (Produkty) - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/product/` | GET/PUT | List and create products |
| `/product/{id}/` | GET/POST/DELETE | CRUD operations |
| `/product/{id}/image/` | GET/PUT/DELETE | Product images |

#### Price Lists (Cenniki) - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/priceList/` | GET/PUT | List and create price lists |
| `/priceList/{id}/` | GET/POST/DELETE | CRUD operations |
| `/priceList/{id}/items/` | GET | Get all items |
| `/priceList/{id}/item/` | GET/PUT | Item management |
| `/priceList/{id}/itemBulkUpsert/` | POST | Bulk item operations |

#### Documents/DMS - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dms/` | GET | List documents |
| `/dms/folder/` | GET/PUT | Folder management |
| `/dms/document/` | PUT | Create document |
| `/dms/document/{id}/` | GET/POST/DELETE | Document CRUD |
| `/attachment/{entity}/{entityId}/` | GET/POST | Attachments |

#### Mass Emails - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/massEmail/` | GET/PUT | Mass email campaigns |
| `/massEmail/{id}/recipient/` | GET/PUT | Recipient management |
| `/massEmail/{id}/recipientBulkUpdate/` | POST | Bulk updates |

#### Invoices (Faktury) - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/invoiceLight/` | GET/PUT | Invoice management |
| `/invoiceLight/{id}/` | GET/POST/DELETE | Invoice CRUD |

#### User & Security - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/userAccount/` | GET | List users |
| `/securityLevel/` | GET/PUT | Security level management |
| `/webhook/` | GET/PUT | Webhook management |

#### GDPR - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/gdpr/` | GET/PUT | GDPR consent management |
| `/gdprTemplate/` | GET | GDPR templates |
| `/gdprFormAgreement/` | GET | Form agreements |

#### Custom Fields - 0% Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/customField/config/` | GET | List custom fields |
| `/customField/config/{entity}/` | GET | Entity-specific fields |
| `/customField/enum/{entity}/{field}/` | GET | Enum values |

---

## Implemented MCP Tools Summary

### Companies (6 tools)
1. `raynet_list_companies` - List with filters
2. `raynet_search_companies` - Search by name
3. `raynet_get_company` - Get details + linked contacts
4. `raynet_create_company` - Create new
5. `raynet_update_company` - Update existing
6. `raynet_delete_company` - Delete

### Contacts (7 tools)
1. `raynet_list_contacts` - List with filters
2. `raynet_search_contacts` - Search by name
3. `raynet_get_contact` - Get details
4. `raynet_create_contact` - Create new with company link
5. `raynet_update_contact` - Update existing
6. `raynet_delete_contact` - Delete
7. `raynet_link_contact_to_company` - Create relationship

### Deals (8 tools)
1. `raynet_list_deals` - List with filters
2. `raynet_search_deals` - Search by name
3. `raynet_get_deal` - Get details
4. `raynet_create_deal` - Create new
5. `raynet_update_deal` - Update existing
6. `raynet_update_deal_phase` - Change phase
7. `raynet_delete_deal` - Delete
8. `raynet_get_pipeline_value` - Pipeline totals

### Leads (9 tools)
1. `raynet_list_leads` - List with filters
2. `raynet_search_leads` - Search by topic
3. `raynet_get_lead` - Get details
4. `raynet_create_lead` - Create new
5. `raynet_update_lead` - Update existing
6. `raynet_update_lead_phase` - Change phase
7. `raynet_delete_lead` - Delete
8. `raynet_convert_lead` - Convert to company/contact
9. `raynet_get_lead_stats` - Statistics

### Activities (9 tools)
1. `raynet_list_activities` - List all types
2. `raynet_search_activities` - Search by title
3. `raynet_get_activity` - Get details
4. `raynet_create_activity` - Create (Task/PhoneCall/Meeting/Email)
5. `raynet_update_activity` - Update existing
6. `raynet_complete_activity` - Mark completed
7. `raynet_delete_activity` - Delete
8. `raynet_get_today_activities` - Today's schedule
9. `raynet_get_overdue_activities` - Overdue items

### Enums (8 tools)
1. `raynet_get_company_categories` - Company categories
2. `raynet_get_company_turnovers` - Turnover ranges
3. `raynet_get_deal_categories` - Deal categories
4. `raynet_get_deal_phases` - Deal phases
5. `raynet_get_lead_phases` - Lead phases
6. `raynet_get_contact_sources` - Contact sources
7. `raynet_get_currencies` - Currencies
8. `raynet_get_all_enums` - All enums at once

**Total: 47 MCP Tools**

---

## Priority Recommendations for Future Implementation

### High Priority (Common CRM Use Cases)

1. **Deal Line Items** (`/businessCase/{id}/item/`)
   - Essential for sales workflows
   - Track products/services per deal
   - Calculate deal values from items

2. **Products** (`/product/`)
   - Product catalog management
   - Required for deal items and offers

3. **Company Addresses** (`/company/{id}/address/`)
   - Multiple address support
   - Shipping vs billing addresses

4. **Custom Fields** (`/customField/config/`)
   - Access to custom field definitions
   - Read/write custom field values

### Medium Priority (Sales Enhancement)

5. **Offers** (`/offer/`)
   - Generate quotes/proposals
   - PDF export capability

6. **Sales Orders** (`/salesOrder/`)
   - Order management
   - Sync with deals

7. **Deal Participants** (`/businessCase/{id}/participants/`)
   - Track stakeholders
   - Assign team members

8. **Phase Change History** (`/businessCase/{id}/phaseChanges`)
   - Track deal progression
   - Sales cycle analytics

### Lower Priority (Advanced Features)

9. **Documents/DMS** (`/dms/`)
   - File attachments
   - Document management

10. **Projects** (`/project/`)
    - Post-sale project tracking

11. **Price Lists** (`/priceList/`)
    - Customer-specific pricing
    - Product pricing tiers

12. **Mass Emails** (`/massEmail/`)
    - Campaign management
    - Batch communications

---

## Intentionally Not Implemented

The following API features are intentionally not implemented:

| Feature | Reason |
|---------|--------|
| **Record Locking** (`/*/lock`, `/*/unlock`) | Not typically needed for MCP interactions; would complicate tool usage |
| **Record Invalidation** (`/*/invalid`, `/*/valid`) | Soft delete pattern not commonly used |
| **Record Merging** (`/*/merge/`) | Complex operation requiring careful UI guidance |
| **GDPR Anonymization** (`/*/anonymize/`) | Sensitive operation requiring explicit consent flows |
| **External ID Access** (`/*/ext/{extId}/`) | Internal system integration, not needed for assistant use |
| **PDF Exports** | Would require file handling which MCP text tools don't support well |
| **Image Uploads** | Binary data handling not suitable for current MCP implementation |
| **User Management** | Administrative function, security concerns |
| **Webhook Management** | Infrastructure configuration, not assistant use case |
| **Security Levels** | Administrative function |

---

## Technical Notes

### API Patterns Used

1. **Optimistic Locking**: All updates fetch current `_version` before POST
2. **Fulltext Search**: Uses `fulltext` query parameter across endpoints
3. **Pagination**: Standard `limit`/`offset` with `totalCount` in response
4. **Filter Operators**: `[EQ]`, `[LIKE]`, `[GT]`, `[GE]`, `[LT]`, `[LE]`
5. **Sorting**: `sortColumn` and `sortDirection` parameters

### API Quirks Handled

1. PUT for creates, POST for updates (reverse of REST convention)
2. Activity endpoints require type-specific paths (`/task/`, `/meeting/`, etc.)
3. Generic `/activity/` endpoint is read-only
4. Priority field is read-only for leads and activities
5. Relationship endpoint used for contact-company links

### Rate Limiting

- 24,000 requests/day limit
- Max 4 concurrent connections
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Appendix: API Endpoint Count by Category

| Category | Total Endpoints | Implemented | Coverage |
|----------|----------------|-------------|----------|
| Companies | 20 | 5 | 25% |
| Contacts | 15 | 6 | 40% |
| Deals | 17 | 6 | 35% |
| Leads | 11 | 5 | 45% |
| Activities (per type) | 6 | 5 | 83% |
| Enums | 60+ | 8 | 13% |
| Offers | 12 | 0 | 0% |
| Sales Orders | 12 | 0 | 0% |
| Projects | 10 | 0 | 0% |
| Products | 8 | 0 | 0% |
| Price Lists | 14 | 0 | 0% |
| Documents | 12 | 0 | 0% |
| Mass Emails | 8 | 0 | 0% |
| Invoices | 8 | 0 | 0% |
| User/Security | 12 | 0 | 0% |
| GDPR | 8 | 0 | 0% |
| Custom Fields | 6 | 0 | 0% |
| Webhooks | 4 | 0 | 0% |
| Other | 10 | 0 | 0% |

---

*Report generated by analyzing `docs/RAYNET-API.md`, `docs/openapi-spec.json`, and implementation in `src/tools/*.ts` and `src/api/*.ts`*
