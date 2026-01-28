# n8n Workflows for Raynet MCP Server

This folder contains ready-to-import n8n workflows for interacting with Raynet CRM via the MCP server.

## Available Workflows

### 1. Raynet CRM Chat Assistant (`raynet-chat-workflow.json`)

A conversational AI assistant that lets you interact with Raynet CRM through n8n's built-in chat interface.

**Features:**
- Natural language queries for CRM data
- Search companies and contacts
- View deals and leads
- Check today's activities
- Create new leads and activities
- Supports Polish and English

## How to Import

### Step 1: Open n8n

Go to your n8n instance: `https://n8n-aipulse.up.railway.app/`

### Step 2: Import Workflow

1. Click the **+** button or go to **Workflows** > **Add workflow**
2. Click the **...** menu (three dots) in the top right
3. Select **Import from file...**
4. Choose `raynet-chat-workflow.json`

### Step 3: Configure Anthropic Credentials

The workflow uses Claude AI. You need to set up Anthropic credentials:

1. Go to **Settings** > **Credentials**
2. Click **Add Credential**
3. Search for **Anthropic**
4. Enter your Anthropic API key
5. Save the credential

### Step 4: Link Credentials to Workflow

1. Open the imported workflow
2. Click on the **Claude** node
3. Select your Anthropic credential from the dropdown
4. Save the workflow

### Step 5: Activate and Test

1. Toggle the workflow to **Active** (top right switch)
2. Click **Chat** button in the bottom left of the canvas
3. Start chatting!

## Example Chat Commands

Once the workflow is active, you can ask questions like:

**List Data:**
- "Pokaż mi wszystkie firmy" (Show me all companies)
- "List my contacts"
- "What deals do we have?"
- "Show my leads"

**Search:**
- "Znajdź firmę 321Grow" (Find company 321Grow)
- "Search for contact named Maciej"

**Today's Work:**
- "Jakie mam dziś zadania?" (What tasks do I have today?)
- "What are my activities for today?"

**Create Records:**
- "Create a new lead for company ABC about web development project"
- "Schedule a meeting tomorrow at 10:00 with subject 'Client call'"
- "Stwórz zadanie na jutro: przygotować ofertę"

## Workflow Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Chat Trigger   │────>│   AI Agent   │────>│  MCP Tool Calls     │
│  (User Input)   │     │   (Claude)   │     │  (HTTP Requests)    │
└─────────────────┘     └──────────────┘     └─────────────────────┘
                              │                        │
                              │                        v
                              │              ┌─────────────────────┐
                              │              │  Raynet MCP Server  │
                              │              │  (Railway)          │
                              │              └─────────────────────┘
                              │                        │
                              v                        v
                        ┌──────────────┐     ┌─────────────────────┐
                        │   Response   │<────│  Raynet CRM API     │
                        │   to Chat    │     └─────────────────────┘
                        └──────────────┘
```

## Available Tools in Workflow

| Tool | Description |
|------|-------------|
| List Companies | Get list of companies from CRM |
| Search Companies | Search companies by name/ID |
| Get Company | Get detailed company info |
| List Contacts | Get list of contacts |
| Search Contacts | Search contacts by name/email |
| List Deals | Get list of deals |
| List Leads | Get list of leads |
| Today Activities | Get today's scheduled activities |
| Create Lead | Create a new lead |
| Create Activity | Create task/meeting/call |

## Troubleshooting

### Chat not responding

1. Make sure the workflow is **Active**
2. Check that Anthropic credentials are configured
3. Verify the MCP server is running:
   ```
   curl https://raynet-mcp-server-production.up.railway.app/health
   ```

### "Unauthorized" errors

- Your Anthropic API key may be invalid or expired
- Go to Credentials and update the API key

### MCP server errors

- Check the server health endpoint
- Look at Railway logs for any issues
- Verify environment variables are set correctly

## Extending the Workflow

To add more Raynet CRM tools:

1. Duplicate an existing HTTP Tool node
2. Update the tool name and description
3. Modify the JSON body with the correct MCP tool name
4. Update the placeholderDefinitions with required parameters
5. Connect the new tool to the AI Agent node

See `docs/N8N-INTEGRATION-GUIDE.md` for the complete list of 91 available tools.

---

*Created: 2026-01-28*
