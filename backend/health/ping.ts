import { api } from "encore.dev/api";

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

// Simple health check endpoint that returns 200 if the service is running
export const ping = api<void, HealthResponse>(
  { expose: true, method: "GET", path: "/health/ping" },
  async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "renovation-task-manager"
    };
  }
);
