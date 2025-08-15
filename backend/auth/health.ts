import { api } from "encore.dev/api";
import { getJWTSecret } from "./utils";

interface HealthCheckResponse {
  status: string;
  jwtSecretConfigured: boolean;
  jwtSecretLength?: number;
  timestamp: string;
  version: string;
  message?: string;
}

// Health check endpoint to verify authentication system status.
export const health = api<HealthCheckResponse, HealthCheckResponse>(
  { expose: true, method: "GET", path: "/auth/health" },
  async () => {
    let jwtSecretConfigured = false;
    let jwtSecretLength: number | undefined;
    let status = "unhealthy";
    let message: string | undefined;

    try {
      const secret = getJWTSecret();
      jwtSecretConfigured = true;
      jwtSecretLength = secret.length;
      
      if (secret.length >= 32) {
        status = "healthy";
        message = "Authentication service is operational";
      } else {
        status = "warning";
        message = "JWT secret is shorter than recommended (32 characters)";
      }
    } catch (error) {
      console.error('JWT secret check failed:', error);
      jwtSecretConfigured = false;
      status = "unhealthy";
      
      if (error instanceof Error) {
        if (error.message.includes('configuration')) {
          message = "JWT secret is not properly configured";
        } else {
          message = "Authentication service configuration error";
        }
      } else {
        message = "Authentication service is not available";
      }
    }

    return {
      status,
      jwtSecretConfigured,
      jwtSecretLength,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      message
    };
  }
);
