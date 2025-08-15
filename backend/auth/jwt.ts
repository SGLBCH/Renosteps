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
    const { default: jwt } = await import('jsonwebtoken');
    
    const secret = getJWTSecret();
    if (!secret) {
      console.error('JWT secret is not configured');
      throw new Error("Authentication service configuration error");
    }

    const payload = {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    console.log('Generating JWT token for user:', userId, 'with secret length:', secret.length);
    
    const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
    
    if (!token) {
      console.error('JWT sign returned empty token');
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
      } else {
        console.error('Unexpected JWT error:', error.message);
        throw new Error("Authentication token generation failed");
      }
    }
    
    throw new Error("Failed to generate authentication token");
  }
}

// Verify and decode a JWT token
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { default: jwt } = await import('jsonwebtoken');
    
    const secret = getJWTSecret();
    if (!secret) {
      console.error('JWT secret is not configured for verification');
      throw new Error("Authentication service configuration error");
    }

    console.log('Verifying JWT token with secret length:', secret.length);
    
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JWTPayload;
    
    if (!decoded || typeof decoded !== 'object') {
      console.error('JWT verify returned invalid payload');
      throw new Error("Invalid token payload");
    }
    
    // Check if token is expired (additional check)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.error('Token has expired:', decoded.exp, 'vs', Math.floor(Date.now() / 1000));
      throw new Error("Token has expired");
    }
    
    console.log('JWT token verified successfully for user:', decoded.userId);
    return decoded;
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
      } else {
        console.error('Unexpected JWT verification error:', error.message);
        throw new Error("Token verification failed");
      }
    }
    
    throw new Error("Invalid authentication token");
  }
}

// Extract token from Authorization header
export function extractTokenFromHeader(authHeader?: string): string {
  if (!authHeader) {
    throw APIError.unauthenticated("Authorization header is required");
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    throw APIError.unauthenticated("Invalid authorization header format. Expected 'Bearer <token>'");
  }

  if (parts[0] !== 'Bearer') {
    throw APIError.unauthenticated("Invalid authorization header format. Must start with 'Bearer'");
  }

  const token = parts[1];
  if (!token || token.trim() === '') {
    throw APIError.unauthenticated("Authorization token is required");
  }

  return token;
}
