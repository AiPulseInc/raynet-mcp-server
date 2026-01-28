/**
 * Comprehensive test of all 91 MCP tools on remote Railway server
 */

const MCP_SERVER_URL = 'https://raynet-mcp-server-production.up.railway.app/mcp';

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface TestResult {
  tool: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
  duration?: number;
}

async function callTool(name: string, args: Record<string, unknown> = {}): Promise<JsonRpcResponse> {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: Date.now(),
      params: { name, arguments: args },
    }),
  });
  return response.json();
}

async function listTools(): Promise<string[]> {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1,
    }),
  });
  const data = await response.json();
  return data.result?.tools?.map((t: { name: string }) => t.name) || [];
}

// Test configurations for each tool
const toolTests: Record<string, Record<string, unknown>> = {
  // Enum tools (read-only, safe to test)
  raynet_get_company_categories: {},
  raynet_get_company_turnovers: {},
  raynet_get_deal_categories: {},
  raynet_get_deal_phases: {},
  raynet_get_lead_phases: {},
  raynet_get_contact_sources: {},
  raynet_get_currencies: {},
  raynet_get_all_enums: {},
  raynet_get_product_categories: {},

  // List tools (read-only)
  raynet_list_companies: { limit: 5 },
  raynet_list_contacts: { limit: 5 },
  raynet_list_deals: { limit: 5 },
  raynet_list_leads: { limit: 5 },
  raynet_list_activities: { limit: 5 },
  raynet_list_products: { limit: 5 },
  raynet_list_offers: { limit: 5 },
  raynet_list_sales_orders: { limit: 5 },
  raynet_list_projects: { limit: 5 },

  // Search tools (read-only)
  raynet_search_companies: { query: 'test', limit: 3 },
  raynet_search_contacts: { query: 'test', limit: 3 },
  raynet_search_deals: { query: 'test', limit: 3 },
  raynet_search_leads: { query: 'test', limit: 3 },
  raynet_search_activities: { query: 'test', limit: 3 },
  raynet_search_products: { query: 'test', limit: 3 },
  raynet_search_offers: { query: 'test', limit: 3 },
  raynet_search_sales_orders: { query: 'test', limit: 3 },
  raynet_search_projects: { query: 'test', limit: 3 },

  // Get tools (read-only) - these need valid IDs
  raynet_get_company: { companyId: 1 },
  raynet_get_contact: { contactId: 1 },
  raynet_get_deal: { dealId: 1 },
  raynet_get_lead: { leadId: 1 },
  raynet_get_activity: { activityId: 1, activityType: 'TASK' },
  raynet_get_product: { productId: 1 },
  raynet_get_offer: { offerId: 1 },
  raynet_get_sales_order: { salesOrderId: 1 },
  raynet_get_project: { projectId: 1 },

  // Aggregation tools (read-only)
  raynet_get_pipeline_value: {},
  raynet_get_lead_stats: {},
  raynet_get_today_activities: {},
  raynet_get_overdue_activities: {},

  // Address tools (read-only list)
  raynet_list_company_addresses: { companyId: 1 },

  // Relationship tools (read-only list)
  raynet_list_contact_relationships: { contactId: 1 },
};

// Tools that require write operations - test with caution
const writeToolTests: Record<string, Record<string, unknown>> = {
  // These will be tested by creating and then cleaning up
};

async function runTests(): Promise<void> {
  console.log('='.repeat(70));
  console.log('Raynet MCP Server - Comprehensive Tool Test');
  console.log(`Server: ${MCP_SERVER_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
  console.log('');

  // Get all available tools
  console.log('Fetching tool list...');
  const allTools = await listTools();
  console.log(`Found ${allTools.length} tools\n`);

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Test read-only tools
  console.log('Testing read-only tools...\n');

  for (const tool of allTools) {
    const start = Date.now();
    let result: TestResult;

    if (toolTests[tool]) {
      try {
        const response = await callTool(tool, toolTests[tool]);
        const duration = Date.now() - start;

        if (response.error) {
          result = {
            tool,
            status: 'error',
            message: response.error.message,
            duration,
          };
          failed++;
        } else {
          result = {
            tool,
            status: 'success',
            duration,
          };
          passed++;
        }
      } catch (err) {
        result = {
          tool,
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
          duration: Date.now() - start,
        };
        failed++;
      }
    } else {
      // Tool not in test config - mark as skipped (likely write operation)
      result = {
        tool,
        status: 'skipped',
        message: 'Write operation - skipped in automated test',
      };
      skipped++;
    }

    results.push(result);

    // Print result
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏭️';
    const durationStr = result.duration ? `(${result.duration}ms)` : '';
    console.log(`${statusIcon} ${tool} ${durationStr}`);
    if (result.status === 'error') {
      console.log(`   Error: ${result.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total tools: ${allTools.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log('');

  // List failed tools
  if (failed > 0) {
    console.log('Failed tools:');
    results
      .filter((r) => r.status === 'error')
      .forEach((r) => {
        console.log(`  - ${r.tool}: ${r.message}`);
      });
  }

  // List skipped tools
  if (skipped > 0) {
    console.log('\nSkipped tools (write operations):');
    results
      .filter((r) => r.status === 'skipped')
      .forEach((r) => {
        console.log(`  - ${r.tool}`);
      });
  }

  console.log('\n' + '='.repeat(70));
}

runTests().catch(console.error);
