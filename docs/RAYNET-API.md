# Raynet CRM API v2 - Internal Documentation

> Generated from API exploration on 2026-01-22
> Instance: crm321grow (EU region)

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Query Parameters](#query-parameters)
4. [Companies (Firmy)](#companies-firmy)
5. [Persons/Contacts (Kontakty)](#personscontacts-kontakty)
6. [Business Cases/Deals (Szanse sprzedaży)](#business-casesdeals-szanse-sprzedaży)
7. [Activities (Aktywności)](#activities-aktywności)
8. [Enums and Categories](#enums-and-categories)
9. [Common Patterns](#common-patterns)

---

## Authentication

All API requests require:

```
Authorization: Basic base64(username:apiKey)
X-Instance-Name: your-instance-name
Content-Type: application/json
```

**Example:**
```javascript
const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');
const headers = {
  'Authorization': `Basic ${auth}`,
  'X-Instance-Name': 'crm321grow',
  'Content-Type': 'application/json'
};
```

---

## Rate Limiting

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Daily request limit | `24000` |
| `X-RateLimit-Remaining` | Remaining requests today | `23983` |
| `X-RateLimit-Reset` | Unix timestamp when limit resets | `1769126400` |

**Limits:**
- **24,000 requests per day** (resets at midnight CET)
- **Maximum 4 concurrent connections**

**Best Practices:**
- Cache responses when possible
- Use pagination with reasonable limits (20-50 records)
- Monitor `X-RateLimit-Remaining` header
- Implement exponential backoff on 429 responses

---

## Query Parameters

### Pagination

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | number | Max records to return (default: 20) | `?limit=50` |
| `offset` | number | Skip first N records | `?offset=20` |

### Filtering

Filters use the pattern: `fieldName[OPERATOR]=value`

| Operator | Description | Example |
|----------|-------------|---------|
| `EQ` | Equal (default) | `?state=A_POTENTIAL` |
| `LIKE` | Contains (use % wildcard) | `?name[LIKE]=%raynet%` |
| `GT` | Greater than | `?totalAmount[GT]=1000` |
| `GE` | Greater or equal | `?probability[GE]=50` |
| `LT` | Less than | `?validFrom[LT]=2026-01-01` |
| `LE` | Less or equal | `?validTill[LE]=2026-12-31` |

### Sorting

> **Note:** Standard `sort` parameter returns 400. Raynet uses `sortColumn` and `sortDirection`.

```
?sortColumn=name&sortDirection=ASC
?sortColumn=rowInfo.createdAt&sortDirection=DESC
```

---

## Companies (Firmy)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/company/` | List all companies |
| GET | `/company/{id}/` | Get single company |
| POST | `/company/` | Create company |
| PUT | `/company/{id}/` | Update company |
| DELETE | `/company/{id}/` | Delete company |

### Current Data
- **Total records:** 12
- **Fields in list:** 104
- **Fields in detail:** 95 (+ addresses, logo, socialNetworkContact)

### Key Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | number | No | Unique identifier |
| `name` | string | No | Company name |
| `person` | boolean | No | Is person (sole proprietor) |
| `role` | string | No | Role: `A_SUBSCRIBER`, `B_PARTNER`, `C_SUPPLIER`, `D_RIVAL` |
| `state` | string | No | State: `A_POTENTIAL`, `B_ACTUAL`, `C_DEFERRED`, `D_ENDED` |
| `rating` | string | No | Rating: `A`, `B`, `C` |
| `regNumber` | string | Yes | Registration number (NIP/IČO) |
| `taxNumber` | string | Yes | Tax number (VAT ID) |
| `owner.id` | number | No | Owner user ID |
| `owner.fullName` | string | No | Owner full name |

### Address Structure (`primaryAddress`)

```json
{
  "id": 1,
  "primary": true,
  "contactAddress": true,
  "address": {
    "id": 1,
    "city": "Ostrava-Poruba",
    "country": "Czech Republic",
    "countryCode": "CZ",
    "name": "Account Headquarters",
    "street": "Hlavní třída 6078/13",
    "zipCode": "708 00",
    "lat": 49.8259006,
    "lng": 18.1824497
  },
  "contactInfo": {
    "primary": true,
    "email": "info@raynet.cz",
    "tel1": "+420123456789",
    "www": "raynet.cz",
    "doNotSendMM": false
  }
}
```

### Related Objects

| Field | Type | Description |
|-------|------|-------------|
| `category` | object | Company category (KAM, AM, zwykły) |
| `turnover` | object | Revenue range |
| `paymentTerm` | object | Payment terms |
| `tags` | array | Tags list |
| `customFields` | object | Custom field values |
| `securityLevel` | object | Access level |

### Row Info (Audit Fields)

```json
{
  "rowInfo": {
    "createdAt": "2025-12-16 14:10",
    "createdBy": "user@example.com",
    "updatedAt": "2026-01-05 14:47",
    "updatedBy": "user@example.com"
  }
}
```

---

## Persons/Contacts (Kontakty)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/person/` | List all contacts |
| GET | `/person/{id}/` | Get single contact |
| POST | `/person/` | Create contact |
| PUT | `/person/{id}/` | Update contact |
| DELETE | `/person/{id}/` | Delete contact |

### Current Data
- **Total records:** 29
- **Fields in list:** 68
- **Fields in detail:** 77 (+ photo, relationships, attachments)

### Key Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | number | No | Unique identifier |
| `firstName` | string | No | First name |
| `lastName` | string | No | Last name |
| `titleBefore` | string | Yes | Title before name (Mgr., Ing.) |
| `titleAfter` | string | Yes | Title after name (PhD.) |
| `birthday` | string | Yes | Birth date (YYYY-MM-DD) |
| `keyman` | boolean | No | Is key decision maker |
| `activeUserAccount` | boolean | No | Has active user account |

### Contact Info Structure

```json
{
  "contactInfo": {
    "email": "jan.kowalski@example.pl",
    "email2": null,
    "tel1": "+48123456789",
    "tel1Type": null,
    "tel2": null,
    "www": "example.pl",
    "fax": null,
    "doNotSendMM": false
  }
}
```

### Primary Relationship (Company Link)

```json
{
  "primaryRelationship": {
    "id": 2,
    "type": "Administrator",
    "company": {
      "id": 2,
      "name": "321 GROW"
    }
  }
}
```

### Detail-Only Fields

| Field | Type | Description |
|-------|------|-------------|
| `photo` | object | Profile photo metadata |
| `relationships` | array | All company relationships |
| `attachments` | array | Attached files |
| `socialNetworkContact` | object | Social media links |

---

## Business Cases/Deals (Szanse sprzedaży)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/businessCase/` | List all deals |
| GET | `/businessCase/{id}/` | Get single deal |
| POST | `/businessCase/` | Create deal |
| PUT | `/businessCase/{id}/` | Update deal |
| DELETE | `/businessCase/{id}/` | Delete deal |

### Current Data
- **Total records:** 3
- **Fields in list:** 50
- **Fields in detail:** 56 (+ items, signatures, attachments)

### Key Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | number | No | Unique identifier |
| `code` | string | No | Deal code (SP-26-001) |
| `name` | string | No | Deal name |
| `status` | string | No | Status: `A_DRAFT`, `B_ACTIVE`, `C_WON`, `D_LOST`, `E_CANCELLED` |
| `probability` | number | No | Win probability (0-100) |
| `totalAmount` | number | No | Total value (net) |
| `totalAmountWithTax` | number | No | Total value (gross) - detail only |
| `tradingProfit` | number | No | Expected profit |
| `estimatedValue` | number | No | Weighted value (amount × probability) |
| `validFrom` | string | No | Start date (YYYY-MM-DD) |
| `validTill` | string | Yes | End date |
| `scheduledEnd` | string | Yes | Expected close date |
| `exchangeRate` | number | No | Currency exchange rate |

### Related Objects

| Field | Type | Description |
|-------|------|-------------|
| `company` | object | Related company (id, name) |
| `person` | object | Related contact (id, name) |
| `owner` | object | Deal owner (id, fullName) |
| `currency` | object | Currency (id: 40 = PLN "zł") |
| `businessCasePhase` | object | Current phase |
| `businessCaseType` | object | Deal type |
| `category` | object | Category (color-coded) |

### Phase Structure

```json
{
  "businessCasePhase": {
    "id": 1,
    "value": "Zaczynamy"
  }
}
```

### Phase Changes (History)

```json
{
  "phaseChanges": [
    {
      "phase": { "id": 1, "value": "Zaczynamy" },
      "changedAt": "2026-01-07 16:39"
    }
  ]
}
```

### Detail-Only Fields

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Line items/products |
| `signatures` | array | Required signatures |
| `attachments` | array | Attached files |

---

## Activities (Aktywności)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activity/` | List all activities |
| GET | `/phoneCall/{id}/` | Get phone call |
| GET | `/meeting/{id}/` | Get meeting |
| GET | `/task/{id}/` | Get task |
| GET | `/email/{id}/` | Get email |

> **Note:** The generic `/activity/{id}/` endpoint returns 404. Use type-specific endpoints.

### Current Data
- **Total records:** 18
- **Fields:** 36

### Activity Types (`_entityName`)

| Type | Polish | Description |
|------|--------|-------------|
| `PhoneCall` | Telefon | Phone call |
| `Meeting` | Spotkanie | Meeting |
| `Task` | Zadanie | Task |
| `Email` | Email | Email |

### Key Fields

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | number | No | Unique identifier |
| `_entityName` | string | No | Activity type |
| `title` | string | No | Activity title |
| `status` | string | No | `SCHEDULED`, `COMPLETED`, `CANCELLED` |
| `priority` | string | No | `LOW`, `DEFAULT`, `HIGH` |
| `personal` | boolean | No | Is private |
| `scheduledFrom` | string | No | Start datetime |
| `scheduledTill` | string | No | End datetime |
| `completed` | string | Yes | Completion datetime |
| `description` | string | Yes | HTML description |
| `solution` | string | Yes | Resolution notes |

### Related Objects

| Field | Type | Description |
|-------|------|-------------|
| `company` | object | Related company |
| `person` | object | Related contact |
| `businessCase` | object | Related deal |
| `lead` | object | Related lead |
| `project` | object | Related project |
| `participants` | array | Activity participants |

---

## Enums and Categories

### Company Categories (`/companyCategory/`)

| ID | Code | Color |
|----|------|-------|
| 96 | KAM | #60AE00 (green) |
| 97 | AM | #CABC00 (yellow) |
| 98 | zwykły | #519CFF (blue) |

### Business Case Categories (`/businessCaseCategory/`)

| ID | Code | Color |
|----|------|-------|
| 99 | [zielony] | #8EA500 |
| 100 | [żółty] | #CABC00 |
| 101 | [pomarańczowy] | #E2B23A |
| 102 | [czerwony] | #E9802F |

### Company Turnover (`/companyTurnover/`)

| ID | Range (PLN) |
|----|-------------|
| 87 | do 200 tys. zł |
| 88 | 200 tys. - 2 mln zł |
| 89 | 2 - 5 mln zł |
| 90 | 5 - 17 mln zł |
| 91 | 17 - 85 mln zł |
| 92 | 85 - 250 mln zł |
| 93 | nad 250 mln zł |

### Business Case Phases (`/businessCasePhase/`)

| ID | Phase (Polish) | Translation |
|----|----------------|-------------|
| 1 | Zaczynamy | Starting |
| 2 | Odbyło się spotkanie | Meeting held |
| 3 | Oferta poszła | Proposal sent |
| 4 | Przed zamknięciem | Near closing |
| 5 | Wygrana | Won |
| 6 | Przegrana | Lost |
| 7 | Anulowane | Cancelled |

### Company States

| Value | Polish | Translation |
|-------|--------|-------------|
| `A_POTENTIAL` | Potencjalny | Potential |
| `B_ACTUAL` | Aktualny | Current |
| `C_DEFERRED` | Odroczony | Deferred |
| `D_ENDED` | Zakończony | Ended |

### Company Roles

| Value | Polish | Translation |
|-------|--------|-------------|
| `A_SUBSCRIBER` | Klient | Customer |
| `B_PARTNER` | Partner | Partner |
| `C_SUPPLIER` | Dostawca | Supplier |
| `D_RIVAL` | Konkurent | Competitor |

### Company/Contact Ratings

| Value | Description |
|-------|-------------|
| `A` | High priority |
| `B` | Medium priority |
| `C` | Low priority |

### Deal Status

| Value | Polish | Translation |
|-------|--------|-------------|
| `A_DRAFT` | Szkic | Draft |
| `B_ACTIVE` | Aktywna | Active |
| `C_WON` | Wygrana | Won |
| `D_LOST` | Przegrana | Lost |
| `E_CANCELLED` | Anulowana | Cancelled |

---

## Common Patterns

### Response Structure

**List Response:**
```json
{
  "success": true,
  "totalCount": 12,
  "data": [
    { "id": 1, "name": "..." },
    { "id": 2, "name": "..." }
  ]
}
```

**Single Record Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "...",
    ...
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "type": "ValidationError",
  "message": "Invalid field value",
  "translatedMessage": "Nieprawidłowa wartość pola"
}
```

### Object References

Related entities are returned as minimal objects:
```json
{
  "company": {
    "id": 4,
    "name": "Evigo.com Spółka z o.o. sp.k."
  },
  "owner": {
    "id": 4,
    "fullName": "Maciej Konieczny"
  }
}
```

### Custom Fields

Custom fields are returned in the `customFields` object with field IDs as keys:
```json
{
  "customFields": {
    "cf_123": "value1",
    "cf_456": 42
  }
}
```

### Version Control

Every record includes a `_version` field for optimistic locking:
```json
{
  "_version": 2
}
```

When updating, include the current version to prevent conflicts.

### Security Levels

Access control via `securityLevel`:
```json
{
  "securityLevel": {
    "id": 1,
    "name": "Wspólny"  // Shared
  }
}
```

---

## MCP Tool Mapping

Based on the API exploration, here are the recommended MCP tools for Sprint 1:

### Companies
- `raynet_list_companies` - GET /company/ with filters
- `raynet_get_company` - GET /company/{id}/
- `raynet_create_company` - POST /company/
- `raynet_update_company` - PUT /company/{id}/
- `raynet_search_companies` - GET /company/ with name[LIKE]

### Contacts
- `raynet_list_contacts` - GET /person/ with filters
- `raynet_get_contact` - GET /person/{id}/
- `raynet_create_contact` - POST /person/
- `raynet_update_contact` - PUT /person/{id}/
- `raynet_search_contacts` - GET /person/ with name filters

### Deals
- `raynet_list_deals` - GET /businessCase/ with filters
- `raynet_get_deal` - GET /businessCase/{id}/
- `raynet_create_deal` - POST /businessCase/
- `raynet_update_deal` - PUT /businessCase/{id}/
- `raynet_update_deal_phase` - PUT /businessCase/{id}/ (phase change)

### Activities
- `raynet_list_activities` - GET /activity/
- `raynet_create_activity` - POST /phoneCall/, /meeting/, /task/
- `raynet_complete_activity` - PUT activity with status=COMPLETED

---

*Last updated: 2026-01-22*
