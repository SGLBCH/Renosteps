import { api } from "encore.dev/api";
import { contractorsDB } from "./db";
import type { ListContractorsResponse, Contractor } from "./types";

// Retrieves all contractors, ordered by creation date (latest first).
export const list = api<void, ListContractorsResponse>(
  { expose: true, method: "GET", path: "/contractors" },
  async () => {
    const contractors: Contractor[] = [];
    
    for await (const row of contractorsDB.query<Contractor>`
      SELECT id, name, role, phone, email, company, hourly_rate as "hourlyRate", notes, created_at as "createdAt", updated_at as "updatedAt"
      FROM contractors
      ORDER BY created_at DESC
    `) {
      contractors.push(row);
    }
    
    return { contractors };
  }
);
