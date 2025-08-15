import { api, APIError } from "encore.dev/api";
import { authDB } from "./db";
import type { ForgotPasswordRequest, MessageResponse } from "./types";

// Initiates password reset process for a user.
export const forgotPassword = api<ForgotPasswordRequest, MessageResponse>(
  { expose: true, method: "POST", path: "/auth/forgot-password" },
  async (req) => {
    try {
      // Check if user exists
      const user = await authDB.queryRow<{
        id: number;
        email: string;
      }>`
        SELECT id, email FROM users WHERE email = ${req.email.toLowerCase()}
      `;

      // Always return success message for security (don't reveal if email exists)
      if (!user) {
        return {
          message: "If an account with that email exists, a password reset link has been sent.",
        };
      }

      // TODO: In a real application, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with an expiration time
      // 3. Send an email with the reset link
      // 4. Create a reset password endpoint that validates the token
      
      console.log(`Password reset requested for user: ${user.email}`);
      
      return {
        message: "If an account with that email exists, a password reset link has been sent.",
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Always return success message for security
      return {
        message: "If an account with that email exists, a password reset link has been sent.",
      };
    }
  }
);
