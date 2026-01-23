#!/usr/bin/env node

/**
 * Test Deals API Service
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'CZK',
  }).format(amount);
}

async function main() {
  log('\n=== Testing Deals API Service ===\n', colors.cyan);

  try {
    const { getDealsService } = require('../dist/api/deals');
    const service = getDealsService();

    // Test 1: List deals
    log('1. Testing list() - Get all deals...', colors.yellow);
    const listResult = await service.list({ limit: 5 });
    log(`   ✓ Found ${listResult.totalCount} deals total`, colors.green);
    log(`   ✓ Retrieved ${listResult.deals.length} deals`, colors.green);
    if (listResult.deals.length > 0) {
      const first = listResult.deals[0];
      log(`   First deal: ${first.name} (ID: ${first.id}, Code: ${first.code})`, colors.blue);
      log(`   Status: ${first.status}, Amount: ${formatCurrency(first.totalAmount)}`, colors.blue);
    }

    // Test 2: Search deals
    log('\n2. Testing search() - Search by name...', colors.yellow);
    const searchResult = await service.search({ query: 'Test', limit: 5 });
    log(`   ✓ Found ${searchResult.totalCount} matching deals`, colors.green);
    searchResult.deals.forEach((d) => {
      log(`   - ${d.name} (${d.code}) - ${formatCurrency(d.totalAmount)}`, colors.blue);
    });

    // Test 3: Get single deal
    if (listResult.deals.length > 0) {
      const firstDeal = listResult.deals[0];
      log(`\n3. Testing get() - Get deal ID ${firstDeal.id}...`, colors.yellow);
      const getResult = await service.get({ dealId: firstDeal.id });
      const deal = getResult.deal;
      log(`   ✓ Retrieved: ${deal.name}`, colors.green);
      log(`   Code: ${deal.code}`, colors.blue);
      log(`   Status: ${deal.status}`, colors.blue);
      log(`   Total Amount: ${formatCurrency(deal.totalAmount)}`, colors.blue);
      log(`   Estimated Value: ${formatCurrency(deal.estimatedValue)}`, colors.blue);
      log(`   Probability: ${deal.probability}%`, colors.blue);
      if (deal.company?.name) {
        log(`   Company: ${deal.company.name}`, colors.blue);
      }
      log(`   Owner: ${deal.owner.fullName}`, colors.blue);
    }

    // Test 4: Get active deals
    log('\n4. Testing getActive() - Get active deals...', colors.yellow);
    const activeResult = await service.getActive(5);
    log(`   ✓ Found ${activeResult.totalCount} active deals`, colors.green);
    activeResult.deals.forEach((d) => {
      log(`   - ${d.name}: ${formatCurrency(d.totalAmount)} (${d.probability}%)`, colors.blue);
    });

    // Test 5: Get pipeline value
    log('\n5. Testing getPipelineValue() - Get pipeline summary...', colors.yellow);
    const pipeline = await service.getPipelineValue();
    log(`   ✓ Pipeline Value: ${formatCurrency(pipeline.totalValue)}`, colors.green);
    log(`   ✓ Estimated Value: ${formatCurrency(pipeline.estimatedValue)}`, colors.green);
    log(`   ✓ Active Deals: ${pipeline.dealCount}`, colors.green);

    // Test 6: Check exists
    log('\n6. Testing exists() - Check if deal exists...', colors.yellow);
    const exists = await service.exists(1);
    log(`   Deal ID 1 exists: ${exists}`, colors.green);

    // Test 7: Get won deals
    log('\n7. Testing getWon() - Get won deals...', colors.yellow);
    const wonResult = await service.getWon(5);
    log(`   ✓ Found ${wonResult.totalCount} won deals`, colors.green);
    wonResult.deals.forEach((d) => {
      log(`   - ${d.name}: ${formatCurrency(d.totalAmount)}`, colors.blue);
    });

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
