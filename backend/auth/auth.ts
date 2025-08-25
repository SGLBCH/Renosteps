import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { verifyToken } from "./utils";
import type { AuthData } from "./types";

// Auth parameters - accept standard Authorization and X-Authorization headers to be proxy-friendly
interface AuthParams {
  authorization?: Header<"Authorization">;
  xAuthorization?: Header<"X-Authorization">;
}

/**
 * Auth handler that validates JWT tokens from Authorization header
 * Also supports X-Authorization to handle proxies that strip Authorization
 * This runs automatically for any API endpoint with auth: true
 */
const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    // Prefer standard Authorization header, fall back to X-Authorization for proxy compatibility
    const rawHeader = params.authorization ?? params.xAuthorization;

    if (!rawHeader) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    // Support both "Bearer <token>" and raw token formats
    let token = rawHeader.trim();
    const parts = token.split(" ");

    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }

    if (!token) {
      throw APIError.unauthenticated("Missing token in authorization header");
    }

    try {
      // Verify the JWT token and extract user info
      const decoded = await verifyToken(token);

      return {
        userID: decoded.userId.toString(),
        email: decoded.email,
      };
    } catch (error) {
      // Log the error for debugging but return generic message to client
      console.error("JWT verification failed:", error);
      throw APIError.unauthenticated("Invalid or expired token");
    }
  }
);

// Configure the API gateway with auth handler only
// Note: CORS is handled automatically by Encore.ts for exposed endpoints
export const gateway = new Gateway({
  authHandler: auth,
});
