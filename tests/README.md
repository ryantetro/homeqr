# Test Scripts

This folder contains test scripts for various components and integrations.

## Files

- **`test-ai-enhancement.js`** - Test AI listing enhancement functionality
- **`test-ai-integration.sh`** - Shell script for AI integration testing
- **`test-integration-logic.js`** - Test integration logic and workflows
- **`test-stripe-integration.js`** - Test Stripe payment and subscription integration
- **`test-subscription-implementation.js`** - Test subscription features and logic
- **`watch-stripe-webhooks.sh`** - Monitor Stripe webhook events in real-time

## Usage

Most test scripts can be run with Node.js:

```bash
node tests/test-ai-enhancement.js
node tests/test-stripe-integration.js
```

Shell scripts can be run directly:

```bash
./tests/test-ai-integration.sh
./tests/watch-stripe-webhooks.sh
```

**Note:** Extension-specific tests are located in the [`extension/`](../extension/) folder.

