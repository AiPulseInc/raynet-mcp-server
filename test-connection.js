#!/usr/bin/env node

/**
 * Raynet API Connection Test
 *
 * This script tests the basic connection to Raynet API using credentials from .env
 * It verifies:
 * - Authentication works
 * - X-Instance-Name header is correct
 * - API responds successfully
 * - Rate limiting headers are present
 */

require('dotenv').config();

const https = require('https');
const url = require('url');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Validate environment variables
function validateConfig() {
  const required = [
    'RAYNET_INSTANCE_URL',
    'RAYNET_INSTANCE_NAME',
    'RAYNET_USERNAME',
    'RAYNET_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    log(`\n❌ Missing required environment variables:`, colors.red);
    missing.forEach(key => log(`   - ${key}`, colors.red));
    log(`\nPlease check your .env file.\n`, colors.yellow);
    process.exit(1);
  }

  log('\n✅ All required environment variables present', colors.green);
}

// Test Raynet API connection
function testConnection() {
  return new Promise((resolve, reject) => {
    const apiUrl = process.env.RAYNET_INSTANCE_URL.replace(/\/$/, ''); // Remove trailing slash
    const endpoint = '/company/';
    const fullUrl = `${apiUrl}${endpoint}`;

    log(`\n📡 Testing connection to Raynet API...`, colors.cyan);
    log(`   URL: ${fullUrl}`, colors.blue);
    log(`   Instance: ${process.env.RAYNET_INSTANCE_NAME}`, colors.blue);
    log(`   Username: ${process.env.RAYNET_USERNAME}`, colors.blue);

    const parsedUrl = new url.URL(fullUrl);

    // Create Basic Auth token
    const auth = Buffer.from(
      `${process.env.RAYNET_USERNAME}:${process.env.RAYNET_API_KEY}`
    ).toString('base64');

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: `${parsedUrl.pathname}?limit=1`, // Just get 1 record for testing
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'X-Instance-Name': process.env.RAYNET_INSTANCE_NAME,
        'Content-Type': 'application/json',
        'User-Agent': 'Raynet-MCP-Server/1.0.0 (Connection Test)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Check rate limiting headers
        const rateLimit = {
          limit: res.headers['x-ratelimit-limit'],
          remaining: res.headers['x-ratelimit-remaining'],
          reset: res.headers['x-ratelimit-reset']
        };

        if (res.statusCode === 200) {
          log(`\n✅ Connection successful!`, colors.green);
          log(`   Status: ${res.statusCode} OK`, colors.green);

          try {
            const json = JSON.parse(data);
            log(`\n📊 Response Data:`, colors.cyan);
            log(`   Success: ${json.success}`, colors.blue);
            if (json.totalCount !== undefined) {
              log(`   Total Companies: ${json.totalCount}`, colors.blue);
            }
            if (json.data && Array.isArray(json.data)) {
              log(`   Records returned: ${json.data.length}`, colors.blue);
              if (json.data.length > 0) {
                log(`   Sample company: "${json.data[0].name}" (ID: ${json.data[0].id})`, colors.blue);
              }
            }
          } catch (e) {
            log(`   ⚠️  Could not parse response JSON`, colors.yellow);
          }

          log(`\n⏱️  Rate Limiting:`, colors.cyan);
          if (rateLimit.limit) {
            log(`   Daily Limit: ${rateLimit.limit} requests`, colors.blue);
            log(`   Remaining: ${rateLimit.remaining} requests`, colors.blue);
            if (rateLimit.reset) {
              const resetDate = new Date(parseInt(rateLimit.reset) * 1000);
              log(`   Resets at: ${resetDate.toLocaleString('pl-PL')}`, colors.blue);
            }

            const percentUsed = ((rateLimit.limit - rateLimit.remaining) / rateLimit.limit * 100).toFixed(1);
            log(`   Usage: ${percentUsed}% (${rateLimit.limit - rateLimit.remaining} requests used)`, colors.blue);
          } else {
            log(`   ⚠️  Rate limit headers not present`, colors.yellow);
          }

          log(`\n✅ All checks passed! Your Raynet API credentials are working.\n`, colors.green);
          resolve({ success: true, statusCode: res.statusCode, rateLimit });
        } else if (res.statusCode === 401) {
          log(`\n❌ Authentication failed!`, colors.red);
          log(`   Status: ${res.statusCode} Unauthorized`, colors.red);
          log(`\n   Possible issues:`, colors.yellow);
          log(`   - Incorrect API key`, colors.yellow);
          log(`   - Incorrect username`, colors.yellow);
          log(`   - API key expired or revoked`, colors.yellow);
          log(`\n   Please check your credentials in .env file\n`, colors.yellow);
          reject(new Error('Authentication failed'));
        } else if (res.statusCode === 400) {
          log(`\n❌ Bad Request!`, colors.red);
          log(`   Status: ${res.statusCode}`, colors.red);
          log(`\n   Possible issues:`, colors.yellow);
          log(`   - Incorrect X-Instance-Name: ${process.env.RAYNET_INSTANCE_NAME}`, colors.yellow);
          log(`   - Invalid request format`, colors.yellow);
          try {
            const json = JSON.parse(data);
            log(`\n   Server response:`, colors.yellow);
            log(`   ${JSON.stringify(json, null, 2)}`, colors.yellow);
          } catch (e) {
            log(`   ${data}`, colors.yellow);
          }
          log(``);
          reject(new Error('Bad request'));
        } else {
          log(`\n❌ Unexpected response!`, colors.red);
          log(`   Status: ${res.statusCode} ${res.statusMessage}`, colors.red);
          log(`   Response: ${data.substring(0, 200)}`, colors.yellow);
          log(``);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      log(`\n❌ Connection error!`, colors.red);
      log(`   ${error.message}`, colors.red);
      log(`\n   Possible issues:`, colors.yellow);
      log(`   - Network connectivity problems`, colors.yellow);
      log(`   - Incorrect RAYNET_INSTANCE_URL`, colors.yellow);
      log(`   - Firewall blocking the connection`, colors.yellow);
      log(``);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      log(`\n❌ Connection timeout!`, colors.red);
      log(`   The request took too long to complete.`, colors.yellow);
      log(``);
      reject(new Error('Connection timeout'));
    });

    req.setTimeout(10000); // 10 second timeout
    req.end();
  });
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Raynet CRM MCP Server - Connection Test', colors.cyan);
  log('='.repeat(60), colors.cyan);

  try {
    validateConfig();
    await testConnection();
    process.exit(0);
  } catch (error) {
    log(`\n💡 Troubleshooting:`, colors.cyan);
    log(`   1. Verify credentials in Raynet CRM → Settings → API Keys`, colors.blue);
    log(`   2. Check your .env file has correct values`, colors.blue);
    log(`   3. Ensure your instance name matches your Raynet URL`, colors.blue);
    log(`   4. Try regenerating your API key if the issue persists`, colors.blue);
    log(``);
    process.exit(1);
  }
}

main();
