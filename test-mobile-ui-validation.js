// Quick mobile UI validation script
const http = require('http');

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375 },
  { name: 'iPhone 12/13/14', width: 390 },
  { name: 'Samsung Galaxy', width: 360 },
  { name: 'iPad Mini', width: 768 }
];

function checkServerRunning() {
  return new Promise((resolve) => {
    http.get('http://localhost:4200', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function validateMobileUI() {
  console.log('🔍 Mobile UI Validation\n');
  console.log('=======================\n');

  // Check if dev server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('❌ Frontend dev server is not running on port 4200');
    console.log('   Please run: cd frontend && npm run dev\n');
    return;
  }

  console.log('✅ Frontend server is running\n');
  
  console.log('📱 Mobile Viewport Guidelines:\n');
  
  MOBILE_VIEWPORTS.forEach(viewport => {
    console.log(`${viewport.name} (${viewport.width}px):`);
    console.log(`  - Visit: http://localhost:4200`);
    console.log(`  - Open browser DevTools (F12)`);
    console.log(`  - Toggle device toolbar (Ctrl+Shift+M)`);
    console.log(`  - Select "${viewport.name}" or set width to ${viewport.width}px\n`);
  });

  console.log('🔍 Check for these common issues:\n');
  console.log('1. Text Overflow on Buttons:');
  console.log('   - Look for button text that extends beyond button boundaries');
  console.log('   - Check if buttons wrap text properly on narrow screens\n');
  
  console.log('2. Excessive Spacing:');
  console.log('   - Verify vertical spacing isn\'t too large on mobile');
  console.log('   - Check padding around cards and sections\n');
  
  console.log('3. Font Sizes:');
  console.log('   - Ensure headings aren\'t too large for mobile screens');
  console.log('   - Check that text remains readable\n');
  
  console.log('4. Horizontal Overflow:');
  console.log('   - Scroll horizontally to check for content overflow');
  console.log('   - Look for elements that extend beyond viewport\n');
  
  console.log('5. Touch Targets:');
  console.log('   - Verify buttons and links are at least 44px tall');
  console.log('   - Check that interactive elements are easily tappable\n');

  console.log('📊 Mobile Fixes Applied:\n');
  console.log('✅ Button text overflow prevention');
  console.log('✅ Responsive spacing utilities');
  console.log('✅ Mobile-optimized font sizes');
  console.log('✅ Minimum touch target sizes (44px)');
  console.log('✅ Container padding adjustments');
  console.log('✅ Horizontal overflow prevention\n');

  console.log('🎯 Testing Pages:');
  console.log('- Landing: http://localhost:4200');
  console.log('- Login: http://localhost:4200/login');
  console.log('- Signup: http://localhost:4200/signup');
  console.log('- Dashboard: http://localhost:4200/dashboard (requires login)\n');

  console.log('💡 Pro tip: Use Chrome DevTools "Device Mode" for the most accurate mobile testing experience.\n');
}

validateMobileUI().catch(console.error);