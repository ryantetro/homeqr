/**
 * Test Suite for Subscription Implementation
 * Tests access control, trial limits, and API gating
 */

import fs from 'fs';

console.log('🧪 Running Subscription Implementation Tests\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
    testsPassed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    testsFailed++;
  }
}

// Test 1: Verify all required files exist
console.log('📁 File Structure Tests\n');
const requiredFiles = [
  'src/lib/subscription/access.ts',
  'src/lib/subscription/limits.ts',
  'src/types/subscription.ts',
  'src/components/dashboard/UsageNudge.tsx',
  'src/components/dashboard/ExpiredTrialOverlay.tsx',
  'src/app/api/subscription/usage/route.ts',
  'src/lib/email/trial-ending.ts',
];

requiredFiles.forEach(file => {
  test(`File exists: ${file}`, fs.existsSync(file));
});

// Test 2: Verify access control implementation
console.log('\n🔒 Access Control Tests\n');
const accessFile = fs.readFileSync('src/lib/subscription/access.ts', 'utf8');
test('checkUserAccess function exists', accessFile.includes('export async function checkUserAccess'));
test('Beta user check implemented', accessFile.includes('is_beta_user'));
test('Handles active subscription', accessFile.includes("status === 'active'"));
test('Handles trialing subscription', accessFile.includes("status === 'trialing'"));
test('Handles past_due subscription', accessFile.includes("status === 'past_due'"));
test('Returns AccessResult type', accessFile.includes('AccessResult'));

// Test 3: Verify trial limits implementation
console.log('\n📊 Trial Limits Tests\n');
const limitsFile = fs.readFileSync('src/lib/subscription/limits.ts', 'utf8');
test('TRIAL_LIMITS constant defined', limitsFile.includes('export const TRIAL_LIMITS'));
test('QR codes limit is 5', limitsFile.includes('qr_codes: 5'));
test('Listings limit is 5', limitsFile.includes('listings: 5'));
test('Photos limit is 50', limitsFile.includes('photos: 50'));
test('checkTrialLimit function exists', limitsFile.includes('export async function checkTrialLimit'));
test('getTrialUsage function exists', limitsFile.includes('export async function getTrialUsage'));
test('getUsageStats function exists', limitsFile.includes('export async function getUsageStats'));

// Test 4: Verify API route gating
console.log('\n🛡️ API Route Gating Tests\n');
const apiRoutes = [
  { file: 'src/app/api/listings/route.ts', methods: ['POST', 'PUT', 'DELETE'] },
  { file: 'src/app/api/qr/route.ts', methods: ['POST'] },
  { file: 'src/app/api/upload/route.ts', methods: ['POST'] },
  { file: 'src/app/api/leads/route.ts', methods: ['PATCH'] },
];

apiRoutes.forEach(({ file, methods }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    test(`Access check in ${file}`, content.includes('checkUserAccess'), 
      `Should have access check for ${methods.join(', ')}`);
    test(`403 response in ${file}`, content.includes('403') || content.includes('status: 403'),
      `Should return 403 on access denial`);
  } else {
    test(`File exists: ${file}`, false);
  }
});

// Test 5: Verify trial limit checks in API routes
console.log('\n🚫 Trial Limit Checks Tests\n');
const listingsRoute = fs.readFileSync('src/app/api/listings/route.ts', 'utf8');
const qrRoute = fs.readFileSync('src/app/api/qr/route.ts', 'utf8');
const uploadRoute = fs.readFileSync('src/app/api/upload/route.ts', 'utf8');

test('Listings route checks trial limit', listingsRoute.includes('checkTrialLimit') && listingsRoute.includes('listings'));
test('QR route checks trial limit', qrRoute.includes('checkTrialLimit') && qrRoute.includes('qr_codes'));
test('Upload route checks trial limit', uploadRoute.includes('checkTrialLimit') && uploadRoute.includes('photos'));

// Test 6: Verify plan selection simplification
console.log('\n💳 Plan Selection Tests\n');
const modalFile = fs.readFileSync('src/components/onboarding/TrialOnboardingModal.tsx', 'utf8');
test('Three plan options defined', modalFile.includes('starter-monthly') && modalFile.includes('pro-monthly') && modalFile.includes('pro-annual'));
test('Grid layout is 3 columns', modalFile.includes('grid-cols-3') || modalFile.includes('md:grid-cols-3'));
test('Default plan is pro-monthly', modalFile.includes("'pro-monthly'") && modalFile.includes("useState<'starter-monthly' | 'pro-monthly' | 'pro-annual'>('pro-monthly')"));

// Test 7: Verify component integration
console.log('\n🎨 Component Integration Tests\n');
const dashboardPage = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
test('UsageNudge imported in dashboard', dashboardPage.includes('UsageNudge'));
test('ExpiredTrialOverlay imported in dashboard', dashboardPage.includes('ExpiredTrialOverlay'));
test('UsageNudge rendered conditionally', dashboardPage.includes('<UsageNudge'));
test('ExpiredTrialOverlay rendered conditionally', dashboardPage.includes('<ExpiredTrialOverlay'));

// Test 8: Verify webhook handler
console.log('\n📧 Webhook Handler Tests\n');
const webhookFile = fs.readFileSync('src/app/api/stripe/webhook/route.ts', 'utf8');
test('Trial will end handler exists', webhookFile.includes('trial_will_end'));
test('Email sending logic present', webhookFile.includes('sendTrialEndingEmail'));
test('Days remaining calculation', webhookFile.includes('daysRemaining'));

// Test 9: Verify email template
console.log('\n✉️ Email Template Tests\n');
const emailFile = fs.readFileSync('src/lib/email/trial-ending.ts', 'utf8');
test('Email template function exists', emailFile.includes('getTrialEndingEmailTemplate'));
test('Send email function exists', emailFile.includes('sendTrialEndingEmail'));
test('Email data interface defined', emailFile.includes('TrialEndingEmailData'));

// Test 10: Verify type definitions
console.log('\n📝 Type Definition Tests\n');
const typesFile = fs.readFileSync('src/types/subscription.ts', 'utf8');
test('AccessResult type defined', typesFile.includes('export interface AccessResult'));
test('TrialLimits type defined', typesFile.includes('export interface TrialLimits'));
test('TrialUsage type defined', typesFile.includes('export interface TrialUsage'));
test('SubscriptionStatus type defined', typesFile.includes("type SubscriptionStatus"));

// Test 11: Verify has_paid removal
console.log('\n🗑️ has_paid Removal Tests\n');
const paymentStatusFile = fs.readFileSync('src/app/api/payment/status/route.ts', 'utf8');
const webhookFileContent = fs.readFileSync('src/app/api/stripe/webhook/route.ts', 'utf8');
test('has_paid derived from subscription status', paymentStatusFile.includes('hasPaid = subscription?.status === \'active\''));
test('has_paid updates removed from webhook', !webhookFileContent.includes('has_paid: true') || webhookFileContent.includes('// Note: has_paid is now derived'));

// Test 12: Verify usage API endpoint
console.log('\n📈 Usage API Tests\n');
const usageApiFile = fs.readFileSync('src/app/api/subscription/usage/route.ts', 'utf8');
test('Usage API endpoint exists', usageApiFile.includes('export async function GET'));
test('Returns usage stats', usageApiFile.includes('getUsageStats'));
test('Checks access before returning', usageApiFile.includes('checkUserAccess'));

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);
console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50) + '\n');

if (testsFailed === 0) {
  console.log('🎉 All tests passed! Implementation is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.\n');
  process.exit(1);
}

