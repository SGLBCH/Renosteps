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
    console.log('Getting user profile from token');
    
    try {
      // Extract and verify token
      const token = extractTokenFromHeader(req.authorization);
      console.log('Token extracted, verifying...');
      
      const payload = await verifyToken(token);
      console.log('Token verified for user:', payload.userId);

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
        console.error('User not found in database:', payload.userId);
        throw APIError.unauthenticated("User not found");
      }

      console.log('User profile retrieved successfully:', user.id);

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle unexpected errors
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('token')) {
          throw APIError.unauthenticated("Invalid authentication token");
        } else {
          console.error('Unexpected profile error:', error.message);
          throw APIError.internal(`Failed to get user profile: ${error.message}`);
        }
      }
      
      throw APIError.internal("Failed to get user profile");
    }
  }
);
