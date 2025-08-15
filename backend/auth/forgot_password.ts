import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import type { ForgotPasswordRequest, MessageResponse } from "./types";

// Initiates password reset process for a user.
export const forgotPassword = api<ForgotPasswordRequest, MessageResponse>(
  { expose: true, method: "POST", path: "/auth/forgot-password" },
  async (req) => {
    try {
      // Validate input format
      if (!req.email || !req.email.trim()) {
        throw APIError.invalidArgument("Email address is required");
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.email.trim())) {
        throw APIError.invalidArgument("Please enter a valid email address");
      }

      // Check if user exists
      const user = await authDB.queryRow<{
        id: number;
        email: string;
      }>`
        SELECT id, email FROM users WHERE email = ${req.email.toLowerCase().trim()}
      `;

      // Always return success message for security (don't reveal if email exists)
      // This prevents email enumeration attacks
      const successMessage = "If an account with that email address exists, a password reset link has been sent to your inbox.";

      if (!user) {
        console.log('Password reset requested for non-existent email:', req.email);
        return { message: successMessage };
      }

      // TODO: In a real application, you would:
      // 1. Generate a secure reset token with expiration
      // 2. Store it in the database with an expiration time
      // 3. Send an email with the reset link
      // 4. Create a reset password endpoint that validates the token
      
      console.log(`Password reset requested for user: ${user.email}`);
      
      return { message: successMessage };
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle database connection errors
      if (error instanceof Error) {
        if (error.message.includes('connection') || error.message.includes('timeout')) {
          throw APIError.unavailable("Service temporarily unavailable. Please try again in a moment.");
        } else if (error.message.includes('database') || error.message.includes('sql')) {
          throw APIError.unavailable("Service temporarily unavailable. Please try again later.");
        } else {
          console.error('Unexpected forgot password error:', error.message);
          throw APIError.internal("Password reset request failed. Please try again.");
        }
      }
      
      // Always return success message for security, even on errors
      // This prevents revealing system information through error messages
      return {
        message: "If an account with that email address exists, a password reset link has been sent to your inbox.",
      };
    }
  }
);
