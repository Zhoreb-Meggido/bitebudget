/**
 * Icon Generator Script
 *
 * Genereert PNG icons vanuit SVG voor PWA gebruik
 *
 * Gebruik: node scripts/generate-icons.js
 *
 * Vereist: sharp package
 * Installeer: npm install --save-dev sharp
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp is not installed. Install it with: npm install --save-dev sharp');
  process.exit(1);
}

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

const svgPath = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  if (!fs.existsSync(svgPath)) {
    console.error('❌ SVG file not found:', svgPath);
    process.exit(1);
  }

  for (const { size, name } of sizes) {
    const outputPath = path.join(outputDir, name);

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\n✅ Icon generation complete!');
  console.log('📁 Icons saved to:', outputDir);
}

generateIcons().catch(console.error);
