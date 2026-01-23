/**
 * MCP Tools Module Exports
 */

// Company tools
export {
  companyToolDefinitions,
  handleCompanyTool,
  handleListCompanies,
  handleSearchCompanies,
  handleGetCompany,
  handleCreateCompany,
  handleUpdateCompany,
  handleDeleteCompany,
} from './companies';

// All tool definitions
export const allToolDefinitions = [
  ...require('./companies').companyToolDefinitions,
];

// Tool handler router
export async function handleTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Company tools
  if (toolName.startsWith('raynet_') && toolName.includes('compan')) {
    const { handleCompanyTool } = require('./companies');
    return handleCompanyTool(toolName, args);
  }

  // Unknown tool
  return {
    content: [
      {
        type: 'text',
        text: `Nieznane narzędzie: ${toolName}`,
      },
    ],
  };
}
