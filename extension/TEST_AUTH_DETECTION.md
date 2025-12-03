# Chrome Extension Authentication Detection - Test Guide

This guide explains how to test the authentication detection functionality in the Chrome extension.

## Quick Test

1. Open the extension popup
2. Right-click the popup and select "Inspect" to open DevTools
3. Go to the Console tab
4. Copy and paste the entire contents of `test-auth-detection.js` into the console
5. The tests will run automatically and show results

## Manual Testing Steps

### Test 1: Storage Change Listener

**Purpose**: Verify the popup detects when auth token is stored in Chrome storage.

**Steps**:
1. Open extension popup (should show "Sign In" if not authenticated)
2. Open Chrome DevTools for the popup (right-click popup > Inspect)
3. In the console, run:
   ```javascript
   chrome.storage.sync.set({authToken: 'test_token_123'})
   ```
4. **Expected Result**: Popup should automatically refresh and show authenticated state (or attempt to load listings)

**Verification**:
- Check console for "Auth token changed, refreshing popup..." message
- Popup UI should update automatically without closing/reopening

---

### Test 2: Message Listener

**Purpose**: Verify the popup responds to messages from the background script.

**Steps**:
1. Open extension popup
2. Open Chrome DevTools for the popup
3. In the console, run:
   ```javascript
   chrome.runtime.sendMessage({type: 'AUTH_TOKEN_STORED', token: 'test_token'})
   ```
4. **Expected Result**: Popup should refresh and check for token

**Verification**:
- Check console for "Auth token stored message received, refreshing popup..." message
- Popup should call `loadInitialData()`

---

### Test 3: Focus Refresh

**Purpose**: Verify the popup checks for token when it regains focus.

**Steps**:
1. Open extension popup (not signed in)
2. Click "Sign In" button (opens new tab)
3. Sign in on the web app (or manually set token in storage)
4. Switch back to the extension popup tab/window
5. **Expected Result**: Popup should detect token and refresh automatically

**Verification**:
- Check console for "Token detected on focus, refreshing popup..." message
- Popup should update to show authenticated state

---

### Test 4: Manual Refresh Button

**Purpose**: Verify the "Check Sign-In Status" button works.

**Steps**:
1. Open extension popup (not signed in)
2. Verify "Check Sign-In Status" button is visible
3. Click "Sign In" button and complete sign-in
4. Return to extension popup
5. Click "Check Sign-In Status" button
6. **Expected Result**: Popup should refresh and show authenticated state

**Verification**:
- Button should be clickable
- Clicking should trigger `loadInitialData()`
- Popup should update after click

---

### Test 5: Real-World Flow

**Purpose**: Test the complete user experience.

**Steps**:
1. Clear extension storage (or use fresh install):
   ```javascript
   chrome.storage.sync.clear()
   ```
2. Open extension popup
   - Should show "Please sign in first" message
   - Should have "Sign In" button
   - Should have "Check Sign-In Status" button
3. Click "Sign In" button
   - Should open new tab to login page
4. Complete sign-in on web app
   - `dashboard-content.js` should store token
5. Return to extension popup (without closing it)
   - **Expected**: Popup should automatically detect authentication
   - Should show authenticated state
   - Should load generate tab
6. If popup doesn't auto-detect:
   - Click "Check Sign-In Status" button
   - Should then detect authentication

**Verification**:
- No need to close/reopen popup
- Authentication detected automatically
- Extension becomes functional immediately

---

## Automated Test Script

Run the automated test suite:

1. Open extension popup
2. Open DevTools (right-click popup > Inspect)
3. Go to Console tab
4. Load the test script:
   ```javascript
   // Copy entire contents of test-auth-detection.js and paste here
   ```
5. Tests will run automatically

### Test Script Functions

The test script provides these functions:

- `window.authDetectionTests.runAll()` - Run all tests
- `window.authDetectionTests.testStorageListener()` - Test storage listener
- `window.authDetectionTests.testMessageListener()` - Test message listener
- `window.authDetectionTests.testFocusRefresh()` - Test focus refresh
- `window.authDetectionTests.testRefreshButton()` - Test refresh button
- `window.authDetectionTests.printInstructions()` - Show manual test instructions

---

## Troubleshooting

### Popup doesn't detect token automatically

1. Check console for errors
2. Verify `dashboard-content.js` is running on the dashboard page
3. Check if token is actually stored:
   ```javascript
   chrome.storage.sync.get(['authToken'], (data) => console.log(data))
   ```
4. Try clicking "Check Sign-In Status" button manually

### Storage listener not working

1. Verify popup is open when token is stored
2. Check console for "Auth token changed" message
3. Ensure `setupAuthListeners()` is called on popup load

### Message listener not working

1. Check if background script is sending messages
2. Verify message type is `AUTH_TOKEN_STORED`
3. Check console for errors

### Focus refresh not working

1. Ensure popup window actually loses and regains focus
2. Check console for "Token detected on focus" message
3. Verify token exists in storage before returning to popup

---

## Expected Behavior Summary

✅ **Should Work**:
- Automatic detection when token is stored
- Detection when returning to popup after sign-in
- Manual refresh button works
- No need to close/reopen popup

❌ **Should NOT Happen**:
- Popup stuck on "Sign In" after authentication
- Need to close/reopen popup to see authenticated state
- Token stored but popup doesn't detect it

---

## Success Criteria

All tests pass if:
1. Storage listener detects token changes ✅
2. Message listener responds to token storage ✅
3. Focus refresh checks for token ✅
4. Manual refresh button works ✅
5. Real-world flow works without closing popup ✅

