#!/usr/bin/env node

/**
 * Test Companies API Service
 *
 * Quick test to verify the Companies service works with the real API
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
  log('\n=== Testing Companies API Service ===\n', colors.cyan);

  try {
    // Import the compiled modules
    const { getCompaniesService } = require('../dist/api/companies');
    const service = getCompaniesService();

    // Test 1: List companies
    log('1. Testing list() - Get all companies...', colors.yellow);
    const listResult = await service.list({ limit: 5 });
    log(`   ✓ Found ${listResult.totalCount} companies total`, colors.green);
    log(`   ✓ Retrieved ${listResult.companies.length} companies`, colors.green);
    if (listResult.companies.length > 0) {
      log(`   First company: ${listResult.companies[0].name} (ID: ${listResult.companies[0].id})`, colors.blue);
    }

    // Test 2: Search companies
    log('\n2. Testing search() - Search by name...', colors.yellow);
    const searchResult = await service.search({ query: 'grow', limit: 5 });
    log(`   ✓ Found ${searchResult.totalCount} matching companies`, colors.green);
    searchResult.companies.forEach((c) => {
      log(`   - ${c.name} (ID: ${c.id})`, colors.blue);
    });

    // Test 3: Get single company
    if (listResult.companies.length > 0) {
      const firstCompany = listResult.companies[0];
      log(`\n3. Testing get() - Get company ID ${firstCompany.id}...`, colors.yellow);
      const getResult = await service.get({ companyId: firstCompany.id });
      log(`   ✓ Retrieved: ${getResult.company.name}`, colors.green);
      log(`   State: ${getResult.company.state}`, colors.blue);
      log(`   Role: ${getResult.company.role}`, colors.blue);
      log(`   Owner: ${getResult.company.owner.fullName}`, colors.blue);
    }

    // Test 4: Check exists
    log('\n4. Testing exists() - Check if company exists...', colors.yellow);
    const exists = await service.exists(1);
    log(`   Company ID 1 exists: ${exists}`, colors.green);

    // Test 5: Get potential companies
    log('\n5. Testing getPotential() - Get potential companies...', colors.yellow);
    const potentialResult = await service.getPotential(3);
    log(`   ✓ Found ${potentialResult.totalCount} potential companies`, colors.green);

    // Test 6: Get active companies
    log('\n6. Testing getActive() - Get active companies...', colors.yellow);
    const activeResult = await service.getActive(3);
    log(`   ✓ Found ${activeResult.totalCount} active companies`, colors.green);

    log('\n=== All tests passed! ===\n', colors.green);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    if (error.code) {
      log(`   Code: ${error.code}`, colors.red);
    }
    if (error.statusCode) {
      log(`   Status: ${error.statusCode}`, colors.red);
    }
    process.exit(1);
  }
}

main();
