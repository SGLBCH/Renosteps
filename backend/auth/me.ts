import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { authDB } from "./db";
import type { User } from "./types";

/**
 * Get current authenticated user's profile
 * Requires valid JWT token in Authorization header
 */
export const me = api<void, User>(
  { expose: true, method: "GET", path: "/auth/me", auth: true },
  async () => {
    try {
      // Get auth data from the JWT token (automatically parsed by auth middleware)
      const auth = getAuthData()!; // Non-null because auth: true is set
      const userId = parseInt(auth.userID, 10);

      console.log('Getting profile for user:', userId);

      // Get user from database
      const user = await authDB.queryRow<{
        id: number;
        email: string;
        created_at: Date;
      }>`
        SELECT id, email, created_at
        FROM users 
        WHERE id = ${userId}
      `;

      if (!user) {
        console.error('User not found in database:', userId);
        throw APIError.unauthenticated("User account not found. Please sign in again.");
      }

      console.log('Profile retrieved successfully for user:', user.id);

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      };

    } catch (error) {
      // Log detailed error for debugging
      console.error('Get profile error:', error);
      
      // Re-throw APIErrors as-is
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle unexpected errors
      if (error instanceof Error) {
        console.error('Unexpected profile error:', error.message);
        throw APIError.internal("Failed to retrieve profile. Please try again.");
      }
      
      throw APIError.unauthenticated("Authentication required. Please sign in.");
    }
  }
);
