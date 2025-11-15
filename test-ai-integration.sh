#!/bin/bash

# Gemini AI Integration Test Script
# This script tests the AI enhancement functionality

echo "🧪 Testing Gemini AI Integration"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${BASE_URL:-http://localhost:3000}"

# Check if server is running
echo "1. Checking if server is running..."
if curl -s -f "$BASE_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start with: npm run dev${NC}"
    exit 1
fi

echo ""
echo "2. Testing Gemini API Key Configuration..."
if [ -z "$GEMINI_API_KEY" ]; then
    if [ -f .env.local ]; then
        GEMINI_API_KEY=$(grep "GEMINI_API_KEY" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ GEMINI_API_KEY not found in environment or .env.local${NC}"
    exit 1
else
    echo -e "${GREEN}✅ GEMINI_API_KEY found${NC}"
fi

echo ""
echo "3. Testing Gemini API directly..."
GEMINI_RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello in one word"
      }]
    }]
  }')

if echo "$GEMINI_RESPONSE" | grep -q "candidates"; then
    echo -e "${GREEN}✅ Gemini API is working${NC}"
    echo "   Response preview: $(echo "$GEMINI_RESPONSE" | grep -o '"text":"[^"]*' | head -1 | cut -d'"' -f4 | cut -c1-50)..."
else
    echo -e "${RED}❌ Gemini API test failed${NC}"
    echo "   Response: $GEMINI_RESPONSE"
    exit 1
fi

echo ""
echo "4. Testing AI Enhancement Service (requires authentication)..."
echo -e "${YELLOW}⚠️  Note: This requires a valid session cookie or Bearer token${NC}"
echo ""
echo "To test the full flow:"
echo "1. Log in to your app at $BASE_URL"
echo "2. Create a listing via the Chrome extension"
echo "3. Check the server logs for: [AI Enhancement] Successfully enhanced listing"
echo ""
echo "Or test the re-enhancement endpoint manually:"
echo ""
echo "   curl -X POST $BASE_URL/api/listings/enhance \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Cookie: your-session-cookie' \\"
echo "     -d '{\"listingId\": \"your-listing-id\"}'"
echo ""

echo "5. Database Verification..."
echo "   Run this SQL in Supabase to check AI enhancements:"
echo ""
echo "   SELECT"
echo "     id,"
echo "     address,"
echo "     ai_enhancement_status,"
echo "     ai_enhanced_at,"
echo "     CASE WHEN ai_description IS NOT NULL THEN 'Yes' ELSE 'No' END as has_description,"
echo "     CASE WHEN ai_key_features IS NOT NULL THEN 'Yes' ELSE 'No' END as has_features"
echo "   FROM listings"
echo "   ORDER BY created_at DESC"
echo "   LIMIT 5;"
echo ""

echo -e "${GREEN}✅ Basic tests completed${NC}"
echo ""
echo "Next steps:"
echo "1. Create a test listing via Chrome extension"
echo "2. Check server logs for AI enhancement messages"
echo "3. Verify AI content in database"
echo "4. View microsite to see AI content displayed"

