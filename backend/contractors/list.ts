import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { contractorsDB } from "./db";
import type { ListContractorsResponse, Contractor } from "./types";

// Retrieves all contractors for the authenticated user, ordered by creation date (latest first).
export const list = api<void, ListContractorsResponse>(
  { expose: true, method: "GET", path: "/contractors", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);
    const contractors: Contractor[] = [];
    
    for await (const row of contractorsDB.query<Contractor>`
      SELECT id, name, role, phone, email, company, hourly_rate as "hourlyRate", notes, created_at as "createdAt", updated_at as "updatedAt"
      FROM contractors
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `) {
      contractors.push(row);
    }
    
    return { contractors };
  }
);
