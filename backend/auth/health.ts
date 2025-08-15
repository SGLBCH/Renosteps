import { api } from "encore.dev/api";
import { getJWTSecret } from "./utils";

interface HealthCheckResponse {
  status: string;
  jwtSecretConfigured: boolean;
  jwtSecretLength?: number;
  timestamp: string;
  version: string;
}

// Health check endpoint to verify authentication system status.
export const health = api<void, HealthCheckResponse>(
  { expose: true, method: "GET", path: "/auth/health" },
  async () => {
    let jwtSecretConfigured = false;
    let jwtSecretLength: number | undefined;

    try {
      const secret = getJWTSecret();
      jwtSecretConfigured = true;
      jwtSecretLength = secret.length;
    } catch (error) {
      console.error('JWT secret check failed:', error);
      jwtSecretConfigured = false;
    }

    return {
      status: jwtSecretConfigured ? "healthy" : "unhealthy",
      jwtSecretConfigured,
      jwtSecretLength,
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    };
  }
);
