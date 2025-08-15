import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { contractorsDB } from "./db";
import type { UpdateContractorRequest, Contractor } from "./types";

// Updates an existing contractor.
export const update = api<UpdateContractorRequest, Contractor>(
  { expose: true, method: "PUT", path: "/contractors/:id", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(req.name);
    }
    if (req.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(req.role);
    }
    if (req.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(req.phone);
    }
    if (req.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(req.email || null);
    }
    if (req.company !== undefined) {
      updates.push(`company = $${paramIndex++}`);
      values.push(req.company || null);
    }
    if (req.hourlyRate !== undefined) {
      updates.push(`hourly_rate = $${paramIndex++}`);
      values.push(req.hourlyRate || null);
    }
    if (req.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(req.notes || null);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.id);
    values.push(userId);

    const query = `
      UPDATE contractors 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING id, name, role, phone, email, company, hourly_rate as "hourlyRate", notes, created_at as "createdAt", updated_at as "updatedAt"
    `;

    const row = await contractorsDB.rawQueryRow<Contractor>(query, ...values);
    
    if (!row) {
      throw APIError.notFound("contractor not found");
    }
    
    return row;
  }
);
