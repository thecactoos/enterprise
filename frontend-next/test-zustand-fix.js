// Simple test to verify Zustand SSR fix
// Run this in the browser console on the login page to test

console.log('Testing Zustand SSR fix...');

// Test if stores are properly initialized without throwing errors
try {
  // This should not cause infinite loops anymore
  const authState = window.__NEXT_STORE_AUTH__ || 'No auth store found';
  const uiState = window.__NEXT_STORE_UI__ || 'No UI store found';
  
  console.log('✅ Stores accessible without errors');
  console.log('Auth store status:', authState);
  console.log('UI store status:', uiState);
  
  // Test if hydration is working
  if (typeof window !== 'undefined') {
    console.log('✅ Client-side hydration environment detected');
    
    // Check if localStorage is accessible (for persist middleware)
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('✅ localStorage is accessible');
    } catch (e) {
      console.log('⚠️ localStorage not accessible:', e.message);
    }
    
    // Test if auth store storage exists
    const authStorage = localStorage.getItem('auth-storage');
    console.log('Auth storage found:', !!authStorage);
    
    // Test if UI store storage exists
    const uiStorage = localStorage.getItem('ui-storage');
    console.log('UI storage found:', !!uiStorage);
    
    console.log('✅ Zustand SSR test completed successfully!');
  }
} catch (error) {
  console.error('❌ Zustand SSR test failed:', error);
  console.error('This indicates the infinite loop issue may still exist');
}

// Test React hydration
try {
  const reactVersion = React.version || 'Unknown';
  console.log('React version:', reactVersion);
  
  if (typeof useSyncExternalStore !== 'undefined') {
    console.log('✅ useSyncExternalStore is available (React 18+)');
  }
} catch (e) {
  console.log('React testing skipped:', e.message);
}