import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  database: string;
}

// Simple health check endpoint that returns 200 if the service is running
export const ping = api<void, HealthResponse>(
  { expose: true, method: "GET", path: "/health/ping" },
  async () => {
    let databaseStatus = "unknown";
    
    try {
      // Test database connection
      await authDB.queryRow`SELECT 1 as test`;
      databaseStatus = "connected";
    } catch (error) {
      console.error("Database health check failed:", error);
      databaseStatus = "disconnected";
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "renovation-task-manager",
      database: databaseStatus
    };
  }
);
