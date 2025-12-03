/**
 * Implementation Verification Script
 * 
 * This script verifies that all required code is in place for auth detection.
 * Run this in Node.js or check manually.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Chrome Extension Auth Detection Implementation...\n');

const results = {
  passed: 0,
  failed: 0,
  checks: []
};

function check(name, condition, details) {
  if (condition) {
    results.passed++;
    results.checks.push({ name, status: '✅ PASS', details });
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    results.failed++;
    results.checks.push({ name, status: '❌ FAIL', details });
    console.error(`❌ ${name}`);
    if (details) console.error(`   ${details}`);
  }
}

// Read files
const popupJs = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');
const backgroundJs = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');

console.log('Checking popup.js...\n');

// Check 1: setupAuthListeners is called
check(
  'setupAuthListeners() is called on initialization',
  popupJs.includes('setupAuthListeners()'),
  'Should be called in DOMContentLoaded event listener'
);

// Check 2: setupAuthListeners function exists
check(
  'setupAuthListeners() function is defined',
  popupJs.includes('function setupAuthListeners()'),
  'Function should be defined in popup.js'
);

// Check 3: Storage listener is set up
check(
  'Storage change listener is implemented',
  popupJs.includes('chrome.storage.onChanged.addListener'),
  'Should listen for authToken changes in sync storage'
);

// Check 4: Message listener is set up
check(
  'Message listener is implemented',
  popupJs.includes('chrome.runtime.onMessage.addListener'),
  'Should listen for AUTH_TOKEN_STORED messages'
);

// Check 5: AUTH_TOKEN_STORED message type is handled
check(
  'AUTH_TOKEN_STORED message is handled',
  popupJs.includes("message.type === 'AUTH_TOKEN_STORED'"),
  'Should respond to AUTH_TOKEN_STORED messages'
);

// Check 6: Focus event listener is set up
check(
  'Focus event listener is implemented',
  popupJs.includes("window.addEventListener('focus'"),
  'Should check for token when popup regains focus'
);

// Check 7: Refresh button exists
check(
  'Refresh button is added to auth prompt',
  popupJs.includes('refreshAuthBtn'),
  'Should have button with id="refreshAuthBtn"'
);

// Check 8: Refresh button has click handler
check(
  'Refresh button has click handler',
  popupJs.includes('refreshAuthBtn') && popupJs.includes('addEventListener') && popupJs.includes('loadInitialData'),
  'Should call loadInitialData() when clicked'
);

// Check 9: loadInitialData tracks previous token
check(
  'loadInitialData tracks previous token state',
  popupJs.includes('previousAuthToken'),
  'Should track previous token to detect new sign-ins'
);

// Check 10: Success toast on new token
check(
  'Success message shown on new token',
  popupJs.includes('Successfully signed in!'),
  'Should show toast when token is first detected'
);

console.log('\nChecking background.js...\n');

// Check 11: Background sends AUTH_TOKEN_STORED message
check(
  'Background script sends AUTH_TOKEN_STORED message',
  backgroundJs.includes('AUTH_TOKEN_STORED'),
  'Should notify popup when token is stored'
);

// Check 12: STORE_AUTH_TOKEN handler exists
check(
  'STORE_AUTH_TOKEN handler exists',
  backgroundJs.includes("message.type === 'STORE_AUTH_TOKEN'"),
  'Should handle token storage requests'
);

// Check 13: Background stores token in sync storage
check(
  'Background stores token in sync storage',
  backgroundJs.includes('chrome.storage.sync.set') && backgroundJs.includes('authToken'),
  'Should store token in chrome.storage.sync'
);

console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Total: ${results.passed + results.failed}`);
console.log(`\n${results.failed === 0 ? '🎉 All checks passed! Implementation looks correct.' : '⚠️ Some checks failed. Review the output above.'}`);

// Detailed report
if (results.failed > 0) {
  console.log('\n📋 Failed Checks:');
  results.checks
    .filter(c => c.status === '❌ FAIL')
    .forEach(c => {
      console.log(`\n${c.status}: ${c.name}`);
      console.log(`   ${c.details}`);
    });
}

console.log('\n💡 Next Steps:');
console.log('1. Load the extension in Chrome');
console.log('2. Open the popup and inspect it');
console.log('3. Run test-auth-detection.js in the console');
console.log('4. Follow the manual test instructions in TEST_AUTH_DETECTION.md');

