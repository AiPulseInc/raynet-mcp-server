# n8n Workflows for Raynet MCP Server

This folder contains ready-to-import n8n workflows for interacting with Raynet CRM via the MCP server.

## Available Workflows

### Recommended: MCP Client Workflows (All 91 Tools)

These workflows use n8n's native **MCP Client Tool** node which automatically discovers all 91 Raynet CRM tools.

| Workflow | Transport | n8n Version | File |
|----------|-----------|-------------|------|
| Raynet CRM Chat (HTTP Streamable) | HTTP | v1.04+ | `raynet-mcp-http-streamable-workflow.json` |
| Raynet CRM Chat (MCP Client) | SSE | v1.70+ | `raynet-mcp-client-workflow.json` |

**Benefits:**
- Single MCP Client node exposes ALL 91 tools
- Automatic tool discovery from server
- Proper MCP protocol session management
- No manual tool definitions needed

### Legacy: HTTP Request Workflow (10 Tools)

| Workflow | Tools | File |
|----------|-------|------|
| Raynet CRM Chat Assistant | 10 | `raynet-chat-workflow.json` |

This workflow manually defines HTTP Request nodes for each tool. Use only if MCP Client doesn't work in your n8n version.

---

## Quick Start: MCP Client Workflow

### Step 1: Check n8n Version

```bash
# Check your n8n version
n8n --version
```

- **v1.04+**: Use HTTP Streamable workflow (recommended)
- **v1.70-1.03**: Use SSE workflow
- **Below v1.70**: Use legacy HTTP Request workflow

### Step 2: Import Workflow

1. Open your n8n instance
2. Click **+** or go to **Workflows** > **Add workflow**
3. Click **...** menu > **Import from file...**
4. Choose the appropriate workflow JSON file

### Step 3: Configure Anthropic Credentials

1. Go to **Settings** > **Credentials**
2. Click **Add Credential**
3. Search for **Anthropic**
4. Enter your Anthropic API key
5. Save the credential

### Step 4: Link Credentials to Workflow

1. Open the imported workflow
2. Click on the **Claude** node
3. Select your Anthropic credential
4. Save the workflow

### Step 5: Verify MCP Connection

1. Click on the **Raynet MCP Tools** node
2. The node should show "91 tools available" after connecting
3. If connection fails, check the troubleshooting section

### Step 6: Activate and Test

1. Toggle workflow to **Active**
2. Click **Chat** button in bottom left
3. Try: "List all products" or "Show deal phases"

---

## All 91 Available Tools

With the MCP Client workflow, you get access to:

### Companies (11 tools)
- `raynet_list_companies` - List companies
- `raynet_search_companies` - Search by name/ID
- `raynet_get_company` - Get company details
- `raynet_create_company` - Create company
- `raynet_update_company` - Update company
- `raynet_delete_company` - Delete company
- `raynet_list_company_addresses` - List addresses
- `raynet_add_company_address` - Add address
- `raynet_update_company_address` - Update address
- `raynet_delete_company_address` - Delete address
- `raynet_set_primary_company_address` - Set primary address

### Contacts (12 tools)
- `raynet_list_contacts` - List contacts
- `raynet_search_contacts` - Search contacts
- `raynet_get_contact` - Get contact details
- `raynet_create_contact` - Create contact
- `raynet_update_contact` - Update contact
- `raynet_delete_contact` - Delete contact
- `raynet_link_contact_to_company` - Link to company
- `raynet_list_contact_relationships` - List relationships
- `raynet_add_contact_relationship` - Add relationship
- `raynet_update_contact_relationship` - Update relationship
- `raynet_delete_contact_relationship` - Delete relationship
- `raynet_set_primary_contact_relationship` - Set primary

### Deals (8 tools)
- `raynet_list_deals` - List deals
- `raynet_search_deals` - Search deals
- `raynet_get_deal` - Get deal details
- `raynet_create_deal` - Create deal
- `raynet_update_deal` - Update deal
- `raynet_update_deal_phase` - Change phase
- `raynet_delete_deal` - Delete deal
- `raynet_get_pipeline_value` - Calculate pipeline value

### Leads (9 tools)
- `raynet_list_leads` - List leads
- `raynet_search_leads` - Search leads
- `raynet_get_lead` - Get lead details
- `raynet_create_lead` - Create lead
- `raynet_update_lead` - Update lead
- `raynet_update_lead_phase` - Change phase
- `raynet_delete_lead` - Delete lead
- `raynet_convert_lead` - Convert to deal
- `raynet_get_lead_stats` - Statistics

### Activities (9 tools)
- `raynet_list_activities` - List activities
- `raynet_search_activities` - Search activities
- `raynet_get_activity` - Get activity details
- `raynet_create_activity` - Create activity
- `raynet_update_activity` - Update activity
- `raynet_complete_activity` - Mark complete
- `raynet_delete_activity` - Delete activity
- `raynet_get_today_activities` - Today's activities
- `raynet_get_overdue_activities` - Overdue activities

### Products (7 tools)
- `raynet_list_products` - List products
- `raynet_search_products` - Search products
- `raynet_get_product` - Get product details
- `raynet_create_product` - Create product
- `raynet_update_product` - Update product
- `raynet_delete_product` - Delete product
- `raynet_get_product_categories` - Product categories

### Offers (9 tools)
- `raynet_list_offers` - List offers
- `raynet_search_offers` - Search offers
- `raynet_get_offer` - Get offer details
- `raynet_create_offer` - Create offer
- `raynet_create_offer_with_items` - Create with items
- `raynet_update_offer` - Update offer
- `raynet_delete_offer` - Delete offer
- `raynet_add_offer_item` - Add item
- `raynet_remove_offer_item` - Remove item

### Sales Orders (10 tools)
- `raynet_list_sales_orders` - List orders
- `raynet_search_sales_orders` - Search orders
- `raynet_get_sales_order` - Get order details
- `raynet_create_sales_order` - Create order
- `raynet_create_sales_order_with_items` - Create with items
- `raynet_create_sales_order_from_offer` - Create from offer
- `raynet_update_sales_order` - Update order
- `raynet_delete_sales_order` - Delete order
- `raynet_add_sales_order_item` - Add item
- `raynet_remove_sales_order_item` - Remove item

### Projects (8 tools)
- `raynet_list_projects` - List projects
- `raynet_search_projects` - Search projects
- `raynet_get_project` - Get project details
- `raynet_create_project` - Create project
- `raynet_update_project` - Update project
- `raynet_delete_project` - Delete project
- `raynet_add_project_participant` - Add participant
- `raynet_remove_project_participant` - Remove participant

### Enums (8 tools)
- `raynet_get_company_categories` - Company categories
- `raynet_get_company_turnovers` - Turnover ranges
- `raynet_get_deal_categories` - Deal categories
- `raynet_get_deal_phases` - Deal phases
- `raynet_get_lead_phases` - Lead phases
- `raynet_get_contact_sources` - Contact sources
- `raynet_get_currencies` - Currencies
- `raynet_get_all_enums` - All enum data

---

## Example Chat Commands

### Basic Queries
- "List all companies"
- "Show me the first 20 contacts"
- "What deals do we have?"
- "Show my leads"

### New Tool Categories (MCP Client Only)
- "List all products"
- "Show product categories"
- "What offers do we have?"
- "List sales orders"
- "Show all projects"
- "What are the deal phases?"
- "Get all enum data"

### Search
- "Find company 321Grow"
- "Search for contact named Maciej"
- "Search deals worth over 100000"

### Create Records
- "Create a new lead for ABC company about web project"
- "Add a product called 'Consulting' priced at 1000 CZK"
- "Create an offer for deal ID 123"

### Manage Records
- "Update company 456 with new phone number"
- "Change deal 789 to phase 'Negotiation'"
- "Add participant to project 101"

---

## Workflow Architecture

### MCP Client Workflow (Recommended)

```
┌─────────────────┐
│  Chat Trigger   │
└────────┬────────┘
         │
         v
┌─────────────────┐     ┌──────────────────┐
│    AI Agent     │<────│  Claude Model    │
└────────┬────────┘     └──────────────────┘
         │
         v
┌─────────────────────────────────────┐
│  MCP Client Tool                    │
│  URL: raynet-mcp-server...app/mcp   │
│  Tools: 91 (auto-discovered)        │
└─────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│  Raynet MCP Server (Railway)        │
│  Protocol: MCP over HTTP/SSE        │
└─────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│  Raynet CRM API                     │
│  https://app.raynet.cz/api/v2       │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### MCP Client shows "Connection failed"

1. Verify server is running:
   ```bash
   curl https://raynet-mcp-server-production.up.railway.app/health
   ```

2. Check response includes `"tools": 91`

3. Try HTTP Streamable transport instead of SSE

### "Could not connect to your MCP server"

This SSE-specific error usually means:
- Proxy is buffering SSE responses
- Timeout is too short
- Try the HTTP Streamable workflow instead

### Tools not showing in MCP Client node

1. Click "Refresh" in the node
2. Check server health endpoint
3. Verify n8n version supports MCP Client

### Chat not responding

1. Ensure workflow is **Active**
2. Check Anthropic credentials are configured
3. Look at workflow execution logs

### "Unauthorized" errors

- Anthropic API key may be invalid
- Update credentials in Settings

---

## Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server info |
| `/health` | GET | Health check (includes tool count) |
| `/mcp` | POST | MCP messages |
| `/mcp` | GET | MCP SSE stream (requires session) |

---

*Updated: 2026-01-28*
*MCP Server: https://raynet-mcp-server-production.up.railway.app*
