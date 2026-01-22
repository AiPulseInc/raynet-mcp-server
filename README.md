# Raynet CRM MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Model Context Protocol (MCP) server that provides seamless integration between Claude AI and Raynet CRM, enabling AI-powered CRM operations through natural language interactions.

## 🎯 Overview

This MCP server bridges Claude AI with the Raynet CRM system, allowing users to perform CRM operations through conversational interfaces like Telegram bots, n8n workflows, or direct Claude API integration. Designed specifically for Polish-speaking teams with support for local business workflows.

### Key Features

- **🤖 Natural Language CRM Operations**: Manage companies, contacts, and deals through conversational AI
- **🇵🇱 Polish Language Support**: Native Polish interface with proper diacritics handling (ąęółżźćń)
- **⚡ Real-time Integration**: SSE (Server-Sent Events) transport for responsive interactions
- **🔒 Enterprise-Ready**: Comprehensive rate limiting, error handling, and security features
- **📊 Complete CRUD Operations**: 16 tools covering all essential CRM workflows
- **🔄 n8n Compatible**: Seamless integration with n8n automation workflows
- **💬 Telegram Ready**: Perfect for Telegram bot assistants

## 🏗️ Architecture

```
┌─────────────────┐
│  Telegram Bot   │  User interacts via messaging
│   (End User)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   n8n Workflow  │  Orchestrates conversation flow
│  (Orchestrator) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Claude API    │  AI processing with MCP tools
│  (with MCP)     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│    Raynet MCP Server (SSE)      │  ← This project
│  ┌───────────────────────────┐  │
│  │   Authentication Layer    │  │
│  │   - Basic Auth            │  │
│  │   - X-Instance-Name       │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     Tool Handlers         │  │
│  │   - Companies (5 tools)   │  │
│  │   - Contacts (6 tools)    │  │
│  │   - Deals (5 tools)       │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Rate Limit Management    │  │
│  │   - 24k requests/day      │  │
│  │   - 4 concurrent max      │  │
│  └───────────────────────────┘  │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────┐
│   Raynet API    │  CRM backend system
│   (v2 REST)     │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Raynet CRM account with API access
- API credentials (username, API key, instance name)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/raynet-mcp-server.git
cd raynet-mcp-server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials (see Configuration section)
nano .env
```

### Configuration

Create a `.env` file with your Raynet credentials:

```env
# Required Configuration
RAYNET_INSTANCE_URL=https://app.raynetcrm.com/api/v2/
RAYNET_INSTANCE_NAME=your-crm-instance
RAYNET_USERNAME=your-email@domain.com
RAYNET_API_KEY=your-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Optional Configuration
RAYNET_MAX_RETRIES=3
RAYNET_TIMEOUT_MS=30000
RAYNET_RATE_LIMIT_BUFFER=100
LOG_FORMAT=pretty
```

#### Finding Your Credentials

1. **Instance URL**: Choose based on your region:
   - 🇨🇿 Czech: `https://app.raynet.cz/api/v2/`
   - 🇸🇰 Slovak: `https://app.raynetcrm.sk/api/v2/`
   - 🌍 International: `https://app.raynetcrm.com/api/v2/`
   - 🇪🇺 EU: `https://eu.raynetcrm.com/api/v2/`

2. **Instance Name**: Your CRM instance identifier (e.g., `my-company-crm`)

3. **API Key**: Generate in Raynet CRM under Settings → API Keys

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start

# Run tests
npm test
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-22T12:00:00.000Z",
  "version": "1.0.0"
}
```

## 🛠️ Available Tools

The server provides 16 MCP tools for CRM operations:

### Companies (Accounts) - 5 Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| `raynet_search_companies` | Search for companies by name, rating, category | "Find all VIP companies" |
| `raynet_get_company` | Get detailed company information | "Show me company #123" |
| `raynet_create_company` | Create a new company record | "Add new company ABC Ltd" |
| `raynet_update_company` | Update company details | "Update company rating to A" |
| `raynet_delete_company` | Delete a company | "Remove test company" |

### Contacts (Persons) - 6 Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| `raynet_search_contacts` | Search contacts by name, email, company | "Find contacts at company X" |
| `raynet_get_contact` | Get contact details | "Show contact Jan Kowalski" |
| `raynet_create_contact` | Create new contact | "Add contact Anna Nowak" |
| `raynet_update_contact` | Update contact information | "Update contact email" |
| `raynet_delete_contact` | Delete a contact | "Remove old contact" |
| `raynet_link_contact_to_company` | Associate contact with company | "Link contact to ABC Ltd" |

### Deals (Business Cases) - 5 Tools

| Tool | Description | Example Use |
|------|-------------|-------------|
| `raynet_search_deals` | Search deals by status, company, value | "Show open deals over 10k" |
| `raynet_get_deal` | Get deal details with relationships | "What's the status of deal #456?" |
| `raynet_create_deal` | Create new sales opportunity | "Create deal for new project" |
| `raynet_update_deal` | Update deal status, value, probability | "Mark deal as won" |
| `raynet_delete_deal` | Delete or mark deal as lost | "Close lost deal" |

## 📖 Usage Examples

### Using with Claude Desktop

Add to your Claude Desktop MCP configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "raynet": {
      "url": "http://localhost:3000/sse",
      "transport": "sse"
    }
  }
}
```

### Using with n8n Workflow

1. Add HTTP Request node pointing to your MCP server
2. Configure Claude API node with MCP connection
3. Connect Telegram trigger
4. Example workflow:

```
Telegram Webhook → n8n → Claude API (with MCP) → Raynet MCP Server → Raynet CRM
```

### Example Conversations (in Polish)

**Creating a Company:**
```
User: "Dodaj nową firmę TEST Sp. z o.o. z oceną A"
Assistant: [Uses raynet_create_company]
Response: "✅ Utworzono firmę TEST Sp. z o.o. (ID: 12345) z oceną A"
```

**Searching Contacts:**
```
User: "Pokaż kontakty w firmie ABC"
Assistant: [Uses raynet_search_contacts with company filter]
Response: "Znaleziono 3 kontakty:
1. Jan Kowalski - jan@abc.pl
2. Anna Nowak - anna@abc.pl
3. Piotr Wiśniewski - piotr@abc.pl"
```

**Checking Deal Status:**
```
User: "Jaki jest status oferty #789?"
Assistant: [Uses raynet_get_deal]
Response: "Oferta #789: Projekt XYZ
Status: W trakcie negocjacji
Wartość: 50 000 PLN
Prawdopodobieństwo: 70%
Kontakt: Jan Kowalski (ABC Ltd)"
```

## 🧪 Development

### Project Structure

```
raynet-mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── config/
│   │   └── env.ts            # Environment configuration
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
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── fixtures/             # Test data
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/api/client.test.ts

# Watch mode
npm run test:watch
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

## 🔒 Security

### Authentication

- **Basic Auth**: Every request requires valid username and API key
- **Instance Header**: `X-Instance-Name` header required for all Raynet API calls
- **Credential Storage**: All credentials stored in environment variables, never in code

### Rate Limiting

The server implements comprehensive rate limiting to comply with Raynet API limits:

- **Daily Limit**: 24,000 requests per day
- **Concurrent Limit**: Maximum 4 concurrent connections
- **Auto-Queuing**: Requests automatically queued when approaching limits
- **429 Handling**: Automatic retry with exponential backoff

### Security Best Practices

- ✅ No credentials in logs or error messages
- ✅ Input validation on all tool parameters
- ✅ CORS configured for production
- ✅ Environment variables validated on startup
- ✅ Secure error messages (no sensitive data leakage)

## 📊 Monitoring

### Health Endpoint

```bash
GET /health
```

Returns server status, uptime, and basic metrics.

### Rate Limit Status

Rate limit information is logged with each API request:

```json
{
  "level": "info",
  "message": "API request completed",
  "endpoint": "/company/",
  "rateLimit": {
    "remaining": 23845,
    "limit": 24000,
    "reset": 1706011200
  }
}
```

### Logging

Logs are structured JSON (production) or pretty-printed (development):

```bash
# View logs in development
npm run dev

# View production logs
npm start | bunyan  # requires bunyan CLI
```

## 🚀 Deployment

### Railway Deployment

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Set environment variables:
```bash
railway variables set RAYNET_INSTANCE_URL=https://app.raynetcrm.com/api/v2/
railway variables set RAYNET_INSTANCE_NAME=your-instance
railway variables set RAYNET_USERNAME=your-email
railway variables set RAYNET_API_KEY=your-key
railway variables set NODE_ENV=production
```

4. Deploy:
```bash
railway up
```

### Alternative Deployment Options

- **Render**: Use `render.yaml` configuration
- **Fly.io**: Use `fly.toml` configuration
- **Docker**: Use included `Dockerfile`

## 🌍 Internationalization

### Current Support

- 🇵🇱 **Polish** (MVP) - Full support with proper diacritics
  - All error messages in Polish
  - Field labels in Polish
  - Date/currency formatting (DD.MM.YYYY, PLN)

### Planned Support (Post-MVP)

- 🇨🇿 Czech
- 🇸🇰 Slovak
- 🇩🇪 German
- 🇬🇧 English

## 📝 API Documentation

Detailed API documentation is available in the `/docs` folder:

- [Tool Reference](docs/TOOLS.md) - Complete tool documentation
- [Error Codes](docs/ERRORS.md) - Error handling reference
- [Rate Limiting](docs/RATE_LIMITING.md) - Rate limit details
- [Development Guide](docs/DEVELOPMENT.md) - Developer documentation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for all new features
- Maintain >80% code coverage
- Follow TypeScript best practices
- Update documentation
- Use conventional commits

## 🐛 Troubleshooting

### Common Issues

**Issue: "X-Instance-Name header missing"**
```bash
# Solution: Ensure RAYNET_INSTANCE_NAME is set in .env
export RAYNET_INSTANCE_NAME=your-instance
```

**Issue: "Rate limit exceeded (429)"**
```bash
# Solution: Server will auto-retry. Check your daily usage:
# Raynet allows 24,000 requests/day
```

**Issue: "Polish characters not displaying correctly"**
```bash
# Solution: Ensure UTF-8 encoding throughout stack
# Check terminal encoding: echo $LANG
# Should be: pl_PL.UTF-8 or en_US.UTF-8
```

**Issue: "Connection timeout"**
```bash
# Solution: Increase timeout in .env
RAYNET_TIMEOUT_MS=60000
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Raynet CRM](https://www.raynet.cz/) for the excellent CRM platform
- [Anthropic](https://www.anthropic.com/) for Claude AI and MCP protocol
- [Model Context Protocol](https://modelcontextprotocol.io/) community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/raynet-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/raynet-mcp-server/discussions)
- **Email**: support@yourdomain.com

## 🗺️ Roadmap

See [raynet-mcp-implementation-plan.md](raynet-mcp-implementation-plan.md) for detailed development roadmap.

### MVP (Current - v1.0)
- ✅ Companies, Contacts, Deals (16 tools)
- ✅ Polish language support
- ✅ Rate limiting
- ✅ n8n integration

### Post-MVP (Planned)
- 📋 Activities & Tasks management
- 📦 Products & Catalog
- 💰 Offers & Quotations
- 📊 Analytics & Reporting
- 🌐 Multi-language support
- 🔔 Webhook notifications
- 🤖 AI-powered suggestions

---

**Built with ❤️ for Polish CRM teams** | **Made possible by Claude AI + MCP**
