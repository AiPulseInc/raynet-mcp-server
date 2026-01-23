#!/usr/bin/env node

/**
 * Test Activities API Service
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

function formatActivityType(type) {
  const types = {
    Task: 'Zadanie',
    PhoneCall: 'Rozmowa',
    Meeting: 'Spotkanie',
    Email: 'E-mail',
  };
  return types[type] || type;
}

async function main() {
  log('\n=== Testing Activities API Service ===\n', colors.cyan);

  try {
    const { getActivitiesService } = require('../dist/api/activities');
    const service = getActivitiesService();

    // Test 1: List all activities
    log('1. Testing list() - Get all activities...', colors.yellow);
    const listResult = await service.list({ limit: 10 });
    log(`   ✓ Found ${listResult.totalCount} activities total`, colors.green);
    log(`   ✓ Retrieved ${listResult.activities.length} activities`, colors.green);
    if (listResult.activities.length > 0) {
      const first = listResult.activities[0];
      log(`   First activity: ${first.title} (${formatActivityType(first._entityName)}, ID: ${first.id})`, colors.blue);
      log(`   Status: ${first.status}, Priority: ${first.priority}`, colors.blue);
    }

    // Test 2: List by type
    log('\n2. Testing listByType() - Get tasks only...', colors.yellow);
    const tasksResult = await service.listByType('Task', { limit: 5 });
    log(`   ✓ Found ${tasksResult.totalCount} tasks`, colors.green);
    tasksResult.activities.forEach((a) => {
      log(`   - ${a.title} (${a.status})`, colors.blue);
    });

    // Test 3: Get scheduled activities
    log('\n3. Testing getScheduled() - Get scheduled activities...', colors.yellow);
    const scheduledResult = await service.getScheduled(5);
    log(`   ✓ Found ${scheduledResult.totalCount} scheduled activities`, colors.green);
    scheduledResult.activities.forEach((a) => {
      log(`   - ${a.title} (${formatActivityType(a._entityName)}) - ${a.scheduledFrom}`, colors.blue);
    });

    // Test 4: Get completed activities
    log('\n4. Testing getCompleted() - Get completed activities...', colors.yellow);
    const completedResult = await service.getCompleted(5);
    log(`   ✓ Found ${completedResult.totalCount} completed activities`, colors.green);
    completedResult.activities.forEach((a) => {
      log(`   - ${a.title} (${formatActivityType(a._entityName)})`, colors.blue);
    });

    // Test 5: Get today's activities
    log("\n5. Testing getToday() - Get today's activities...", colors.yellow);
    const todayResult = await service.getToday(10);
    log(`   ✓ Found ${todayResult.totalCount} activities for today`, colors.green);
    if (todayResult.activities.length > 0) {
      todayResult.activities.forEach((a) => {
        log(`   - ${a.title} (${formatActivityType(a._entityName)}) at ${a.scheduledFrom}`, colors.blue);
      });
    } else {
      log('   No activities scheduled for today', colors.blue);
    }

    // Test 6: Get overdue activities
    log('\n6. Testing getOverdue() - Get overdue activities...', colors.yellow);
    const overdueResult = await service.getOverdue(10);
    log(`   ✓ Found ${overdueResult.totalCount} overdue activities`, colors.green);
    if (overdueResult.activities.length > 0) {
      overdueResult.activities.forEach((a) => {
        log(`   - ${a.title} (due: ${a.scheduledTill})`, colors.blue);
      });
    } else {
      log('   No overdue activities - great!', colors.blue);
    }

    // Test 7: Get single activity (if we have any)
    if (listResult.activities.length > 0) {
      const firstActivity = listResult.activities[0];
      log(`\n7. Testing get() - Get activity ID ${firstActivity.id}...`, colors.yellow);
      const getResult = await service.get({
        activityId: firstActivity.id,
        activityType: firstActivity._entityName,
      });
      const activity = getResult.activity;
      log(`   ✓ Retrieved: ${activity.title}`, colors.green);
      log(`   Type: ${formatActivityType(activity._entityName)}`, colors.blue);
      log(`   Status: ${activity.status}`, colors.blue);
      log(`   Priority: ${activity.priority}`, colors.blue);
      log(`   Scheduled: ${activity.scheduledFrom} - ${activity.scheduledTill}`, colors.blue);
      if (activity.company?.name) {
        log(`   Company: ${activity.company.name}`, colors.blue);
      }
      if (activity.description) {
        log(`   Description: ${activity.description.substring(0, 50)}...`, colors.blue);
      }
    }

    // Test 8: Search activities
    log('\n8. Testing search() - Search activities...', colors.yellow);
    try {
      const searchResult = await service.search({ query: 'spotkanie', limit: 5 });
      log(`   ✓ Found ${searchResult.totalCount} matching activities`, colors.green);
      searchResult.activities.forEach((a) => {
        log(`   - ${a.title} (${formatActivityType(a._entityName)})`, colors.blue);
      });
    } catch (error) {
      log(`   Search returned: ${error.message}`, colors.blue);
    }

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
