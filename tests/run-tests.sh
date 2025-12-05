#!/bin/bash

# Helper script to run extraction tests
# Usage: ./tests/run-tests.sh

echo "🚀 HomeQR Extraction Test Runner"
echo "=================================="
echo ""

# Check if server is running
if ! lsof -ti:3000 > /dev/null 2>&1; then
  echo "❌ Dev server is not running on port 3000"
  echo "   Please start it with: npm run dev"
  echo ""
  exit 1
fi

echo "✅ Dev server is running"
echo ""

# Check if URLs were provided
if [ -z "$1" ]; then
  echo "📝 Usage Examples:"
  echo ""
  echo "  # Test a single URL:"
  echo "  ./tests/run-tests.sh https://www.zillow.com/homedetails/..."
  echo ""
  echo "  # Test multiple URLs:"
  echo "  ./tests/run-tests.sh https://www.zillow.com/... https://www.realtor.com/..."
  echo ""
  echo "  # Test from file:"
  echo "  ./tests/run-tests.sh --file tests/test-urls-example.txt"
  echo ""
  echo "  # Quick test (single URL, JSON output):"
  echo "  ./tests/test-extraction-quick.sh https://www.zillow.com/..."
  echo ""
  echo "💡 Tip: Add your test URLs to tests/test-urls-example.txt for batch testing"
  echo ""
  exit 0
fi

# Run the test script with provided arguments
node tests/test-extraction.js "$@"






