import { api, APIError } from "encore.dev/api";
import { budgetDB } from "./db";
import type { UpdateExpenseRequest, BudgetExpense } from "./types";

// Updates an existing budget expense.
export const updateExpense = api<UpdateExpenseRequest, BudgetExpense>(
  { expose: true, method: "PUT", path: "/budget/expenses/:id" },
  async (req) => {
    const { id, ...updates } = req;
    const now = new Date();

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updates.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(updates.category);
    }

    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updates.description);
    }

    if (updates.amount !== undefined) {
      updateFields.push(`amount = $${paramIndex++}`);
      updateValues.push(updates.amount);
    }

    if (updates.date !== undefined) {
      updateFields.push(`date = $${paramIndex++}`);
      updateValues.push(updates.date);
    }

    if (updates.projectId !== undefined) {
      updateFields.push(`project_id = $${paramIndex++}`);
      // Convert projectId to string if it's a number
      updateValues.push(String(updates.projectId));
    }

    if (updateFields.length === 0) {
      throw APIError.invalidArgument("No fields to update");
    }

    updateFields.push(`updated_at = $${paramIndex++}`);
    updateValues.push(now);
    updateValues.push(id);

    const query = `
      UPDATE budget_expenses 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, category, description, amount, date, project_id as "projectId",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const row = await budgetDB.rawQueryRow<BudgetExpense>(query, ...updateValues);

    if (!row) {
      throw APIError.notFound("expense not found");
    }

    return row;
  }
);
