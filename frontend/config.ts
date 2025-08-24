// Base URL for the backend API when hosting the frontend outside of Leap (e.g. Vercel).
// Set this to your Encore backend's public URL, for example:
// export const backendBaseUrl = "https://<your-app-id>.api.encore.dev";
// For local development with Vite, you can leave it empty and Encore's dev proxy will be used.

// Check if we're in production and use the appropriate backend URL
export const backendBaseUrl = (() => {
  // If we're in development (localhost), use the proxy
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }
  
  // If we're in production, use the API proxy
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  
  // Fallback for SSR or other environments
  return '/api';
})();

// Notes:
// - If left empty, the auto-generated client will use its default base URL.
// - When deploying the frontend to a different origin (e.g. https://renosteps.app)
//   you MUST set backendBaseUrl to the publicly accessible Encore API URL
//   and also allow that origin in the backend CORS configuration.
// - In production, we use "/api" which gets proxied to the Encore backend via Vercel rewrites.
