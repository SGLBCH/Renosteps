import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { budgetDB } from "./db";
import type { DeleteExpenseParams } from "./types";

// Deletes a budget expense.
export const deleteExpense = api<DeleteExpenseParams, void>(
  { expose: true, method: "DELETE", path: "/budget/expenses/:id", auth: true },
  async ({ id }) => {
    const auth = getAuthData()!;
    
    const result = await budgetDB.queryRow`
      DELETE FROM budget_expenses WHERE id = ${id} AND user_id = ${auth.userID} RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("expense not found");
    }
  }
);
