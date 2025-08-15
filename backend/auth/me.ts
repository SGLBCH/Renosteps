import { api, APIError, Header } from "encore.dev/api";
import { authDB } from "./db";
import { verifyToken, extractTokenFromHeader } from "./jwt";

interface GetMeRequest {
  authorization: Header<"Authorization">;
}

interface UserProfile {
  id: number;
  email: string;
  createdAt: Date;
}

// Gets the current authenticated user's profile.
export const me = api<GetMeRequest, UserProfile>(
  { expose: true, method: "GET", path: "/auth/me" },
  async (req) => {
    try {
      // Extract and verify token
      const token = extractTokenFromHeader(req.authorization);
      const payload = await verifyToken(token);

      // Get user from database
      const user = await authDB.queryRow<{
        id: number;
        email: string;
        created_at: Date;
      }>`
        SELECT id, email, created_at
        FROM users 
        WHERE id = ${payload.userId}
      `;

      if (!user) {
        throw APIError.unauthenticated("User not found");
      }

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error('Get user profile error:', error);
      throw APIError.internal("Failed to get user profile");
    }
  }
);
