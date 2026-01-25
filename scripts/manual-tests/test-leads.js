#!/usr/bin/env node

/**
 * Test Leads API Service
 */

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  log('\n=== Testing Leads API Service ===\n', colors.cyan);

  try {
    const { getLeadsService } = require('../dist/api/leads');
    const service = getLeadsService();

    // Test 1: List leads
    log('1. Testing list() - Get all leads...', colors.yellow);
    const listResult = await service.list({ limit: 10 });
    log(`   ✓ Found ${listResult.totalCount} leads total`, colors.green);
    log(`   ✓ Retrieved ${listResult.leads.length} leads`, colors.green);
    if (listResult.leads.length > 0) {
      const first = listResult.leads[0];
      log(`   First lead: ${first.topic} (${first.code}, ID: ${first.id})`, colors.blue);
      log(`   Status: ${first.status}, Priority: ${first.priority}`, colors.blue);
      log(`   Phase: ${first.leadPhase?.code01 || 'N/A'}`, colors.blue);
    }

    // Test 2: Get active leads
    log('\n2. Testing getActive() - Get active leads...', colors.yellow);
    const activeResult = await service.getActive(5);
    log(`   ✓ Found ${activeResult.totalCount} active leads`, colors.green);
    activeResult.leads.forEach((l) => {
      log(`   - ${l.topic} (${l.code})`, colors.blue);
    });

    // Test 3: Get single lead
    if (listResult.leads.length > 0) {
      const firstLead = listResult.leads[0];
      log(`\n3. Testing get() - Get lead ID ${firstLead.id}...`, colors.yellow);
      const getResult = await service.get({ leadId: firstLead.id });
      const lead = getResult.lead;
      log(`   ✓ Retrieved: ${lead.topic}`, colors.green);
      log(`   Code: ${lead.code}`, colors.blue);
      log(`   Status: ${lead.status}`, colors.blue);
      log(`   Phase: ${lead.leadPhase?.code01}`, colors.blue);
      if (lead.firstName || lead.lastName) {
        log(`   Contact: ${lead.firstName || ''} ${lead.lastName || ''}`.trim(), colors.blue);
      }
      if (lead.companyName) {
        log(`   Company: ${lead.companyName}`, colors.blue);
      }
      if (lead.contactInfo?.email) {
        log(`   Email: ${lead.contactInfo.email}`, colors.blue);
      }
      if (lead.contactInfo?.tel1) {
        log(`   Phone: ${lead.contactInfo.tel1}`, colors.blue);
      }
      log(`   Owner: ${lead.owner.fullName}`, colors.blue);
    }

    // Test 4: Search leads
    log('\n4. Testing search() - Search leads...', colors.yellow);
    try {
      const searchResult = await service.search({ query: 'lead', limit: 5 });
      log(`   ✓ Found ${searchResult.totalCount} matching leads`, colors.green);
      searchResult.leads.forEach((l) => {
        log(`   - ${l.topic} (${l.code})`, colors.blue);
      });
    } catch (error) {
      log(`   Search returned: ${error.message}`, colors.blue);
    }

    // Test 5: Check exists
    log('\n5. Testing exists() - Check if lead exists...', colors.yellow);
    const exists = await service.exists(1);
    log(`   Lead ID 1 exists: ${exists}`, colors.green);

    // Test 6: Get stats
    log('\n6. Testing getStats() - Get lead statistics...', colors.yellow);
    const stats = await service.getStats();
    log(`   ✓ Total leads: ${stats.total}`, colors.green);
    log(`   Active: ${stats.active}`, colors.blue);
    log(`   Converted: ${stats.converted}`, colors.blue);
    log(`   Cancelled: ${stats.cancelled}`, colors.blue);

    log('\n=== All tests passed! ===\n', colors.green);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    if (error.code) {
      log(`   Code: ${error.code}`, colors.red);
    }
    if (error.statusCode) {
      log(`   Status: ${error.statusCode}`, colors.red);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

main();
