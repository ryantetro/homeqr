#!/usr/bin/env node

/**
 * Unit test for Zillow price extraction logic
 * Tests the extraction with mock HTML to verify the logic works
 */

const { parseZillow } = require('../src/lib/extract/platforms/zillow');

// Mock HTML with price in different locations
const mockHtmlWithPriceInJson = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="$523,900 | 123 Main St, City, ST 12345" />
  <meta property="og:description" content="Listed for sale at $523900" />
</head>
<body>
  <script id="__NEXT_DATA__">
    {
      "props": {
        "pageProps": {
          "componentProps": {
            "gdpClientCache": {
              "ForSaleFullRenderQuery": {
                "data": {
                  "property": {
                    "address": {
                      "streetAddress": "123 Main St",
                      "city": "City",
                      "state": "ST",
                      "zipcode": "12345"
                    },
                    "price": 523900,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "livingArea": 1500
                  }
                }
              }
            }
          }
        }
      }
    }
  </script>
</body>
</html>
`;

const mockHtmlWithPriceInMetaOnly = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="$523,900 | 123 Main St, City, ST 12345" />
  <meta property="og:description" content="Beautiful home listed for sale at $523,900" />
</head>
<body>
  <script id="__NEXT_DATA__">
    {
      "props": {
        "pageProps": {
          "componentProps": {
            "gdpClientCache": {
              "ForSaleFullRenderQuery": {
                "data": {
                  "property": {
                    "address": {
                      "streetAddress": "123 Main St",
                      "city": "City",
                      "state": "ST",
                      "zipcode": "12345"
                    },
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "livingArea": 1500
                  }
                }
              }
            }
          }
        }
      }
    }
  </script>
</body>
</html>
`;

const mockHtmlWithPriceInDescription = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="123 Main St, City, ST 12345" />
  <meta property="og:description" content="Listed for sale at $1,595,000. Beautiful home with 4 bedrooms." />
</head>
<body>
  <script id="__NEXT_DATA__">
    {
      "props": {
        "pageProps": {
          "componentProps": {
            "gdpClientCache": {
              "ForSaleFullRenderQuery": {
                "data": {
                  "property": {
                    "address": {
                      "streetAddress": "123 Main St",
                      "city": "City",
                      "state": "ST",
                      "zipcode": "12345"
                    },
                    "bedrooms": 4,
                    "bathrooms": 3,
                    "livingArea": 2500
                  }
                }
              }
            }
          }
        }
      }
    }
  </script>
</body>
</html>
`;

async function runTests() {
  console.log('🧪 Testing Zillow Price Extraction Logic\n');
  console.log('═'.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Price in JSON cache
  console.log('\n📋 Test 1: Price in JSON cache');
  try {
    const result1 = await parseZillow(mockHtmlWithPriceInJson, 'https://www.zillow.com/test/');
    if (result1.price && result1.price.includes('523')) {
      console.log('✅ PASS: Price extracted from JSON cache');
      console.log(`   Price: ${result1.price}`);
      passed++;
    } else {
      console.log('❌ FAIL: Price not extracted from JSON cache');
      console.log(`   Got: ${result1.price || '(empty)'}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error during extraction');
    console.log(`   Error: ${error.message}`);
    failed++;
  }
  
  // Test 2: Price in meta tags (fallback)
  console.log('\n📋 Test 2: Price in meta tags (fallback when missing from JSON)');
  try {
    const result2 = await parseZillow(mockHtmlWithPriceInMetaOnly, 'https://www.zillow.com/test/');
    if (result2.price && result2.price.includes('523')) {
      console.log('✅ PASS: Price extracted from meta tags fallback');
      console.log(`   Price: ${result2.price}`);
      passed++;
    } else {
      console.log('❌ FAIL: Price not extracted from meta tags');
      console.log(`   Got: ${result2.price || '(empty)'}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error during extraction');
    console.log(`   Error: ${error.message}`);
    failed++;
  }
  
  // Test 3: Price in description meta tag
  console.log('\n📋 Test 3: Price in og:description');
  try {
    const result3 = await parseZillow(mockHtmlWithPriceInDescription, 'https://www.zillow.com/test/');
    if (result3.price && result3.price.includes('1,595')) {
      console.log('✅ PASS: Price extracted from og:description');
      console.log(`   Price: ${result3.price}`);
      passed++;
    } else {
      console.log('❌ FAIL: Price not extracted from og:description');
      console.log(`   Got: ${result3.price || '(empty)'}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error during extraction');
    console.log(`   Error: ${error.message}`);
    failed++;
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Summary');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Price extraction logic is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the extraction logic.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});


