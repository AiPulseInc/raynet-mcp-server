# n8n Integration Guide for Raynet MCP Server

This guide explains how to connect the Raynet MCP Server deployed on Railway to n8n for CRM automation workflows.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Information](#server-information)
3. [Installation Methods](#installation-methods)
   - [Method 1: MCP Community Node (Recommended)](#method-1-mcp-community-node-recommended)
   - [Method 2: HTTP Request Node](#method-2-http-request-node)
4. [Configuration](#configuration)
5. [Example Workflows](#example-workflows)
6. [Available Tools](#available-tools)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- n8n instance (self-hosted or cloud)
- Access to the deployed Raynet MCP Server
- Basic understanding of n8n workflows

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

## Installation Methods

### Method 1: MCP Community Node (Recommended)

The easiest way to connect n8n to an MCP server is using the community MCP node.

#### Step 1: Install the MCP Node

In your n8n instance:

1. Go to **Settings** > **Community Nodes**
2. Click **Install a community node**
3. Search for `n8n-nodes-mcp` or `@anthropic/n8n-nodes-mcp`
4. Click **Install**

Alternatively, install via CLI:
```bash
# For self-hosted n8n
npm install n8n-nodes-mcp

# Or using npx
npx n8n-community-node-installer install n8n-nodes-mcp
```

#### Step 2: Configure MCP Credentials

1. Go to **Credentials** > **Add Credential**
2. Search for **MCP** or **Model Context Protocol**
3. Configure:
   - **Name**: `Raynet MCP Server`
   - **Server URL**: `https://raynet-mcp-server-production.up.railway.app/mcp`
   - **Transport**: `HTTP/SSE` (Streamable HTTP)

#### Step 3: Use in Workflow

1. Add an **MCP** node to your workflow
2. Select the credential you created
3. Choose **Operation**: `Call Tool`
4. Select the tool from the dropdown (e.g., `raynet_list_companies`)
5. Configure tool parameters

---

### Method 2: HTTP Request Node

If the MCP community node is not available, you can use the standard HTTP Request node.

#### MCP Protocol Basics

MCP uses JSON-RPC 2.0 over HTTP. Each request requires:
- `POST` method
- Proper headers
- JSON-RPC formatted body

#### Step 1: Create HTTP Request Node

Add an **HTTP Request** node with these settings:

**Authentication**: None (credentials are configured server-side)

**Request Settings**:
| Setting | Value |
|---------|-------|
| Method | `POST` |
| URL | `https://raynet-mcp-server-production.up.railway.app/mcp` |

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream"
}
```

#### Step 2: Initialize Session

First request must initialize the MCP session:

**Body (JSON)**:
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "n8n-client",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

**Response** will include `Mcp-Session-Id` header - save this for subsequent requests.

#### Step 3: List Available Tools

**Body**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 2
}
```

**Headers** (add to all subsequent requests):
```
Mcp-Session-Id: <session-id-from-initialize>
```

#### Step 4: Call a Tool

**Body** (example: list companies):
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "raynet_list_companies",
    "arguments": {
      "limit": 10
    }
  },
  "id": 3
}
```

---

## Configuration

### Session Management

MCP uses stateful sessions. For n8n workflows:

1. **Initialize once** at the start of your workflow
2. **Store the session ID** using a Set node
3. **Include session ID** in all subsequent requests
4. **Sessions expire** after inactivity (typically 30 minutes)

### Example Session Flow

```
[Trigger] -> [Initialize MCP] -> [Set Session ID] -> [Call Tool 1] -> [Call Tool 2] -> ...
```

### Parsing SSE Responses

MCP returns Server-Sent Events (SSE) format:
```
event: message
data: {"result": {...}, "jsonrpc": "2.0", "id": 1}
```

Use a **Code** node to parse:
```javascript
const response = $input.first().json.data;
// Parse SSE format
const lines = response.split('\n');
const dataLine = lines.find(l => l.startsWith('data: '));
if (dataLine) {
  const jsonData = JSON.parse(dataLine.replace('data: ', ''));
  return { json: jsonData.result };
}
return { json: response };
```

---

## Example Workflows

### Workflow 1: Daily Company Report

Automatically fetch and report new companies daily.

```
[Schedule Trigger (Daily)]
    -> [HTTP Request: Initialize MCP]
    -> [Set: Store Session ID]
    -> [HTTP Request: Call raynet_list_companies]
    -> [Code: Parse Response]
    -> [IF: New Companies?]
        -> [Email: Send Report]
```

**Tool Call Body**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "raynet_search_companies",
    "arguments": {
      "query": "",
      "limit": 50
    }
  },
  "id": 3
}
```

### Workflow 2: Lead from Form Submission

Create a lead in Raynet when a form is submitted.

```
[Webhook: Form Submission]
    -> [HTTP Request: Initialize MCP]
    -> [Set: Store Session ID]
    -> [HTTP Request: Call raynet_create_lead]
    -> [Code: Parse Response]
    -> [IF: Success?]
        -> [Respond: Success]
        -> [Respond: Error]
```

**Tool Call Body**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "raynet_create_lead",
    "arguments": {
      "topic": "{{ $json.subject }}",
      "companyName": "{{ $json.company }}",
      "contactEmail": "{{ $json.email }}",
      "contactPhone": "{{ $json.phone }}",
      "description": "{{ $json.message }}"
    }
  },
  "id": 3
}
```

### Workflow 3: Sync Contacts to External System

```
[Schedule Trigger (Hourly)]
    -> [HTTP Request: Initialize MCP]
    -> [Set: Store Session ID]
    -> [HTTP Request: Call raynet_list_contacts]
    -> [Code: Parse Response]
    -> [Split In Batches]
    -> [HTTP Request: Update External CRM]
```

---

## Available Tools

The server provides 91 tools organized by category:

### Companies (11 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_companies` | List companies with pagination |
| `raynet_search_companies` | Search companies by name/RegNo/TaxNo |
| `raynet_get_company` | Get company details |
| `raynet_create_company` | Create new company |
| `raynet_update_company` | Update company |
| `raynet_delete_company` | Delete company |
| `raynet_list_company_addresses` | List company addresses |
| `raynet_add_company_address` | Add address to company |
| `raynet_update_company_address` | Update company address |
| `raynet_delete_company_address` | Delete company address |
| `raynet_set_primary_company_address` | Set primary address |

### Contacts (12 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_contacts` | List contacts with filters |
| `raynet_search_contacts` | Search contacts |
| `raynet_get_contact` | Get contact details |
| `raynet_create_contact` | Create new contact |
| `raynet_update_contact` | Update contact |
| `raynet_delete_contact` | Delete contact |
| `raynet_link_contact_to_company` | Link contact to company |
| `raynet_list_contact_relationships` | List contact relationships |
| `raynet_add_contact_relationship` | Add relationship |
| `raynet_update_contact_relationship` | Update relationship |
| `raynet_delete_contact_relationship` | Delete relationship |
| `raynet_set_primary_contact_relationship` | Set primary relationship |

### Deals (8 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_deals` | List deals with filters |
| `raynet_search_deals` | Search deals |
| `raynet_get_deal` | Get deal details |
| `raynet_create_deal` | Create new deal |
| `raynet_update_deal` | Update deal |
| `raynet_delete_deal` | Delete deal |
| `raynet_change_deal_status` | Change deal status |
| `raynet_get_deal_pipeline` | Get deal pipeline stages |

### Leads (9 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_leads` | List leads with filters |
| `raynet_search_leads` | Search leads |
| `raynet_get_lead` | Get lead details |
| `raynet_create_lead` | Create new lead |
| `raynet_update_lead` | Update lead |
| `raynet_delete_lead` | Delete lead |
| `raynet_convert_lead` | Convert lead to deal |
| `raynet_change_lead_status` | Change lead status |
| `raynet_get_lead_statistics` | Get lead statistics |

### Activities (9 tools)
| Tool | Description |
|------|-------------|
| `raynet_list_activities` | List activities |
| `raynet_get_activity` | Get activity details |
| `raynet_create_activity` | Create activity |
| `raynet_update_activity` | Update activity |
| `raynet_delete_activity` | Delete activity |
| `raynet_complete_activity` | Mark activity complete |
| `raynet_get_today_activities` | Get today's activities |
| `raynet_get_overdue_activities` | Get overdue activities |
| `raynet_get_upcoming_activities` | Get upcoming activities |

### Products (7 tools) - NEW
| Tool | Description |
|------|-------------|
| `raynet_list_products` | List products |
| `raynet_search_products` | Search products |
| `raynet_get_product` | Get product details |
| `raynet_create_product` | Create product |
| `raynet_update_product` | Update product |
| `raynet_delete_product` | Delete product |
| `raynet_get_product_categories` | Get product categories |

### Offers (9 tools) - NEW
| Tool | Description |
|------|-------------|
| `raynet_list_offers` | List offers |
| `raynet_search_offers` | Search offers |
| `raynet_get_offer` | Get offer details |
| `raynet_create_offer` | Create offer |
| `raynet_create_offer_with_items` | Create offer with line items |
| `raynet_update_offer` | Update offer |
| `raynet_delete_offer` | Delete offer |
| `raynet_add_offer_item` | Add item to offer |
| `raynet_remove_offer_item` | Remove item from offer |

### Sales Orders (10 tools) - NEW
| Tool | Description |
|------|-------------|
| `raynet_list_sales_orders` | List sales orders |
| `raynet_search_sales_orders` | Search sales orders |
| `raynet_get_sales_order` | Get order details |
| `raynet_create_sales_order` | Create order |
| `raynet_create_sales_order_with_items` | Create order with items |
| `raynet_create_sales_order_from_offer` | Convert offer to order |
| `raynet_update_sales_order` | Update order |
| `raynet_delete_sales_order` | Delete order |
| `raynet_add_sales_order_item` | Add item to order |
| `raynet_remove_sales_order_item` | Remove item from order |

### Projects (8 tools) - NEW
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
| `raynet_get_company_categories` | Get company categories |
| `raynet_get_contact_sources` | Get contact sources |
| `raynet_get_activity_types` | Get activity types |
| `raynet_get_deal_statuses` | Get deal statuses |
| `raynet_get_lead_statuses` | Get lead statuses |
| `raynet_get_countries` | Get countries list |
| `raynet_get_currencies` | Get currencies |
| `raynet_get_users` | Get CRM users |

---

## Troubleshooting

### Common Issues

#### 1. "Not Acceptable" Error

**Error**: `Client must accept both application/json and text/event-stream`

**Solution**: Add the Accept header:
```
Accept: application/json, text/event-stream
```

#### 2. Session Not Found

**Error**: `Session not found` (404)

**Solution**:
- Your session expired. Re-initialize with a new request.
- Make sure you're including `Mcp-Session-Id` header.

#### 3. Missing Session ID on GET

**Error**: `Missing Mcp-Session-Id header for GET request`

**Solution**: GET requests require an active session. Initialize first with POST.

#### 4. Tool Not Found

**Error**: `Unknown tool: <tool_name>`

**Solution**:
- Check tool name spelling
- List available tools with `tools/list` method
- Tool names use underscores, not hyphens

#### 5. Invalid Arguments

**Error**: `Validation failed` or `Missing required field`

**Solution**:
- Check required parameters for the tool
- Ensure correct data types (numbers vs strings)
- Use the `tools/list` response to see parameter schemas

### Health Check

Verify server status:
```bash
curl https://raynet-mcp-server-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "raynet-mcp-server",
  "version": "1.0.0",
  "tools": 91,
  "timestamp": "2026-01-28T16:00:00.000Z"
}
```

### Debug Mode

For debugging, check the full response including headers:
```bash
curl -v -X POST https://raynet-mcp-server-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

---

## Support

- **GitHub Issues**: https://github.com/AiPulseInc/raynet-mcp-server/issues
- **Raynet API Docs**: https://raynet.cz/api/
- **MCP Protocol Spec**: https://modelcontextprotocol.io/

---

*Last updated: 2026-01-28*
