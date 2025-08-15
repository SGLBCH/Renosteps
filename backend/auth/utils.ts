import { secret } from "encore.dev/config";

// JWT secret for signing tokens
const jwtSecret = secret("JWTSecret");

// Hash a password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  // Import bcrypt dynamically to avoid issues with bundling
  const bcrypt = await import('bcrypt');
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify a password against its hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Get the JWT secret
export function getJWTSecret(): string {
  return jwtSecret();
}
