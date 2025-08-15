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
    
    try {
      // Validate input format
      if (!req.email || !req.email.trim()) {
        throw APIError.invalidArgument("Email is required");
      }

      if (!req.password || !req.password.trim()) {
        throw APIError.invalidArgument("Password is required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.email.trim())) {
        throw APIError.invalidArgument("Please enter a valid email address");
      }

      // Validate password strength with specific requirements
      const password = req.password.trim();
      if (password.length < 8) {
        throw APIError.invalidArgument("Password must be at least 8 characters long");
      }

      if (password.length > 128) {
        throw APIError.invalidArgument("Password must be less than 128 characters long");
      }

      // Check for at least one letter and one number for better security
      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        throw APIError.invalidArgument("Password must contain at least one letter and one number");
      }

      // Check if user already exists
      console.log('Checking if user exists:', req.email.toLowerCase());
      const existingUser = await authDB.queryRow`
        SELECT id FROM users WHERE email = ${req.email.toLowerCase().trim()}
      `;

      if (existingUser) {
        console.error('User already exists:', req.email);
        throw APIError.alreadyExists("An account with this email address already exists");
      }

      // Hash password
      console.log('Hashing password for user:', req.email);
      const passwordHash = await hashPassword(password);

      // Create user
      console.log('Creating user in database:', req.email);
      const user = await authDB.queryRow<{
        id: number;
        email: string;
        created_at: Date;
      }>`
        INSERT INTO users (email, password_hash, created_at)
        VALUES (${req.email.toLowerCase().trim()}, ${passwordHash}, NOW())
        RETURNING id, email, created_at
      `;

      if (!user) {
        console.error('Failed to create user - no data returned');
        throw APIError.internal("Failed to create account. Please try again.");
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
      
      // Handle database errors with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw APIError.alreadyExists("An account with this email address already exists");
        } else if (error.message.includes('connection') || error.message.includes('timeout')) {
          throw APIError.unavailable("Service temporarily unavailable. Please try again in a moment.");
        } else if (error.message.includes('password')) {
          throw APIError.internal("Password processing failed. Please try again.");
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
          throw APIError.internal("Account created but login failed. Please try signing in.");
        } else if (error.message.includes('database') || error.message.includes('sql')) {
          throw APIError.unavailable("Service temporarily unavailable. Please try again later.");
        } else if (error.message.includes('email')) {
          throw APIError.invalidArgument("Invalid email address format");
        } else {
          console.error('Unexpected registration error:', error.message);
          throw APIError.internal("Registration failed. Please try again.");
        }
      }
      
      throw APIError.internal("An unexpected error occurred. Please try again.");
    }
  }
);
