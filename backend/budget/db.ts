import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const budgetDB = new SQLDatabase("budget", {
  migrations: "./migrations",
});
