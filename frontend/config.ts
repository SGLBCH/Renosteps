// Base URL for the backend API when hosting the frontend outside of Leap (e.g. Vercel).
// Set this to your Encore backend's public URL, for example:
// export const backendBaseUrl = "https://<your-app-id>.api.encore.dev";
// For local development with Vite, you can leave it empty and Encore's dev proxy will be used.
export const backendBaseUrl = "https://renovation-task-manager-d2evcgk82vjt19ur26rg.lp.dev";

// Notes:
// - If left empty, the auto-generated client will use its default base URL.
// - When deploying the frontend to a different origin (e.g. https://renosteps.app)
//   you MUST set backendBaseUrl to the publicly accessible Encore API URL
//   and also allow that origin in the backend CORS configuration.
