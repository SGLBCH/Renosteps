import { api } from "encore.dev/api";
import { authDB } from "../auth/db";

interface ProductionHealthResponse {
  status: string;
  timestamp: string;
  service: string;
  environment: string;
  uptime: number;
  version: string;
  database: {
    status: string;
    tables: string[];
  };
}

// Enhanced production health check with more detailed information
export const productionCheck = api<void, ProductionHealthResponse>(
  { expose: true, method: "GET", path: "/health/production" },
  async () => {
    const startTime = process.hrtime();
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const uptime = seconds + nanoseconds / 1e9;

    let databaseStatus = "unknown";
    let tables: string[] = [];
    
    try {
      // Test database connection and list tables
      await authDB.queryRow`SELECT 1 as test`;
      databaseStatus = "connected";
      
      const tableRows = await authDB.queryAll<{ table_name: string }>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      tables = tableRows.map(row => row.table_name);
    } catch (error) {
      console.error("Database health check failed:", error);
      databaseStatus = "disconnected";
    }

    return {
      status: databaseStatus === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      service: "renovation-task-manager",
      environment: process.env.NODE_ENV || "development",
      uptime: uptime,
      version: "1.0.0",
      database: {
        status: databaseStatus,
        tables: tables
      }
    };
  }
);
