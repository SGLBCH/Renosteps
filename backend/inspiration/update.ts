import { api, APIError } from "encore.dev/api";
import { inspirationDB } from "./db";

export interface UpdateInspirationRequest {
  id: number;
  title?: string;
  description?: string;
  url?: string;
}

export interface UpdateInspirationResponse {
  success: boolean;
}

// Updates an existing inspiration.
export const update = api<UpdateInspirationRequest, UpdateInspirationResponse>(
  { expose: true, method: "PUT", path: "/inspiration/:id" },
  async (req) => {
    const { id, title, description, url } = req;

    // Check if inspiration exists
    const existing = await inspirationDB.queryRow`
      SELECT id FROM inspiration WHERE id = ${id}
    `;

    if (!existing) {
      throw APIError.notFound("inspiration not found");
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (url !== undefined) {
      updates.push(`url = $${paramIndex++}`);
      values.push(url);
    }

    if (updates.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // Add id for WHERE clause
    values.push(id);

    const query = `
      UPDATE inspiration 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await inspirationDB.rawExec(query, ...values);

    return { success: true };
  }
);
