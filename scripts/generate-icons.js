#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple SVG icon generator
function generateIcon(size) {
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6F61;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <path d="M${size * 0.3} ${size * 0.4} L${size * 0.45} ${size * 0.55} L${size * 0.7} ${size * 0.3}" 
        stroke="white" stroke-width="${size * 0.08}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  return svg;
}

// Icon sizes from manifest
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../frontend/public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
iconSizes.forEach(size => {
  const svg = generateIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // For now, save as SVG and we'll convert later
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);
  
  fs.writeFileSync(svgFilepath, svg);
  console.log(`Generated ${svgFilename}`);
});

// Generate shortcut icons
const shortcutIcons = [
  { name: 'checkin', size: 96 },
  { name: 'insights', size: 96 }
];

shortcutIcons.forEach(({ name, size }) => {
  const svg = generateIcon(size);
  const filename = `${name}-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Generated ${filename}`);
});

console.log('Icon generation complete!');
console.log('Note: These are SVG files. For production, convert to PNG using a tool like ImageMagick or online converters.'); 