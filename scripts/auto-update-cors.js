#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Auto CORS Configuration Updater\n');

// Configuration
const BACKEND_SERVER_FILE = 'backend/server.js';
const CORS_SECTION_START = '// CORS - Environment-aware origin configuration';
const CORS_SECTION_END = '];';

function getCurrentVercelUrls() {
  try {
    console.log('📡 Fetching current Vercel URLs...');
    
    // Get Vercel project URLs
    const vercelOutput = execSync('vercel ls', { encoding: 'utf8' });
    
    const stagingUrls = [];
    
    // Parse the output to find staging URLs
    const lines = vercelOutput.split('\n');
    lines.forEach(line => {
      // Look for lines containing staging URLs that are "Ready" and "Preview"
      if (line.includes('-novara-fertility.vercel.app') && 
          line.includes('● Ready') && 
          line.includes('Preview')) {
        const urlMatch = line.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          stagingUrls.push(url);
          console.log(`   Found staging URL: ${url}`);
        }
      }
    });
    
    // Return only the most recent staging URL (first one found)
    return stagingUrls.slice(0, 1);
  } catch (error) {
    console.log('⚠️ Could not fetch Vercel URLs automatically');
    console.log('   Error:', error.message);
    return [];
  }
}

function readServerFile() {
  try {
    return fs.readFileSync(BACKEND_SERVER_FILE, 'utf8');
  } catch (error) {
    console.error('❌ Could not read server.js file:', error.message);
    process.exit(1);
  }
}

function updateCorsConfiguration(content, newUrls) {
  // Find the CORS section
  const corsStartIndex = content.indexOf(CORS_SECTION_START);
  if (corsStartIndex === -1) {
    console.error('❌ Could not find CORS configuration section');
    return null;
  }
  
  // Find the end of the allowedOrigins array
  const corsEndIndex = content.indexOf(CORS_SECTION_END, corsStartIndex);
  if (corsEndIndex === -1) {
    console.error('❌ Could not find end of CORS configuration');
    return null;
  }
  
  // Extract existing URLs
  const corsSection = content.substring(corsStartIndex, corsEndIndex + CORS_SECTION_END.length);
  const urlMatches = corsSection.match(/https:\/\/[^,\s]+/g) || [];
  
  // Filter out old staging URLs (keep production and development)
  const existingUrls = urlMatches.filter(url => 
    !url.includes('-novara-fertility.vercel.app') || 
    url.includes('novara-mvp.vercel.app') // Keep production
  );
  
  // Add new staging URLs
  const allUrls = [...existingUrls, ...newUrls];
  
  // Create new CORS configuration
  const newCorsConfig = `// CORS - Environment-aware origin configuration
// ⚠️ Vercel preview URLs change dynamically - consider using wildcard pattern
const allowedOrigins = [
  'http://localhost:3000',  // Frontend development
  'http://localhost:4200',  // Stable frontend port
  'https://novara-mvp.vercel.app', // Production frontend
  'https://novara-mvp-staging.vercel.app', // Staging frontend
  'https://novara-mvp-git-staging-novara-fertility.vercel.app', // Vercel staging frontend
${allUrls.map(url => `  '${url}', // Staging frontend`).join('\n')}
  // TODO: Consider using wildcard pattern: 'https://novara-*-novara-fertility.vercel.app'
];`;
  
  // Replace the CORS section
  const beforeCors = content.substring(0, corsStartIndex);
  const afterCors = content.substring(corsEndIndex + CORS_SECTION_END.length);
  
  return beforeCors + newCorsConfig + afterCors;
}

function backupServerFile() {
  const backupPath = `${BACKEND_SERVER_FILE}.backup.${Date.now()}`;
  try {
    fs.copyFileSync(BACKEND_SERVER_FILE, backupPath);
    console.log(`📋 Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Could not create backup:', error.message);
    return null;
  }
}

function writeServerFile(content) {
  try {
    fs.writeFileSync(BACKEND_SERVER_FILE, content, 'utf8');
    console.log('✅ Server.js file updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Could not write server.js file:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Auto CORS Configuration Updater');
  console.log('=====================================\n');
  
  // Get current Vercel URLs
  const stagingUrls = getCurrentVercelUrls();
  
  if (stagingUrls.length === 0) {
    console.log('⚠️ No staging URLs found. Please check manually:');
    console.log('   vercel ls');
    console.log('   or check Vercel dashboard');
    return;
  }
  
  // Read current server file
  const currentContent = readServerFile();
  
  // Update CORS configuration
  const updatedContent = updateCorsConfiguration(currentContent, stagingUrls);
  
  if (!updatedContent) {
    console.error('❌ Failed to update CORS configuration');
    return;
  }
  
  // Create backup
  const backupPath = backupServerFile();
  
  // Write updated content
  if (writeServerFile(updatedContent)) {
    console.log('\n🎉 CORS configuration updated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the changes in backend/server.js');
    console.log('2. Deploy to staging: railway up');
    console.log('3. Test the configuration: node scripts/test-new-staging-url.js');
    console.log('4. If issues occur, restore from backup:', backupPath);
  }
}

// Run the script
main().catch(console.error); 