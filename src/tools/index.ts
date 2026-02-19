/**
 * MCP Tools Module Exports
 */

import { getConfig } from '../config/env';

// ============================================================================
// Static imports (used internally for dispatch map and fullToolDefinitions)
// ============================================================================

import { companyToolDefinitions, handleCompanyTool } from './companies';
import { contactToolDefinitions, handleContactTool } from './contacts';
import { dealToolDefinitions, handleDealTool } from './deals';
import { activityToolDefinitions, handleActivityTool } from './activities';
import { leadToolDefinitions, handleLeadTool } from './leads';
import { enumToolDefinitions, handleEnumTool } from './enums';
import { productToolDefinitions, handleProductTool } from './products';
import { offerToolDefinitions, handleOfferTool } from './offers';
import { salesOrderToolDefinitions, handleSalesOrderTool } from './salesOrders';
import { projectToolDefinitions, handleProjectTool } from './projects';

// ============================================================================
// Re-exports for consumers of this module
// ============================================================================

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

// ============================================================================
// Tool Definitions (full set, built from static imports)
// ============================================================================

/** Mobile tool names — 25 essential tools for field sales reps */
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

/** All tool definitions — built from static imports only */
const fullToolDefinitions = [
  ...companyToolDefinitions,
  ...contactToolDefinitions,
  ...dealToolDefinitions,
  ...activityToolDefinitions,
  ...leadToolDefinitions,
  ...enumToolDefinitions,
  ...productToolDefinitions,
  ...offerToolDefinitions,
  ...salesOrderToolDefinitions,
  ...projectToolDefinitions,
];

// ============================================================================
// Tool Dispatch Map (pre-computed at module load — O(1) lookup per call)
// ============================================================================

type ToolHandler = (toolName: string, args: unknown) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;

/** Maps every tool name to its domain handler, built once at startup */
const toolDispatch = new Map<string, ToolHandler>();

for (const tool of companyToolDefinitions)    toolDispatch.set(tool.name, handleCompanyTool);
for (const tool of contactToolDefinitions)    toolDispatch.set(tool.name, handleContactTool);
for (const tool of dealToolDefinitions)       toolDispatch.set(tool.name, handleDealTool);
for (const tool of activityToolDefinitions)   toolDispatch.set(tool.name, handleActivityTool);
for (const tool of leadToolDefinitions)       toolDispatch.set(tool.name, handleLeadTool);
for (const tool of enumToolDefinitions)       toolDispatch.set(tool.name, handleEnumTool);
for (const tool of productToolDefinitions)    toolDispatch.set(tool.name, handleProductTool);
for (const tool of offerToolDefinitions)      toolDispatch.set(tool.name, handleOfferTool);
for (const tool of salesOrderToolDefinitions) toolDispatch.set(tool.name, handleSalesOrderTool);
for (const tool of projectToolDefinitions)    toolDispatch.set(tool.name, handleProjectTool);

// ============================================================================
// Public API
// ============================================================================

/** Return tool definitions filtered by TOOL_MODE */
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

/** Backward-compatible export */
export const allToolDefinitions = fullToolDefinitions;

/** Route a tool call to the correct domain handler via pre-computed Map */
export async function handleTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const handler = toolDispatch.get(toolName);
  if (!handler) {
    return {
      content: [
        {
          type: 'text',
          text: `Nieznane narzędzie: ${toolName}`,
        },
      ],
    };
  }
  return handler(toolName, args);
}
