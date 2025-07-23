// Safe Production Health Check - No Data Creation
const FRONTEND_URL = 'https://novara-mvp.vercel.app';
const BACKEND_URL = 'https://novara-mvp-production.up.railway.app';
const GA_MEASUREMENT_ID = 'G-QP9XJD6QFS';

console.log('🏥 Safe Production Health Check - No Data Creation\n');

// Safe health monitoring
const healthStatus = {
  frontend: false,
  backend: false,
  analytics: false,
  security: false,
  timestamp: new Date().toISOString()
};

async function checkFrontendHealth() {
  console.log('🌐 Checking Frontend Health...');
  
  try {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    // Check deployment status
    const isLive = response.ok && response.status === 200;
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    // Check if analytics is deployed (without testing it)
    const hasGA4 = html.includes(GA_MEASUREMENT_ID) || html.includes('gtag');
    console.log(`   GA4 Integration: ${hasGA4 ? '✅ Deployed' : '❌ Missing'}`);
    
    // Check if error boundary is deployed
    const hasErrorBoundary = html.includes('ErrorBoundary') || html.includes('error-boundary');
    console.log(`   Error Handling: ${hasErrorBoundary ? '✅ Deployed' : '⚠️ Check needed'}`);
    
    // Check deployment hash for cache issues
    const assetMatch = html.match(/assets\/index-([^.]*?)\.js/);
    const deploymentHash = assetMatch ? assetMatch[1] : 'unknown';
    console.log(`   Build Version: ${deploymentHash}`);
    
    healthStatus.frontend = isLive;
    healthStatus.analytics = hasGA4;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    healthStatus.frontend = false;
  }
}

async function checkBackendHealth() {
  console.log('\n⚙️ Checking Backend Health...');
  
  try {
    // Only use the health endpoint - no data creation
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Service: ${data.service}`);
    console.log(`   Environment: ${data.environment}`);
    console.log(`   Database: ${data.airtable}`);
    console.log(`   Authentication: ${data.jwt}`);
    
    const isHealthy = response.ok && 
                     data.status === 'ok' && 
                     data.airtable === 'connected' && 
                     data.jwt === 'configured';
    
    healthStatus.backend = isHealthy;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    healthStatus.backend = false;
  }
}

async function checkSecurityHeaders() {
  console.log('\n🔒 Checking Security Configuration...');
  
  try {
    // Check CORS headers with OPTIONS request
    const corsResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'OPTIONS'
    });
    
    const corsHeaders = corsResponse.headers.get('access-control-allow-origin');
    console.log(`   CORS Headers: ${corsHeaders ? '✅ Present' : '⚠️ Check needed'}`);
    
    // Check for security headers on frontend
    const frontendResponse = await fetch(FRONTEND_URL);
    const securityHeaders = {
      'x-frame-options': frontendResponse.headers.get('x-frame-options'),
      'x-content-type-options': frontendResponse.headers.get('x-content-type-options'),
      'referrer-policy': frontendResponse.headers.get('referrer-policy')
    };
    
    const hasSecurityHeaders = Object.values(securityHeaders).some(header => header !== null);
    console.log(`   Security Headers: ${hasSecurityHeaders ? '✅ Present' : '⚠️ Basic only'}`);
    
    healthStatus.security = corsHeaders !== null;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    healthStatus.security = false;
  }
}

async function generateHealthReport() {
  console.log('\n📊 Production Health Report');
  console.log('============================');
  
  const allHealthy = Object.values(healthStatus).every(status => 
    typeof status === 'boolean' ? status : true
  );
  
  console.log(`Frontend Service: ${healthStatus.frontend ? '🟢 Healthy' : '🔴 Issues'}`);
  console.log(`Backend Service: ${healthStatus.backend ? '🟢 Healthy' : '🔴 Issues'}`);
  console.log(`Analytics Setup: ${healthStatus.analytics ? '🟢 Deployed' : '🟡 Missing'}`);
  console.log(`Security Config: ${healthStatus.security ? '🟢 Configured' : '🟡 Basic'}`);
  
  console.log(`\nOverall Status: ${allHealthy ? '🟢 HEALTHY' : '🟡 NEEDS ATTENTION'}`);
  console.log(`Last Check: ${healthStatus.timestamp}`);
  
  // Safe recommendations without testing
  if (!healthStatus.frontend) {
    console.log('\n🔧 Frontend Issues:');
    console.log('   - Check Vercel deployment status');
    console.log('   - Verify domain configuration');
  }
  
  if (!healthStatus.backend) {
    console.log('\n🔧 Backend Issues:');
    console.log('   - Check Railway service status');
    console.log('   - Verify environment variables');
  }
  
  if (!healthStatus.analytics) {
    console.log('\n🔧 Analytics Issues:');
    console.log('   - Verify VITE_GA_MEASUREMENT_ID in Vercel');
    console.log('   - Ensure latest deployment is live');
  }
  
  console.log('\n💡 Safe Verification:');
  console.log('   - Visit https://novara-mvp.vercel.app manually');
  console.log('   - Check browser dev tools for analytics requests');
  console.log('   - Monitor real user behavior instead of synthetic tests');
  
  return allHealthy;
}

// Run health check
async function runHealthCheck() {
  const startTime = Date.now();
  
  await checkFrontendHealth();
  await checkBackendHealth();
  await checkSecurityHeaders();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nHealth Check Duration: ${duration}s`);
  
  return generateHealthReport();
}

// Main execution
runHealthCheck()
  .then(isHealthy => {
    console.log(`\n${isHealthy ? '✅' : '⚠️'} Health check complete`);
    process.exit(isHealthy ? 0 : 1);
  })
  .catch(error => {
    console.error(`\n❌ Health check failed: ${error.message}`);
    process.exit(1);
  }); 