import { api } from "encore.dev/api";

interface ProductionHealthResponse {
  status: string;
  timestamp: string;
  service: string;
  environment: string;
  uptime: number;
  version: string;
}

// Enhanced production health check with more detailed information
export const productionCheck = api<void, ProductionHealthResponse>(
  { expose: true, method: "GET", path: "/health/production" },
  async () => {
    const startTime = process.hrtime();
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const uptime = seconds + nanoseconds / 1e9;

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "renovation-task-manager",
      environment: process.env.NODE_ENV || "development",
      uptime: uptime,
      version: "1.0.0"
    };
  }
);
