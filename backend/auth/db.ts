import { SQLDatabase } from 'encore.dev/storage/sqldb';

// Create the prod database with migrations - this is the primary database definition
export const authDB = new SQLDatabase("prod", {
  migrations: "./migrations",
});
