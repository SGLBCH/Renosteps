import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { verifyPassword } from "./utils";
import type { LoginRequest, AuthResponse } from "./types";
import { generateToken } from "./jwt";

// Authenticates a user and returns a JWT token.
export const login = api<LoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    try {
      // Find user by email
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
        throw APIError.unauthenticated("Invalid email or password");
      }

      // Verify password
      const isValidPassword = await verifyPassword(req.password, user.password_hash);
      if (!isValidPassword) {
        throw APIError.unauthenticated("Invalid email or password");
      }

      // Generate JWT token
      const token = await generateToken(user.id, user.email);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      console.error('Login error:', error);
      throw APIError.internal("Failed to authenticate user");
    }
  }
);
