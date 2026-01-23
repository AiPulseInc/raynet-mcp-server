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

// Deal tools
export {
  dealToolDefinitions,
  handleDealTool,
  handleListDeals,
  handleSearchDeals,
  handleGetDeal,
  handleCreateDeal,
  handleUpdateDeal,
  handleUpdateDealPhase,
  handleDeleteDeal,
  handleGetPipelineValue,
} from './deals';

// Activity tools
export {
  activityToolDefinitions,
  handleActivityTool,
  handleListActivities,
  handleSearchActivities,
  handleGetActivity,
  handleCreateActivity,
  handleUpdateActivity,
  handleCompleteActivity,
  handleDeleteActivity,
  handleGetTodayActivities,
  handleGetOverdueActivities,
} from './activities';

// Lead tools
export {
  leadToolDefinitions,
  handleLeadTool,
  handleListLeads,
  handleSearchLeads,
  handleGetLead,
  handleCreateLead,
  handleUpdateLead,
  handleUpdateLeadPhase,
  handleDeleteLead,
  handleConvertLead,
  handleGetLeadStats,
} from './leads';

// Enum tools
export {
  enumToolDefinitions,
  handleEnumTool,
  handleGetCompanyCategories,
  handleGetCompanyTurnovers,
  handleGetDealCategories,
  handleGetDealPhases,
  handleGetLeadPhases,
  handleGetContactSources,
  handleGetCurrencies,
  handleGetAllEnums,
} from './enums';

// All tool definitions
export const allToolDefinitions = [
  ...require('./companies').companyToolDefinitions,
  ...require('./contacts').contactToolDefinitions,
  ...require('./deals').dealToolDefinitions,
  ...require('./activities').activityToolDefinitions,
  ...require('./leads').leadToolDefinitions,
  ...require('./enums').enumToolDefinitions,
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

  // Deal tools
  if (toolName.startsWith('raynet_') && (toolName.includes('deal') || toolName.includes('pipeline'))) {
    const { handleDealTool } = require('./deals');
    return handleDealTool(toolName, args);
  }

  // Activity tools
  if (toolName.startsWith('raynet_') && (toolName.includes('activit') || toolName.includes('today') || toolName.includes('overdue'))) {
    const { handleActivityTool } = require('./activities');
    return handleActivityTool(toolName, args);
  }

  // Lead tools
  if (toolName.startsWith('raynet_') && (toolName.includes('lead') || toolName.includes('convert'))) {
    const { handleLeadTool } = require('./leads');
    return handleLeadTool(toolName, args);
  }

  // Enum tools
  if (toolName.startsWith('raynet_get_') && (
    toolName.includes('categor') ||
    toolName.includes('turnover') ||
    toolName.includes('phase') ||
    toolName.includes('source') ||
    toolName.includes('currenc') ||
    toolName.includes('enum')
  )) {
    const { handleEnumTool } = require('./enums');
    return handleEnumTool(toolName, args);
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
