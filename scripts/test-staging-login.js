#!/usr/bin/env node

/**
 * Test Script: Verify Staging Login Functionality
 * Tests the complete login flow to ensure API connection is working
 */

const https = require('https');
const { URL } = require('url');

const STAGING_FRONTEND_URL = 'https://novara-anmzr866v-novara-fertility.vercel.app';
const STAGING_BACKEND_URL = 'https://novara-staging-staging.up.railway.app';
const TEST_EMAIL = 'test@example.com';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Novara-Staging-Test/1.0',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          url,
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject({ url, error: err.message });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject({ url, error: 'Request timeout' });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testBackendHealth() {
  console.log('🔍 Testing Backend Health...');
  
  try {
    const response = await makeRequest(`${STAGING_BACKEND_URL}/api/health`);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      console.log('✅ Backend is healthy');
      console.log(`   Environment: ${healthData.environment}`);
      console.log(`   Version: ${healthData.version}`);
      console.log(`   Service: ${healthData.service}`);
      return true;
    } else {
      console.log(`❌ Backend health check failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend health check error: ${error.error}`);
    return false;
  }
}

async function testLoginEndpoint() {
  console.log('\n🔐 Testing Login Endpoint...');
  
  try {
    const loginData = {
      email: TEST_EMAIL
    };
    
    const response = await makeRequest(`${STAGING_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      body: loginData
    });
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const loginResponse = JSON.parse(response.data);
      console.log('✅ Login endpoint working');
      console.log(`   User ID: ${loginResponse.user?.id || 'N/A'}`);
      console.log(`   Token: ${loginResponse.token ? 'Present' : 'Missing'}`);
      return true;
    } else if (response.statusCode === 404) {
      console.log('❌ Login endpoint not found (404)');
      return false;
    } else {
      console.log(`⚠️  Login endpoint returned: ${response.statusCode}`);
      console.log(`   Response: ${response.data.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Login endpoint error: ${error.error}`);
    return false;
  }
}

async function testFrontendLoad() {
  console.log('\n🌐 Testing Frontend Load...');
  
  try {
    const response = await makeRequest(STAGING_FRONTEND_URL);
    
    if (response.statusCode === 200) {
      console.log('✅ Frontend loads successfully');
      
      // Check for React app indicators
      const isReactApp = response.data.includes('React') || 
                        response.data.includes('novara') || 
                        response.data.includes('Novara');
      
      if (isReactApp) {
        console.log('✅ Appears to be a React application');
      } else {
        console.log('⚠️  May not be a React application');
      }
      
      // Check for environment configuration
      if (response.data.includes('localhost:9002')) {
        console.log('❌ Still using localhost API URL (development config)');
        return false;
      } else if (response.data.includes('novara-staging-staging.up.railway.app')) {
        console.log('✅ Using staging backend URL');
        return true;
      } else {
        console.log('⚠️  API URL not detected in response');
        return null;
      }
    } else {
      console.log(`❌ Frontend load failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend load error: ${error.error}`);
    return false;
  }
}

async function testCORSConfiguration() {
  console.log('\n🌍 Testing CORS Configuration...');
  
  try {
    const response = await makeRequest(`${STAGING_BACKEND_URL}/api/health`, {
      headers: {
        'Origin': STAGING_FRONTEND_URL
      }
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    
    if (corsHeader) {
      console.log('✅ CORS headers present');
      console.log(`   Allow-Origin: ${corsHeader}`);
      
      if (corsHeader === '*' || corsHeader.includes('vercel.app')) {
        console.log('✅ CORS configuration allows frontend');
        return true;
      } else {
        console.log('⚠️  CORS may not allow frontend');
        return false;
      }
    } else {
      console.log('⚠️  No CORS headers found');
      return false;
    }
  } catch (error) {
    console.log(`❌ CORS test error: ${error.error}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Comprehensive Staging Environment Test\n');
  console.log(`Frontend URL: ${STAGING_FRONTEND_URL}`);
  console.log(`Backend URL: ${STAGING_BACKEND_URL}\n`);
  
  const results = {
    backend: await testBackendHealth(),
    login: await testLoginEndpoint(),
    frontend: await testFrontendLoad(),
    cors: await testCORSConfiguration()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Backend Health: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Login Endpoint: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Frontend Load: ${results.frontend ? '✅ PASS' : results.frontend === null ? '⚠️  UNKNOWN' : '❌ FAIL'}`);
  console.log(`   CORS Config: ${results.cors ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.backend && results.login && results.cors;
  
  if (allPassed) {
    console.log('\n🎉 All critical tests passed!');
    console.log('   The staging environment should be working correctly.');
    console.log('\n🔗 Test the login manually:');
    console.log(`   ${STAGING_FRONTEND_URL}`);
  } else {
    console.log('\n❌ Some tests failed. Check the issues above.');
    console.log('   The staging environment may have configuration issues.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Test the login manually in a browser');
  console.log('   2. Check browser console for any JavaScript errors');
  console.log('   3. Verify environment variables are set correctly');
}

main().catch(console.error); 