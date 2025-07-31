#!/usr/bin/env node

/**
 * Diagnose domain and backend connectivity issues
 */

const https = require('https');
const http = require('http');
const dns = require('dns').promises;

async function checkDomain(domain) {
  console.log(`\n🔍 Checking domain: ${domain}`);
  
  try {
    // DNS lookup
    const addresses = await dns.resolve4(domain);
    console.log(`✅ DNS resolved to: ${addresses.join(', ')}`);
    
    // Check A records
    const aRecords = await dns.resolve(domain, 'A');
    console.log(`   A records: ${aRecords.join(', ')}`);
    
    // Check CNAME if exists
    try {
      const cname = await dns.resolve(domain, 'CNAME');
      console.log(`   CNAME: ${cname.join(', ')}`);
    } catch (e) {
      // No CNAME is fine
    }
  } catch (error) {
    console.log(`❌ DNS lookup failed: ${error.message}`);
  }
}

async function checkHttpEndpoint(url, description) {
  console.log(`\n🔍 Checking ${description}: ${url}`);
  
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, { timeout: 5000 }, (res) => {
      console.log(`✅ Response: ${res.statusCode} ${res.statusMessage}`);
      console.log(`   Headers:`, {
        'content-type': res.headers['content-type'],
        'server': res.headers['server'],
        'x-powered-by': res.headers['x-powered-by']
      });
      
      // Check for CORS headers
      if (res.headers['access-control-allow-origin']) {
        console.log(`   CORS: ${res.headers['access-control-allow-origin']}`);
      }
      
      resolve(true);
    }).on('error', (error) => {
      console.log(`❌ Connection failed: ${error.message}`);
      resolve(false);
    });
  });
}

async function checkBackendAPIs() {
  const backends = [
    {
      name: 'Production Railway',
      url: 'https://novara-mvp-production.up.railway.app/api/health'
    },
    {
      name: 'Staging Railway',
      url: 'https://novara-staging-staging.up.railway.app/api/health'
    }
  ];
  
  for (const backend of backends) {
    await checkHttpEndpoint(backend.url, backend.name);
  }
}

async function checkFrontendBackendConnection() {
  console.log('\n📡 Frontend to Backend Connection Test\n');
  
  const frontendUrls = [
    'https://novarafertility.com',
    'https://www.novarafertility.com',
    'https://novara-mvp.vercel.app'
  ];
  
  for (const url of frontendUrls) {
    console.log(`\nTesting from frontend: ${url}`);
    await checkHttpEndpoint(url, 'Frontend');
  }
}

async function main() {
  console.log('🏥 Novara Domain & Backend Diagnostic Tool');
  console.log('==========================================\n');
  
  // Check domains
  await checkDomain('novarafertility.com');
  await checkDomain('www.novarafertility.com');
  
  // Check backend endpoints
  await checkBackendAPIs();
  
  // Check frontend
  await checkFrontendBackendConnection();
  
  console.log('\n\n📋 Recommendations:\n');
  console.log('1. Ensure your domain DNS is correctly pointing to Vercel');
  console.log('2. Check that environment variables in Vercel point to the correct Railway backend');
  console.log('3. Verify CORS settings on your Railway backend allow your custom domain');
  console.log('4. Consider using environment-specific API URLs in Vercel:');
  console.log('   - Production: Set VITE_API_URL to your Railway production URL');
  console.log('   - Staging: Set VITE_API_URL to your Railway staging URL');
}

main().catch(console.error);