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

// Connection test function for debugging
export function testBackendConnection() {
  console.group('🔍 Backend Connection Test');
  console.log('Configured backend URL:', backendBaseUrl);
  console.log('Current environment:', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    origin: window.location.origin
  });
  
  // Test if the backend URL is reachable
  if (backendBaseUrl) {
    console.log('Testing connection to:', backendBaseUrl);
    fetch(backendBaseUrl + '/health', { 
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      console.log('✅ Backend connection test result:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    })
    .catch(error => {
      console.log('❌ Backend connection test failed:', error);
    });
  } else {
    console.log('ℹ️ Using default backend configuration - no explicit URL to test');
  }
  
  console.groupEnd();
}

// Notes:
// - If left empty, the auto-generated client will use its default base URL.
// - When deploying the frontend to a different origin (e.g. https://renosteps.app)
//   you MUST set backendBaseUrl to the publicly accessible Encore API URL
//   and also allow that origin in the backend CORS configuration.
// - In production, we use the direct Encore API URL to avoid proxy issues.
// - Enhanced with detailed logging for debugging connection issues.
