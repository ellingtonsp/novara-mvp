#!/usr/bin/env node

/**
 * Update package.json to support refactored server
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add new scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "start": "node server-switcher.js",
  "start:legacy": "node server.js",
  "start:refactored": "USE_REFACTORED_SERVER=true node server-switcher.js",
  "dev": "nodemon server-switcher.js",
  "dev:legacy": "nodemon server.js",
  "dev:refactored": "USE_REFACTORED_SERVER=true nodemon server-switcher.js",
  "test:refactored": "node test-refactored.js"
};

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('✅ Updated package.json with new scripts:');
console.log('  - npm start (uses server-switcher.js)');
console.log('  - npm run start:legacy (uses old server.js)');
console.log('  - npm run start:refactored (uses new modular server)');
console.log('  - npm run dev:refactored (development mode with refactored server)');
console.log('  - npm run test:refactored (test refactored server)');