import { api } from "encore.dev/api";
import { budgetDB } from "./db";
import type { UpdateBudgetRequest, BudgetSettings } from "./types";

// Updates the total budget amount for a specific project.
export const updateBudget = api<UpdateBudgetRequest, BudgetSettings>(
  { expose: true, method: "PUT", path: "/budget" },
  async (req) => {
    const now = new Date();
    // Convert projectId to string if it's a number, default to '1' if not specified
    const projectId = req.projectId ? String(req.projectId) : '1';

    // Check if budget settings exist for this project
    const existing = await budgetDB.queryRow`
      SELECT id FROM budget_settings 
      WHERE project_id = ${projectId}
      ORDER BY id DESC LIMIT 1
    `;

    if (existing) {
      // Update existing
      await budgetDB.exec`
        UPDATE budget_settings 
        SET total_budget = ${req.totalBudget}, updated_at = ${now}
        WHERE id = ${existing.id}
      `;
    } else {
      // Create new
      await budgetDB.exec`
        INSERT INTO budget_settings (total_budget, project_id, created_at, updated_at)
        VALUES (${req.totalBudget}, ${projectId}, ${now}, ${now})
      `;
    }

    const updated = await budgetDB.queryRow<BudgetSettings>`
      SELECT 
        id, total_budget as "totalBudget", project_id as "projectId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM budget_settings 
      WHERE project_id = ${projectId}
      ORDER BY id DESC LIMIT 1
    `;

    if (!updated) {
      throw new Error("Failed to update budget");
    }

    return updated;
  }
);
