import { secret } from "encore.dev/config";
import bcrypt from "bcryptjs";

// JWT secret for signing tokens - this must be set in Encore's secrets management
const jwtSecret = secret("JWT_SECRET");

/**
 * Hash a password using bcrypt with salt rounds of 12
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Get JWT secret with proper error handling
 * @returns string - JWT secret
 */
export function getJWTSecret(): string {
  try {
    const secret = jwtSecret();
    if (!secret) {
      // Use a default secret for development if not configured
      console.warn('JWT_SECRET not configured, using default development secret');
      return 'development-secret-key-change-in-production';
    }
    return secret;
  } catch (error) {
    console.error('Failed to get JWT secret:', error);
    // Use a default secret for development
    console.warn('Using default development JWT secret');
    return 'development-secret-key-change-in-production';
  }
}

/**
 * Generate a JWT token for a user
 * @param userId - User ID to include in token
 * @param email - User email to include in token
 * @returns Promise<string> - JWT token
 */
export async function generateToken(userId: number, email: string): Promise<string> {
  try {
    // Import jsonwebtoken dynamically
    const { default: jwt } = await import('jsonwebtoken');
    
    const secret = getJWTSecret();
    
    const payload = {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    console.log('Generating JWT token for user:', userId);
    
    const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
    
    if (!token) {
      throw new Error("Token generation failed");
    }

    console.log('JWT token generated successfully');
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    
    // Handle specific JWT errors with user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes('secretOrPrivateKey')) {
        throw new Error("Authentication service configuration error");
      } else if (error.message.includes('payload')) {
        throw new Error("Invalid user data for token generation");
      } else if (error.message.includes('configuration')) {
        throw new Error("Authentication service configuration error");
      }
    }
    
    throw new Error("Failed to generate authentication token");
  }
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Promise<object> - Decoded token payload
 */
export async function verifyToken(token: string): Promise<{ userId: number; email: string }> {
  try {
    const { default: jwt } = await import('jsonwebtoken');
    
    const secret = getJWTSecret();
    
    console.log('Verifying JWT token');
    
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
    
    if (!decoded || typeof decoded !== 'object') {
      throw new Error("Invalid token payload");
    }
    
    // Check if token is expired (additional check)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token has expired");
    }
    
    console.log('JWT token verified successfully for user:', decoded.userId);
    
    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Handle specific JWT errors with user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes('jwt expired')) {
        throw new Error("Token has expired");
      } else if (error.message.includes('jwt malformed')) {
        throw new Error("Malformed token");
      } else if (error.message.includes('invalid signature')) {
        throw new Error("Invalid token signature");
      } else if (error.message.includes('jwt not active')) {
        throw new Error("Token not yet active");
      } else if (error.message.includes('configuration')) {
        throw new Error("Authentication service configuration error");
      }
    }
    
    throw new Error("Invalid authentication token");
  }
}

/**
 * Validate email format using a simple regex
 * @param email - Email to validate
 * @returns boolean - True if email format is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns object - Validation result with isValid boolean and error message
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: "Password must be less than 128 characters long" };
  }
  
  // Check for at least one letter and one number
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: "Password must contain at least one letter and one number" };
  }
  
  return { isValid: true };
}
