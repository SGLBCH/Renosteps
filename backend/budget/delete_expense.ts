import { api, APIError } from "encore.dev/api";
import { budgetDB } from "./db";
import type { DeleteExpenseParams } from "./types";

// Deletes a budget expense.
export const deleteExpense = api<DeleteExpenseParams, void>(
  { expose: true, method: "DELETE", path: "/budget/expenses/:id" },
  async ({ id }) => {
    const result = await budgetDB.queryRow`
      DELETE FROM budget_expenses WHERE id = ${id} RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("expense not found");
    }
  }
);
