import { useState, useEffect } from 'react';
import backend from '~backend/client';
import type { BudgetSummaryResponse } from '~backend/budget/types';

export interface BudgetSummary {
  totalBudget: number;
  totalExpenses: number;
  remaining: number;
  expenses: any[];
  categoryBreakdown: {
    category: string;
    spent: number;
    count: number;
  }[];
}

export function useBudget() {
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await backend.budget.getSummary();
      
      // Transform the response to match our expected format
      const transformedSummary: BudgetSummary = {
        totalBudget: summary.totalBudget || 0,
        totalExpenses: summary.totalSpent || 0,
        remaining: summary.remaining || 0,
        expenses: summary.expenses || [],
        categoryBreakdown: summary.categoryBreakdown || [],
      };
      
      setBudgetSummary(transformedSummary);
    } catch (err) {
      console.error('Failed to fetch budget summary:', err);
      setError('Failed to load budget summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetSummary();
  }, []);

  const refreshBudget = () => {
    fetchBudgetSummary();
  };

  return {
    budgetSummary,
    loading,
    error,
    refreshBudget
  };
}
