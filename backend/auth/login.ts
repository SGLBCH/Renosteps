import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { verifyPassword, generateToken, isValidEmail } from "./utils";
import type { LoginRequest, AuthResponse } from "./types";

/**
 * Login with email and password
 * Validates credentials and returns JWT token if successful
 */
export const login = api<LoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    console.log('Login attempt for email:', req.email);
    
    try {
      // Validate input
      if (!req.email || !req.email.trim()) {
        throw APIError.invalidArgument("Email is required");
      }

      if (!req.password) {
        throw APIError.invalidArgument("Password is required");
      }

      // Validate email format
      const email = req.email.trim().toLowerCase();
      if (!isValidEmail(email)) {
        throw APIError.invalidArgument("Please enter a valid email address");
      }

      // Find user by email
      const user = await authDB.queryRow<{
        id: number;
        email: string;
        password_hash: string;
        created_at: Date;
      }>`
        SELECT id, email, password_hash, created_at
        FROM users 
        WHERE email = ${email}
      `;

      if (!user) {
        console.log('Login failed: user not found for email:', email);
        // Use generic message to avoid revealing whether email exists
        throw APIError.unauthenticated("Invalid email or password");
      }

      // Verify password
      const isValidPassword = await verifyPassword(req.password, user.password_hash);
      if (!isValidPassword) {
        console.log('Login failed: invalid password for user:', user.id);
        // Use generic message to avoid revealing whether email exists
        throw APIError.unauthenticated("Invalid email or password");
      }

      console.log('Login successful for user:', user.id, user.email);

      // Generate JWT token
      const token = await generateToken(user.id, user.email);

      // Return success response
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
      };

    } catch (error) {
      // Log detailed error for debugging
      console.error('Login error:', error);
      
      // Re-throw APIErrors as-is (they have user-friendly messages)
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle unexpected errors
      if (error instanceof Error) {
        console.error('Unexpected login error:', error.message);
        throw APIError.internal("Login failed. Please try again.");
      }
      
      throw APIError.internal("Login failed. Please try again.");
    }
  }
);
