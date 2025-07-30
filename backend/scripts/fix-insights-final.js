#!/usr/bin/env node

/**
 * Final fix for insights - the issue is likely with saveInsight
 */

const fs = require('fs');
const path = require('path');

// Check the insights service
const servicePath = path.join(__dirname, '../services/insights-service.js');
let content = fs.readFileSync(servicePath, 'utf8');

// The issue might be with saving insights - let's check the Airtable array format
const saveInsightSection = content.match(/async saveInsight\(userId, insight\) \{[\s\S]*?\n  \}/);

if (saveInsightSection) {
  console.log('Found saveInsight method');
  
  // Check if it's handling the user_id array format correctly
  if (content.includes('user_id: [userId] // Array format for Airtable')) {
    console.log('✅ Airtable array format is handled');
  }
  
  // The issue might be that when using PostgreSQL, we shouldn't convert to array
  console.log('📝 The issue might be in the createInsight method of postgres-adapter');
  console.log('   It might not be handling the data format correctly');
}

// Let's also check if the route is catching errors properly
const routePath = path.join(__dirname, '../routes/insights.js');
content = fs.readFileSync(routePath, 'utf8');

console.log('\n🔍 Checking insights route error handling...');
if (content.includes('} catch (error) {')) {
  console.log('✅ Route has error handling');
  
  // The 500 error suggests an unhandled error is reaching the global handler
  console.log('📝 The error is likely in the service layer, not being caught properly');
}