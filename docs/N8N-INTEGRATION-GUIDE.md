# n8n Integration Guide for Raynet MCP Server

This guide explains how to connect the Raynet MCP Server deployed on Railway to n8n for CRM automation workflows.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Information](#server-information)
3. [Integration Methods](#integration-methods)
   - [Method 1: Native MCP Client Tool (Recommended)](#method-1-native-mcp-client-tool-recommended)
   - [Method 2: AI Agent with MCP Client](#method-2-ai-agent-with-mcp-client)
   - [Method 3: HTTP Request Node (Legacy)](#method-3-http-request-node-legacy)
4. [Pre-Built Workflows](#pre-built-workflows)
5. [Available Tools (91 Total)](#available-tools-91-total)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- n8n instance v1.70+ (v1.04+ recommended for HTTP Streamable transport)
- Access to the deployed Raynet MCP Server
- Anthropic API key (for AI Agent workflows)

---

## Server Information

| Property | Value |
|----------|-------|
| **Server URL** | `https://raynet-mcp-server-production.up.railway.app` |
| **MCP Endpoint** | `https://raynet-mcp-server-production.up.railway.app/mcp` |
| **Health Check** | `https://raynet-mcp-server-production.up.railway.app/health` |
| **Protocol** | MCP (Model Context Protocol) over HTTP/SSE |
| **Tools Available** | 91 |

---

## Integration Methods

### Method 1: Native MCP Client Tool (Recommended)

n8n v1.70+ includes a native **MCP Client Tool** node (`@n8n/n8n-nodes-langchain.toolMcp`) that automatically discovers all tools from an MCP server.

#### Why This Method is Best

- **Automatic Tool Discovery**: Single node exposes ALL 91 tools
- **Proper MCP Protocol**: Handles sessions, streaming, and protocol details
- **No Manual Configuration**: Tools update automatically when server changes
- **Works with AI Agent**: Direct integration with LangChain agent

#### Step 1: Add MCP Client Tool Node

1. In your workflow, search for **MCP Client Tool**
2. Add it to your canvas
3. Configure:
   - **Connection Type**: HTTP (for v1.04+) or SSE (for older versions)
   - **HTTP URL / SSE Endpoint**: `https://raynet-mcp-server-production.up.railway.app/mcp`
   - **Authentication**: None (server handles Raynet credentials)

#### Step 2: Connect to AI Agent

1. Add an **AI Agent** node
2. Connect MCP Client Tool to the agent's `ai_tool` input
3. Add a language model (Claude, OpenAI, etc.)
4. The agent can now use all 91 Raynet tools

#### Workflow Structure

```
┌─────────────────┐
│  Trigger Node   │  (Chat, Webhook, Schedule, etc.)
└────────┬────────┘
         │
         v
┌─────────────────┐     ┌──────────────────┐
│    AI Agent     │<────│  Language Model  │
└────────┬────────┘     └──────────────────┘
         │
         v
┌─────────────────────────────────────┐
│  MCP Client Tool                    │
│  URL: ...mcp-server.../mcp          │
│  Tools: 91 (auto-discovered)        │
└─────────────────────────────────────┘
```

---

### Method 2: AI Agent with MCP Client

This is the same as Method 1 but includes a complete workflow setup for conversational CRM chat.

#### Import Pre-Built Workflow

We provide ready-to-use workflow files in `n8n-workflows/`:

| n8n Version | Workflow File |
|-------------|---------------|
| v1.04+ | `raynet-mcp-http-streamable-workflow.json` |
| v1.70-1.03 | `raynet-mcp-client-workflow.json` |
| Legacy | `raynet-chat-workflow.json` |

#### Manual Setup

1. **Add Chat Trigger** or other trigger node
2. **Add AI Agent** (`@n8n/n8n-nodes-langchain.agent`)
3. **Add Language Model** (Claude recommended)
4. **Add MCP Client Tool** configured as above
5. **Connect nodes**:
   - Trigger → AI Agent (main)
   - Language Model → AI Agent (ai_languageModel)
   - MCP Client Tool → AI Agent (ai_tool)

#### AI Agent System Prompt (Recommended)

```
You are a CRM assistant with access to 91 Raynet CRM tools covering:
- Companies (11 tools): CRUD, address management
- Contacts (12 tools): CRUD, relationship management
- Deals (8 tools): CRUD, phase changes, pipeline
- Leads (9 tools): CRUD, conversion, statistics
- Activities (9 tools): Tasks, meetings, calls, emails
- Products (7 tools): CRUD, categories
- Offers (9 tools): CRUD, line items
- Sales Orders (10 tools): CRUD, conversion from offers
- Projects (8 tools): CRUD, participants
- Enums (8 tools): Categories, phases, statuses

Use the appropriate tool based on user requests.
Respond in the same language as the user.
```

---

### Method 3: HTTP Request Node (Legacy)

For older n8n versions or when MCP Client is unavailable, use HTTP Request nodes.

> **Note**: This method requires manual configuration for each tool and doesn't support automatic tool discovery.

#### MCP Protocol Basics

MCP uses JSON-RPC 2.0 over HTTP:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "raynet_list_companies",
    "arguments": { "limit": 10 }
  },
  "id": 1
}
```

#### HTTP Request Configuration

| Setting | Value |
|---------|-------|
| Method | `POST` |
| URL | `https://raynet-mcp-server-production.up.railway.app/mcp` |
| Content-Type | `application/json` |
| Accept | `application/json, text/event-stream` |

#### Session Management (For Stateful Operations)

1. **Initialize session** (first request):
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "n8n", "version": "1.0.0" }
  },
  "id": 1
}
```

2. **Store `Mcp-Session-Id`** from response headers

3. **Include header in subsequent requests**:
```
Mcp-Session-Id: <session-id>
```

#### Using with AI Agent (Legacy)

Use `@n8n/n8n-nodes-langchain.toolHttpRequest` to create tool nodes:

```json
{
  "name": "raynet_list_companies",
  "description": "List companies from Raynet CRM",
  "method": "POST",
  "url": "https://raynet-mcp-server-production.up.railway.app/mcp",
  "jsonBody": {
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "raynet_list_companies",
      "arguments": { "limit": "{{ $fromAI('limit', 10) }}" }
    }
  }
}
```

---

## Pre-Built Workflows

Ready-to-import workflows are in `n8n-workflows/`:

| File | Description | Tools | Method |
|------|-------------|-------|--------|
| `raynet-mcp-http-streamable-workflow.json` | Chat with HTTP transport | 91 | MCP Client |
| `raynet-mcp-client-workflow.json` | Chat with SSE transport | 91 | MCP Client |
| `raynet-chat-workflow.json` | Chat with HTTP Request nodes | 10 | Legacy |

### Import Instructions

1. Go to n8n **Workflows** > **Add workflow**
2. Click **...** menu > **Import from file**
3. Select the workflow JSON
4. Configure Anthropic credentials
5. Activate workflow

---

## Available Tools (91 Total)

### Companies (11 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_companies` | List companies with pagination |
| `raynet_search_companies` | Search by name/RegNo/TaxNo |
| `raynet_get_company` | Get company details |
| `raynet_create_company` | Create new company |
| `raynet_update_company` | Update company |
| `raynet_delete_company` | Delete company |
| `raynet_list_company_addresses` | List company addresses |
| `raynet_add_company_address` | Add address |
| `raynet_update_company_address` | Update address |
| `raynet_delete_company_address` | Delete address |
| `raynet_set_primary_company_address` | Set primary address |

### Contacts (12 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_contacts` | List contacts |
| `raynet_search_contacts` | Search contacts |
| `raynet_get_contact` | Get contact details |
| `raynet_create_contact` | Create contact |
| `raynet_update_contact` | Update contact |
| `raynet_delete_contact` | Delete contact |
| `raynet_link_contact_to_company` | Link to company |
| `raynet_list_contact_relationships` | List relationships |
| `raynet_add_contact_relationship` | Add relationship |
| `raynet_update_contact_relationship` | Update relationship |
| `raynet_delete_contact_relationship` | Delete relationship |
| `raynet_set_primary_contact_relationship` | Set primary |

### Deals (8 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_deals` | List deals |
| `raynet_search_deals` | Search deals |
| `raynet_get_deal` | Get deal details |
| `raynet_create_deal` | Create deal |
| `raynet_update_deal` | Update deal |
| `raynet_delete_deal` | Delete deal |
| `raynet_update_deal_phase` | Change phase |
| `raynet_get_pipeline_value` | Calculate pipeline value |

### Leads (9 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_leads` | List leads |
| `raynet_search_leads` | Search leads |
| `raynet_get_lead` | Get lead details |
| `raynet_create_lead` | Create lead |
| `raynet_update_lead` | Update lead |
| `raynet_delete_lead` | Delete lead |
| `raynet_update_lead_phase` | Change phase |
| `raynet_convert_lead` | Convert to deal |
| `raynet_get_lead_stats` | Statistics |

### Activities (9 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_activities` | List activities |
| `raynet_search_activities` | Search activities |
| `raynet_get_activity` | Get activity details |
| `raynet_create_activity` | Create activity |
| `raynet_update_activity` | Update activity |
| `raynet_delete_activity` | Delete activity |
| `raynet_complete_activity` | Mark complete |
| `raynet_get_today_activities` | Today's activities |
| `raynet_get_overdue_activities` | Overdue activities |

### Products (7 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_products` | List products |
| `raynet_search_products` | Search products |
| `raynet_get_product` | Get product details |
| `raynet_create_product` | Create product |
| `raynet_update_product` | Update product |
| `raynet_delete_product` | Delete product |
| `raynet_get_product_categories` | Get categories |

### Offers (9 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_offers` | List offers |
| `raynet_search_offers` | Search offers |
| `raynet_get_offer` | Get offer details |
| `raynet_create_offer` | Create offer |
| `raynet_create_offer_with_items` | Create with items |
| `raynet_update_offer` | Update offer |
| `raynet_delete_offer` | Delete offer |
| `raynet_add_offer_item` | Add item |
| `raynet_remove_offer_item` | Remove item |

### Sales Orders (10 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_sales_orders` | List orders |
| `raynet_search_sales_orders` | Search orders |
| `raynet_get_sales_order` | Get order details |
| `raynet_create_sales_order` | Create order |
| `raynet_create_sales_order_with_items` | Create with items |
| `raynet_create_sales_order_from_offer` | From offer |
| `raynet_update_sales_order` | Update order |
| `raynet_delete_sales_order` | Delete order |
| `raynet_add_sales_order_item` | Add item |
| `raynet_remove_sales_order_item` | Remove item |

### Projects (8 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_projects` | List projects |
| `raynet_search_projects` | Search projects |
| `raynet_get_project` | Get project details |
| `raynet_create_project` | Create project |
| `raynet_update_project` | Update project |
| `raynet_delete_project` | Delete project |
| `raynet_add_project_participant` | Add participant |
| `raynet_remove_project_participant` | Remove participant |

### Enums (8 tools)
| Tool | Description |
|------|-------------|
| `raynet_get_company_categories` | Company categories |
| `raynet_get_company_turnovers` | Turnover ranges |
| `raynet_get_deal_categories` | Deal categories |
| `raynet_get_deal_phases` | Deal phases |
| `raynet_get_lead_phases` | Lead phases |
| `raynet_get_contact_sources` | Contact sources |
| `raynet_get_currencies` | Currencies |
| `raynet_get_all_enums` | All enum data |

---

## Troubleshooting

### MCP Client Connection Issues

#### "Could not connect to your MCP server"

**Causes & Solutions:**
1. **Proxy buffering**: Railway/Cloudflare may buffer SSE → Use HTTP Streamable transport
2. **Timeout**: Increase timeout in n8n settings
3. **CORS**: Server has CORS enabled for all origins; check browser console

#### Tools Not Showing in MCP Client

1. Click "Refresh" button in the node
2. Check server health: `curl https://raynet-mcp-server-production.up.railway.app/health`
3. Verify response shows `"tools": 91`

### HTTP Request Issues

#### "Not Acceptable" Error

**Solution**: Add Accept header:
```
Accept: application/json, text/event-stream
```

#### Session Not Found (404)

**Solution**: Re-initialize session. Sessions expire after ~30 minutes of inactivity.

#### Unknown Tool Error

**Solution**: Check tool name spelling. Use underscores not hyphens. Run `tools/list` to see all tools.

### Server Health Check

```bash
curl https://raynet-mcp-server-production.up.railway.app/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "raynet-mcp-server",
  "version": "1.0.0",
  "tools": 91
}
```

### Debug MCP Request

```bash
curl -v -X POST https://raynet-mcp-server-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

---

## Support

- **GitHub Issues**: [raynet-mcp-server issues](https://github.com/AiPulseInc/raynet-mcp-server/issues)
- **n8n Docs**: [MCP Client Tool](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolmcp/)
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io/)

---

*Last updated: 2026-01-28*
