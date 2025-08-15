import { SQLDatabase } from 'encore.dev/storage/sqldb';

// Create the auth database with migrations
export const authDB = new SQLDatabase("auth", {
  migrations: "./migrations",
});
