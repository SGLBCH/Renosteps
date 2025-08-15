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
        throw APIError.unauthenticated("User account not found. Please sign in again.");
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
      
      // Handle specific error types with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('jwt expired') || error.message.includes('expired')) {
          throw APIError.unauthenticated("Your session has expired. Please sign in again.");
        } else if (error.message.includes('jwt malformed') || error.message.includes('malformed')) {
          throw APIError.unauthenticated("Invalid session. Please sign in again.");
        } else if (error.message.includes('invalid signature') || error.message.includes('signature')) {
          throw APIError.unauthenticated("Invalid session. Please sign in again.");
        } else if (error.message.includes('connection') || error.message.includes('timeout')) {
          throw APIError.unavailable("Service temporarily unavailable. Please try again in a moment.");
        } else if (error.message.includes('database') || error.message.includes('sql')) {
          throw APIError.unavailable("Service temporarily unavailable. Please try again later.");
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
          throw APIError.unauthenticated("Invalid session. Please sign in again.");
        } else {
          console.error('Unexpected profile error:', error.message);
          throw APIError.internal("Failed to retrieve profile. Please try again.");
        }
      }
      
      throw APIError.unauthenticated("Authentication required. Please sign in.");
    }
  }
);
