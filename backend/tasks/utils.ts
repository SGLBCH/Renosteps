/**
 * Generates a unique ID string using random characters.
 * @returns A unique identifier string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
