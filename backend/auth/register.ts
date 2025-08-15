import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { hashPassword } from "./utils";
import type { RegisterRequest, AuthResponse } from "./types";
import { generateToken } from "./jwt";

// Registers a new user account.
export const register = api<RegisterRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    console.log('Registration attempt for email:', req.email);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.email)) {
      console.error('Invalid email format:', req.email);
      throw APIError.invalidArgument("Invalid email format");
    }

    // Validate password strength
    if (req.password.length < 8) {
      console.error('Password too short:', req.password.length);
      throw APIError.invalidArgument("Password must be at least 8 characters long");
    }

    try {
      // Check if user already exists
      console.log('Checking if user exists:', req.email.toLowerCase());
      const existingUser = await authDB.queryRow`
        SELECT id FROM users WHERE email = ${req.email.toLowerCase()}
      `;

      if (existingUser) {
        console.error('User already exists:', req.email);
        throw APIError.alreadyExists("User with this email already exists");
      }

      // Hash password
      console.log('Hashing password for user:', req.email);
      const passwordHash = await hashPassword(req.password);

      // Create user
      console.log('Creating user in database:', req.email);
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
        console.error('Failed to create user - no data returned');
        throw APIError.internal("Failed to create user");
      }

      console.log('User created successfully:', user.id, user.email);

      // Generate JWT token
      console.log('Generating JWT token for user:', user.id);
      const token = await generateToken(user.id, user.email);

      console.log('Registration completed successfully for user:', user.id);
      
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle database errors
      if (error instanceof Error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw APIError.alreadyExists("User with this email already exists");
        } else if (error.message.includes('password')) {
          throw APIError.internal("Password processing failed");
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
          throw APIError.internal("Authentication token generation failed");
        } else {
          console.error('Unexpected registration error:', error.message);
          throw APIError.internal(`Registration failed: ${error.message}`);
        }
      }
      
      throw APIError.internal("Failed to register user");
    }
  }
);
