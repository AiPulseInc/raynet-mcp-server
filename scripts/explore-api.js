#!/usr/bin/env node

/**
 * Raynet API Explorer
 *
 * This script explores Raynet API endpoints and documents their responses.
 * Used for Sprint 0.5 API Discovery.
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Create Basic Auth header
const auth = Buffer.from(
  `${process.env.RAYNET_USERNAME}:${process.env.RAYNET_API_KEY}`
).toString('base64');

// API request helper
function apiRequest(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const apiUrl = process.env.RAYNET_INSTANCE_URL.replace(/\/$/, '');
    const queryString = new URLSearchParams(params).toString();
    const fullPath = `${endpoint}${queryString ? '?' + queryString : ''}`;
    const fullUrl = `${apiUrl}${fullPath}`;

    const parsedUrl = new URL(fullUrl);

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'X-Instance-Name': process.env.RAYNET_INSTANCE_NAME,
        'Content-Type': 'application/json',
        'User-Agent': 'Raynet-MCP-Server/1.0.0 (API Explorer)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const rateLimit = {
          limit: res.headers['x-ratelimit-limit'],
          remaining: res.headers['x-ratelimit-remaining'],
          reset: res.headers['x-ratelimit-reset']
        };

        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rateLimit,
            data: json
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rateLimit,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000);
    req.end();
  });
}

// Extract field info from a sample record
function analyzeFields(record, prefix = '') {
  const fields = {};

  for (const [key, value] of Object.entries(record)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    const type = Array.isArray(value) ? 'array' : typeof value;

    fields[fieldPath] = {
      type,
      nullable: value === null,
      sample: type === 'object' && value !== null
        ? '[object]'
        : type === 'array'
          ? `[array:${value.length}]`
          : String(value).substring(0, 50)
    };

    // Recurse into objects (but not too deep)
    if (type === 'object' && value !== null && !prefix.includes('.')) {
      Object.assign(fields, analyzeFields(value, fieldPath));
    }
  }

  return fields;
}

// Explore an endpoint
async function exploreEndpoint(name, endpoint, options = {}) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  Exploring: ${name}`, colors.cyan);
  log(`  Endpoint: ${endpoint}`, colors.blue);
  log('='.repeat(60), colors.cyan);

  const results = {
    name,
    endpoint,
    timestamp: new Date().toISOString(),
    list: null,
    single: null,
    filters: [],
    errors: []
  };

  try {
    // 1. List endpoint (with limit)
    log(`\n📋 Testing LIST endpoint...`, colors.yellow);
    const listResponse = await apiRequest(endpoint, { limit: 5 });

    results.list = {
      statusCode: listResponse.statusCode,
      success: listResponse.data.success,
      totalCount: listResponse.data.totalCount,
      returnedCount: listResponse.data.data?.length || 0,
      rateLimit: listResponse.rateLimit
    };

    log(`   Status: ${listResponse.statusCode}`, colors.green);
    log(`   Total records: ${listResponse.data.totalCount}`, colors.blue);
    log(`   Returned: ${results.list.returnedCount}`, colors.blue);

    // Analyze fields from first record
    if (listResponse.data.data && listResponse.data.data.length > 0) {
      const sampleRecord = listResponse.data.data[0];
      results.list.sampleId = sampleRecord.id;
      results.list.fields = analyzeFields(sampleRecord);

      log(`\n   📊 Fields discovered: ${Object.keys(results.list.fields).length}`, colors.magenta);

      // Show top-level fields
      const topLevelFields = Object.entries(results.list.fields)
        .filter(([k]) => !k.includes('.'))
        .map(([k, v]) => `${k} (${v.type})`);
      log(`   Top-level: ${topLevelFields.slice(0, 10).join(', ')}${topLevelFields.length > 10 ? '...' : ''}`, colors.blue);

      // 2. Single record endpoint
      if (sampleRecord.id) {
        log(`\n📄 Testing SINGLE record endpoint (ID: ${sampleRecord.id})...`, colors.yellow);
        const singleResponse = await apiRequest(`${endpoint}${sampleRecord.id}/`);

        results.single = {
          statusCode: singleResponse.statusCode,
          success: singleResponse.data.success,
          hasData: !!singleResponse.data.data
        };

        if (singleResponse.data.data) {
          results.single.fields = analyzeFields(singleResponse.data.data);
          const singleFieldCount = Object.keys(results.single.fields).length;
          const listFieldCount = Object.keys(results.list.fields).length;

          log(`   Status: ${singleResponse.statusCode}`, colors.green);
          log(`   Fields in single: ${singleFieldCount} (vs ${listFieldCount} in list)`, colors.blue);

          // Find fields only in single response
          const extraFields = Object.keys(results.single.fields)
            .filter(k => !results.list.fields[k])
            .filter(k => !k.includes('.'));
          if (extraFields.length > 0) {
            log(`   Extra fields in detail: ${extraFields.join(', ')}`, colors.magenta);
          }
        }
      }
    }

    // 3. Test filtering (if supported)
    if (options.filterField) {
      log(`\n🔍 Testing FILTER on ${options.filterField}...`, colors.yellow);
      const filterResponse = await apiRequest(endpoint, {
        limit: 3,
        [options.filterField]: options.filterValue
      });

      results.filters.push({
        field: options.filterField,
        value: options.filterValue,
        statusCode: filterResponse.statusCode,
        resultCount: filterResponse.data.data?.length || 0
      });

      log(`   Status: ${filterResponse.statusCode}`, filterResponse.statusCode === 200 ? colors.green : colors.red);
      log(`   Results: ${filterResponse.data.data?.length || 0}`, colors.blue);
    }

    // 4. Test sorting
    log(`\n📈 Testing SORTING...`, colors.yellow);
    const sortResponse = await apiRequest(endpoint, {
      limit: 3,
      sort: 'id',
      desc: 'true'
    });

    results.sorting = {
      statusCode: sortResponse.statusCode,
      success: sortResponse.data.success
    };

    log(`   Status: ${sortResponse.statusCode}`, sortResponse.statusCode === 200 ? colors.green : colors.red);

    // 5. Test offset pagination
    log(`\n📑 Testing PAGINATION (offset)...`, colors.yellow);
    const pageResponse = await apiRequest(endpoint, {
      limit: 2,
      offset: 2
    });

    results.pagination = {
      statusCode: pageResponse.statusCode,
      success: pageResponse.data.success,
      returnedCount: pageResponse.data.data?.length || 0
    };

    log(`   Status: ${pageResponse.statusCode}`, pageResponse.statusCode === 200 ? colors.green : colors.red);
    log(`   Returned with offset=2: ${results.pagination.returnedCount}`, colors.blue);

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    results.errors.push(error.message);
  }

  return results;
}

// Main exploration
async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Raynet API Explorer - Sprint 0.5', colors.cyan);
  log('='.repeat(60), colors.cyan);

  const allResults = {
    timestamp: new Date().toISOString(),
    instance: process.env.RAYNET_INSTANCE_NAME,
    endpoints: {}
  };

  // Explore Companies
  allResults.endpoints.company = await exploreEndpoint(
    'Companies',
    '/company/',
    { filterField: 'name[LIKE]', filterValue: '%' }
  );

  // Explore Persons (Contacts)
  allResults.endpoints.person = await exploreEndpoint(
    'Persons (Contacts)',
    '/person/',
    { filterField: 'lastName[LIKE]', filterValue: '%' }
  );

  // Explore Business Cases (Deals)
  allResults.endpoints.businessCase = await exploreEndpoint(
    'Business Cases (Deals)',
    '/businessCase/',
    { filterField: 'name[LIKE]', filterValue: '%' }
  );

  // Explore Activities
  allResults.endpoints.activity = await exploreEndpoint(
    'Activities',
    '/activity/'
  );

  // Explore Categories/Enums
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Exploring Enum/Category Endpoints', colors.cyan);
  log('='.repeat(60), colors.cyan);

  // Company categories
  try {
    log(`\n📋 Company Categories...`, colors.yellow);
    const catResponse = await apiRequest('/companyCategory/');
    allResults.endpoints.companyCategory = {
      statusCode: catResponse.statusCode,
      count: catResponse.data.data?.length || 0,
      items: catResponse.data.data?.map(c => ({ id: c.id, code01: c.code01, code02: c.code02 })) || []
    };
    log(`   Found: ${allResults.endpoints.companyCategory.count} categories`, colors.green);
  } catch (e) {
    log(`   Error: ${e.message}`, colors.red);
  }

  // Business case categories
  try {
    log(`\n📋 Business Case Categories...`, colors.yellow);
    const bcCatResponse = await apiRequest('/businessCaseCategory/');
    allResults.endpoints.businessCaseCategory = {
      statusCode: bcCatResponse.statusCode,
      count: bcCatResponse.data.data?.length || 0,
      items: bcCatResponse.data.data?.map(c => ({ id: c.id, code01: c.code01, code02: c.code02 })) || []
    };
    log(`   Found: ${allResults.endpoints.businessCaseCategory.count} categories`, colors.green);
  } catch (e) {
    log(`   Error: ${e.message}`, colors.red);
  }

  // Company turnover categories
  try {
    log(`\n📋 Company Turnover Categories...`, colors.yellow);
    const turnoverResponse = await apiRequest('/companyTurnover/');
    allResults.endpoints.companyTurnover = {
      statusCode: turnoverResponse.statusCode,
      count: turnoverResponse.data.data?.length || 0,
      items: turnoverResponse.data.data?.map(c => ({ id: c.id, code01: c.code01 })) || []
    };
    log(`   Found: ${allResults.endpoints.companyTurnover.count} turnover categories`, colors.green);
  } catch (e) {
    log(`   Error: ${e.message}`, colors.red);
  }

  // Business case phases
  try {
    log(`\n📋 Business Case Phases...`, colors.yellow);
    const phaseResponse = await apiRequest('/businessCasePhase/');
    allResults.endpoints.businessCasePhase = {
      statusCode: phaseResponse.statusCode,
      count: phaseResponse.data.data?.length || 0,
      items: phaseResponse.data.data?.map(p => ({ id: p.id, code01: p.code01 })) || []
    };
    log(`   Found: ${allResults.endpoints.businessCasePhase.count} phases`, colors.green);
  } catch (e) {
    log(`   Error: ${e.message}`, colors.red);
  }

  // Save results
  const outputDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'api-exploration-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

  log(`\n${'='.repeat(60)}`, colors.green);
  log(`  ✅ Exploration complete!`, colors.green);
  log(`  Results saved to: ${outputPath}`, colors.blue);
  log('='.repeat(60), colors.green);

  // Print summary
  log(`\n📊 Summary:`, colors.cyan);
  for (const [name, data] of Object.entries(allResults.endpoints)) {
    if (data.list) {
      log(`   ${name}: ${data.list.totalCount} records, ${Object.keys(data.list.fields || {}).length} fields`, colors.blue);
    } else if (data.count !== undefined) {
      log(`   ${name}: ${data.count} items`, colors.blue);
    }
  }

  // Rate limit info
  const lastEndpoint = Object.values(allResults.endpoints).find(e => e.list?.rateLimit);
  if (lastEndpoint?.list?.rateLimit) {
    log(`\n⏱️  Rate Limit Status:`, colors.yellow);
    log(`   Remaining: ${lastEndpoint.list.rateLimit.remaining}/${lastEndpoint.list.rateLimit.limit}`, colors.blue);
  }
}

main().catch(console.error);
