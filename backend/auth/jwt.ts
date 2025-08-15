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
      throw APIError.internal("JWT secret is not configured");
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
      throw APIError.internal("Failed to sign JWT token");
    }

    console.log('JWT token generated successfully');
    return token;
  } catch (error) {
    console.error('Token generation error:', error);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.message.includes('secretOrPrivateKey')) {
        throw APIError.internal("JWT secret configuration error");
      } else if (error.message.includes('payload')) {
        throw APIError.internal("Invalid token payload");
      } else {
        console.error('Unexpected JWT error:', error.message);
        throw APIError.internal(`JWT generation failed: ${error.message}`);
      }
    }
    
    throw APIError.internal("Failed to generate authentication token");
  }
}

// Verify and decode a JWT token
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { default: jwt } = await import('jsonwebtoken');
    
    const secret = getJWTSecret();
    if (!secret) {
      console.error('JWT secret is not configured for verification');
      throw APIError.unauthenticated("JWT secret is not configured");
    }

    console.log('Verifying JWT token with secret length:', secret.length);
    
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JWTPayload;
    
    if (!decoded || typeof decoded !== 'object') {
      console.error('JWT verify returned invalid payload');
      throw APIError.unauthenticated("Invalid token payload");
    }
    
    // Check if token is expired (additional check)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.error('Token has expired:', decoded.exp, 'vs', Math.floor(Date.now() / 1000));
      throw APIError.unauthenticated("Token has expired");
    }
    
    console.log('JWT token verified successfully for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    // Handle specific JWT errors
    if (error instanceof Error) {
      if (error.message.includes('jwt expired')) {
        throw APIError.unauthenticated("Token has expired");
      } else if (error.message.includes('jwt malformed')) {
        throw APIError.unauthenticated("Malformed token");
      } else if (error.message.includes('invalid signature')) {
        throw APIError.unauthenticated("Invalid token signature");
      } else if (error.message.includes('jwt not active')) {
        throw APIError.unauthenticated("Token not yet active");
      } else {
        console.error('Unexpected JWT verification error:', error.message);
        throw APIError.unauthenticated(`Token verification failed: ${error.message}`);
      }
    }
    
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

  const token = parts[1];
  if (!token || token.trim() === '') {
    throw APIError.unauthenticated("Empty token in authorization header");
  }

  return token;
}
