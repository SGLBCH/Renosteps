export interface BudgetSettings {
  id: number;
  totalBudget: number;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetExpense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: Date;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseRequest {
  category: string;
  description: string;
  amount: number;
  date?: Date;
  projectId?: string;
}

export interface UpdateExpenseRequest {
  id: number;
  category?: string;
  description?: string;
  amount?: number;
  date?: Date;
  projectId?: string;
}

export interface UpdateBudgetRequest {
  totalBudget: number;
  projectId?: string;
}

export interface BudgetSummaryRequest {
  projectId?: string;
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

export interface BudgetSummary {
  totalBudget: number;
  totalExpenses: number;
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

// Alias for compatibility
export type Expense = BudgetExpense;
