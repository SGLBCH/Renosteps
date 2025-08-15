import { api } from "encore.dev/api";
import { budgetDB } from "./db";
import type { BudgetSummaryResponse, BudgetExpense } from "./types";

// Retrieves budget summary with total, spent, remaining, and category breakdown.
export const getSummary = api<void, BudgetSummaryResponse>(
  { expose: true, method: "GET", path: "/budget/summary" },
  async () => {
    // Get budget settings
    const budgetSettings = await budgetDB.queryRow<{ total_budget: number }>`
      SELECT total_budget FROM budget_settings ORDER BY id DESC LIMIT 1
    `;

    const totalBudget = budgetSettings?.total_budget || 0;

    // Get all expenses
    const expenses: BudgetExpense[] = [];
    for await (const row of budgetDB.query<BudgetExpense>`
      SELECT 
        id, category, description, amount, date,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM budget_expenses
      ORDER BY date DESC, created_at DESC
    `) {
      expenses.push(row);
    }

    // Calculate totals
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = totalBudget - totalSpent;

    // Calculate category breakdown
    const categoryMap = new Map<string, { spent: number; count: number }>();
    
    expenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { spent: 0, count: 0 };
      categoryMap.set(expense.category, {
        spent: existing.spent + expense.amount,
        count: existing.count + 1,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      spent: data.spent,
      count: data.count,
    })).sort((a, b) => b.spent - a.spent);

    return {
      totalBudget,
      totalSpent,
      remaining,
      expenses,
      categoryBreakdown,
    };
  }
);
