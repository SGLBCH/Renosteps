import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const tasksDB = new SQLDatabase("tasks", {
  migrations: "./migrations",
});

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
