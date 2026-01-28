/**
 * Cleanup Test Data Script
 *
 * This script searches for and deletes all test entities with "_TEST_" prefix
 * from Raynet CRM in the correct order to avoid dependency issues.
 */

import { handleTool } from '../src/tools/index';

interface TestEntity {
  id: number;
  name: string;
  type: string;
}

const TEST_PREFIX = '_TEST_';

// Results tracking
const findings: {
  activities: TestEntity[];
  salesOrders: TestEntity[];
  offers: TestEntity[];
  projects: TestEntity[];
  deals: TestEntity[];
  leads: TestEntity[];
  products: TestEntity[];
  contacts: TestEntity[];
  companies: TestEntity[];
} = {
  activities: [],
  salesOrders: [],
  offers: [],
  projects: [],
  deals: [],
  leads: [],
  products: [],
  contacts: [],
  companies: [],
};

const deletionResults: {
  success: string[];
  failed: string[];
} = {
  success: [],
  failed: [],
};

/**
 * Parse search results to extract entity IDs and names
 */
function parseSearchResults(text: string, entityType: string): TestEntity[] {
  const entities: TestEntity[] = [];

  // Match pattern: **Name** (ID: 123) or **Name** (Code, ID: 123)
  // Example: **_TEST_Company_Updated_V2** (ID: 29)
  // Example: **_TEST_Lead_Minimal** (L-26-002, ID: 2)
  const pattern = /\*\*([^*]+)\*\*\s*\([^)]*ID:\s*(\d+)\)/g;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const name = match[1].trim();
    const id = parseInt(match[2], 10);

    if (name.includes(TEST_PREFIX)) {
      entities.push({ id, name, type: entityType });
    }
  }

  return entities;
}

/**
 * Search for test entities
 */
async function searchTestEntities(): Promise<void> {
  console.log('\n=== SEARCHING FOR TEST DATA ===\n');

  // Search Companies
  console.log('Searching companies...');
  try {
    const companyResult = await handleTool('raynet_search_companies', { query: TEST_PREFIX, limit: 100 });
    const text = companyResult.content[0].text;
    console.log('Company search result:', text.substring(0, 200));
    findings.companies = parseSearchResults(text, 'company');
    console.log(`Found ${findings.companies.length} test companies`);
  } catch (error) {
    console.error('Error searching companies:', error);
  }

  // Search Contacts
  console.log('Searching contacts...');
  try {
    const contactResult = await handleTool('raynet_search_contacts', { query: TEST_PREFIX, limit: 100 });
    const text = contactResult.content[0].text;
    console.log('Contact search result:', text.substring(0, 200));
    findings.contacts = parseSearchResults(text, 'contact');
    console.log(`Found ${findings.contacts.length} test contacts`);
  } catch (error) {
    console.error('Error searching contacts:', error);
  }

  // Search Deals
  console.log('Searching deals...');
  try {
    const dealResult = await handleTool('raynet_search_deals', { query: TEST_PREFIX, limit: 100 });
    const text = dealResult.content[0].text;
    console.log('Deal search result:', text.substring(0, 200));
    findings.deals = parseSearchResults(text, 'deal');
    console.log(`Found ${findings.deals.length} test deals`);
  } catch (error) {
    console.error('Error searching deals:', error);
  }

  // Search Leads
  console.log('Searching leads...');
  try {
    const leadResult = await handleTool('raynet_search_leads', { query: TEST_PREFIX, limit: 100 });
    const text = leadResult.content[0].text;
    console.log('Lead search result:', text.substring(0, 200));
    findings.leads = parseSearchResults(text, 'lead');
    console.log(`Found ${findings.leads.length} test leads`);
  } catch (error) {
    console.error('Error searching leads:', error);
  }

  // Search Activities
  console.log('Searching activities...');
  try {
    const activityResult = await handleTool('raynet_search_activities', { query: TEST_PREFIX, limit: 100 });
    const text = activityResult.content[0].text;
    console.log('Activity search result:', text.substring(0, 200));
    findings.activities = parseSearchResults(text, 'activity');
    console.log(`Found ${findings.activities.length} test activities`);
  } catch (error) {
    console.error('Error searching activities:', error);
  }

  // Search Products
  console.log('Searching products...');
  try {
    const productResult = await handleTool('raynet_search_products', { query: TEST_PREFIX, limit: 100 });
    const text = productResult.content[0].text;
    console.log('Product search result:', text.substring(0, 200));
    findings.products = parseSearchResults(text, 'product');
    console.log(`Found ${findings.products.length} test products`);
  } catch (error) {
    console.error('Error searching products:', error);
  }

  // Search Offers
  console.log('Searching offers...');
  try {
    const offerResult = await handleTool('raynet_search_offers', { query: TEST_PREFIX, limit: 100 });
    const text = offerResult.content[0].text;
    console.log('Offer search result:', text.substring(0, 200));
    findings.offers = parseSearchResults(text, 'offer');
    console.log(`Found ${findings.offers.length} test offers`);
  } catch (error) {
    console.error('Error searching offers:', error);
  }

  // Search Sales Orders
  console.log('Searching sales orders...');
  try {
    const salesOrderResult = await handleTool('raynet_search_sales_orders', { query: TEST_PREFIX, limit: 100 });
    const text = salesOrderResult.content[0].text;
    console.log('Sales order search result:', text.substring(0, 200));
    findings.salesOrders = parseSearchResults(text, 'salesOrder');
    console.log(`Found ${findings.salesOrders.length} test sales orders`);
  } catch (error) {
    console.error('Error searching sales orders:', error);
  }

  // Search Projects
  console.log('Searching projects...');
  try {
    const projectResult = await handleTool('raynet_search_projects', { query: TEST_PREFIX, limit: 100 });
    const text = projectResult.content[0].text;
    console.log('Project search result:', text.substring(0, 200));
    findings.projects = parseSearchResults(text, 'project');
    console.log(`Found ${findings.projects.length} test projects`);
  } catch (error) {
    console.error('Error searching projects:', error);
  }
}

/**
 * Delete test entities in correct order
 */
async function deleteTestEntities(): Promise<void> {
  console.log('\n=== DELETING TEST DATA ===\n');

  // Phase 1: Delete Activities, Sales Orders, Offers, Projects
  console.log('Phase 1: Deleting Activities, Sales Orders, Offers, Projects...\n');

  for (const activity of findings.activities) {
    try {
      // Activity deletion requires type - try to determine from name or default to Task
      const activityType = activity.name.toLowerCase().includes('meeting') ? 'Meeting' :
                          activity.name.toLowerCase().includes('call') ? 'PhoneCall' :
                          activity.name.toLowerCase().includes('email') ? 'Email' : 'Task';

      await handleTool('raynet_delete_activity', { activityId: activity.id, activityType });
      deletionResults.success.push(`Activity: ${activity.name} (ID: ${activity.id})`);
      console.log(`✓ Deleted activity: ${activity.name} (ID: ${activity.id})`);
    } catch (error) {
      deletionResults.failed.push(`Activity: ${activity.name} (ID: ${activity.id}) - ${error}`);
      console.error(`✗ Failed to delete activity: ${activity.name} (ID: ${activity.id})`, error);
    }
  }

  for (const salesOrder of findings.salesOrders) {
    try {
      await handleTool('raynet_delete_sales_order', { salesOrderId: salesOrder.id });
      deletionResults.success.push(`Sales Order: ${salesOrder.name} (ID: ${salesOrder.id})`);
      console.log(`✓ Deleted sales order: ${salesOrder.name} (ID: ${salesOrder.id})`);
    } catch (error) {
      deletionResults.failed.push(`Sales Order: ${salesOrder.name} (ID: ${salesOrder.id}) - ${error}`);
      console.error(`✗ Failed to delete sales order: ${salesOrder.name} (ID: ${salesOrder.id})`, error);
    }
  }

  for (const offer of findings.offers) {
    try {
      await handleTool('raynet_delete_offer', { offerId: offer.id });
      deletionResults.success.push(`Offer: ${offer.name} (ID: ${offer.id})`);
      console.log(`✓ Deleted offer: ${offer.name} (ID: ${offer.id})`);
    } catch (error) {
      deletionResults.failed.push(`Offer: ${offer.name} (ID: ${offer.id}) - ${error}`);
      console.error(`✗ Failed to delete offer: ${offer.name} (ID: ${offer.id})`, error);
    }
  }

  for (const project of findings.projects) {
    try {
      await handleTool('raynet_delete_project', { projectId: project.id });
      deletionResults.success.push(`Project: ${project.name} (ID: ${project.id})`);
      console.log(`✓ Deleted project: ${project.name} (ID: ${project.id})`);
    } catch (error) {
      deletionResults.failed.push(`Project: ${project.name} (ID: ${project.id}) - ${error}`);
      console.error(`✗ Failed to delete project: ${project.name} (ID: ${project.id})`, error);
    }
  }

  // Phase 2: Delete Deals, Leads, Products
  console.log('\nPhase 2: Deleting Deals, Leads, Products...\n');

  for (const deal of findings.deals) {
    try {
      await handleTool('raynet_delete_deal', { dealId: deal.id });
      deletionResults.success.push(`Deal: ${deal.name} (ID: ${deal.id})`);
      console.log(`✓ Deleted deal: ${deal.name} (ID: ${deal.id})`);
    } catch (error) {
      deletionResults.failed.push(`Deal: ${deal.name} (ID: ${deal.id}) - ${error}`);
      console.error(`✗ Failed to delete deal: ${deal.name} (ID: ${deal.id})`, error);
    }
  }

  for (const lead of findings.leads) {
    try {
      await handleTool('raynet_delete_lead', { leadId: lead.id });
      deletionResults.success.push(`Lead: ${lead.name} (ID: ${lead.id})`);
      console.log(`✓ Deleted lead: ${lead.name} (ID: ${lead.id})`);
    } catch (error) {
      deletionResults.failed.push(`Lead: ${lead.name} (ID: ${lead.id}) - ${error}`);
      console.error(`✗ Failed to delete lead: ${lead.name} (ID: ${lead.id})`, error);
    }
  }

  for (const product of findings.products) {
    try {
      await handleTool('raynet_delete_product', { productId: product.id });
      deletionResults.success.push(`Product: ${product.name} (ID: ${product.id})`);
      console.log(`✓ Deleted product: ${product.name} (ID: ${product.id})`);
    } catch (error) {
      deletionResults.failed.push(`Product: ${product.name} (ID: ${product.id}) - ${error}`);
      console.error(`✗ Failed to delete product: ${product.name} (ID: ${product.id})`, error);
    }
  }

  // Phase 3: Delete Contacts
  console.log('\nPhase 3: Deleting Contacts...\n');

  for (const contact of findings.contacts) {
    try {
      await handleTool('raynet_delete_contact', { contactId: contact.id });
      deletionResults.success.push(`Contact: ${contact.name} (ID: ${contact.id})`);
      console.log(`✓ Deleted contact: ${contact.name} (ID: ${contact.id})`);
    } catch (error) {
      deletionResults.failed.push(`Contact: ${contact.name} (ID: ${contact.id}) - ${error}`);
      console.error(`✗ Failed to delete contact: ${contact.name} (ID: ${contact.id})`, error);
    }
  }

  // Phase 4: Delete Companies
  console.log('\nPhase 4: Deleting Companies...\n');

  for (const company of findings.companies) {
    try {
      await handleTool('raynet_delete_company', { companyId: company.id });
      deletionResults.success.push(`Company: ${company.name} (ID: ${company.id})`);
      console.log(`✓ Deleted company: ${company.name} (ID: ${company.id})`);
    } catch (error) {
      deletionResults.failed.push(`Company: ${company.name} (ID: ${company.id}) - ${error}`);
      console.error(`✗ Failed to delete company: ${company.name} (ID: ${company.id})`, error);
    }
  }
}

/**
 * Print final report
 */
function printReport(): void {
  console.log('\n' + '='.repeat(60));
  console.log('                    CLEANUP REPORT');
  console.log('='.repeat(60) + '\n');

  console.log('TEST ENTITIES FOUND:');
  console.log('-'.repeat(40));
  console.log(`  Companies:     ${findings.companies.length}`);
  console.log(`  Contacts:      ${findings.contacts.length}`);
  console.log(`  Deals:         ${findings.deals.length}`);
  console.log(`  Leads:         ${findings.leads.length}`);
  console.log(`  Activities:    ${findings.activities.length}`);
  console.log(`  Products:      ${findings.products.length}`);
  console.log(`  Offers:        ${findings.offers.length}`);
  console.log(`  Sales Orders:  ${findings.salesOrders.length}`);
  console.log(`  Projects:      ${findings.projects.length}`);

  const totalFound = findings.companies.length + findings.contacts.length +
                     findings.deals.length + findings.leads.length +
                     findings.activities.length + findings.products.length +
                     findings.offers.length + findings.salesOrders.length +
                     findings.projects.length;
  console.log('-'.repeat(40));
  console.log(`  TOTAL FOUND:   ${totalFound}`);

  console.log('\n\nDELETION RESULTS:');
  console.log('-'.repeat(40));
  console.log(`  Successfully deleted: ${deletionResults.success.length}`);
  console.log(`  Failed to delete:     ${deletionResults.failed.length}`);

  if (deletionResults.success.length > 0) {
    console.log('\n  Successfully deleted:');
    for (const item of deletionResults.success) {
      console.log(`    ✓ ${item}`);
    }
  }

  if (deletionResults.failed.length > 0) {
    console.log('\n  Failed to delete:');
    for (const item of deletionResults.failed) {
      console.log(`    ✗ ${item}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('                    END OF REPORT');
  console.log('='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  RAYNET CRM TEST DATA CLEANUP');
  console.log('  Prefix: ' + TEST_PREFIX);
  console.log('='.repeat(60));

  await searchTestEntities();
  await deleteTestEntities();
  printReport();
}

main().catch(console.error);
