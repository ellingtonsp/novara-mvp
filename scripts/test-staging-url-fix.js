#!/usr/bin/env node

/**
 * Test Script: Verify Staging URL Fix
 * Tests that the new staging deployment is using the correct API URL
 */

const https = require('https');
const { URL } = require('url');

const TEST_URLS = [
  'https://novara-anmzr866v-novara-fertility.vercel.app', // New preview deployment
  'https://novara-env5r6741-novara-fertility.vercel.app', // Old problematic deployment
];

const STAGING_BACKEND_URL = 'https://novara-staging-staging.up.railway.app';

async function testUrl(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Novara-Staging-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          url,
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 1000) // First 1000 chars
        });
      });
    });

    req.on('error', (err) => {
      reject({ url, error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({ url, error: 'Request timeout' });
    });

    req.end();
  });
}

async function testBackendHealth() {
  try {
    const response = await testUrl(`${STAGING_BACKEND_URL}/api/health`);
    console.log('✅ Staging Backend Health Check:');
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response: ${response.data.substring(0, 200)}...`);
    return true;
  } catch (error) {
    console.log('❌ Staging Backend Health Check Failed:');
    console.log(`   Error: ${error.error}`);
    return false;
  }
}

async function testFrontendDeployment(url) {
  try {
    const response = await testUrl(url);
    console.log(`\n🌐 Testing Frontend: ${url}`);
    console.log(`   Status: ${response.statusCode}`);
    
    // Check if it's a React app (should contain React-related content)
    const isReactApp = response.data.includes('React') || 
                      response.data.includes('novara') || 
                      response.data.includes('Novara');
    
    if (isReactApp) {
      console.log('   ✅ Appears to be a React application');
    } else {
      console.log('   ⚠️  May not be a React application');
    }
    
    // Check for environment indicators
    if (response.data.includes('localhost:9002')) {
      console.log('   ❌ Still using localhost API URL (development config)');
      return false;
    } else if (response.data.includes('novara-staging-staging.up.railway.app')) {
      console.log('   ✅ Using staging backend URL');
      return true;
    } else {
      console.log('   ⚠️  API URL not detected in response');
      return null;
    }
    
  } catch (error) {
    console.log(`\n❌ Frontend Test Failed: ${url}`);
    console.log(`   Error: ${error.error}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Staging URL Fix\n');
  
  // Test backend health first
  const backendHealthy = await testBackendHealth();
  
  if (!backendHealthy) {
    console.log('\n❌ Backend is not healthy. Cannot proceed with frontend tests.');
    process.exit(1);
  }
  
  // Test each frontend deployment
  for (const url of TEST_URLS) {
    await testFrontendDeployment(url);
  }
  
  console.log('\n📋 Summary:');
  console.log('   - Backend is healthy and accessible');
  console.log('   - New preview deployment should use staging backend');
  console.log('   - Old deployment may still have issues');
  console.log('\n🔗 Test the new deployment manually:');
  console.log('   https://novara-anmzr866v-novara-fertility.vercel.app');
}

main().catch(console.error); 