import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import { hashPassword, generateToken, isValidEmail, validatePassword } from "./utils";
import type { RegisterRequest, AuthResponse } from "./types";

/**
 * Register a new user account
 * Validates input, checks for existing email, hashes password, and returns JWT token
 */
export const register = api<RegisterRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    console.log('Registration attempt for email:', req.email);
    
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

      // Validate password strength
      const passwordValidation = validatePassword(req.password);
      if (!passwordValidation.isValid) {
        throw APIError.invalidArgument(passwordValidation.error!);
      }

      // Check if user already exists
      const existingUser = await authDB.queryRow`
        SELECT id FROM users WHERE email = ${email}
      `;

      if (existingUser) {
        console.log('Registration failed: email already exists:', email);
        throw APIError.alreadyExists("An account with this email address already exists");
      }

      // Hash the password
      const passwordHash = await hashPassword(req.password);

      // Create the user
      const newUser = await authDB.queryRow<{
        id: number;
        email: string;
        created_at: Date;
      }>`
        INSERT INTO users (email, password_hash, created_at)
        VALUES (${email}, ${passwordHash}, NOW())
        RETURNING id, email, created_at
      `;

      if (!newUser) {
        console.error('Failed to create user - no data returned from INSERT');
        throw APIError.internal("Failed to create account. Please try again.");
      }

      console.log('User created successfully:', newUser.id, newUser.email);

      // Generate JWT token
      const token = generateToken(newUser.id, newUser.email);

      // Return success response
      return {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.created_at,
        },
      };

    } catch (error) {
      // Log detailed error for debugging
      console.error('Registration error:', error);
      
      // Re-throw APIErrors as-is (they have user-friendly messages)
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle database errors
      if (error instanceof Error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          throw APIError.alreadyExists("An account with this email address already exists");
        }
        
        // Log unexpected errors but return generic message
        console.error('Unexpected registration error:', error.message);
        throw APIError.internal("Registration failed. Please try again.");
      }
      
      throw APIError.internal("Registration failed. Please try again.");
    }
  }
);
