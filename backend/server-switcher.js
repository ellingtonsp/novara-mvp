/**
 * Server Switcher
 * Allows switching between legacy and refactored server based on environment variable
 */

const useRefactored = process.env.USE_REFACTORED_SERVER === 'true';

if (useRefactored) {
  console.log('🚀 Starting REFACTORED server...');
  require('./server-refactored');
} else {
  console.log('📦 Starting LEGACY server...');
  require('./server');
}

// Log which server is being used
console.log(`
=====================================
Server Mode: ${useRefactored ? 'REFACTORED' : 'LEGACY'}
To switch: Set USE_REFACTORED_SERVER=true
=====================================
`);