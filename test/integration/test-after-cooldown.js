// Test script to run after rate limit cooldown
const BACKEND_URL = 'https://novara-mvp-production.up.railway.app';
const FRONTEND_URL = 'https://novara-mvp.vercel.app';

console.log('🧪 Testing after cooldown period...\n');

async function quickTest() {
  // Test 1: Check if new Vercel deployment is live
  console.log('1. Checking Vercel deployment...');
  try {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    // Look for new deployment hash
    const assetMatch = html.match(/assets\/index-([^.]*?)\.js/);
    const currentHash = assetMatch ? assetMatch[1] : 'unknown';
    console.log(`   Deployment hash: ${currentHash}`);
    
    // Check for GA4
    const hasGA4 = html.includes('G-QP9XJD6QFS') || html.includes('gtag');
    console.log(`   GA4 Analytics: ${hasGA4 ? '✅ Detected' : '❌ Not found'}`);
    
    // Check for Vercel Analytics
    const hasVercel = html.includes('@vercel/analytics') || html.includes('vercel');
    console.log(`   Vercel Analytics: ${hasVercel ? '✅ Detected' : '❌ Not found'}`);
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Try a single Airtable operation
  console.log('\n2. Testing Airtable (single request)...');
  try {
    const testUser = {
      email: `cooldown-test-${Date.now()}@test.com`,
      nickname: 'CooldownTest',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      timezone: 'America/New_York'
    };
    
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Airtable working! User creation successful');
      console.log(`   User ID: ${data.user?.id}`);
    } else {
      console.log(`   ❌ Still having issues: ${data.error}`);
      
      if (data.error.includes('Too many')) {
        console.log('   ⏰ Rate limit still active - wait longer');
      } else if (data.error.includes('UNAUTHORIZED')) {
        console.log('   🔑 API key issue - check Railway environment variables');
      }
    }
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n📊 Summary:');
  console.log('- If GA4 is detected → Analytics fixed ✅');
  console.log('- If Airtable works → User registration fixed ✅');
  console.log('- If both work → Run full test: node fix-and-test-production.js');
}

quickTest().catch(console.error); 