import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { contractorsDB } from "./db";

// Deletes a contractor.
export const deleteContractor = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/contractors/:id", auth: true },
  async ({ id }) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);

    const result = await contractorsDB.queryRow`
      DELETE FROM contractors WHERE id = ${id} AND user_id = ${userId} RETURNING id
    `;
    
    if (!result) {
      throw APIError.notFound("contractor not found");
    }
  }
);
