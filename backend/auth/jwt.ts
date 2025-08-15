import { APIError } from "encore.dev/api";
import { getJWTSecret } from "./utils";

interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

// Generate a JWT token for a user
export async function generateToken(userId: number, email: string): Promise<string> {
  try {
    // Import jsonwebtoken dynamically
    const jwt = await import('jsonwebtoken');
    
    const payload = {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    return jwt.sign(payload, getJWTSecret());
  } catch (error) {
    console.error('Token generation error:', error);
    throw APIError.internal("Failed to generate authentication token");
  }
}

// Verify and decode a JWT token
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const jwt = await import('jsonwebtoken');
    
    const decoded = jwt.verify(token, getJWTSecret()) as JWTPayload;
    
    // Check if token is expired
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw APIError.unauthenticated("Token has expired");
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    console.error('Token verification error:', error);
    throw APIError.unauthenticated("Invalid authentication token");
  }
}

// Extract token from Authorization header
export function extractTokenFromHeader(authHeader?: string): string {
  if (!authHeader) {
    throw APIError.unauthenticated("Missing authorization header");
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw APIError.unauthenticated("Invalid authorization header format");
  }

  return parts[1];
}
