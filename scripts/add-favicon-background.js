#!/usr/bin/env node

/**
 * Script to add white backgrounds to favicon PNG files
 * This makes the favicons more visible on browser tabs
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available, if not, provide instructions
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp package is required to run this script.');
  console.log('\n📦 Please install sharp first:');
  console.log('   npm install sharp --save-dev\n');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'src', 'app');

// List of favicon files to process
const faviconFiles = [
  { file: 'favicon-16x16.png', dir: publicDir },
  { file: 'favicon-32x32.png', dir: publicDir },
  { file: 'apple-touch-icon.png', dir: publicDir },
  { file: 'android-chrome-192x192.png', dir: publicDir },
  { file: 'android-chrome-512x512.png', dir: publicDir },
];

async function addWhiteBackground(inputPath, outputPath) {
  try {
    // Read the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Create a white background
    const whiteBackground = sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    
    // Composite the original image on top of white background
    const result = await whiteBackground
      .composite([{ input: await image.toBuffer(), blend: 'over' }])
      .png()
      .toBuffer();
    
    // Write the result
    fs.writeFileSync(outputPath, result);
    console.log(`✅ Processed: ${path.basename(outputPath)}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message);
    return false;
  }
}

async function processFaviconICO(inputPath, outputPath) {
  try {
    // ICO files are complex and sharp doesn't handle them well
    // Instead, we'll use the favicon-32x32.png we just processed
    const pngSource = path.join(publicDir, 'favicon-32x32.png');
    
    if (!fs.existsSync(pngSource)) {
      console.log(`⚠️  Cannot create ICO: ${pngSource} not found`);
      return false;
    }
    
    // Read the PNG with white background we just created
    const pngImage = sharp(pngSource);
    const metadata = await pngImage.metadata();
    
    // Resize to 32x32 if needed (ICO typically uses 32x32)
    const resized = await pngImage
      .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();
    
    // Save as PNG (sharp can't create ICO, but browsers will accept PNG)
    // For a proper ICO, use an online converter
    const pngPath = outputPath.replace('.ico', '-32x32.png');
    fs.writeFileSync(pngPath, resized);
    
    // Also try to copy the PNG as favicon.png for Next.js
    const faviconPng = path.join(path.dirname(outputPath), 'favicon.png');
    fs.writeFileSync(faviconPng, resized);
    
    console.log(`✅ Created PNG version: ${path.basename(pngPath)}`);
    console.log(`✅ Created favicon.png for Next.js`);
    console.log(`   Note: ICO format requires specialized tools.`);
    console.log(`   You can convert ${pngPath} to ICO using:`);
    console.log(`   - https://convertio.co/png-ico/`);
    console.log(`   - https://favicon.io/favicon-converter/`);
    console.log(`   - Or use: npm install -g to-ico && to-ico ${pngPath} -o ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error processing ICO ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Adding white backgrounds to favicons...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  // Process PNG files
  for (const { file, dir } of faviconFiles) {
    const inputPath = path.join(dir, file);
    const outputPath = path.join(dir, file);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  File not found: ${file}`);
      failCount++;
      continue;
    }
    
    // Backup original
    const backupPath = path.join(dir, `${file}.backup`);
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
      console.log(`📦 Backed up: ${file}`);
    }
    
    const success = await addWhiteBackground(inputPath, outputPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  // Process favicon.ico
  const icoPath = path.join(appDir, 'favicon.ico');
  if (fs.existsSync(icoPath)) {
    console.log('\n📝 Processing favicon.ico...');
    const backupPath = path.join(appDir, 'favicon.ico.backup');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(icoPath, backupPath);
      console.log('📦 Backed up: favicon.ico');
    }
    
    const success = await processFaviconICO(icoPath, icoPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(50));
  
  if (failCount === 0) {
    console.log('\n🎉 All favicons processed successfully!');
    console.log('💡 Original files backed up with .backup extension');
    console.log('💡 Note: favicon.ico was converted to PNG format');
    console.log('   For proper ICO format, use an online tool like:');
    console.log('   https://convertio.co/png-ico/ or https://favicon.io/favicon-converter/');
  }
}

main().catch(console.error);

