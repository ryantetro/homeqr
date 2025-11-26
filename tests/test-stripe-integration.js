#!/usr/bin/env node

/**
 * Stripe Integration Test Script
 * Tests the Stripe configuration and API endpoints
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Price IDs
const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
};

console.log('🧪 Stripe Integration Test\n');
console.log('='.repeat(50));

// Test 1: Environment Variables
console.log('\n📋 Test 1: Environment Variables');
console.log('-'.repeat(50));

const requiredVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_STARTER_MONTHLY_PRICE_ID',
  'STRIPE_STARTER_ANNUAL_PRICE_ID',
  'STRIPE_PRO_MONTHLY_PRICE_ID',
  'STRIPE_PRO_ANNUAL_PRICE_ID',
  'NEXT_PUBLIC_SITE_URL',
];

let allVarsPresent = true;
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  const isPresent = !!value;
  const displayValue = varName.includes('SECRET') || varName.includes('KEY')
    ? (value ? `${value.substring(0, 20)}...` : 'MISSING')
    : value || 'MISSING';
  
  console.log(`${isPresent ? '✅' : '❌'} ${varName}: ${displayValue}`);
  if (!isPresent) allVarsPresent = false;
});

// Test 2: Price ID Format
console.log('\n📋 Test 2: Price ID Format');
console.log('-'.repeat(50));

const priceIdPattern = /^price_[a-zA-Z0-9]+$/;
let allPriceIdsValid = true;

Object.entries(PRICE_IDS).forEach(([plan, prices]) => {
  Object.entries(prices).forEach(([billing, priceId]) => {
    const isValid = priceId && priceIdPattern.test(priceId);
    console.log(`${isValid ? '✅' : '❌'} ${plan} ${billing}: ${priceId || 'MISSING'}`);
    if (!isValid) allPriceIdsValid = false;
  });
});

// Test 3: Stripe Key Format
console.log('\n📋 Test 3: Stripe Key Format');
console.log('-'.repeat(50));

const secretKeyPattern = /^sk_(live|test)_[a-zA-Z0-9]+$/;
const publishableKeyPattern = /^pk_(live|test)_[a-zA-Z0-9]+$/;
const webhookSecretPattern = /^whsec_[a-zA-Z0-9]+$/;

const secretKeyValid = STRIPE_SECRET_KEY && secretKeyPattern.test(STRIPE_SECRET_KEY);
const publishableKeyValid = STRIPE_PUBLISHABLE_KEY && publishableKeyPattern.test(STRIPE_PUBLISHABLE_KEY);
const webhookSecretValid = STRIPE_WEBHOOK_SECRET && webhookSecretPattern.test(STRIPE_WEBHOOK_SECRET);

console.log(`${secretKeyValid ? '✅' : '❌'} Secret Key: ${secretKeyValid ? 'Valid format' : 'Invalid format'}`);
console.log(`${publishableKeyValid ? '✅' : '❌'} Publishable Key: ${publishableKeyValid ? 'Valid format' : 'Invalid format'}`);
console.log(`${webhookSecretValid ? '✅' : '❌'} Webhook Secret: ${webhookSecretValid ? 'Valid format' : 'Invalid format'}`);

// Test 4: Check if server is running
console.log('\n📋 Test 4: Server Connection');
console.log('-'.repeat(50));

const url = new URL(SITE_URL);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

const testServer = () => {
  return new Promise((resolve) => {
    const req = client.get(SITE_URL, (res) => {
      console.log(`✅ Server is running at ${SITE_URL} (Status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ Server is not running at ${SITE_URL}`);
      console.log(`   Error: ${err.message}`);
      console.log(`   Make sure to run: npm run dev`);
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log(`❌ Server connection timeout`);
      resolve(false);
    });
  });
};

// Test 5: API Endpoint Check
const testCheckoutEndpoint = async () => {
  console.log('\n📋 Test 5: Checkout API Endpoint');
  console.log('-'.repeat(50));

  return new Promise((resolve) => {
    const checkoutUrl = `${SITE_URL}/api/stripe/checkout`;
    const req = client.request(checkoutUrl, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 401) {
          console.log(`✅ Checkout endpoint exists (requires authentication)`);
          resolve(true);
        } else if (res.statusCode === 503) {
          console.log(`⚠️  Checkout endpoint exists but Stripe may not be configured`);
          resolve(true);
        } else {
          console.log(`⚠️  Checkout endpoint returned status ${res.statusCode}`);
          resolve(true);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Cannot reach checkout endpoint: ${err.message}`);
      resolve(false);
    });

    req.write(JSON.stringify({ plan: 'starter', billing: 'monthly' }));
    req.end();

    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ Checkout endpoint timeout`);
      resolve(false);
    });
  });
};

// Run all tests
(async () => {
  const serverRunning = await testServer();
  
  if (serverRunning) {
    await testCheckoutEndpoint();
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  
  const allTestsPassed = allVarsPresent && allPriceIdsValid && secretKeyValid && publishableKeyValid && webhookSecretValid;
  
  if (allTestsPassed) {
    console.log('\n✅ All configuration tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Make sure your dev server is running: npm run dev');
    console.log('   2. Test the checkout flow in your browser');
    console.log('   3. Use test card: 4242 4242 4242 4242');
    console.log('   4. Check Stripe Dashboard → Webhooks for event logs');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues above.');
  }
  
  console.log('\n');
})();

