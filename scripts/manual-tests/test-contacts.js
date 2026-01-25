#!/usr/bin/env node

/**
 * Test Contacts API Service
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
  log('\n=== Testing Contacts API Service ===\n', colors.cyan);

  try {
    const { getContactsService } = require('../dist/api/contacts');
    const service = getContactsService();

    // Test 1: List contacts
    log('1. Testing list() - Get all contacts...', colors.yellow);
    const listResult = await service.list({ limit: 5 });
    log(`   ✓ Found ${listResult.totalCount} contacts total`, colors.green);
    log(`   ✓ Retrieved ${listResult.contacts.length} contacts`, colors.green);
    if (listResult.contacts.length > 0) {
      const first = listResult.contacts[0];
      log(`   First contact: ${first.firstName} ${first.lastName} (ID: ${first.id})`, colors.blue);
    }

    // Test 2: Search contacts
    log('\n2. Testing search() - Search by name...', colors.yellow);
    const searchResult = await service.search({ query: 'Maciej', limit: 5 });
    log(`   ✓ Found ${searchResult.totalCount} matching contacts`, colors.green);
    searchResult.contacts.forEach((c) => {
      log(`   - ${c.firstName} ${c.lastName} (ID: ${c.id})`, colors.blue);
    });

    // Test 3: Get single contact
    if (listResult.contacts.length > 0) {
      const firstContact = listResult.contacts[0];
      log(`\n3. Testing get() - Get contact ID ${firstContact.id}...`, colors.yellow);
      const getResult = await service.get({ contactId: firstContact.id });
      const contact = getResult.contact;
      log(`   ✓ Retrieved: ${contact.firstName} ${contact.lastName}`, colors.green);
      if (contact.primaryRelationship?.company?.name) {
        log(`   Company: ${contact.primaryRelationship.company.name}`, colors.blue);
      }
      if (contact.contactInfo?.email) {
        log(`   Email: ${contact.contactInfo.email}`, colors.blue);
      }
      log(`   Owner: ${contact.owner.fullName}`, colors.blue);
      log(`   Key person: ${contact.keyman ? 'Yes' : 'No'}`, colors.blue);
    }

    // Test 4: Check exists
    log('\n4. Testing exists() - Check if contact exists...', colors.yellow);
    const exists = await service.exists(1);
    log(`   Contact ID 1 exists: ${exists}`, colors.green);

    // Test 5: Get key contacts
    log('\n5. Testing getKeyContacts() - Get key contacts...', colors.yellow);
    const keyResult = await service.getKeyContacts(5);
    log(`   ✓ Found ${keyResult.totalCount} key contacts`, colors.green);
    keyResult.contacts.forEach((c) => {
      log(`   - ${c.firstName} ${c.lastName} (keyman: ${c.keyman})`, colors.blue);
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
    process.exit(1);
  }
}

main();
