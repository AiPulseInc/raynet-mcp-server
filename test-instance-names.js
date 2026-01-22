#!/usr/bin/env node

/**
 * Test different instance name variations to find the correct one
 */

require('dotenv').config();
const https = require('https');
const url = require('url');

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

// Test different instance name variations
const instanceVariations = [
  '321grow',
  'crm321grow',
  'crm-321grow',
  'crm.321grow',
  '321grow-crm'
];

function testInstance(instanceName) {
  return new Promise((resolve) => {
    const apiUrl = process.env.RAYNET_INSTANCE_URL.replace(/\/$/, '');
    const endpoint = '/company/';
    const fullUrl = `${apiUrl}${endpoint}`;
    const parsedUrl = new url.URL(fullUrl);

    const auth = Buffer.from(
      `${process.env.RAYNET_USERNAME}:${process.env.RAYNET_API_KEY}`
    ).toString('base64');

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: `${parsedUrl.pathname}?limit=1`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'X-Instance-Name': instanceName,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          instanceName,
          statusCode: res.statusCode,
          success: res.statusCode === 200,
          data: data
        });
      });
    });

    req.on('error', () => {
      resolve({ instanceName, statusCode: 0, success: false, error: true });
    });

    req.setTimeout(5000);
    req.on('timeout', () => {
      req.destroy();
      resolve({ instanceName, statusCode: 0, success: false, timeout: true });
    });

    req.end();
  });
}

async function main() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Testing Different Instance Name Variations', colors.cyan);
  log('='.repeat(60), colors.cyan);
  log(`\nCurrent instance name in .env: ${process.env.RAYNET_INSTANCE_NAME}\n`, colors.yellow);

  for (const instanceName of instanceVariations) {
    process.stdout.write(`Testing "${instanceName}"... `);
    const result = await testInstance(instanceName);

    if (result.success) {
      log(`✅ SUCCESS!`, colors.green);
      log(`\n🎉 Found the correct instance name: "${instanceName}"`, colors.green);
      log(`\nUpdate your .env file:`, colors.cyan);
      log(`RAYNET_INSTANCE_NAME=${instanceName}`, colors.blue);
      log('');
      return;
    } else {
      if (result.timeout) {
        log(`⏱️  Timeout`, colors.yellow);
      } else if (result.error) {
        log(`❌ Error`, colors.red);
      } else {
        log(`❌ ${result.statusCode}`, colors.red);
      }
    }
  }

  log(`\n⚠️  None of the common variations worked.`, colors.yellow);
  log(`\nPlease provide your exact Raynet login URL, and I'll help you find the instance name.\n`, colors.yellow);
}

main();
