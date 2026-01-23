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

// Contact tools
export {
  contactToolDefinitions,
  handleContactTool,
  handleListContacts,
  handleSearchContacts,
  handleGetContact,
  handleCreateContact,
  handleUpdateContact,
  handleDeleteContact,
  handleLinkContactToCompany,
} from './contacts';

// All tool definitions
export const allToolDefinitions = [
  ...require('./companies').companyToolDefinitions,
  ...require('./contacts').contactToolDefinitions,
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

  // Contact tools
  if (toolName.startsWith('raynet_') && toolName.includes('contact')) {
    const { handleContactTool } = require('./contacts');
    return handleContactTool(toolName, args);
  }

  // Link tool (special case)
  if (toolName === 'raynet_link_contact_to_company') {
    const { handleLinkContactToCompany } = require('./contacts');
    return handleLinkContactToCompany(args);
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
