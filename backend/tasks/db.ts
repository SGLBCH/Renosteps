import { SQLDatabase } from 'encore.dev/storage/sqldb';

// Reference the existing prod database created in auth service
export const tasksDB = SQLDatabase.named("prod");

// Helper function to ensure database connections are properly handled
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
    )
  ]);
}
