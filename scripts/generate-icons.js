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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
