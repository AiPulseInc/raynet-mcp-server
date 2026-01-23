# Raynet CRM MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Model Context Protocol (MCP) server that provides seamless integration between Claude AI and Raynet CRM, enabling AI-powered CRM operations through natural language interactions.

## Overview

This MCP server bridges Claude AI with the Raynet CRM system, allowing users to perform CRM operations through conversational interfaces like Claude Desktop, Telegram bots, or n8n workflows. Designed specifically for Polish-speaking teams with support for local business workflows.

### Key Features

- **Natural Language CRM Operations**: Manage companies, contacts, deals, activities, and leads through conversational AI
- **Polish Language Support**: Native Polish interface with proper diacritics handling
- **47 MCP Tools**: Comprehensive coverage of CRM workflows
- **Real-time Integration**: stdio transport for responsive interactions
- **Enterprise-Ready**: Rate limiting, error handling, and retry logic
- **Claude Desktop Compatible**: Works with Claude Desktop MCP configuration

## Available Tools (47 Total)

### Companies (Firmy) - 6 Tools

| Tool | Description |
|------|-------------|
| `raynet_list_companies` | List companies with filters (state, role, rating, owner) |
| `raynet_search_companies` | Search companies by name |
| `raynet_get_company` | Get detailed company information by ID |
| `raynet_create_company` | Create a new company record |
| `raynet_update_company` | Update company details |
| `raynet_delete_company` | Delete a company |

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

### Deals (Szanse sprzedaży) - 8 Tools

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

### Activities (Aktywności) - 9 Tools

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

### Enums (Słowniki) - 8 Tools

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
```

#### Finding Your Credentials

1. **Instance URL**: Choose based on your region:
   - Czech: `https://app.raynet.cz/api/v2`
   - Slovak: `https://app.raynetcrm.sk/api/v2`
   - International: `https://app.raynetcrm.com/api/v2`

2. **Instance Name**: Your CRM instance identifier (found in your Raynet URL)

3. **API Key**: Generate in Raynet CRM under Settings → API Keys

### Running the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
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

## Example Conversations (in Polish)

**Creating a Company:**
```
User: "Dodaj nową firmę TEST Sp. z o.o. z oceną A"
Assistant: [Uses raynet_create_company]
Response: "✅ Utworzono firmę TEST Sp. z o.o. (ID: 12345) z oceną A"
```

**Checking Pipeline:**
```
User: "Jaka jest wartość naszego pipeline?"
Assistant: [Uses raynet_get_pipeline_value]
Response: "📊 Wartość Pipeline
- Liczba aktywnych szans: 4
- Łączna wartość: 42 000 zł
- Wartość ważona: 21 000 zł"
```

**Managing Activities:**
```
User: "Pokaż moje zadania na dziś"
Assistant: [Uses raynet_get_today_activities]
Response: "📅 Aktywności na dziś (czwartek, 23 stycznia 2026)
- Spotkanie z klientem ABC (10:00-11:00)
- Telefon do Jana Kowalskiego (14:00)"
```

**Working with Leads:**
```
User: "Pokaż statystyki leadów"
Assistant: [Uses raynet_get_lead_stats]
Response: "📊 Statystyki Leadów
- Łącznie: 15
- 🟢 Aktywne: 8
- ✅ Skonwertowane: 5
- ❌ Anulowane: 2"
```

## Project Structure

```
raynet-mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── config/
│   │   └── env.ts            # Environment configuration
│   ├── api/
│   │   ├── client.ts         # Raynet API client
│   │   ├── companies.ts      # Companies service
│   │   ├── contacts.ts       # Contacts service
│   │   ├── deals.ts          # Deals service
│   │   ├── activities.ts     # Activities service
│   │   ├── leads.ts          # Leads service
│   │   └── enums.ts          # Enums/lookups service
│   ├── tools/
│   │   ├── companies.ts      # Company MCP tools
│   │   ├── contacts.ts       # Contact MCP tools
│   │   ├── deals.ts          # Deal MCP tools
│   │   ├── activities.ts     # Activity MCP tools
│   │   ├── leads.ts          # Lead MCP tools
│   │   └── enums.ts          # Enum MCP tools
│   ├── utils/
│   │   ├── logger.ts         # Winston logger
│   │   └── errors.ts         # Error handling
│   └── types/
│       └── index.ts          # TypeScript types
├── scripts/
│   ├── test-companies.js     # Company tests
│   ├── test-contacts.js      # Contact tests
│   ├── test-deals.js         # Deal tests
│   ├── test-activities.js    # Activity tests
│   └── test-leads.js         # Lead tests
├── docs/
│   └── RAYNET-API.md         # API documentation
├── .env.example
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

- **Basic Auth**: Every request requires valid username and API key
- **Instance Header**: `X-Instance-Name` header required for all API calls
- **Credential Storage**: All credentials via environment variables
- **Input Validation**: Zod schemas validate all tool inputs

## Development

```bash
# Build the project
npm run build

# Run tests
node scripts/test-companies.js
node scripts/test-contacts.js
node scripts/test-deals.js
node scripts/test-activities.js
node scripts/test-leads.js

# Type check
npx tsc --noEmit
```

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Raynet CRM](https://www.raynet.cz/) for the CRM platform and API
- [Anthropic](https://www.anthropic.com/) for Claude AI and MCP protocol
- [Model Context Protocol](https://modelcontextprotocol.io/) community

---

**Built for Polish CRM teams** | **Powered by Claude AI + MCP**
