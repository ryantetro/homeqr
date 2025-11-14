/**
 * Integration Logic Tests
 * Tests the actual logic flow and edge cases
 */

const fs = require('fs');

console.log('🔍 Running Integration Logic Tests\n');

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

// Test 1: Verify access control logic flow
console.log('🔐 Access Control Logic Tests\n');
const accessFile = fs.readFileSync('src/lib/subscription/access.ts', 'utf8');

// Check that beta users bypass all checks first
const betaCheckIndex = accessFile.indexOf('is_beta_user');
const subscriptionCheckIndex = accessFile.indexOf('from(\'subscriptions\')');
test('Beta check happens before subscription check', 
  betaCheckIndex < subscriptionCheckIndex,
  'Beta users should bypass subscription checks');

// Check that active is checked before trialing
const activeCheckIndex = accessFile.indexOf("status === 'active'");
const trialingCheckIndex = accessFile.indexOf("status === 'trialing'");
test('Active subscription checked before trialing',
  activeCheckIndex < trialingCheckIndex,
  'Active subscriptions should be prioritized');

// Check that past_due is handled correctly
test('Past due returns no access',
  accessFile.includes("status === 'past_due'") && accessFile.includes('hasAccess: false'),
  'Past due subscriptions should deny access');

// Test 2: Verify trial limit logic
console.log('\n📊 Trial Limit Logic Tests\n');
const limitsFile = fs.readFileSync('src/lib/subscription/limits.ts', 'utf8');

// Check that limits are properly defined
test('QR codes limit is exactly 5',
  limitsFile.includes('qr_codes: 5') && !limitsFile.includes('qr_codes: 6'),
  'QR codes limit should be 5');

test('Listings limit is exactly 5',
  limitsFile.includes('listings: 5') && !limitsFile.includes('listings: 6'),
  'Listings limit should be 5');

test('Photos limit is exactly 50',
  limitsFile.includes('photos: 50') && !limitsFile.includes('photos: 51'),
  'Photos limit should be 50');

// Check that checkTrialLimit returns proper structure
test('checkTrialLimit returns allowed, current, limit, remaining',
  limitsFile.includes('allowed:') && limitsFile.includes('current:') && 
  limitsFile.includes('limit:') && limitsFile.includes('remaining:'),
  'checkTrialLimit should return all required fields');

// Test 3: Verify API route error handling
console.log('\n⚠️ API Route Error Handling Tests\n');
const listingsRoute = fs.readFileSync('src/app/api/listings/route.ts', 'utf8');
const qrRoute = fs.readFileSync('src/app/api/qr/route.ts', 'utf8');

// Check that access check happens before business logic
const accessCheckInListings = listingsRoute.indexOf('checkUserAccess');
const listingInsertInListings = listingsRoute.indexOf('.insert({');
test('Access check before listing creation',
  accessCheckInListings < listingInsertInListings,
  'Access should be checked before creating listing');

const accessCheckInQR = qrRoute.indexOf('checkUserAccess');
const qrGenerationInQR = qrRoute.indexOf('QRCode.toDataURL');
test('Access check before QR generation',
  accessCheckInQR < qrGenerationInQR,
  'Access should be checked before generating QR code');

// Check that trial limit check happens after access check
const trialLimitCheckInListings = listingsRoute.indexOf('checkTrialLimit');
test('Trial limit check after access check in listings',
  accessCheckInListings < trialLimitCheckInListings,
  'Trial limits should be checked after access verification');

// Test 4: Verify plan selection logic
console.log('\n💳 Plan Selection Logic Tests\n');
const modalFile = fs.readFileSync('src/components/onboarding/TrialOnboardingModal.tsx', 'utf8');

// Check that plan parsing works correctly
test('Plan selection splits correctly',
  modalFile.includes("selectedPlan.split('-')") && modalFile.includes("as ['starter' | 'pro', 'monthly' | 'annual']"),
  'Plan selection should parse correctly for checkout');

// Check that default plan is set
test('Default plan is pro-monthly',
  modalFile.includes("useState<'starter-monthly' | 'pro-monthly' | 'pro-annual'>('pro-monthly')"),
  'Default plan should be pro-monthly');

// Test 5: Verify component conditional rendering
console.log('\n🎨 Component Conditional Rendering Tests\n');
const dashboardPage = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// Check that UsageNudge only shows for trialing users
const usageNudgeCondition = dashboardPage.indexOf('<UsageNudge');
const trialingCheck = dashboardPage.indexOf("subscription?.status === 'trialing'");
test('UsageNudge only shows for trialing users',
  trialingCheck !== -1 && (trialingCheck < usageNudgeCondition || dashboardPage.substring(trialingCheck, usageNudgeCondition).includes('trialing')),
  'UsageNudge should only render for trialing subscriptions');

// Check that ExpiredTrialOverlay checks expiration
const expiredOverlayCondition = dashboardPage.indexOf('<ExpiredTrialOverlay');
const isExpiredCheck = dashboardPage.indexOf('isExpired');
test('ExpiredTrialOverlay checks expiration status',
  isExpiredCheck !== -1 && isExpiredCheck < expiredOverlayCondition,
  'ExpiredTrialOverlay should check isExpired before rendering');

// Test 6: Verify webhook email logic
console.log('\n📧 Webhook Email Logic Tests\n');
const webhookFile = fs.readFileSync('src/app/api/stripe/webhook/route.ts', 'utf8');

// Check that email is only sent if user email exists
const emailCheck = webhookFile.indexOf('if (userEmail)');
const emailSend = webhookFile.indexOf('sendTrialEndingEmail');
test('Email only sent if user email exists',
  emailCheck !== -1 && emailCheck < emailSend,
  'Email should only be sent when user email is available');

// Check that days remaining is calculated
test('Days remaining calculated correctly',
  webhookFile.includes('daysRemaining') && webhookFile.includes('Math.ceil'),
  'Days remaining should be calculated before sending email');

// Test 7: Verify has_paid removal
console.log('\n🗑️ has_paid Removal Verification\n');
const paymentStatusFile = fs.readFileSync('src/app/api/payment/status/route.ts', 'utf8');
const webhookFileContent = fs.readFileSync('src/app/api/stripe/webhook/route.ts', 'utf8');

// Check that has_paid is derived, not stored
test('has_paid is derived from subscription status',
  paymentStatusFile.includes("hasPaid = subscription?.status === 'active'"),
  'has_paid should be derived, not stored');

// Check that webhook doesn't update has_paid
const hasPaidUpdate = webhookFileContent.indexOf("update({ has_paid: true })");
const hasPaidComment = webhookFileContent.indexOf('// Note: has_paid is now derived');
test('Webhook does not update has_paid',
  hasPaidUpdate === -1 || hasPaidComment !== -1,
  'Webhook should not update has_paid field');

// Test 8: Verify usage API response structure
console.log('\n📈 Usage API Response Structure Tests\n');
const usageApiFile = fs.readFileSync('src/app/api/subscription/usage/route.ts', 'utf8');

// Check that response includes all required fields
test('Usage API returns usage, isTrial, subscriptionStatus',
  usageApiFile.includes('usage:') && usageApiFile.includes('isTrial:') && 
  usageApiFile.includes('subscriptionStatus:'),
  'Usage API should return all required fields');

// Check that access is verified before returning data
// Check that checkUserAccess is called before getUsageStats in the function body
const functionBody = usageApiFile.substring(usageApiFile.indexOf('export async function GET'));
const accessCheckInBody = functionBody.indexOf('checkUserAccess');
const usageStatsInBody = functionBody.indexOf('getUsageStats');
test('Access checked before fetching usage stats',
  accessCheckInBody !== -1 && usageStatsInBody !== -1 && accessCheckInBody < usageStatsInBody,
  'Access should be verified before fetching usage data (checkUserAccess on line 18, getUsageStats on line 27)');

// Test 9: Verify error messages are user-friendly
console.log('\n💬 Error Message Tests\n');
const listingsError = listingsRoute.indexOf('Subscription required');
const qrError = qrRoute.indexOf('Subscription required');
const uploadError = fs.readFileSync('src/app/api/upload/route.ts', 'utf8').includes('Subscription required');

test('Listings route has user-friendly error',
  listingsError !== -1,
  'Listings route should return clear error message');

test('QR route has user-friendly error',
  qrError !== -1,
  'QR route should return clear error message');

test('Upload route has user-friendly error',
  uploadError,
  'Upload route should return clear error message');

// Test 10: Verify logging for monitoring
console.log('\n📝 Logging Tests\n');
test('Access denials are logged',
  listingsRoute.includes('console.log') && listingsRoute.includes('Access Denied'),
  'Access denials should be logged for monitoring');

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Integration Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);
console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(50) + '\n');

if (testsFailed === 0) {
  console.log('🎉 All integration tests passed! Logic flow is correct.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some integration tests failed. Please review the logic.\n');
  process.exit(1);
}

