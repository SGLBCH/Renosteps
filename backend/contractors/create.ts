import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { contractorsDB } from "./db";
import type { CreateContractorRequest, Contractor } from "./types";

// Creates a new contractor.
export const create = api<CreateContractorRequest, Contractor>(
  { expose: true, method: "POST", path: "/contractors", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);

    const row = await contractorsDB.queryRow<Contractor>`
      INSERT INTO contractors (name, role, phone, email, company, hourly_rate, notes, user_id)
      VALUES (${req.name}, ${req.role}, ${req.phone}, ${req.email || null}, ${req.company || null}, ${req.hourlyRate || null}, ${req.notes || null}, ${userId})
      RETURNING id, name, role, phone, email, company, hourly_rate as "hourlyRate", notes, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    if (!row) {
      throw new Error("Failed to create contractor");
    }
    
    return row;
  }
);
