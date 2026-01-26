/**
 * Comprehensive Integration Test v2 for Raynet MCP Server
 *
 * Tests all 91 MCP tools systematically with real API calls.
 * Creates test data with _TEST_ prefix and cleans up after completion.
 *
 * Includes:
 * - Original tools (47): Companies, Contacts, Deals, Leads, Activities, Enums
 * - New tools (44): Products, Company Addresses, Contact Relationships, Offers, Sales Orders, Projects
 */

import 'dotenv/config';
import { handleTool } from '../../src/tools/index';

// ============================================================================
// Test Result Types
// ============================================================================

interface TestResult {
  tool: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  duration: number;
}

interface TestContext {
  // Companies
  companyFullId?: number;
  companyMinimalId?: number;
  // Contacts
  contactFullId?: number;
  contactMinimalId?: number;
  // Deals
  dealFullId?: number;
  dealMinimalId?: number;
  // Leads
  leadFullId?: number;
  leadMinimalId?: number;
  // Activities
  activityTaskId?: number;
  activityMeetingId?: number;
  // Products
  productFullId?: number;
  productMinimalId?: number;
  // Offers
  offerFullId?: number;
  offerItemId?: number;
  // Sales Orders
  salesOrderFullId?: number;
  salesOrderItemId?: number;
  // Projects
  projectFullId?: number;
  participantId?: number;
  // Addresses
  addressId?: number;
  // Relationships
  relationshipId?: number;
  // Enum IDs for reference
  dealPhaseId?: number;
  leadPhaseId?: number;
  productCategoryId?: number;
  currencyId?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractId(response: string): number | undefined {
  const idMatch = response.match(/ID:\s*(\d+)/);
  return idMatch ? parseInt(idMatch[1], 10) : undefined;
}

function extractFirstId(response: string): number | undefined {
  const idMatch = response.match(/ID\s+(\d+)/);
  return idMatch ? parseInt(idMatch[1], 10) : undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest(
  toolName: string,
  args: unknown,
  description?: string
): Promise<TestResult> {
  const start = Date.now();
  const result: TestResult = {
    tool: toolName,
    status: 'PASS',
    duration: 0,
  };

  try {
    const response = await handleTool(toolName, args);
    const text = response.content[0]?.text ?? '';
    result.duration = Date.now() - start;
    result.message = text.substring(0, 150);

    if (text.includes('Błąd:') || text.includes('Error') || text.includes('nieoczekiwany')) {
      result.status = 'FAIL';
      result.message = text.substring(0, 300);
    }

    return result;
  } catch (error) {
    result.duration = Date.now() - start;
    result.status = 'FAIL';
    result.message = error instanceof Error ? error.message : String(error);
    return result;
  }
}

// ============================================================================
// Test Results and Context
// ============================================================================

const results: TestResult[] = [];
const ctx: TestContext = {};

// ============================================================================
// Phase 1: Enum Tools (8 tools)
// ============================================================================

async function phase1_EnumTools(): Promise<void> {
  console.log('\n📚 Phase 1: Enum Tools (8 tools)');
  console.log('='.repeat(60));

  const tests = [
    { name: 'raynet_get_company_categories', args: {} },
    { name: 'raynet_get_company_turnovers', args: {} },
    { name: 'raynet_get_deal_categories', args: {} },
    { name: 'raynet_get_deal_phases', args: {} },
    { name: 'raynet_get_lead_phases', args: {} },
    { name: 'raynet_get_contact_sources', args: {} },
    { name: 'raynet_get_currencies', args: {} },
    { name: 'raynet_get_all_enums', args: {} },
  ];

  for (const test of tests) {
    console.log(`  Testing ${test.name}...`);
    const r = await runTest(test.name, test.args);
    results.push(r);

    // Extract IDs for later use
    if (test.name === 'raynet_get_deal_phases' && r.status === 'PASS') {
      ctx.dealPhaseId = extractFirstId(r.message ?? '');
    }
    if (test.name === 'raynet_get_lead_phases' && r.status === 'PASS') {
      ctx.leadPhaseId = extractFirstId(r.message ?? '');
    }
    if (test.name === 'raynet_get_currencies' && r.status === 'PASS') {
      ctx.currencyId = extractFirstId(r.message ?? '');
    }

    console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
    await delay(300);
  }
}

// ============================================================================
// Phase 2: Company Tools (6 tools)
// ============================================================================

async function phase2_CompanyTools(): Promise<void> {
  console.log('\n🏢 Phase 2: Company Tools (6 tools)');
  console.log('='.repeat(60));

  // Create Company - Full
  console.log('  Testing raynet_create_company (full)...');
  let r = await runTest('raynet_create_company', {
    name: '_TEST_Company_Full_V2',
    role: 'A_SUBSCRIBER',
    state: 'A_POTENTIAL',
    rating: 'B',
    regNumber: '1234567890',
    notice: 'Test company - comprehensive test v2',
    tags: ['test', 'v2'],
  });
  results.push(r);
  ctx.companyFullId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.companyFullId}`);
  await delay(500);

  // Create Company - Minimal
  console.log('  Testing raynet_create_company (minimal)...');
  r = await runTest('raynet_create_company', { name: '_TEST_Company_Minimal_V2' });
  results.push(r);
  ctx.companyMinimalId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.companyMinimalId}`);
  await delay(500);

  // Get Company
  console.log('  Testing raynet_get_company...');
  r = await runTest('raynet_get_company', { companyId: ctx.companyFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Company
  console.log('  Testing raynet_update_company...');
  r = await runTest('raynet_update_company', {
    companyId: ctx.companyFullId,
    name: '_TEST_Company_Updated_V2',
    notice: 'Updated - comprehensive test v2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Companies
  console.log('  Testing raynet_search_companies...');
  r = await runTest('raynet_search_companies', { query: '_TEST_Company' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Companies
  console.log('  Testing raynet_list_companies...');
  r = await runTest('raynet_list_companies', { limit: 5 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 3: Company Address Tools (5 tools)
// ============================================================================

async function phase3_CompanyAddressTools(): Promise<void> {
  console.log('\n📍 Phase 3: Company Address Tools (5 tools)');
  console.log('='.repeat(60));

  // Add Company Address
  console.log('  Testing raynet_add_company_address...');
  let r = await runTest('raynet_add_company_address', {
    companyId: ctx.companyFullId,
    name: 'Test Branch Office',
    street: 'Testowa 123',
    city: 'Warszawa',
    zipCode: '00-001',
    country: 'Polska',
  });
  results.push(r);
  ctx.addressId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.addressId}`);
  await delay(500);

  // List Company Addresses
  console.log('  Testing raynet_list_company_addresses...');
  r = await runTest('raynet_list_company_addresses', { companyId: ctx.companyFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Company Address
  console.log('  Testing raynet_update_company_address...');
  r = await runTest('raynet_update_company_address', {
    companyId: ctx.companyFullId,
    addressId: ctx.addressId,
    name: 'Updated Branch Office',
    city: 'Kraków',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Set Primary Address
  console.log('  Testing raynet_set_primary_company_address...');
  r = await runTest('raynet_set_primary_company_address', {
    companyId: ctx.companyFullId,
    addressId: ctx.addressId,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Delete Company Address (will be tested later in cleanup or skip if primary)
  console.log('  Testing raynet_delete_company_address...');
  r = await runTest('raynet_delete_company_address', {
    companyId: ctx.companyFullId,
    addressId: ctx.addressId,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 4: Contact Tools (7 tools)
// ============================================================================

async function phase4_ContactTools(): Promise<void> {
  console.log('\n👤 Phase 4: Contact Tools (7 tools)');
  console.log('='.repeat(60));

  // Create Contact - Full
  console.log('  Testing raynet_create_contact (full)...');
  let r = await runTest('raynet_create_contact', {
    firstName: '_TEST_Jan',
    lastName: 'Testowy_V2',
    companyId: ctx.companyFullId,
    position: 'Dyrektor Testowy',
    email: 'jan.testowy.v2@test.pl',
    phone: '+48111222333',
    notice: 'Test contact - comprehensive test v2',
    tags: ['vip', 'test'],
  });
  results.push(r);
  ctx.contactFullId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.contactFullId}`);
  await delay(500);

  // Create Contact - Minimal
  console.log('  Testing raynet_create_contact (minimal)...');
  r = await runTest('raynet_create_contact', {
    firstName: '_TEST_Maria',
    lastName: 'Testowa_V2',
  });
  results.push(r);
  ctx.contactMinimalId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.contactMinimalId}`);
  await delay(500);

  // Get Contact
  console.log('  Testing raynet_get_contact...');
  r = await runTest('raynet_get_contact', { contactId: ctx.contactFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Contact
  console.log('  Testing raynet_update_contact...');
  r = await runTest('raynet_update_contact', {
    contactId: ctx.contactFullId,
    firstName: '_TEST_Jan_Updated',
    email: 'jan.updated.v2@test.pl',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Link Contact to Company
  console.log('  Testing raynet_link_contact_to_company...');
  r = await runTest('raynet_link_contact_to_company', {
    contactId: ctx.contactMinimalId,
    companyId: ctx.companyFullId,
    relationshipType: 'Konsultant',
    primary: true,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Contacts
  console.log('  Testing raynet_search_contacts...');
  r = await runTest('raynet_search_contacts', { query: '_TEST_' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Contacts
  console.log('  Testing raynet_list_contacts...');
  r = await runTest('raynet_list_contacts', { companyId: ctx.companyFullId, limit: 10 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 5: Contact Relationship Tools (5 tools)
// ============================================================================

async function phase5_ContactRelationshipTools(): Promise<void> {
  console.log('\n🔗 Phase 5: Contact Relationship Tools (5 tools)');
  console.log('='.repeat(60));

  // Add Contact Relationship
  console.log('  Testing raynet_add_contact_relationship...');
  let r = await runTest('raynet_add_contact_relationship', {
    contactId: ctx.contactFullId,
    companyId: ctx.companyMinimalId,
    type: 'Doradca',
    primary: false,
  });
  results.push(r);
  ctx.relationshipId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.relationshipId}`);
  await delay(500);

  // List Contact Relationships
  console.log('  Testing raynet_list_contact_relationships...');
  r = await runTest('raynet_list_contact_relationships', { contactId: ctx.contactFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Contact Relationship
  console.log('  Testing raynet_update_contact_relationship...');
  r = await runTest('raynet_update_contact_relationship', {
    contactId: ctx.contactFullId,
    relationshipId: ctx.relationshipId,
    relationshipType: 'Konsultant Zewnętrzny',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Set Primary Contact Relationship
  console.log('  Testing raynet_set_primary_contact_relationship...');
  r = await runTest('raynet_set_primary_contact_relationship', {
    contactId: ctx.contactFullId,
    relationshipId: ctx.relationshipId,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Delete Contact Relationship
  console.log('  Testing raynet_delete_contact_relationship...');
  r = await runTest('raynet_delete_contact_relationship', {
    contactId: ctx.contactFullId,
    relationshipId: ctx.relationshipId,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 6: Product Tools (7 tools)
// ============================================================================

async function phase6_ProductTools(): Promise<void> {
  console.log('\n📦 Phase 6: Product Tools (7 tools)');
  console.log('='.repeat(60));

  // Create Product - Full
  console.log('  Testing raynet_create_product (full)...');
  let r = await runTest('raynet_create_product', {
    name: '_TEST_Product_Full_V2',
    code: 'TEST-PROD-001',
    description: 'Test product - comprehensive test v2',
    unit: 'szt.',
    price: 1500.00,
    taxRate: 23,
    active: true,
  });
  results.push(r);
  ctx.productFullId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.productFullId}`);
  await delay(500);

  // Create Product - Minimal
  console.log('  Testing raynet_create_product (minimal)...');
  r = await runTest('raynet_create_product', {
    name: '_TEST_Product_Minimal_V2',
    code: 'TEST-PROD-002',
  });
  results.push(r);
  ctx.productMinimalId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.productMinimalId}`);
  await delay(500);

  // Get Product
  console.log('  Testing raynet_get_product...');
  r = await runTest('raynet_get_product', { productId: ctx.productFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Product
  console.log('  Testing raynet_update_product...');
  r = await runTest('raynet_update_product', {
    productId: ctx.productFullId,
    name: '_TEST_Product_Updated_V2',
    price: 2000.00,
    description: 'Updated product - comprehensive test v2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Products
  console.log('  Testing raynet_search_products...');
  r = await runTest('raynet_search_products', { query: '_TEST_Product' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Products
  console.log('  Testing raynet_list_products...');
  r = await runTest('raynet_list_products', { limit: 10 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Get Product Categories
  console.log('  Testing raynet_get_product_categories...');
  r = await runTest('raynet_get_product_categories', {});
  results.push(r);
  ctx.productCategoryId = extractFirstId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 7: Deal Tools (8 tools)
// ============================================================================

async function phase7_DealTools(): Promise<void> {
  console.log('\n💼 Phase 7: Deal Tools (8 tools)');
  console.log('='.repeat(60));

  // Create Deal - Full
  console.log('  Testing raynet_create_deal (full)...');
  let r = await runTest('raynet_create_deal', {
    name: '_TEST_Deal_Full_V2',
    companyId: ctx.companyFullId,
    contactId: ctx.contactFullId,
    totalAmount: 50000,
    probability: 75,
    validFrom: '2025-01-01',
    scheduledEnd: '2025-06-30',
    description: 'Test deal - comprehensive test v2',
    tags: ['test', 'v2'],
  });
  results.push(r);
  ctx.dealFullId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.dealFullId}`);
  await delay(500);

  // Create Deal - Minimal
  console.log('  Testing raynet_create_deal (minimal)...');
  r = await runTest('raynet_create_deal', {
    name: '_TEST_Deal_Minimal_V2',
    companyId: ctx.companyFullId,
  });
  results.push(r);
  ctx.dealMinimalId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.dealMinimalId}`);
  await delay(500);

  // Get Deal
  console.log('  Testing raynet_get_deal...');
  r = await runTest('raynet_get_deal', { dealId: ctx.dealFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Deal
  console.log('  Testing raynet_update_deal...');
  r = await runTest('raynet_update_deal', {
    dealId: ctx.dealFullId,
    name: '_TEST_Deal_Updated_V2',
    totalAmount: 75000,
    probability: 90,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Update Deal Phase
  console.log('  Testing raynet_update_deal_phase...');
  r = await runTest('raynet_update_deal_phase', {
    dealId: ctx.dealFullId,
    phaseId: ctx.dealPhaseId ?? 2,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Deals
  console.log('  Testing raynet_search_deals...');
  r = await runTest('raynet_search_deals', { query: '_TEST_Deal' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Deals
  console.log('  Testing raynet_list_deals...');
  r = await runTest('raynet_list_deals', { companyId: ctx.companyFullId, limit: 10 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Get Pipeline Value
  console.log('  Testing raynet_get_pipeline_value...');
  r = await runTest('raynet_get_pipeline_value', {});
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 8: Offer Tools (9 tools)
// ============================================================================

async function phase8_OfferTools(): Promise<void> {
  console.log('\n📋 Phase 8: Offer Tools (9 tools)');
  console.log('='.repeat(60));

  // Create Offer
  console.log('  Testing raynet_create_offer...');
  let r = await runTest('raynet_create_offer', {
    name: '_TEST_Offer_Full_V2',
    companyId: ctx.companyFullId,
    dealId: ctx.dealFullId,
    validFrom: '2025-01-01',
    validTill: '2025-03-31',
    description: 'Test offer - comprehensive test v2',
  });
  results.push(r);
  ctx.offerFullId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.offerFullId}`);
  await delay(500);

  // Create Offer with Items
  console.log('  Testing raynet_create_offer_with_items...');
  r = await runTest('raynet_create_offer_with_items', {
    name: '_TEST_Offer_WithItems_V2',
    companyId: ctx.companyFullId,
    dealId: ctx.dealMinimalId,
    validFrom: '2025-01-01',
    validTill: '2025-03-31',
    items: [
      {
        name: 'Test Item 1',
        quantity: 2,
        price: 1000,
      },
      {
        name: 'Test Item 2',
        quantity: 5,
        price: 500,
      },
    ],
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Get Offer
  console.log('  Testing raynet_get_offer...');
  r = await runTest('raynet_get_offer', { offerId: ctx.offerFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Offer
  console.log('  Testing raynet_update_offer...');
  r = await runTest('raynet_update_offer', {
    offerId: ctx.offerFullId,
    name: '_TEST_Offer_Updated_V2',
    description: 'Updated offer - comprehensive test v2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Add Offer Item
  console.log('  Testing raynet_add_offer_item...');
  r = await runTest('raynet_add_offer_item', {
    offerId: ctx.offerFullId,
    item: {
      name: 'Additional Item',
      quantity: 3,
      price: 750,
      description: 'Added item - comprehensive test v2',
    },
  });
  results.push(r);
  ctx.offerItemId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.offerItemId}`);
  await delay(500);

  // Remove Offer Item
  console.log('  Testing raynet_remove_offer_item...');
  r = await runTest('raynet_remove_offer_item', {
    offerId: ctx.offerFullId,
    itemId: ctx.offerItemId,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Offers
  console.log('  Testing raynet_search_offers...');
  r = await runTest('raynet_search_offers', { query: '_TEST_Offer' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Offers
  console.log('  Testing raynet_list_offers...');
  r = await runTest('raynet_list_offers', { companyId: ctx.companyFullId, limit: 10 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Note: raynet_delete_offer will be tested in cleanup
  console.log('  Testing raynet_delete_offer...');
  r = await runTest('raynet_delete_offer', { offerId: ctx.offerFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 9: Sales Order Tools (10 tools)
// ============================================================================

async function phase9_SalesOrderTools(): Promise<void> {
  console.log('\n🛒 Phase 9: Sales Order Tools (10 tools)');
  console.log('='.repeat(60));

  // First create an offer to convert
  console.log('  Creating offer for sales order conversion...');
  let offerForConversion: number | undefined;
  let r = await runTest('raynet_create_offer', {
    name: '_TEST_Offer_ForConversion_V2',
    companyId: ctx.companyFullId,
    dealId: ctx.dealFullId,
    validFrom: '2025-01-01',
    validTill: '2025-12-31',
  });
  offerForConversion = extractId(r.message ?? '');
  await delay(500);

  // Create Sales Order
  console.log('  Testing raynet_create_sales_order...');
  r = await runTest('raynet_create_sales_order', {
    name: '_TEST_SalesOrder_Full_V2',
    companyId: ctx.companyFullId,
    dealId: ctx.dealFullId,
    orderDate: '2025-01-15',
    deliveryDate: '2025-02-15',
    description: 'Test sales order - comprehensive test v2',
  });
  results.push(r);
  ctx.salesOrderFullId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.salesOrderFullId}`);
  await delay(500);

  // Create Sales Order with Items
  console.log('  Testing raynet_create_sales_order_with_items...');
  r = await runTest('raynet_create_sales_order_with_items', {
    name: '_TEST_SalesOrder_WithItems_V2',
    companyId: ctx.companyFullId,
    dealId: ctx.dealFullId,
    orderDate: '2025-01-15',
    items: [
      { name: 'Order Item 1', quantity: 10, price: 100 },
      { name: 'Order Item 2', quantity: 5, price: 200 },
    ],
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Create Sales Order from Offer
  console.log('  Testing raynet_create_sales_order_from_offer...');
  r = await runTest('raynet_create_sales_order_from_offer', {
    offerId: offerForConversion,
    name: '_TEST_SalesOrder_FromOffer_V2',
    orderDate: '2025-01-20',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Get Sales Order
  console.log('  Testing raynet_get_sales_order...');
  r = await runTest('raynet_get_sales_order', { salesOrderId: ctx.salesOrderFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Sales Order
  console.log('  Testing raynet_update_sales_order...');
  r = await runTest('raynet_update_sales_order', {
    salesOrderId: ctx.salesOrderFullId,
    name: '_TEST_SalesOrder_Updated_V2',
    description: 'Updated sales order - comprehensive test v2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Add Sales Order Item
  console.log('  Testing raynet_add_sales_order_item...');
  r = await runTest('raynet_add_sales_order_item', {
    salesOrderId: ctx.salesOrderFullId,
    item: {
      name: 'Additional Order Item',
      quantity: 2,
      price: 500,
      description: 'Added item - comprehensive test v2',
    },
  });
  results.push(r);
  ctx.salesOrderItemId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.salesOrderItemId}`);
  await delay(500);

  // Remove Sales Order Item
  console.log('  Testing raynet_remove_sales_order_item...');
  r = await runTest('raynet_remove_sales_order_item', {
    salesOrderId: ctx.salesOrderFullId,
    itemId: ctx.salesOrderItemId,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Sales Orders
  console.log('  Testing raynet_search_sales_orders...');
  r = await runTest('raynet_search_sales_orders', { query: '_TEST_SalesOrder' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Sales Orders
  console.log('  Testing raynet_list_sales_orders...');
  r = await runTest('raynet_list_sales_orders', { companyId: ctx.companyFullId, limit: 10 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Delete offer used for conversion
  if (offerForConversion) {
    await handleTool('raynet_delete_offer', { offerId: offerForConversion });
    await delay(300);
  }
}

// ============================================================================
// Phase 10: Project Tools (8 tools)
// ============================================================================

async function phase10_ProjectTools(): Promise<void> {
  console.log('\n📁 Phase 10: Project Tools (8 tools)');
  console.log('='.repeat(60));

  // Create Project (without dealId link to allow independent deletion)
  console.log('  Testing raynet_create_project...');
  let r = await runTest('raynet_create_project', {
    name: '_TEST_Project_Full_V2',
    companyId: ctx.companyFullId,
    startDate: '2025-02-01',
    endDate: '2025-12-31',
    description: 'Test project - comprehensive test v2',
    tags: ['test', 'v2'],
  });
  results.push(r);
  ctx.projectFullId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.projectFullId}`);
  await delay(500);

  // Get Project
  console.log('  Testing raynet_get_project...');
  r = await runTest('raynet_get_project', { projectId: ctx.projectFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Project
  console.log('  Testing raynet_update_project...');
  r = await runTest('raynet_update_project', {
    projectId: ctx.projectFullId,
    name: '_TEST_Project_Updated_V2',
    status: 'B_ACTIVE',
    description: 'Updated project - comprehensive test v2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Add Project Participant
  console.log('  Testing raynet_add_project_participant...');
  r = await runTest('raynet_add_project_participant', {
    projectId: ctx.projectFullId,
    contactId: ctx.contactFullId,
    note: 'Project Manager - comprehensive test v2',
  });
  results.push(r);
  ctx.participantId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.participantId}`);
  await delay(500);

  // Remove Project Participant
  console.log('  Testing raynet_remove_project_participant...');
  r = await runTest('raynet_remove_project_participant', {
    projectId: ctx.projectFullId,
    participantId: ctx.participantId,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Projects
  console.log('  Testing raynet_search_projects...');
  r = await runTest('raynet_search_projects', { query: '_TEST_Project' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Projects
  console.log('  Testing raynet_list_projects...');
  r = await runTest('raynet_list_projects', { companyId: ctx.companyFullId, limit: 10 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Delete Project
  console.log('  Testing raynet_delete_project...');
  r = await runTest('raynet_delete_project', { projectId: ctx.projectFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 11: Lead Tools (9 tools)
// ============================================================================

async function phase11_LeadTools(): Promise<void> {
  console.log('\n🎯 Phase 11: Lead Tools (9 tools)');
  console.log('='.repeat(60));

  // Create Lead - Full
  console.log('  Testing raynet_create_lead (full)...');
  let r = await runTest('raynet_create_lead', {
    topic: '_TEST_Lead_Full_V2',
    firstName: 'Test',
    lastName: 'Leadowy_V2',
    companyName: '_TEST_Lead_Company_V2',
    email: 'lead.v2@test.pl',
    phone: '+48555666777',
    notice: 'Test lead - comprehensive test v2',
    tags: ['hot', 'test'],
  });
  results.push(r);
  ctx.leadFullId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.leadFullId}`);
  await delay(500);

  // Create Lead - Minimal (for conversion)
  console.log('  Testing raynet_create_lead (minimal)...');
  r = await runTest('raynet_create_lead', {
    topic: '_TEST_Lead_Minimal_V2',
    companyName: '_TEST_LeadConvert_Company_V2',
    firstName: '_TEST_LeadConvert',
    lastName: 'Contact_V2',
  });
  results.push(r);
  ctx.leadMinimalId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.leadMinimalId}`);
  await delay(500);

  // Get Lead
  console.log('  Testing raynet_get_lead...');
  r = await runTest('raynet_get_lead', { leadId: ctx.leadFullId });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Lead
  console.log('  Testing raynet_update_lead...');
  r = await runTest('raynet_update_lead', {
    leadId: ctx.leadFullId,
    topic: '_TEST_Lead_Updated_V2',
    firstName: 'Updated',
    notice: 'Updated lead - comprehensive test v2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Update Lead Phase
  console.log('  Testing raynet_update_lead_phase...');
  r = await runTest('raynet_update_lead_phase', {
    leadId: ctx.leadFullId,
    phaseId: ctx.leadPhaseId ?? 104,
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Leads
  console.log('  Testing raynet_search_leads...');
  r = await runTest('raynet_search_leads', { query: '_TEST_Lead' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Leads
  console.log('  Testing raynet_list_leads...');
  r = await runTest('raynet_list_leads', { status: 'B_ACTIVE', limit: 10 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Get Lead Stats
  console.log('  Testing raynet_get_lead_stats...');
  r = await runTest('raynet_get_lead_stats', {});
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Convert Lead
  console.log('  Testing raynet_convert_lead...');
  r = await runTest('raynet_convert_lead', {
    leadId: ctx.leadMinimalId,
    createCompany: true,
    createContact: true,
    createDeal: true,
    dealName: '_TEST_Converted_Deal_V2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);
}

// ============================================================================
// Phase 12: Activity Tools (9 tools)
// ============================================================================

async function phase12_ActivityTools(): Promise<void> {
  console.log('\n📅 Phase 12: Activity Tools (9 tools)');
  console.log('='.repeat(60));

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dateFormat = (d: Date) => d.toISOString().slice(0, 19);

  // Create Activity - Task
  console.log('  Testing raynet_create_activity (Task)...');
  let r = await runTest('raynet_create_activity', {
    type: 'Task',
    title: '_TEST_Task_V2',
    companyId: ctx.companyFullId,
    contactId: ctx.contactFullId,
    scheduledFrom: dateFormat(tomorrow),
    scheduledTill: dateFormat(new Date(tomorrow.getTime() + 60 * 60 * 1000)),
    description: 'Test task - comprehensive test v2',
  });
  results.push(r);
  ctx.activityTaskId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.activityTaskId}`);
  await delay(500);

  // Create Activity - Meeting
  console.log('  Testing raynet_create_activity (Meeting)...');
  r = await runTest('raynet_create_activity', {
    type: 'Meeting',
    title: '_TEST_Meeting_V2',
    companyId: ctx.companyFullId,
    scheduledFrom: dateFormat(new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000)),
    scheduledTill: dateFormat(new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000)),
  });
  results.push(r);
  ctx.activityMeetingId = extractId(r.message ?? '');
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms) ID: ${ctx.activityMeetingId}`);
  await delay(500);

  // Get Activity
  console.log('  Testing raynet_get_activity...');
  r = await runTest('raynet_get_activity', {
    activityId: ctx.activityTaskId,
    activityType: 'Task',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Update Activity
  console.log('  Testing raynet_update_activity...');
  r = await runTest('raynet_update_activity', {
    activityId: ctx.activityTaskId,
    activityType: 'Task',
    title: '_TEST_Task_Updated_V2',
    description: 'Updated task - comprehensive test v2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Complete Activity
  console.log('  Testing raynet_complete_activity...');
  r = await runTest('raynet_complete_activity', {
    activityId: ctx.activityMeetingId,
    activityType: 'Meeting',
    solution: 'Meeting completed - comprehensive test v2',
  });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(500);

  // Search Activities
  console.log('  Testing raynet_search_activities...');
  r = await runTest('raynet_search_activities', { query: '_TEST_' });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // List Activities
  console.log('  Testing raynet_list_activities...');
  r = await runTest('raynet_list_activities', { companyId: ctx.companyFullId, limit: 10 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Get Today Activities
  console.log('  Testing raynet_get_today_activities...');
  r = await runTest('raynet_get_today_activities', { limit: 20 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);

  // Get Overdue Activities
  console.log('  Testing raynet_get_overdue_activities...');
  r = await runTest('raynet_get_overdue_activities', { limit: 20 });
  results.push(r);
  console.log(`    ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} (${r.duration}ms)`);
  await delay(300);
}

// ============================================================================
// Phase 13: Cleanup
// ============================================================================

async function phase13_Cleanup(): Promise<void> {
  console.log('\n🧹 Phase 13: Cleanup');
  console.log('='.repeat(60));

  // Delete Activities
  console.log('  Deleting activities...');
  if (ctx.activityTaskId) {
    await handleTool('raynet_delete_activity', { activityId: ctx.activityTaskId, activityType: 'Task' });
    console.log(`    Deleted Task ${ctx.activityTaskId}`);
    await delay(300);
  }
  if (ctx.activityMeetingId) {
    await handleTool('raynet_delete_activity', { activityId: ctx.activityMeetingId, activityType: 'Meeting' });
    console.log(`    Deleted Meeting ${ctx.activityMeetingId}`);
    await delay(300);
  }

  // Delete Sales Orders
  console.log('  Deleting sales orders...');
  const soSearch = await handleTool('raynet_search_sales_orders', { query: '_TEST_SalesOrder' });
  const soText = soSearch.content[0]?.text ?? '';
  const soIds = [...soText.matchAll(/ID:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  for (const id of soIds) {
    await handleTool('raynet_delete_sales_order', { salesOrderId: id });
    console.log(`    Deleted Sales Order ${id}`);
    await delay(300);
  }

  // Delete Offers
  console.log('  Deleting offers...');
  const offerSearch = await handleTool('raynet_search_offers', { query: '_TEST_Offer' });
  const offerText = offerSearch.content[0]?.text ?? '';
  const offerIds = [...offerText.matchAll(/ID:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  for (const id of offerIds) {
    await handleTool('raynet_delete_offer', { offerId: id });
    console.log(`    Deleted Offer ${id}`);
    await delay(300);
  }

  // Delete Deals
  console.log('  Deleting deals...');
  const dealSearch = await handleTool('raynet_search_deals', { query: '_TEST_Deal' });
  const dealText = dealSearch.content[0]?.text ?? '';
  const dealIds = [...dealText.matchAll(/ID:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  for (const id of dealIds) {
    await handleTool('raynet_delete_deal', { dealId: id });
    console.log(`    Deleted Deal ${id}`);
    await delay(300);
  }

  // Delete Leads
  console.log('  Deleting leads...');
  if (ctx.leadFullId) {
    await handleTool('raynet_delete_lead', { leadId: ctx.leadFullId });
    console.log(`    Deleted Lead ${ctx.leadFullId}`);
    await delay(300);
  }

  // Delete Products
  console.log('  Deleting products...');
  if (ctx.productFullId) {
    await handleTool('raynet_delete_product', { productId: ctx.productFullId });
    console.log(`    Deleted Product ${ctx.productFullId}`);
    await delay(300);
  }
  if (ctx.productMinimalId) {
    await handleTool('raynet_delete_product', { productId: ctx.productMinimalId });
    console.log(`    Deleted Product ${ctx.productMinimalId}`);
    await delay(300);
  }

  // Delete Contacts
  console.log('  Deleting contacts...');
  const contactSearch = await handleTool('raynet_search_contacts', { query: '_TEST_' });
  const contactText = contactSearch.content[0]?.text ?? '';
  const contactIds = [...contactText.matchAll(/ID:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  for (const id of contactIds) {
    await handleTool('raynet_delete_contact', { contactId: id });
    console.log(`    Deleted Contact ${id}`);
    await delay(300);
  }

  // Delete Companies
  console.log('  Deleting companies...');
  const companySearch = await handleTool('raynet_search_companies', { query: '_TEST_' });
  const companyText = companySearch.content[0]?.text ?? '';
  const companyIds = [...companyText.matchAll(/ID:\s*(\d+)/g)].map(m => parseInt(m[1], 10));
  for (const id of companyIds) {
    await handleTool('raynet_delete_company', { companyId: id });
    console.log(`    Deleted Company ${id}`);
    await delay(300);
  }

  console.log('  Cleanup complete!');
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('='.repeat(80));
  lines.push('📊 RAYNET MCP SERVER - COMPREHENSIVE TEST REPORT V2');
  lines.push('='.repeat(80));
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push('');

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  lines.push('## Summary');
  lines.push(`- Total Tools Tested: ${total}`);
  lines.push(`- ✅ Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
  lines.push(`- ❌ Failed: ${failed}`);
  lines.push(`- ⏭️ Skipped: ${skipped}`);
  lines.push('');

  // Group by category
  const categories: Record<string, TestResult[]> = {
    'Enum Tools': [],
    'Company Tools': [],
    'Company Address Tools': [],
    'Contact Tools': [],
    'Contact Relationship Tools': [],
    'Product Tools': [],
    'Deal Tools': [],
    'Offer Tools': [],
    'Sales Order Tools': [],
    'Project Tools': [],
    'Lead Tools': [],
    'Activity Tools': [],
  };

  for (const r of results) {
    if (r.tool.includes('categor') || r.tool.includes('turnover') || r.tool.includes('phase') ||
        r.tool.includes('source') || r.tool.includes('currenc') || r.tool.includes('enum')) {
      categories['Enum Tools'].push(r);
    } else if (r.tool.includes('address')) {
      categories['Company Address Tools'].push(r);
    } else if (r.tool.includes('relationship')) {
      categories['Contact Relationship Tools'].push(r);
    } else if (r.tool.includes('compan')) {
      categories['Company Tools'].push(r);
    } else if (r.tool.includes('contact') || r.tool.includes('link_contact')) {
      categories['Contact Tools'].push(r);
    } else if (r.tool.includes('product')) {
      categories['Product Tools'].push(r);
    } else if (r.tool.includes('deal') || r.tool.includes('pipeline')) {
      categories['Deal Tools'].push(r);
    } else if (r.tool.includes('offer')) {
      categories['Offer Tools'].push(r);
    } else if (r.tool.includes('sales_order')) {
      categories['Sales Order Tools'].push(r);
    } else if (r.tool.includes('project') || r.tool.includes('participant')) {
      categories['Project Tools'].push(r);
    } else if (r.tool.includes('lead') || r.tool.includes('convert')) {
      categories['Lead Tools'].push(r);
    } else if (r.tool.includes('activit') || r.tool.includes('today') || r.tool.includes('overdue')) {
      categories['Activity Tools'].push(r);
    }
  }

  for (const [category, tests] of Object.entries(categories)) {
    if (tests.length === 0) continue;

    const catPassed = tests.filter(t => t.status === 'PASS').length;
    const catFailed = tests.filter(t => t.status === 'FAIL').length;

    lines.push(`\n## ${category} (${catPassed}/${tests.length} passed)`);
    lines.push('| Tool | Status | Duration |');
    lines.push('|------|--------|----------|');

    for (const t of tests) {
      const icon = t.status === 'PASS' ? '✅' : t.status === 'FAIL' ? '❌' : '⏭️';
      lines.push(`| ${t.tool} | ${icon} ${t.status} | ${t.duration}ms |`);
    }

    // Show failed test details
    const failedTests = tests.filter(t => t.status === 'FAIL');
    if (failedTests.length > 0) {
      lines.push('');
      lines.push('**Failed Tests:**');
      for (const t of failedTests) {
        lines.push(`- \`${t.tool}\`: ${t.message?.substring(0, 200) ?? 'Unknown error'}`);
      }
    }
  }

  // Overall statistics
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  lines.push('\n## Execution Statistics');
  lines.push(`- Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  lines.push(`- Average per Tool: ${total > 0 ? (totalDuration / total).toFixed(0) : 0}ms`);

  lines.push('\n' + '='.repeat(80));

  return lines.join('\n');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 RAYNET MCP SERVER - COMPREHENSIVE INTEGRATION TEST V2');
  console.log('='.repeat(80));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('Testing all 91 MCP tools with real API calls...\n');

  try {
    await phase1_EnumTools();
    await phase2_CompanyTools();
    await phase3_CompanyAddressTools();
    await phase4_ContactTools();
    await phase5_ContactRelationshipTools();
    await phase6_ProductTools();
    await phase7_DealTools();
    await phase8_OfferTools();
    await phase9_SalesOrderTools();
    await phase10_ProjectTools();
    await phase11_LeadTools();
    await phase12_ActivityTools();
    await phase13_Cleanup();
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    // Still try to cleanup
    console.log('\nAttempting cleanup despite error...');
    try {
      await phase13_Cleanup();
    } catch (cleanupError) {
      console.error('Cleanup also failed:', cleanupError);
    }
  }

  const report = generateReport();
  console.log(report);

  // Exit with appropriate code
  const failed = results.filter(r => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
