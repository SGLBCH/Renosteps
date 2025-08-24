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
  
  // If we're in development (localhost), use the Encore dev proxy with empty base URL.
  if (hostname === 'localhost') {
    selectedUrl = '';
    reason = 'Development mode - using Encore dev proxy';
  } else {
    // For production (including renosteps.app and any subdomain), use the same-origin API proxy.
    // This avoids cross-origin requests and CORS issues by routing through /api (see vercel.json rewrites).
    selectedUrl = '/api';
    reason = 'Production - using same-origin /api proxy to Encore';
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
  if (typeof window !== 'undefined') {
    console.log('Current environment:', {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      origin: window.location.origin
    });
  }
  
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
    .then(async response => {
      console.log(`✅ ${endpoint} connection test result:`, {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      try {
        const data = await response.json();
        console.log(`📊 ${endpoint} response data:`, data);
      } catch (e) {
        console.log(`ℹ️ ${endpoint} response had no JSON body`);
      }
    })
    .catch(error => {
      console.log(`❌ ${endpoint} connection test failed:`, {
        error: (error as Error).message,
        type: (error as any).name,
        stack: (error as any).stack
      });
    });
  });
  
  console.groupEnd();
}

// Auto-run connection test in production for debugging
if (typeof window !== 'undefined' && window.location.hostname.endsWith('renosteps.app')) {
  console.log('🚀 Production environment detected - running connection test');
  setTimeout(testBackendConnection, 1000);
}

// Notes:
// - If left empty, the auto-generated client will use its default base URL.
// - When deploying the frontend to a different origin (e.g. https://renosteps.app)
//   we now use the same-origin proxy (/api) which Vercel rewrites to the Encore API.
//   This avoids cross-origin issues and ensures Authorization headers pass through.
// - vercel.json handles rewriting /api/* to the Encore public URL and sets CORS headers if needed.
// - Enhanced with detailed logging for debugging connection issues.
// - The JWT secret is handled in the backend via Encore secrets; frontend does not need it.
