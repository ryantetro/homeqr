#!/usr/bin/env node

/**
 * Generate extension icons from favicon with white background
 * Creates 16x16, 48x48, and 128x128 icons for Chrome extension
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '..', 'public');
const extensionDir = path.join(__dirname, '..', 'extension');
const iconsDir = path.join(extensionDir, 'icons');

// Source favicon (we'll use the 32x32 with white background)
const sourceFavicon = path.join(publicDir, 'favicon-32x32.png');

// Extension icon sizes needed
const iconSizes = [
  { size: 16, name: 'icon16.png' },
  { size: 48, name: 'icon48.png' },
  { size: 128, name: 'icon128.png' },
];

async function generateExtensionIcons() {
  console.log('🎨 Generating extension icons from favicon...\n');
  
  // Check if source exists
  if (!fs.existsSync(sourceFavicon)) {
    console.error('❌ Source favicon not found:', sourceFavicon);
    console.log('   Please run the add-favicon-background script first.');
    process.exit(1);
  }
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('📁 Created icons directory');
  }
  
  // Backup existing icons
  console.log('📦 Backing up existing icons...');
  for (const { name } of iconSizes) {
    const iconPath = path.join(iconsDir, name);
    if (fs.existsSync(iconPath)) {
      const backupPath = path.join(iconsDir, `${name}.backup`);
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(iconPath, backupPath);
        console.log(`   Backed up: ${name}`);
      }
    }
  }
  
  // Generate icons
  console.log('\n🖼️  Generating icons...');
  let successCount = 0;
  let failCount = 0;
  
  for (const { size, name } of iconSizes) {
    try {
      const outputPath = path.join(iconsDir, name);
      
      // Resize the favicon to the required size
      await sharp(sourceFavicon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${name} (${size}x${size})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(50));
  
  if (failCount === 0) {
    console.log('\n🎉 All extension icons generated successfully!');
    console.log('💡 Original icons backed up with .backup extension');
    console.log('💡 Icons are ready to use in the Chrome extension');
  } else {
    process.exit(1);
  }
}

generateExtensionIcons().catch(console.error);

