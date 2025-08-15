export interface BudgetSettings {
  id: number;
  totalBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetExpense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseRequest {
  category: string;
  description: string;
  amount: number;
  date?: Date;
}

export interface UpdateBudgetRequest {
  totalBudget: number;
}

export interface BudgetSummaryResponse {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  expenses: BudgetExpense[];
  categoryBreakdown: {
    category: string;
    spent: number;
    count: number;
  }[];
}

export interface ListExpensesResponse {
  expenses: BudgetExpense[];
}

export interface DeleteExpenseParams {
  id: number;
}
