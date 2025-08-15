import { secret } from "encore.dev/config";

// JWT secret for signing tokens
const jwtSecret = secret("JWTSecret");

// Hash a password using bcryptjs
export async function hashPassword(password: string): Promise<string> {
  try {
    // Import bcryptjs dynamically to avoid issues with bundling
    const { default: bcryptjs } = await import('bcryptjs');
    const saltRounds = 12;
    
    console.log('Hashing password with salt rounds:', saltRounds);
    const hash = await bcryptjs.hash(password, saltRounds);
    
    if (!hash) {
      throw new Error('Bcryptjs returned empty hash');
    }
    
    console.log('Password hashed successfully');
    return hash;
  } catch (error) {
    console.error('Password hashing error:', error);
    
    if (error instanceof Error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
    
    throw new Error('Password hashing failed');
  }
}

// Verify a password against its hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const { default: bcryptjs } = await import('bcryptjs');
    
    console.log('Verifying password against hash');
    const isValid = await bcryptjs.compare(password, hash);
    
    console.log('Password verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Get the JWT secret
export function getJWTSecret(): string {
  try {
    const secret = jwtSecret();
    
    if (!secret || secret.trim() === '') {
      console.error('JWT secret is empty or not configured');
      throw new Error('JWT secret is not configured');
    }
    
    if (secret.length < 32) {
      console.warn('JWT secret is shorter than recommended (32 characters)');
    }
    
    return secret;
  } catch (error) {
    console.error('Error getting JWT secret:', error);
    throw new Error('Failed to retrieve JWT secret');
  }
}
