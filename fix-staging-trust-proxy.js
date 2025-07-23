// Quick fix for staging trust proxy issue
// This script creates a staging-specific server configuration

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'backend', 'server.js');
const backupPath = path.join(__dirname, 'backend', 'server.js.backup');

// Read the original server.js
const originalContent = fs.readFileSync(serverPath, 'utf8');

// Create backup
fs.writeFileSync(backupPath, originalContent);

// Fix the trust proxy configuration
const fixedContent = originalContent.replace(
  '// Trust Railway proxy\napp.set(\'trust proxy\', true);',
  `// Trust Railway proxy - conditional for staging
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
} else {
  app.set('trust proxy', 1); // More restrictive for staging
}`
);

// Write the fixed content
fs.writeFileSync(serverPath, fixedContent);

console.log('✅ Fixed trust proxy configuration for staging');
console.log('   - Backup created at: backend/server.js.backup');
console.log('   - Trust proxy now conditional based on NODE_ENV');
console.log('   - Production: trust proxy = true');
console.log('   - Staging: trust proxy = 1 (more restrictive)');
console.log('');
console.log('🚀 Now commit and push to redeploy staging:');
console.log('   git add .');
console.log('   git commit -m "Fix trust proxy for staging environment"');
console.log('   git push'); 