#!/usr/bin/env node

/**
 * Test script for URL-based listing extraction
 * 
 * Usage:
 *   node tests/test-extraction.js <url1> <url2> ...
 *   node tests/test-extraction.js --file urls.txt
 *   node tests/test-extraction.js --url https://www.zillow.com/homedetails/...
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + colorize('═'.repeat(60), 'cyan'));
  console.log(colorize(text, 'bright'));
  console.log(colorize('═'.repeat(60), 'cyan') + '\n');
}

function printSection(text) {
  console.log(colorize(`\n${'─'.repeat(60)}`, 'gray'));
  console.log(colorize(text, 'bright'));
  console.log(colorize('─'.repeat(60), 'gray') + '\n');
}

function printField(label, value, extracted = false) {
  const status = extracted ? colorize('✓', 'green') : colorize('✗', 'red');
  const displayValue = value || colorize('(empty)', 'gray');
  console.log(`  ${status} ${colorize(label + ':', 'cyan')} ${displayValue}`);
}

async function testExtraction(url) {
  try {
    printHeader(`Testing Extraction: ${url}`);

    const startTime = Date.now();
    
    const response = await axios.post(`${API_BASE_URL}/api/extract`, {
      url: url,
    }, {
      timeout: 60000, // 60 second timeout
      validateStatus: () => true, // Don't throw on non-2xx status
    });

    const duration = Date.now() - startTime;

    if (response.status !== 200) {
      console.log(colorize(`❌ Request failed with status ${response.status}`, 'red'));
      if (response.data?.error) {
        console.log(colorize(`   Error: ${response.data.error}`, 'red'));
      }
      return { success: false, url, error: response.data?.error || 'Request failed' };
    }

    const data = response.data;

    if (!data.success) {
      console.log(colorize('❌ Extraction Failed', 'red'));
      console.log(colorize(`   Error: ${data.error || 'Unknown error'}`, 'red'));
      if (data.extractedFields && data.extractedFields.length > 0) {
        console.log(colorize(`   Partially extracted fields: ${data.extractedFields.join(', ')}`, 'yellow'));
      }
      return { success: false, url, error: data.error };
    }

    if (!data.data) {
      console.log(colorize('❌ No data returned', 'red'));
      return { success: false, url, error: 'No data returned' };
    }

    const extracted = data.data;
    const extractedFields = data.extractedFields || [];
    const missingFields = data.missingFields || [];

    console.log(colorize(`✅ Extraction Successful (${duration}ms)`, 'green'));

    printSection('Extracted Data');

    // Core fields
    printField('Address', extracted.address, extractedFields.includes('address'));
    printField('City', extracted.city, extractedFields.includes('city'));
    printField('State', extracted.state, extractedFields.includes('state'));
    printField('ZIP', extracted.zip, extractedFields.includes('zip'));
    printField('Price', extracted.price, extractedFields.includes('price'));
    printField('Bedrooms', extracted.bedrooms, extractedFields.includes('bedrooms'));
    printField('Bathrooms', extracted.bathrooms, extractedFields.includes('bathrooms'));
    printField('Square Feet', extracted.squareFeet, extractedFields.includes('squareFeet'));
    printField('MLS ID', extracted.mlsId, extractedFields.includes('mlsId'));
    printField('Description', extracted.description ? `${extracted.description.substring(0, 100)}...` : '', extractedFields.includes('description'));
    
    // Images
    const imageCount = extracted.imageUrls?.length || 0;
    printField('Images', `${imageCount} image(s)`, extractedFields.includes('images'));
    if (imageCount > 0 && extracted.imageUrl) {
      console.log(colorize(`     Primary: ${extracted.imageUrl.substring(0, 80)}...`, 'gray'));
    }

    // Additional fields
    if (extracted.propertyType || extracted.yearBuilt || extracted.lotSize) {
      printSection('Additional Details');
      if (extracted.propertyType) printField('Property Type', extracted.propertyType);
      if (extracted.yearBuilt) printField('Year Built', extracted.yearBuilt);
      if (extracted.lotSize) printField('Lot Size', extracted.lotSize);
      if (extracted.features && extracted.features.length > 0) {
        printField('Features', `${extracted.features.length} feature(s)`);
      }
    }

    // Summary
    printSection('Extraction Summary');
    console.log(colorize(`  Extracted Fields: ${extractedFields.length}`, 'green'));
    if (extractedFields.length > 0) {
      console.log(colorize(`    ${extractedFields.join(', ')}`, 'gray'));
    }
    
    if (missingFields.length > 0) {
      console.log(colorize(`  Missing Fields: ${missingFields.length}`, 'yellow'));
      console.log(colorize(`    ${missingFields.join(', ')}`, 'gray'));
    }

    // Quality score
    const requiredFields = ['address'];
    const importantFields = ['price', 'bedrooms', 'bathrooms', 'squareFeet', 'images'];
    const hasRequired = requiredFields.every(f => extractedFields.includes(f));
    const hasImportant = importantFields.filter(f => extractedFields.includes(f)).length;
    const qualityScore = hasRequired ? (hasImportant / importantFields.length) * 100 : 0;

    console.log(colorize(`  Quality Score: ${qualityScore.toFixed(0)}%`, qualityScore >= 80 ? 'green' : qualityScore >= 50 ? 'yellow' : 'red'));

    return {
      success: true,
      url,
      duration,
      extractedFields: extractedFields.length,
      missingFields: missingFields.length,
      qualityScore,
      data: extracted,
    };
  } catch (error) {
    console.log(colorize('❌ Extraction Error', 'red'));
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.log(colorize('   Error: Request timed out', 'red'));
      } else if (error.response) {
        console.log(colorize(`   Status: ${error.response.status}`, 'red'));
        console.log(colorize(`   Error: ${error.response.data?.error || error.message}`, 'red'));
      } else if (error.request) {
        console.log(colorize('   Error: No response received. Is the server running?', 'red'));
        console.log(colorize(`   Make sure to run: npm run dev`, 'yellow'));
      } else {
        console.log(colorize(`   Error: ${error.message}`, 'red'));
      }
    } else {
      console.log(colorize(`   Error: ${error.message}`, 'red'));
    }
    return { success: false, url, error: error.message };
  }
}

async function runTests(urls) {
  printHeader('HomeQR URL Extraction Test Suite');
  console.log(colorize(`API URL: ${API_BASE_URL}`, 'gray'));
  console.log(colorize(`Testing ${urls.length} URL(s)\n`, 'gray'));

  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(colorize(`\n[${i + 1}/${urls.length}]`, 'blue'));
    const result = await testExtraction(url);
    results.push(result);

    // Small delay between requests to avoid rate limiting
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Final summary
  printHeader('Test Summary');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(colorize(`Total Tests: ${results.length}`, 'bright'));
  console.log(colorize(`✅ Successful: ${successful.length}`, 'green'));
  console.log(colorize(`❌ Failed: ${failed.length}`, 'red'));

  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + (r.duration || 0), 0) / successful.length;
    const avgFields = successful.reduce((sum, r) => sum + (r.extractedFields || 0), 0) / successful.length;
    const avgQuality = successful.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / successful.length;

    console.log(colorize(`\nAverage Duration: ${avgDuration.toFixed(0)}ms`, 'gray'));
    console.log(colorize(`Average Extracted Fields: ${avgFields.toFixed(1)}`, 'gray'));
    console.log(colorize(`Average Quality Score: ${avgQuality.toFixed(0)}%`, 'gray'));
  }

  if (failed.length > 0) {
    printSection('Failed Tests');
    failed.forEach((result, idx) => {
      console.log(colorize(`${idx + 1}. ${result.url}`, 'red'));
      console.log(colorize(`   ${result.error}`, 'gray'));
    });
  }

  // Platform breakdown
  const platformCounts = {};
  results.forEach(r => {
    if (r.url) {
      const platform = detectPlatform(r.url);
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    }
  });

  if (Object.keys(platformCounts).length > 0) {
    printSection('Platform Breakdown');
    Object.entries(platformCounts).forEach(([platform, count]) => {
      const successCount = results.filter(r => r.success && detectPlatform(r.url) === platform).length;
      const color = successCount === count ? 'green' : 'yellow';
      console.log(colorize(`  ${platform}: ${successCount}/${count} successful`, color));
    });
  }

  console.log('\n');
  process.exit(failed.length > 0 ? 1 : 0);
}

function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('zillow.com')) return 'zillow';
  if (urlLower.includes('realtor.com')) return 'realtor';
  if (urlLower.includes('redfin.com')) return 'redfin';
  if (urlLower.includes('homes.com')) return 'homes';
  if (urlLower.includes('trulia.com')) return 'trulia';
  if (urlLower.includes('utahrealestate.com')) return 'utahrealestate';
  return 'generic';
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(colorize('Usage:', 'bright'));
  console.log('  node tests/test-extraction.js <url1> <url2> ...');
  console.log('  node tests/test-extraction.js --file urls.txt');
  console.log('  node tests/test-extraction.js --url https://...');
  console.log('\n' + colorize('Examples:', 'bright'));
  console.log('  node tests/test-extraction.js https://www.zillow.com/homedetails/...');
  console.log('  node tests/test-extraction.js --file test-urls.txt');
  console.log('\n' + colorize('Environment Variables:', 'bright'));
  console.log('  API_URL - API base URL (default: http://localhost:3000)');
  process.exit(1);
}

let urls = [];

if (args[0] === '--file') {
  const fs = require('fs');
  const filePath = args[1];
  if (!filePath) {
    console.log(colorize('Error: --file requires a file path', 'red'));
    process.exit(1);
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    urls = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line.startsWith('http'));
  } catch (error) {
    console.log(colorize(`Error reading file: ${error.message}`, 'red'));
    process.exit(1);
  }
} else if (args[0] === '--url') {
  urls = args.slice(1).filter(arg => arg.startsWith('http'));
} else {
  urls = args.filter(arg => arg.startsWith('http'));
}

if (urls.length === 0) {
  console.log(colorize('Error: No valid URLs provided', 'red'));
  process.exit(1);
}

runTests(urls).catch(error => {
  console.error(colorize(`Fatal error: ${error.message}`, 'red'));
  process.exit(1);
});






