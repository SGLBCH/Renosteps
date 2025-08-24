import { SQLDatabase } from "encore.dev/storage/sqldb";

// Reference the existing prod database created in auth service
export const projectsDB = SQLDatabase.named("prod");
