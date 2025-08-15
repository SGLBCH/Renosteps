import { api } from "encore.dev/api";
import { budgetDB } from "./db";
import type { CreateExpenseRequest, BudgetExpense } from "./types";

// Creates a new budget expense.
export const createExpense = api<CreateExpenseRequest, BudgetExpense>(
  { expose: true, method: "POST", path: "/budget/expenses" },
  async (req) => {
    const now = new Date();
    const expenseDate = req.date || new Date();

    const row = await budgetDB.queryRow<BudgetExpense>`
      INSERT INTO budget_expenses (category, description, amount, date, created_at, updated_at)
      VALUES (${req.category}, ${req.description}, ${req.amount}, ${expenseDate}, ${now}, ${now})
      RETURNING 
        id, category, description, amount, date,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!row) {
      throw new Error("Failed to create expense");
    }

    return row;
  }
);
