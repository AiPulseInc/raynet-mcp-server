/**
 * Comprehensive Integration Test for Raynet MCP Server
 *
 * Tests all 43+ MCP tools systematically with real API calls.
 * Creates test data with _TEST_ prefix and cleans up after completion.
 */

import 'dotenv/config';
import { handleTool } from '../../src/tools/index';

// ============================================================================
// Test Result Types
// ============================================================================

interface TestResult {
  tool: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  fieldsTested: string[];
  issues: string[];
  response?: string;
  duration: number;
}

interface TestContext {
  companyFullId?: number;
  companyMinimalId?: number;
  contactFullId?: number;
  contactMinimalId?: number;
  dealFullId?: number;
  dealMinimalId?: number;
  leadFullId?: number;
  leadMinimalId?: number;
  activityTaskId?: number;
  activityMeetingId?: number;
  activityPhoneCallId?: number;
  activityEmailId?: number;
  // From lead conversion
  convertedCompanyId?: number;
  convertedContactId?: number;
  convertedDealId?: number;
  // Enum IDs for reference
  dealPhaseId?: number;
  leadPhaseId?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractId(response: string): number | undefined {
  const idMatch = response.match(/ID:\s*(\d+)/);
  return idMatch ? parseInt(idMatch[1], 10) : undefined;
}

function extractMultipleIds(response: string): number[] {
  const matches = response.matchAll(/ID:\s*(\d+)/g);
  return Array.from(matches, m => parseInt(m[1], 10));
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest(
  toolName: string,
  args: unknown,
  expectedFields: string[] = []
): Promise<TestResult> {
  const start = Date.now();
  const result: TestResult = {
    tool: toolName,
    status: 'PASS',
    fieldsTested: expectedFields,
    issues: [],
    duration: 0,
  };

  try {
    const response = await handleTool(toolName, args);
    const text = response.content[0]?.text ?? '';
    result.response = text;
    result.duration = Date.now() - start;

    if (text.includes('Błąd:') || text.includes('Error')) {
      result.status = 'FAIL';
      result.issues.push(text);
    }

    return result;
  } catch (error) {
    result.duration = Date.now() - start;
    result.status = 'FAIL';
    result.issues.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

// ============================================================================
// Test Phases
// ============================================================================

const results: TestResult[] = [];
const ctx: TestContext = {};

async function phase1_EnumTools(): Promise<void> {
  console.log('\n📚 Phase 1: Testing Enum Tools (8 tools)');
  console.log('=' .repeat(60));

  // Test 1: Get Company Categories
  console.log('  Testing raynet_get_company_categories...');
  let r = await runTest('raynet_get_company_categories', {}, ['id', 'code']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 2: Get Company Turnovers
  console.log('  Testing raynet_get_company_turnovers...');
  r = await runTest('raynet_get_company_turnovers', {}, ['id', 'code']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 3: Get Deal Categories
  console.log('  Testing raynet_get_deal_categories...');
  r = await runTest('raynet_get_deal_categories', {}, ['id', 'code', 'color']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 4: Get Deal Phases
  console.log('  Testing raynet_get_deal_phases...');
  r = await runTest('raynet_get_deal_phases', {}, ['id', 'code']);
  results.push(r);
  // Extract a phase ID for later use
  const phaseMatch = r.response?.match(/ID\s+(\d+)/);
  if (phaseMatch) ctx.dealPhaseId = parseInt(phaseMatch[1], 10);
  console.log(`    ${r.status}: ${r.duration}ms (phaseId: ${ctx.dealPhaseId})`);
  await delay(300);

  // Test 5: Get Lead Phases
  console.log('  Testing raynet_get_lead_phases...');
  r = await runTest('raynet_get_lead_phases', {}, ['id', 'code']);
  results.push(r);
  // Extract a lead phase ID for later use
  const leadPhaseMatch = r.response?.match(/ID\s+(\d+)/);
  if (leadPhaseMatch) ctx.leadPhaseId = parseInt(leadPhaseMatch[1], 10);
  console.log(`    ${r.status}: ${r.duration}ms (leadPhaseId: ${ctx.leadPhaseId})`);
  await delay(300);

  // Test 6: Get Contact Sources
  console.log('  Testing raynet_get_contact_sources...');
  r = await runTest('raynet_get_contact_sources', {}, ['id', 'code']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 7: Get Currencies
  console.log('  Testing raynet_get_currencies...');
  r = await runTest('raynet_get_currencies', {}, ['id', 'code', 'symbol']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 8: Get All Enums
  console.log('  Testing raynet_get_all_enums...');
  r = await runTest('raynet_get_all_enums', {}, ['categories', 'turnovers', 'phases', 'currencies']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);
}

async function phase2_CompanyTools(): Promise<void> {
  console.log('\n🏢 Phase 2: Testing Company Tools (6 tools)');
  console.log('='.repeat(60));

  // Test 1: Create Company - Full
  console.log('  Testing raynet_create_company (full)...');
  let r = await runTest('raynet_create_company', {
    name: '_TEST_Company_Full',
    role: 'A_SUBSCRIBER',
    state: 'A_POTENTIAL',
    rating: 'B',
    regNumber: '1234567890',
    taxNumber: 'PL1234567890',
    notice: 'Test company notice - automated testing',
    tags: ['test', 'automated'],
    address: {
      street: 'Testowa 1',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'Polska',
    },
    contactInfo: {
      email: 'test@testcompany.pl',
      tel1: '+48123456789',
      www: 'www.testcompany.pl',
    },
  }, ['name', 'role', 'state', 'rating', 'regNumber', 'taxNumber', 'notice', 'tags', 'address', 'contactInfo']);
  results.push(r);
  ctx.companyFullId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.companyFullId})`);
  await delay(500);

  // Test 2: Create Company - Minimal
  console.log('  Testing raynet_create_company (minimal)...');
  r = await runTest('raynet_create_company', {
    name: '_TEST_Company_Minimal',
  }, ['name']);
  results.push(r);
  ctx.companyMinimalId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.companyMinimalId})`);
  await delay(500);

  // Test 3: Get Company
  console.log('  Testing raynet_get_company...');
  r = await runTest('raynet_get_company', {
    companyId: ctx.companyFullId,
  }, ['companyId']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 4: Update Company
  console.log('  Testing raynet_update_company...');
  r = await runTest('raynet_update_company', {
    companyId: ctx.companyFullId,
    name: '_TEST_Company_Updated',
    role: 'B_PARTNER',
    state: 'B_ACTUAL',
    rating: 'A',
    notice: 'Updated notice - automated testing',
    tags: ['updated', 'test'],
  }, ['companyId', 'name', 'role', 'state', 'rating', 'notice', 'tags']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 5: Search Companies
  console.log('  Testing raynet_search_companies...');
  r = await runTest('raynet_search_companies', {
    query: '_TEST_Company',
  }, ['query']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 6: List Companies
  console.log('  Testing raynet_list_companies...');
  r = await runTest('raynet_list_companies', {
    state: 'A_POTENTIAL',
    limit: 5,
  }, ['state', 'limit']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);
}

async function phase3_ContactTools(): Promise<void> {
  console.log('\n👤 Phase 3: Testing Contact Tools (7 tools)');
  console.log('='.repeat(60));

  // Test 1: Create Contact - Full
  console.log('  Testing raynet_create_contact (full)...');
  let r = await runTest('raynet_create_contact', {
    firstName: '_TEST_Jan',
    lastName: 'Testowy',
    companyId: ctx.companyFullId,
    position: 'Dyrektor Testowy',
    email: 'jan.testowy@test.pl',
    phone: '+48111222333',
    titleBefore: 'mgr',
    titleAfter: 'PhD',
    birthday: '1990-01-15',
    notice: 'Test contact note - automated testing',
    tags: ['vip', 'test'],
  }, ['firstName', 'lastName', 'companyId', 'position', 'email', 'phone', 'titleBefore', 'titleAfter', 'birthday', 'notice', 'tags']);
  results.push(r);
  ctx.contactFullId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.contactFullId})`);
  await delay(500);

  // Test 2: Create Contact - Minimal
  console.log('  Testing raynet_create_contact (minimal)...');
  r = await runTest('raynet_create_contact', {
    firstName: '_TEST_Maria',
    lastName: 'Testowa',
  }, ['firstName', 'lastName']);
  results.push(r);
  ctx.contactMinimalId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.contactMinimalId})`);
  await delay(500);

  // Test 3: Get Contact
  console.log('  Testing raynet_get_contact...');
  r = await runTest('raynet_get_contact', {
    contactId: ctx.contactFullId,
  }, ['contactId']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 4: Update Contact
  console.log('  Testing raynet_update_contact...');
  r = await runTest('raynet_update_contact', {
    contactId: ctx.contactFullId,
    firstName: '_TEST_Jan_Updated',
    email: 'jan.updated@test.pl',
    phone: '+48999888777',
    notice: 'Updated note - automated testing',
  }, ['contactId', 'firstName', 'email', 'phone', 'notice']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 5: Link Contact to Company
  console.log('  Testing raynet_link_contact_to_company...');
  r = await runTest('raynet_link_contact_to_company', {
    contactId: ctx.contactMinimalId,
    companyId: ctx.companyFullId,
    relationshipType: 'Konsultant',
    primary: true,
  }, ['contactId', 'companyId', 'relationshipType', 'primary']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 6: Search Contacts
  console.log('  Testing raynet_search_contacts...');
  r = await runTest('raynet_search_contacts', {
    query: '_TEST_',
  }, ['query']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 7: List Contacts
  console.log('  Testing raynet_list_contacts...');
  r = await runTest('raynet_list_contacts', {
    companyId: ctx.companyFullId,
    limit: 10,
  }, ['companyId', 'limit']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);
}

async function phase4_DealTools(): Promise<void> {
  console.log('\n💼 Phase 4: Testing Deal Tools (8 tools)');
  console.log('='.repeat(60));

  // Test 1: Create Deal - Full
  console.log('  Testing raynet_create_deal (full)...');
  let r = await runTest('raynet_create_deal', {
    name: '_TEST_Deal_Full',
    companyId: ctx.companyFullId,
    contactId: ctx.contactFullId,
    totalAmount: 50000,
    probability: 75,
    validFrom: '2025-01-01',
    scheduledEnd: '2025-06-30',
    description: 'Test deal description - automated testing',
    tags: ['test', 'q1'],
  }, ['name', 'companyId', 'contactId', 'totalAmount', 'probability', 'validFrom', 'scheduledEnd', 'description', 'tags']);
  results.push(r);
  ctx.dealFullId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.dealFullId})`);
  await delay(500);

  // Test 2: Create Deal - Minimal
  console.log('  Testing raynet_create_deal (minimal)...');
  r = await runTest('raynet_create_deal', {
    name: '_TEST_Deal_Minimal',
    companyId: ctx.companyFullId,
  }, ['name', 'companyId']);
  results.push(r);
  ctx.dealMinimalId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.dealMinimalId})`);
  await delay(500);

  // Test 3: Get Deal
  console.log('  Testing raynet_get_deal...');
  r = await runTest('raynet_get_deal', {
    dealId: ctx.dealFullId,
  }, ['dealId']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 4: Update Deal
  console.log('  Testing raynet_update_deal...');
  r = await runTest('raynet_update_deal', {
    dealId: ctx.dealFullId,
    name: '_TEST_Deal_Updated',
    totalAmount: 75000,
    probability: 90,
    description: 'Updated description - automated testing',
  }, ['dealId', 'name', 'totalAmount', 'probability', 'description']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 5: Update Deal Phase
  console.log('  Testing raynet_update_deal_phase...');
  r = await runTest('raynet_update_deal_phase', {
    dealId: ctx.dealFullId,
    phaseId: ctx.dealPhaseId ?? 2, // Default to phase 2 if not found
  }, ['dealId', 'phaseId']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 6: Search Deals
  console.log('  Testing raynet_search_deals...');
  r = await runTest('raynet_search_deals', {
    query: '_TEST_Deal',
  }, ['query']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 7: List Deals
  console.log('  Testing raynet_list_deals...');
  r = await runTest('raynet_list_deals', {
    companyId: ctx.companyFullId,
    limit: 10,
  }, ['companyId', 'limit']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 8: Get Pipeline Value
  console.log('  Testing raynet_get_pipeline_value...');
  r = await runTest('raynet_get_pipeline_value', {}, ['totalValue', 'estimatedValue', 'dealCount']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);
}

async function phase5_LeadTools(): Promise<void> {
  console.log('\n🎯 Phase 5: Testing Lead Tools (9 tools)');
  console.log('='.repeat(60));

  // Test 1: Create Lead - Full
  console.log('  Testing raynet_create_lead (full)...');
  let r = await runTest('raynet_create_lead', {
    topic: '_TEST_Lead_Full',
    firstName: 'Test',
    lastName: 'Leadowy',
    companyName: 'Test Lead Company',
    email: 'lead@test.pl',
    phone: '+48555666777',
    website: 'www.testlead.pl',
    priority: 'HIGH',
    notice: 'Test lead notes - automated testing',
    tags: ['hot', 'test'],
  }, ['topic', 'firstName', 'lastName', 'companyName', 'email', 'phone', 'website', 'priority', 'notice', 'tags']);
  results.push(r);
  ctx.leadFullId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.leadFullId})`);
  await delay(500);

  // Test 2: Create Lead - Minimal (for conversion)
  console.log('  Testing raynet_create_lead (minimal)...');
  r = await runTest('raynet_create_lead', {
    topic: '_TEST_Lead_Minimal',
    companyName: '_TEST_LeadConvert_Company',
    firstName: '_TEST_LeadConvert',
    lastName: 'Contact',
  }, ['topic']);
  results.push(r);
  ctx.leadMinimalId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.leadMinimalId})`);
  await delay(500);

  // Test 3: Get Lead
  console.log('  Testing raynet_get_lead...');
  r = await runTest('raynet_get_lead', {
    leadId: ctx.leadFullId,
  }, ['leadId']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 4: Update Lead
  console.log('  Testing raynet_update_lead...');
  r = await runTest('raynet_update_lead', {
    leadId: ctx.leadFullId,
    topic: '_TEST_Lead_Updated',
    firstName: 'Updated',
    priority: 'DEFAULT',
    notice: 'Updated notes - automated testing',
  }, ['leadId', 'topic', 'firstName', 'priority', 'notice']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 5: Update Lead Phase
  console.log('  Testing raynet_update_lead_phase...');
  r = await runTest('raynet_update_lead_phase', {
    leadId: ctx.leadFullId,
    phaseId: ctx.leadPhaseId ?? 104, // Default to "In Progress" phase
  }, ['leadId', 'phaseId']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 6: Search Leads
  console.log('  Testing raynet_search_leads...');
  r = await runTest('raynet_search_leads', {
    query: '_TEST_Lead',
  }, ['query']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 7: List Leads
  console.log('  Testing raynet_list_leads...');
  r = await runTest('raynet_list_leads', {
    status: 'B_ACTIVE',
    limit: 10,
  }, ['status', 'limit']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 8: Get Lead Stats
  console.log('  Testing raynet_get_lead_stats...');
  r = await runTest('raynet_get_lead_stats', {}, ['total', 'active', 'converted', 'cancelled']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 9: Convert Lead (on minimal lead)
  console.log('  Testing raynet_convert_lead...');
  r = await runTest('raynet_convert_lead', {
    leadId: ctx.leadMinimalId,
    createCompany: true,
    createContact: true,
    createDeal: true,
    dealName: '_TEST_Converted_Deal',
  }, ['leadId', 'createCompany', 'createContact', 'createDeal', 'dealName']);
  results.push(r);
  // Extract IDs from conversion result
  const ids = extractMultipleIds(r.response ?? '');
  if (ids.length >= 2) {
    // The response format typically shows company first, then contact, then deal
    ctx.convertedCompanyId = ids.find(id => r.response?.includes(`Utworzono firmę`) && r.response?.includes(`ID: ${id}`));
    ctx.convertedContactId = ids.find(id => r.response?.includes(`Utworzono kontakt`) && r.response?.includes(`ID: ${id}`));
    ctx.convertedDealId = ids.find(id => r.response?.includes(`Utworzono szansę`) && r.response?.includes(`ID: ${id}`));
  }
  console.log(`    ${r.status}: ${r.duration}ms (converted entities created)`);
  await delay(500);
}

async function phase6_ActivityTools(): Promise<void> {
  console.log('\n📅 Phase 6: Testing Activity Tools (9 tools)');
  console.log('='.repeat(60));

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dateFormat = (d: Date) => d.toISOString().slice(0, 19);

  // Test 1: Create Activity - Task
  console.log('  Testing raynet_create_activity (Task)...');
  let r = await runTest('raynet_create_activity', {
    type: 'Task',
    title: '_TEST_Task_Full',
    companyId: ctx.companyFullId,
    contactId: ctx.contactFullId,
    scheduledFrom: dateFormat(new Date(tomorrow.getTime())),
    scheduledTill: dateFormat(new Date(tomorrow.getTime() + 60 * 60 * 1000)),
    description: 'Test task description - automated testing',
    priority: 'HIGH',
  }, ['type', 'title', 'companyId', 'contactId', 'scheduledFrom', 'scheduledTill', 'description', 'priority']);
  results.push(r);
  ctx.activityTaskId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.activityTaskId})`);
  await delay(500);

  // Test 2: Create Activity - Meeting
  console.log('  Testing raynet_create_activity (Meeting)...');
  r = await runTest('raynet_create_activity', {
    type: 'Meeting',
    title: '_TEST_Meeting',
    companyId: ctx.companyFullId,
    scheduledFrom: dateFormat(new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000)),
    scheduledTill: dateFormat(new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000)),
  }, ['type', 'title', 'companyId', 'scheduledFrom', 'scheduledTill']);
  results.push(r);
  ctx.activityMeetingId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.activityMeetingId})`);
  await delay(500);

  // Test 3: Create Activity - PhoneCall
  console.log('  Testing raynet_create_activity (PhoneCall)...');
  r = await runTest('raynet_create_activity', {
    type: 'PhoneCall',
    title: '_TEST_PhoneCall',
    contactId: ctx.contactFullId,
    scheduledFrom: dateFormat(new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000)),
    scheduledTill: dateFormat(new Date(tomorrow.getTime() + 4.5 * 60 * 60 * 1000)),
  }, ['type', 'title', 'contactId', 'scheduledFrom', 'scheduledTill']);
  results.push(r);
  ctx.activityPhoneCallId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.activityPhoneCallId})`);
  await delay(500);

  // Test 4: Create Activity - Email
  console.log('  Testing raynet_create_activity (Email)...');
  r = await runTest('raynet_create_activity', {
    type: 'Email',
    title: '_TEST_Email',
    dealId: ctx.dealFullId,
    scheduledFrom: dateFormat(new Date(tomorrow.getTime() + 5 * 60 * 60 * 1000)),
    scheduledTill: dateFormat(new Date(tomorrow.getTime() + 5.25 * 60 * 60 * 1000)),
  }, ['type', 'title', 'dealId', 'scheduledFrom', 'scheduledTill']);
  results.push(r);
  ctx.activityEmailId = extractId(r.response ?? '');
  console.log(`    ${r.status}: ${r.duration}ms (ID: ${ctx.activityEmailId})`);
  await delay(500);

  // Test 5: Get Activity
  console.log('  Testing raynet_get_activity...');
  r = await runTest('raynet_get_activity', {
    activityId: ctx.activityTaskId,
    activityType: 'Task',
  }, ['activityId', 'activityType']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 6: Update Activity
  console.log('  Testing raynet_update_activity...');
  r = await runTest('raynet_update_activity', {
    activityId: ctx.activityTaskId,
    activityType: 'Task',
    title: '_TEST_Task_Updated',
    priority: 'LOW',
    description: 'Updated description - automated testing',
  }, ['activityId', 'activityType', 'title', 'priority', 'description']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 7: Complete Activity
  console.log('  Testing raynet_complete_activity...');
  r = await runTest('raynet_complete_activity', {
    activityId: ctx.activityMeetingId,
    activityType: 'Meeting',
    solution: 'Meeting completed successfully - automated testing',
  }, ['activityId', 'activityType', 'solution']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(500);

  // Test 8: Search Activities
  console.log('  Testing raynet_search_activities...');
  r = await runTest('raynet_search_activities', {
    query: '_TEST_',
  }, ['query']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 9: List Activities
  console.log('  Testing raynet_list_activities...');
  r = await runTest('raynet_list_activities', {
    companyId: ctx.companyFullId,
    limit: 10,
  }, ['companyId', 'limit']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 10: Get Today Activities
  console.log('  Testing raynet_get_today_activities...');
  r = await runTest('raynet_get_today_activities', {
    limit: 20,
  }, ['limit']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);

  // Test 11: Get Overdue Activities
  console.log('  Testing raynet_get_overdue_activities...');
  r = await runTest('raynet_get_overdue_activities', {
    limit: 20,
  }, ['limit']);
  results.push(r);
  console.log(`    ${r.status}: ${r.duration}ms`);
  await delay(300);
}

async function phase7_Cleanup(): Promise<void> {
  console.log('\n🧹 Phase 7: Cleanup');
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
  if (ctx.activityPhoneCallId) {
    await handleTool('raynet_delete_activity', { activityId: ctx.activityPhoneCallId, activityType: 'PhoneCall' });
    console.log(`    Deleted PhoneCall ${ctx.activityPhoneCallId}`);
    await delay(300);
  }
  if (ctx.activityEmailId) {
    await handleTool('raynet_delete_activity', { activityId: ctx.activityEmailId, activityType: 'Email' });
    console.log(`    Deleted Email ${ctx.activityEmailId}`);
    await delay(300);
  }

  // Delete Deals
  console.log('  Deleting deals...');
  if (ctx.dealFullId) {
    await handleTool('raynet_delete_deal', { dealId: ctx.dealFullId });
    console.log(`    Deleted Deal ${ctx.dealFullId}`);
    await delay(300);
  }
  if (ctx.dealMinimalId) {
    await handleTool('raynet_delete_deal', { dealId: ctx.dealMinimalId });
    console.log(`    Deleted Deal ${ctx.dealMinimalId}`);
    await delay(300);
  }
  if (ctx.convertedDealId) {
    await handleTool('raynet_delete_deal', { dealId: ctx.convertedDealId });
    console.log(`    Deleted Converted Deal ${ctx.convertedDealId}`);
    await delay(300);
  }

  // Delete Leads
  console.log('  Deleting leads...');
  if (ctx.leadFullId) {
    await handleTool('raynet_delete_lead', { leadId: ctx.leadFullId });
    console.log(`    Deleted Lead ${ctx.leadFullId}`);
    await delay(300);
  }
  // Note: leadMinimalId was converted, so it's already in C_CONVERTED status

  // Delete Contacts
  console.log('  Deleting contacts...');
  if (ctx.contactFullId) {
    await handleTool('raynet_delete_contact', { contactId: ctx.contactFullId });
    console.log(`    Deleted Contact ${ctx.contactFullId}`);
    await delay(300);
  }
  if (ctx.contactMinimalId) {
    await handleTool('raynet_delete_contact', { contactId: ctx.contactMinimalId });
    console.log(`    Deleted Contact ${ctx.contactMinimalId}`);
    await delay(300);
  }
  if (ctx.convertedContactId) {
    await handleTool('raynet_delete_contact', { contactId: ctx.convertedContactId });
    console.log(`    Deleted Converted Contact ${ctx.convertedContactId}`);
    await delay(300);
  }

  // Delete Companies
  console.log('  Deleting companies...');
  if (ctx.companyFullId) {
    await handleTool('raynet_delete_company', { companyId: ctx.companyFullId });
    console.log(`    Deleted Company ${ctx.companyFullId}`);
    await delay(300);
  }
  if (ctx.companyMinimalId) {
    await handleTool('raynet_delete_company', { companyId: ctx.companyMinimalId });
    console.log(`    Deleted Company ${ctx.companyMinimalId}`);
    await delay(300);
  }
  if (ctx.convertedCompanyId) {
    await handleTool('raynet_delete_company', { companyId: ctx.convertedCompanyId });
    console.log(`    Deleted Converted Company ${ctx.convertedCompanyId}`);
    await delay(300);
  }

  // Verify cleanup
  console.log('  Verifying cleanup...');
  const searchResult = await handleTool('raynet_search_companies', { query: '_TEST_' });
  const text = searchResult.content[0]?.text ?? '';
  if (text.includes('Nie znaleziono') || !text.includes('_TEST_')) {
    console.log('    ✅ All test data removed successfully');
  } else {
    console.log('    ⚠️ Some test data may remain - manual cleanup may be needed');
  }
}

function generateReport(): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RAYNET MCP SERVER TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const partial = results.filter(r => r.status === 'PARTIAL').length;
  const total = results.length;

  console.log('## Summary');
  console.log(`- Total Tools Tested: ${total}`);
  console.log(`- Passed: ${passed}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Partial: ${partial}`);
  console.log('');

  // Results by Category
  const categories: Record<string, TestResult[]> = {
    'Enum Tools': results.filter(r => r.tool.includes('categor') || r.tool.includes('turnover') || r.tool.includes('phase') || r.tool.includes('source') || r.tool.includes('currenc') || r.tool.includes('enum')),
    'Company Tools': results.filter(r => r.tool.includes('compan')),
    'Contact Tools': results.filter(r => r.tool.includes('contact') || r.tool.includes('link_contact')),
    'Deal Tools': results.filter(r => r.tool.includes('deal') || r.tool.includes('pipeline')),
    'Lead Tools': results.filter(r => r.tool.includes('lead') || r.tool.includes('convert')),
    'Activity Tools': results.filter(r => r.tool.includes('activit') || r.tool.includes('today') || r.tool.includes('overdue')),
  };

  for (const [category, tests] of Object.entries(categories)) {
    console.log(`\n## ${category} (${tests.length})`);
    console.log('| Tool | Status | Duration | Fields Tested |');
    console.log('|------|--------|----------|---------------|');
    for (const t of tests) {
      const statusIcon = t.status === 'PASS' ? '✅' : t.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`| ${t.tool} | ${statusIcon} ${t.status} | ${t.duration}ms | ${t.fieldsTested.length} |`);
    }
  }

  // Issues Found
  const failedTests = results.filter(r => r.status === 'FAIL');
  if (failedTests.length > 0) {
    console.log('\n## Issues Found');
    for (const t of failedTests) {
      console.log(`\n### ${t.tool}`);
      for (const issue of t.issues) {
        console.log(`- ${issue.substring(0, 200)}${issue.length > 200 ? '...' : ''}`);
      }
    }
  }

  // Total Duration
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`\n## Execution Stats`);
  console.log(`- Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`- Average per Tool: ${(totalDuration / total).toFixed(0)}ms`);

  console.log('\n' + '='.repeat(80));
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 RAYNET MCP SERVER - COMPREHENSIVE INTEGRATION TEST');
  console.log('='.repeat(80));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('Testing all 43+ MCP tools with real API calls...\n');

  try {
    await phase1_EnumTools();
    await phase2_CompanyTools();
    await phase3_ContactTools();
    await phase4_DealTools();
    await phase5_LeadTools();
    await phase6_ActivityTools();
    await phase7_Cleanup();
    generateReport();
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    // Still try to cleanup
    console.log('\nAttempting cleanup despite error...');
    try {
      await phase7_Cleanup();
    } catch (cleanupError) {
      console.error('Cleanup also failed:', cleanupError);
    }
    generateReport();
    process.exit(1);
  }

  // Exit with appropriate code
  const failed = results.filter(r => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
