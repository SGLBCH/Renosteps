import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { hashPassword } from "./utils";
import type { RegisterRequest, AuthResponse } from "./types";
import { generateToken } from "./jwt";

// Registers a new user account.
export const register = api<RegisterRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.email)) {
      throw APIError.invalidArgument("Invalid email format");
    }

    // Validate password strength
    if (req.password.length < 8) {
      throw APIError.invalidArgument("Password must be at least 8 characters long");
    }

    try {
      // Check if user already exists
      const existingUser = await authDB.queryRow`
        SELECT id FROM users WHERE email = ${req.email.toLowerCase()}
      `;

      if (existingUser) {
        throw APIError.alreadyExists("User with this email already exists");
      }

      // Hash password
      const passwordHash = await hashPassword(req.password);

      // Create user
      const user = await authDB.queryRow<{
        id: number;
        email: string;
        created_at: Date;
      }>`
        INSERT INTO users (email, password_hash, created_at)
        VALUES (${req.email.toLowerCase()}, ${passwordHash}, NOW())
        RETURNING id, email, created_at
      `;

      if (!user) {
        throw APIError.internal("Failed to create user");
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
      
      console.error('Registration error:', error);
      throw APIError.internal("Failed to register user");
    }
  }
);
