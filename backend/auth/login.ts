import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { verifyPassword } from "./utils";
import type { LoginRequest, AuthResponse } from "./types";
import { generateToken } from "./jwt";

// Authenticates a user and returns a JWT token.
export const login = api<LoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    console.log('Login attempt for email:', req.email);
    
    try {
      // Find user by email
      console.log('Looking up user:', req.email.toLowerCase());
      const user = await authDB.queryRow<{
        id: number;
        email: string;
        password_hash: string;
        created_at: Date;
      }>`
        SELECT id, email, password_hash, created_at
        FROM users 
        WHERE email = ${req.email.toLowerCase()}
      `;

      if (!user) {
        console.error('User not found:', req.email);
        throw APIError.unauthenticated("Invalid email or password");
      }

      console.log('User found:', user.id, user.email);

      // Verify password
      console.log('Verifying password for user:', user.id);
      const isValidPassword = await verifyPassword(req.password, user.password_hash);
      if (!isValidPassword) {
        console.error('Invalid password for user:', user.id);
        throw APIError.unauthenticated("Invalid email or password");
      }

      console.log('Password verified for user:', user.id);

      // Generate JWT token
      console.log('Generating JWT token for user:', user.id);
      const token = await generateToken(user.id, user.email);

      console.log('Login completed successfully for user:', user.id);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle unexpected errors
      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('token')) {
          throw APIError.internal("Authentication token generation failed");
        } else if (error.message.includes('password')) {
          throw APIError.unauthenticated("Invalid email or password");
        } else {
          console.error('Unexpected login error:', error.message);
          throw APIError.internal(`Login failed: ${error.message}`);
        }
      }
      
      throw APIError.internal("Failed to authenticate user");
    }
  }
);
