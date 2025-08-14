import { api, APIError } from "encore.dev/api";
import { contractorsDB } from "./db";

// Deletes a contractor.
export const deleteContractor = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/contractors/:id" },
  async ({ id }) => {
    const result = await contractorsDB.queryRow`
      DELETE FROM contractors WHERE id = ${id} RETURNING id
    `;
    
    if (!result) {
      throw APIError.notFound("contractor not found");
    }
  }
);
