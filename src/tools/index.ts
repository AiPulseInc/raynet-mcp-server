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
  handleListCompanyAddresses,
  handleAddCompanyAddress,
  handleUpdateCompanyAddress,
  handleDeleteCompanyAddress,
  handleSetPrimaryCompanyAddress,
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
  handleListContactRelationships,
  handleAddContactRelationship,
  handleUpdateContactRelationship,
  handleDeleteContactRelationship,
  handleSetPrimaryContactRelationship,
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

// Product tools
export {
  productToolDefinitions,
  handleProductTool,
  handleListProducts,
  handleSearchProducts,
  handleGetProduct,
  handleCreateProduct,
  handleUpdateProduct,
  handleDeleteProduct,
  handleGetProductCategories,
} from './products';

// Offer tools
export {
  offerToolDefinitions,
  handleOfferTool,
  handleListOffers,
  handleSearchOffers,
  handleGetOffer,
  handleCreateOffer,
  handleCreateOfferWithItems,
  handleUpdateOffer,
  handleDeleteOffer,
  handleAddOfferItem,
  handleRemoveOfferItem,
} from './offers';

// Sales Order tools
export {
  salesOrderToolDefinitions,
  handleSalesOrderTool,
  handleListSalesOrders,
  handleSearchSalesOrders,
  handleGetSalesOrder,
  handleCreateSalesOrder,
  handleCreateSalesOrderWithItems,
  handleCreateSalesOrderFromOffer,
  handleUpdateSalesOrder,
  handleDeleteSalesOrder,
  handleAddSalesOrderItem,
  handleRemoveSalesOrderItem,
} from './salesOrders';

// Project tools
export {
  projectToolDefinitions,
  handleProjectTool,
  handleListProjects,
  handleSearchProjects,
  handleGetProject,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
  handleAddProjectParticipant,
  handleRemoveProjectParticipant,
} from './projects';

// All tool definitions
export const allToolDefinitions = [
  ...require('./companies').companyToolDefinitions,
  ...require('./contacts').contactToolDefinitions,
  ...require('./deals').dealToolDefinitions,
  ...require('./activities').activityToolDefinitions,
  ...require('./leads').leadToolDefinitions,
  ...require('./enums').enumToolDefinitions,
  ...require('./products').productToolDefinitions,
  ...require('./offers').offerToolDefinitions,
  ...require('./salesOrders').salesOrderToolDefinitions,
  ...require('./projects').projectToolDefinitions,
];

// Tool handler router
export async function handleTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Company tools (including addresses)
  if (toolName.startsWith('raynet_') && (toolName.includes('compan') || toolName.includes('address'))) {
    const { handleCompanyTool } = require('./companies');
    return handleCompanyTool(toolName, args);
  }

  // Contact tools (including relationships)
  if (toolName.startsWith('raynet_') && (toolName.includes('contact') || toolName.includes('relationship'))) {
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

  // Product tools
  if (toolName.startsWith('raynet_') && toolName.includes('product')) {
    const { handleProductTool } = require('./products');
    return handleProductTool(toolName, args);
  }

  // Offer tools
  if (toolName.startsWith('raynet_') && toolName.includes('offer')) {
    const { handleOfferTool } = require('./offers');
    return handleOfferTool(toolName, args);
  }

  // Sales Order tools
  if (toolName.startsWith('raynet_') && toolName.includes('sales_order')) {
    const { handleSalesOrderTool } = require('./salesOrders');
    return handleSalesOrderTool(toolName, args);
  }

  // Project tools
  if (toolName.startsWith('raynet_') && (toolName.includes('project') || toolName.includes('participant'))) {
    const { handleProjectTool } = require('./projects');
    return handleProjectTool(toolName, args);
  }

  // Enum tools
  if (toolName.startsWith('raynet_get_') && (
    toolName.includes('categor') ||
    toolName.includes('turnover') ||
    toolName.includes('phase') ||
    toolName.includes('source') ||
    toolName.includes('currenc') ||
    toolName.includes('enum') ||
    toolName.includes('status')
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
