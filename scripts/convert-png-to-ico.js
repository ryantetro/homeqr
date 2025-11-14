#!/usr/bin/env node

/**
 * Convert PNG to ICO format for favicon
 * Uses the PNG with white background we created
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertPNGtoICO() {
  const pngSource = path.join(__dirname, '..', 'src', 'app', 'favicon-32x32.png');
  const icoOutput = path.join(__dirname, '..', 'src', 'app', 'favicon.ico');
  
  if (!fs.existsSync(pngSource)) {
    console.error('❌ Source PNG not found:', pngSource);
    process.exit(1);
  }
  
  try {
    // Read the PNG
    const image = await sharp(pngSource);
    const metadata = await image.metadata();
    
    // Create multiple sizes for ICO (16x16 and 32x32 are standard)
    const sizes = [16, 32];
    const buffers = [];
    
    for (const size of sizes) {
      const resized = await image
        .resize(size, size, { 
          fit: 'contain', 
          background: { r: 255, g: 255, b: 255, alpha: 1 } 
        })
        .png()
        .toBuffer();
      buffers.push({ size, buffer: resized });
    }
    
    // For now, we'll use the 32x32 as the main favicon
    // Note: Creating a proper multi-resolution ICO requires a specialized library
    // But browsers will accept a PNG renamed to .ico for most cases
    // Let's create a simple ICO structure
    
    // Actually, let's just copy the PNG and rename it
    // Many modern browsers accept PNG files with .ico extension
    const pngBuffer = await image
      .resize(32, 32, { 
        fit: 'contain', 
        background: { r: 255, g: 255, b: 255, alpha: 1 } 
      })
      .png()
      .toBuffer();
    
    // Backup old ICO
    if (fs.existsSync(icoOutput)) {
      const backup = icoOutput + '.old-backup';
      fs.copyFileSync(icoOutput, backup);
      console.log('📦 Backed up old favicon.ico');
    }
    
    // Write PNG data (browsers will accept this)
    fs.writeFileSync(icoOutput, pngBuffer);
    console.log('✅ Created favicon.ico from PNG with white background');
    console.log('   Note: This is a PNG file with .ico extension');
    console.log('   For a proper multi-resolution ICO, use an online converter');
    
  } catch (error) {
    console.error('❌ Error converting PNG to ICO:', error.message);
    process.exit(1);
  }
}

convertPNGtoICO();

