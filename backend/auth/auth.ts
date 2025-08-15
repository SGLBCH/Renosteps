import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { verifyToken } from "./utils";
import type { AuthData } from "./types";

// Auth parameters - only Authorization header is needed for JWT
interface AuthParams {
  authorization?: Header<"Authorization">;
}

/**
 * Auth handler that validates JWT tokens from Authorization header
 * This runs automatically for any API endpoint with auth: true
 */
const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    // Check if Authorization header is present
    if (!params.authorization) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    // Extract token from "Bearer <token>" format
    const authHeader = params.authorization;
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw APIError.unauthenticated("Invalid authorization header format. Expected 'Bearer <token>'");
    }

    const token = parts[1];
    if (!token) {
      throw APIError.unauthenticated("Missing token in authorization header");
    }

    try {
      // Verify the JWT token and extract user info
      const decoded = verifyToken(token);
      
      return {
        userID: decoded.userId.toString(),
        email: decoded.email,
      };
    } catch (error) {
      // Log the error for debugging but return generic message to client
      console.error('JWT verification failed:', error);
      throw APIError.unauthenticated("Invalid or expired token");
    }
  }
);

// Configure the API gateway to use our auth handler
export const gateway = new Gateway({ authHandler: auth });
