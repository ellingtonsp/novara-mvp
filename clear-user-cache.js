// Clear user cache script - run this in the browser console
console.log('🧹 Clearing user cache...');

// Clear localStorage
localStorage.removeItem('token');
localStorage.removeItem('user');

console.log('✅ User cache cleared');
console.log('🔄 Please refresh the page to re-authenticate');

// Optional: Force page refresh
// window.location.reload(); 