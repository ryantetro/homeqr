#!/bin/bash

# Quick test script for URL extraction
# Usage: ./tests/test-extraction-quick.sh <url>

if [ -z "$1" ]; then
  echo "Usage: ./tests/test-extraction-quick.sh <url>"
  echo "Example: ./tests/test-extraction-quick.sh https://www.zillow.com/homedetails/..."
  exit 1
fi

URL="$1"
API_URL="${API_URL:-http://localhost:3000}"

echo "Testing extraction for: $URL"
echo "API URL: $API_URL"
echo ""

RESPONSE=$(curl -X POST "$API_URL/api/extract" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}" \
  -s -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if command -v jq &> /dev/null; then
  echo "$BODY" | jq '.'
else
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

echo ""
echo "HTTP Status: $HTTP_CODE"

