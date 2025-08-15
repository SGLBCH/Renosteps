import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { budgetDB } from "./db";
import type { CreateExpenseRequest, BudgetExpense } from "./types";

// Creates a new budget expense for a specific project.
export const createExpense = api<CreateExpenseRequest, BudgetExpense>(
  { expose: true, method: "POST", path: "/budget/expenses", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const userId = parseInt(auth.userID, 10);
    const now = new Date();
    const expenseDate = req.date || new Date();
    // Convert projectId to string if it's a number, default to '1' if not specified
    const projectId = req.projectId ? String(req.projectId) : '1';

    const row = await budgetDB.queryRow<BudgetExpense>`
      INSERT INTO budget_expenses (category, description, amount, date, project_id, user_id, created_at, updated_at)
      VALUES (${req.category}, ${req.description}, ${req.amount}, ${expenseDate}, ${projectId}, ${userId}, ${now}, ${now})
      RETURNING 
        id, category, description, amount, date, project_id as "projectId",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!row) {
      throw new Error("Failed to create expense");
    }

    return row;
  }
);
