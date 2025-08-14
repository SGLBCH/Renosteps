import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const contractorsDB = new SQLDatabase("contractors", {
  migrations: "./migrations",
});
