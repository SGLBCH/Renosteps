import { SQLDatabase } from "encore.dev/storage/sqldb";

export const inspirationDB = new SQLDatabase("inspiration", {
  migrations: "./migrations",
});
