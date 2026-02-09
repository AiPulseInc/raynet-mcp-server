/**
 * MCP Tools Module Exports
 */

import { getConfig } from '../config/env';

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

// Mobile tool names — 25 essential tools for field sales reps
const mobileToolNames = new Set([
  // Companies (3)
  'raynet_search_companies',
  'raynet_get_company',
  'raynet_create_company',
  // Contacts (3)
  'raynet_search_contacts',
  'raynet_get_contact',
  'raynet_create_contact',
  // Deals (5)
  'raynet_list_deals',
  'raynet_search_deals',
  'raynet_get_deal',
  'raynet_create_deal',
  'raynet_update_deal_phase',
  // Activities (5)
  'raynet_create_activity',
  'raynet_complete_activity',
  'raynet_get_today_activities',
  'raynet_get_overdue_activities',
  'raynet_search_activities',
  // Leads (4)
  'raynet_search_leads',
  'raynet_get_lead',
  'raynet_create_lead',
  'raynet_convert_lead',
  // Products (2)
  'raynet_search_products',
  'raynet_get_product',
  // Offers (2)
  'raynet_create_offer_with_items',
  'raynet_get_offer',
  // Enums (1)
  'raynet_get_all_enums',
]);

// All tool definitions (full set)
const fullToolDefinitions = [
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

// Export tool definitions based on TOOL_MODE env variable
export function getToolDefinitions(): typeof fullToolDefinitions {
  try {
    const config = getConfig();
    if (config.server.toolMode === 'mobile') {
      return fullToolDefinitions.filter((t: { name: string }) => mobileToolNames.has(t.name));
    }
  } catch {
    // Config not loaded yet (e.g. during tests), return full set
  }
  return fullToolDefinitions;
}

// Backward-compatible export (lazy getter)
export const allToolDefinitions = fullToolDefinitions;

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
