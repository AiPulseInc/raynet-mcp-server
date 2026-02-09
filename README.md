# Raynet CRM MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.80.0-blue.svg)](CHANGELOG.md)
[![Production](https://img.shields.io/badge/status-production%20ready-brightgreen.svg)](CHANGELOG.md)

A Model Context Protocol (MCP) server that provides seamless integration between Claude AI and Raynet CRM, enabling AI-powered CRM operations through natural language interactions.

**v0.80.0 (2026-02-09):** Mobile mode — 25 essential tools for field sales reps (default). Set `TOOL_MODE=full` for all 91 tools. See [CHANGELOG.md](CHANGELOG.md).

## Overview

This MCP server bridges Claude AI with the Raynet CRM system, allowing users to perform CRM operations through conversational interfaces like Claude Desktop, Telegram bots, or n8n workflows. Designed specifically for Polish-speaking teams with support for local business workflows.

### Key Features

- **Natural Language CRM Operations**: Manage companies, contacts, deals, activities, leads, products, offers, sales orders, and projects through conversational AI
- **Polish Language Support**: Native Polish interface with proper diacritics handling
- **91 MCP Tools**: Comprehensive coverage of CRM workflows including sales pipeline, quoting, and project management
- **Mobile Mode (default)**: 25 essential tools for field sales reps — reduces LLM context and focuses on field-relevant actions
- **Dual Transport**: stdio (Claude Desktop) and HTTP/JSON-RPC (n8n, Telegram, remote deployment)
- **Bearer Token Auth**: Secure HTTP transport with `MCP_API_KEY` authentication
- **Enterprise-Ready**: Rate limiting, error handling, retry logic with exponential backoff
- **Claude Desktop Compatible**: Works with Claude Desktop MCP configuration

## Available Tools (91 Total)

### Companies (Firmy) - 6 Tools

| Tool | Description |
|------|-------------|
| `raynet_list_companies` | List companies with filters (state, role, rating, owner) |
| `raynet_search_companies` | Search companies by name |
| `raynet_get_company` | Get detailed company information by ID |
| `raynet_create_company` | Create a new company record |
| `raynet_update_company` | Update company details |
| `raynet_delete_company` | Delete a company |

### Company Addresses (Adresy firm) - 5 Tools (NEW)

| Tool | Description |
|------|-------------|
| `raynet_list_company_addresses` | List all addresses for a company |
| `raynet_add_company_address` | Add a new address to a company |
| `raynet_update_company_address` | Update an existing company address |
| `raynet_delete_company_address` | Delete a company address |
| `raynet_set_primary_company_address` | Set an address as the primary address |

### Contacts (Kontakty) - 7 Tools

| Tool | Description |
|------|-------------|
| `raynet_list_contacts` | List contacts with filters (company, owner) |
| `raynet_search_contacts` | Search contacts by name |
| `raynet_get_contact` | Get contact details by ID |
| `raynet_create_contact` | Create new contact |
| `raynet_update_contact` | Update contact information |
| `raynet_delete_contact` | Delete a contact |
| `raynet_link_contact_to_company` | Associate contact with company |

### Contact Relationships (Relacje kontaktow) - 5 Tools (NEW)

| Tool | Description |
|------|-------------|
| `raynet_list_contact_relationships` | List all company relationships for a contact |
| `raynet_add_contact_relationship` | Add a new company relationship to a contact |
| `raynet_update_contact_relationship` | Update an existing contact-company relationship |
| `raynet_delete_contact_relationship` | Delete a contact-company relationship |
| `raynet_set_primary_contact_relationship` | Set a relationship as the primary one |

### Products (Produkty) - 7 Tools (NEW)

| Tool | Description |
|------|-------------|
| `raynet_list_products` | List products with filters (category, active status) |
| `raynet_search_products` | Search products by name or code |
| `raynet_get_product` | Get detailed product information |
| `raynet_create_product` | Create a new product |
| `raynet_update_product` | Update product details |
| `raynet_delete_product` | Delete a product |
| `raynet_get_product_categories` | Get product categories for filtering |

### Deals (Szanse sprzedazy) - 8 Tools

| Tool | Description |
|------|-------------|
| `raynet_list_deals` | List deals with filters (status, company, owner, phase) |
| `raynet_search_deals` | Search deals by name |
| `raynet_get_deal` | Get deal details with relationships |
| `raynet_create_deal` | Create new sales opportunity |
| `raynet_update_deal` | Update deal status, value, probability |
| `raynet_update_deal_phase` | Change deal phase in sales process |
| `raynet_delete_deal` | Delete a deal |
| `raynet_get_pipeline_value` | Get total pipeline value and statistics |

### Offers (Oferty) - 9 Tools (NEW)

| Tool | Description |
|------|-------------|
| `raynet_list_offers` | List offers with filters (status, company, deal, owner) |
| `raynet_search_offers` | Search offers by name |
| `raynet_get_offer` | Get offer details including line items |
| `raynet_create_offer` | Create a new offer/quote |
| `raynet_create_offer_with_items` | Create offer with line items in one call |
| `raynet_update_offer` | Update offer details and status |
| `raynet_delete_offer` | Delete an offer |
| `raynet_add_offer_item` | Add a line item to an existing offer |
| `raynet_remove_offer_item` | Remove a line item from an offer |

### Sales Orders (Zamowienia sprzedazy) - 10 Tools (NEW)

| Tool | Description |
|------|-------------|
| `raynet_list_sales_orders` | List sales orders with filters |
| `raynet_search_sales_orders` | Search sales orders by name |
| `raynet_get_sales_order` | Get sales order details including line items |
| `raynet_create_sales_order` | Create a new sales order |
| `raynet_create_sales_order_with_items` | Create sales order with line items |
| `raynet_create_sales_order_from_offer` | Convert an offer to a sales order |
| `raynet_update_sales_order` | Update sales order details |
| `raynet_delete_sales_order` | Delete a sales order |
| `raynet_add_sales_order_item` | Add a line item to a sales order |
| `raynet_remove_sales_order_item` | Remove a line item from a sales order |

### Projects (Projekty) - 8 Tools (NEW)

| Tool | Description |
|------|-------------|
| `raynet_list_projects` | List projects with filters (status, company, owner) |
| `raynet_search_projects` | Search projects by name |
| `raynet_get_project` | Get project details including participants |
| `raynet_create_project` | Create a new project |
| `raynet_update_project` | Update project details and status |
| `raynet_delete_project` | Delete a project |
| `raynet_add_project_participant` | Add a participant to a project |
| `raynet_remove_project_participant` | Remove a participant from a project |

### Activities (Aktywnosci) - 9 Tools

| Tool | Description |
|------|-------------|
| `raynet_list_activities` | List activities (tasks, calls, meetings, emails) |
| `raynet_search_activities` | Search activities by title |
| `raynet_get_activity` | Get activity details by ID and type |
| `raynet_create_activity` | Create new activity (Task/PhoneCall/Meeting/Email) |
| `raynet_update_activity` | Update activity properties |
| `raynet_complete_activity` | Mark activity as completed |
| `raynet_delete_activity` | Delete an activity |
| `raynet_get_today_activities` | Get today's scheduled activities |
| `raynet_get_overdue_activities` | Get overdue activities |

### Leads (Leady) - 9 Tools

| Tool | Description |
|------|-------------|
| `raynet_list_leads` | List leads with filters (status, phase, owner) |
| `raynet_search_leads` | Search leads by name |
| `raynet_get_lead` | Get lead details by ID |
| `raynet_create_lead` | Create new lead |
| `raynet_update_lead` | Update lead properties |
| `raynet_update_lead_phase` | Change lead phase |
| `raynet_delete_lead` | Delete a lead |
| `raynet_convert_lead` | Convert lead to company/contact/deal |
| `raynet_get_lead_stats` | Get lead statistics |

### Enums (Slowniki) - 8 Tools

| Tool | Description |
|------|-------------|
| `raynet_get_company_categories` | Get company categories (KAM, AM, etc.) |
| `raynet_get_company_turnovers` | Get company turnover ranges |
| `raynet_get_deal_categories` | Get deal categories (color-coded) |
| `raynet_get_deal_phases` | Get deal phases (sales process stages) |
| `raynet_get_lead_phases` | Get lead phases |
| `raynet_get_contact_sources` | Get contact/lead sources |
| `raynet_get_currencies` | Get available currencies |
| `raynet_get_all_enums` | Get all lookup values at once |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Raynet CRM account with API access
- API credentials (username, API key, instance name)

### Installation

```bash
# Clone the repository
git clone https://github.com/AiPulseInc/raynet-mcp-server.git
cd raynet-mcp-server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials
nano .env
```

### Configuration

Create a `.env` file with your Raynet credentials:

```env
# Required Configuration
RAYNET_INSTANCE_URL=https://app.raynet.cz/api/v2
RAYNET_INSTANCE_NAME=your-crm-instance
RAYNET_USERNAME=your-email@domain.com
RAYNET_API_KEY=your-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
LOG_FORMAT=pretty

# Tool Mode: 'mobile' (25 tools, default) or 'full' (all 91 tools)
TOOL_MODE=mobile

# HTTP Transport Authentication (optional, for remote deployment)
# MCP_API_KEY=your-bearer-token-here
```

#### Finding Your Credentials

1. **Instance URL**: Choose based on your region:
   - Czech: `https://app.raynet.cz/api/v2`
   - Slovak: `https://app.raynetcrm.sk/api/v2`
   - International: `https://app.raynetcrm.com/api/v2`

2. **Instance Name**: Your CRM instance identifier (found in your Raynet URL)

3. **API Key**: Generate in Raynet CRM under Settings -> API Keys

### Running the Server

```bash
# Development mode (stdio transport — for Claude Desktop)
npm run dev

# Development mode (HTTP transport — for n8n, Telegram, remote)
npm run dev:http

# Production build
npm run build

# Start HTTP server (default, for deployment)
npm start

# Start stdio server (for Claude Desktop)
npm run start:stdio
```

### Using with Claude Desktop

Add to your Claude Desktop MCP configuration (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "raynet": {
      "command": "node",
      "args": ["/path/to/raynet-mcp-server/dist/index.js"],
      "env": {
        "RAYNET_INSTANCE_URL": "https://app.raynet.cz/api/v2",
        "RAYNET_INSTANCE_NAME": "your-instance",
        "RAYNET_USERNAME": "your-email",
        "RAYNET_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Mobile Mode (25 Tools for Field Sales Reps)

Set `TOOL_MODE=mobile` to expose only 25 essential tools optimized for reps working on mobile (Claude, Telegram, n8n). This reduces LLM context usage and focuses the AI on field-relevant actions.

```json
{
  "mcpServers": {
    "raynet": {
      "command": "node",
      "args": ["/path/to/raynet-mcp-server/dist/index.js"],
      "env": {
        "TOOL_MODE": "mobile",
        "RAYNET_INSTANCE_URL": "https://app.raynet.cz/api/v2",
        "RAYNET_INSTANCE_NAME": "your-instance",
        "RAYNET_USERNAME": "your-email",
        "RAYNET_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Mobile tools include:**

| Area | Tools | What reps can do |
|------|-------|-----------------|
| Companies (3) | search, get, create | Find & add companies |
| Contacts (3) | search, get, create | Find & add contacts |
| Deals (5) | list, search, get, create, update_phase | Manage pipeline |
| Activities (5) | create, complete, today, overdue, search | Log & track work |
| Leads (4) | search, get, create, convert | Capture & qualify leads |
| Products (2) | search, get | Look up products/prices |
| Offers (2) | create_with_items, get | Quick quoting |
| Enums (1) | get_all_enums | Load all picklist values |

**Not included in mobile mode:** delete operations, address management, contact relationships, sales orders, projects, individual enum lookups, and bulk update operations. These remain available when `TOOL_MODE=full`.

## Example Conversations (in Polish)

**Creating a Company:**
```
User: "Dodaj nowa firme TEST Sp. z o.o. z ocena A"
Assistant: [Uses raynet_create_company]
Response: "Utworzono firme TEST Sp. z o.o. (ID: 12345) z ocena A"
```

**Checking Pipeline:**
```
User: "Jaka jest wartosc naszego pipeline?"
Assistant: [Uses raynet_get_pipeline_value]
Response: "Wartosc Pipeline
- Liczba aktywnych szans: 4
- Laczna wartosc: 42 000 zl
- Wartosc wazona: 21 000 zl"
```

**Creating an Offer:**
```
User: "Stworz oferte dla firmy ABC z produktem X za 5000 zl"
Assistant: [Uses raynet_create_offer_with_items]
Response: "Oferta utworzona pomyslnie!
**Oferta ABC - Produkt X** (ID: 456)
- Status: Aktywna
- Wartosc: 5 000.00 PLN"
```

**Managing Projects:**
```
User: "Pokaz aktywne projekty"
Assistant: [Uses raynet_list_projects with status filter]
Response: "Znaleziono 3 projektow:
**Wdrozenie CRM** (ID: 789)
- Status: Aktywny
- Firma: ABC Sp. z o.o.
- Okres: 2026-01-01 - 2026-03-31"
```

**Working with Leads:**
```
User: "Pokaz statystyki leadow"
Assistant: [Uses raynet_get_lead_stats]
Response: "Statystyki Leadow
- Lacznie: 15
- Aktywne: 8
- Skonwertowane: 5
- Anulowane: 2"
```

## Project Structure

```
raynet-mcp-server/
├── src/
│   ├── index.ts              # Entry point (stdio transport)
│   ├── server.ts             # MCP server (stdio)
│   ├── server-http.ts        # MCP server (HTTP/JSON-RPC)
│   ├── version.ts            # Centralized version constant
│   ├── config/
│   │   └── env.ts            # Environment configuration + Zod validation
│   ├── api/
│   │   ├── client.ts         # Raynet API client (auth, retries, rate limiting)
│   │   ├── companies.ts      # Companies service
│   │   ├── contacts.ts       # Contacts service
│   │   ├── deals.ts          # Deals service
│   │   ├── activities.ts     # Activities service
│   │   ├── leads.ts          # Leads service
│   │   ├── products.ts       # Products service
│   │   ├── offers.ts         # Offers service
│   │   ├── salesOrders.ts    # Sales orders service
│   │   ├── projects.ts       # Projects service
│   │   └── enums.ts          # Enums/lookups service
│   ├── tools/
│   │   ├── index.ts          # Tool registry, mobile filter, router
│   │   ├── companies.ts      # Company & address MCP tools
│   │   ├── contacts.ts       # Contact & relationship MCP tools
│   │   ├── deals.ts          # Deal MCP tools
│   │   ├── activities.ts     # Activity MCP tools
│   │   ├── leads.ts          # Lead MCP tools
│   │   ├── products.ts       # Product MCP tools
│   │   ├── offers.ts         # Offer MCP tools
│   │   ├── salesOrders.ts    # Sales order MCP tools
│   │   ├── projects.ts       # Project MCP tools
│   │   └── enums.ts          # Enum MCP tools
│   ├── utils/
│   │   ├── logger.ts         # Winston logger with sensitive data redaction
│   │   └── errors.ts         # Error classes with Polish messages
│   └── types/
│       └── index.ts          # TypeScript types
├── tests/
│   └── unit/                 # Unit tests (Vitest)
├── docs/
│   ├── RAYNET-API.md         # API documentation
│   └── TEST_REPORT.md        # Integration test results
├── .env.example              # Environment template
├── CHANGELOG.md              # Release history
├── TODO.md                   # Development roadmap
├── package.json
├── tsconfig.json
└── README.md
```

## Rate Limiting

The server implements rate limiting to comply with Raynet API limits:

- **Daily Limit**: 24,000 requests per day
- **Concurrent Limit**: Maximum 4 concurrent connections
- **Auto-Retry**: Automatic retry with exponential backoff on 429 errors

Rate limit headers are tracked and logged with each request.

## Security

- **Basic Auth**: Every Raynet API request uses username + API key
- **Bearer Token Auth**: HTTP transport protected by `MCP_API_KEY` environment variable
- **Instance Header**: `X-Instance-Name` header sent with every API call
- **Credential Storage**: All credentials via environment variables (never hardcoded)
- **Input Validation**: Zod schemas validate all tool inputs before API calls
- **Log Redaction**: Sensitive fields (API keys, tokens, passwords) automatically redacted from logs

## HTTP Transport

For remote deployment (Railway, n8n, Telegram bots), the server provides an HTTP/JSON-RPC transport:

```bash
# Set authentication token
export MCP_API_KEY=your-secret-bearer-token

# Start HTTP server
npm start
```

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | No | Server info (version, tool count) |
| `GET` | `/health` | No | Health check |
| `POST` | `/mcp` | Bearer | MCP JSON-RPC endpoint |
| `DELETE` | `/mcp` | Bearer | Session cleanup |

**Example request:**
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-bearer-token" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Development

```bash
# Build the project
npm run build

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Unit tests (Vitest)
npm test

# With coverage
npm run test:coverage

# Integration tests (requires Raynet credentials)
npm run test:integration
```

See [docs/TEST_REPORT.md](docs/TEST_REPORT.md) for detailed integration test results.

## Troubleshooting

**Issue: "X-Instance-Name header missing"**
```bash
# Ensure RAYNET_INSTANCE_NAME is set in .env
```

**Issue: "Rate limit exceeded (429)"**
```bash
# Server auto-retries. Check daily usage (24,000 requests/day limit)
```

**Issue: "Connection timeout"**
```bash
# Increase timeout in config or check network connectivity
```

**Issue: "Date format error"**
```bash
# Raynet expects dates in YYYY-MM-DD HH:mm format, not ISO 8601
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Raynet CRM](https://www.raynet.cz/) for the CRM platform and API
- [Anthropic](https://www.anthropic.com/) for Claude AI and MCP protocol
- [Model Context Protocol](https://modelcontextprotocol.io/) community

---

**Built for Polish CRM teams** | **Powered by Claude AI + MCP**
