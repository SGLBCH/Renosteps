import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
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

export function useProjectBudget() {
  const { currentProject } = useProject();
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetSummary = useCallback(async () => {
    if (!currentProject) {
      setBudgetSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Pass the project ID to filter budget data
      const summary = await backend.budget.getSummary({ projectId: currentProject.id });
      
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
  }, [currentProject]);

  useEffect(() => {
    fetchBudgetSummary();
  }, [fetchBudgetSummary]);

  const refreshBudget = useCallback(() => {
    fetchBudgetSummary();
  }, [fetchBudgetSummary]);

  return {
    budgetSummary,
    loading,
    error,
    refreshBudget,
    currentProject
  };
}
