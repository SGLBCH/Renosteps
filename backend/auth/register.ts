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

      // Create user - with detailed logging for database operations
      console.log('Creating user in database:', req.email);
      console.log('Database operation: INSERT INTO users with columns: email, password_hash, created_at');
      
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
        console.error('Failed to create user - no data returned from INSERT operation');
        console.error('This suggests the INSERT statement executed but RETURNING clause failed');
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
    } catch (err: any) {
      console.error('Registration error caught:', err);
      console.error("Registration error message:", err.message);
      console.error("Full registration error object:", err);
      console.error("Detailed registration error:", err);
      
      // Log additional database-specific information
      if (err && typeof err === 'object') {
        console.error('Error type:', typeof err);
        console.error('Error constructor:', err.constructor?.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        
        // Log database-specific error details
        if (err.code) {
          console.error('Database error code:', err.code);
        }
        if (err.detail) {
          console.error('Database error detail:', err.detail);
        }
        if (err.hint) {
          console.error('Database error hint:', err.hint);
        }
        if (err.position) {
          console.error('Database error position:', err.position);
        }
        if (err.routine) {
          console.error('Database error routine:', err.routine);
        }
        if (err.schema) {
          console.error('Database error schema:', err.schema);
        }
        if (err.table) {
          console.error('Database error table:', err.table);
        }
        if (err.column) {
          console.error('Database error column:', err.column);
        }
      }
      
      if (err instanceof APIError) {
        throw err;
      }
      
      // Handle database errors with user-friendly messages
      if (err instanceof Error) {
        // Check for specific database column errors
        if (err.message.includes('password_hash') || err.message.includes('column "password_hash"')) {
          console.error('CRITICAL: password_hash column missing from users table');
          console.error('This indicates the database migration has not been applied to staging');
          throw APIError.internal("Database schema error. Please contact support.");
        }
        
        if (err.message.includes('relation "users" does not exist')) {
          console.error('CRITICAL: users table does not exist');
          console.error('This indicates the database migration has not been applied to staging');
          throw APIError.internal("Database schema error. Please contact support.");
        }
        
        if (err.message.includes('unique') || err.message.includes('duplicate')) {
          throw APIError.alreadyExists("An account with this email address already exists");
        } else if (err.message.includes('connection') || err.message.includes('timeout')) {
          throw APIError.unavailable("Service temporarily unavailable. Please try again in a moment.");
        } else if (err.message.includes('password')) {
          throw APIError.internal("Password processing failed. Please try again.");
        } else if (err.message.includes('JWT') || err.message.includes('token')) {
          throw APIError.internal("Account created but login failed. Please try signing in.");
        } else if (err.message.includes('database') || err.message.includes('sql')) {
          throw APIError.unavailable("Service temporarily unavailable. Please try again later.");
        } else if (err.message.includes('email')) {
          throw APIError.invalidArgument("Invalid email address format");
        } else {
          console.error('Unexpected registration error:', err.message);
          console.error("Detailed registration error:", err);
          throw APIError.internal("Registration failed. Please try again.");
        }
      }
      
      console.error("Detailed registration error:", err);
      throw APIError.internal("Registration failed. Please try again.");
    }
  }
);
