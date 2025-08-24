// Base URL for the backend API when hosting the frontend outside of Leap (e.g. Vercel).
// Set this to your Encore backend's public URL, for example:
// export const backendBaseUrl = "https://<your-app-id>.api.encore.dev";
// For local development with Vite, you can leave it empty and Encore's dev proxy will be used.

// Enhanced backend URL configuration with detailed logging
export const backendBaseUrl = (() => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const port = typeof window !== 'undefined' ? window.location.port : '';
  
  console.group('🌐 Backend URL Configuration');
  console.log('Current hostname:', hostname);
  console.log('Current protocol:', protocol);
  console.log('Current port:', port);
  console.log('Full current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  
  let selectedUrl = '';
  let reason = '';
  
  // If we're in development (localhost), use the proxy
  if (hostname === 'localhost') {
    selectedUrl = '';
    reason = 'Development mode - using Encore dev proxy';
  }
  // If we're in production on renosteps.app, use the direct Encore API URL
  else if (hostname === 'renosteps.app') {
    selectedUrl = 'https://renovation-task-manager-d2evcgk82vjt19ur26rg.lp.dev';
    reason = 'Production on renosteps.app - using direct Encore API';
  }
  // For any other production environment, use the API proxy
  else if (hostname !== 'localhost') {
    selectedUrl = '/api';
    reason = 'Other production environment - using API proxy';
  }
  // Fallback for SSR or other environments
  else {
    selectedUrl = '/api';
    reason = 'Fallback for SSR or unknown environment';
  }
  
  console.log('Selected backend URL:', selectedUrl || 'default (empty)');
  console.log('Reason:', reason);
  console.groupEnd();
  
  return selectedUrl;
})();

// Enhanced connection test function for debugging production issues
export function testBackendConnection() {
  console.group('🔍 Backend Connection Test');
  console.log('Configured backend URL:', backendBaseUrl);
  console.log('Current environment:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    origin: window.location.origin
  });
  
  // Test multiple endpoints to verify backend availability
  const testEndpoints = [
    '/health/ping',
    '/health/production'
  ];
  
  testEndpoints.forEach(endpoint => {
    const testUrl = backendBaseUrl ? backendBaseUrl + endpoint : endpoint;
    console.log(`Testing connection to: ${testUrl}`);
    
    fetch(testUrl, { 
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log(`✅ ${endpoint} connection test result:`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      return response.json();
    })
    .then(data => {
      console.log(`📊 ${endpoint} response data:`, data);
    })
    .catch(error => {
      console.log(`❌ ${endpoint} connection test failed:`, {
        error: error.message,
        type: error.name,
        stack: error.stack
      });
    });
  });
  
  console.groupEnd();
}

// Auto-run connection test in production for debugging
if (typeof window !== 'undefined' && window.location.hostname === 'renosteps.app') {
  console.log('🚀 Production environment detected - running connection test');
  setTimeout(testBackendConnection, 1000);
}

// Notes:
// - If left empty, the auto-generated client will use its default base URL.
// - When deploying the frontend to a different origin (e.g. https://renosteps.app)
//   you MUST set backendBaseUrl to the publicly accessible Encore API URL
//   and also allow that origin in the backend CORS configuration.
// - In production, we use the direct Encore API URL to avoid proxy issues.
// - Enhanced with detailed logging for debugging connection issues.
// - The JWT secret is now handled gracefully with a default for development.
// - Auto-runs connection test in production for immediate debugging feedback.
