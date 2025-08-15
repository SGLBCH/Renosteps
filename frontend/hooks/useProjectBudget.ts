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
      
      // In a real app, you would pass the project ID to filter budget data
      const summary = await backend.budget.getSummary();
      
      // Simulate project-specific budget data
      // In reality, the backend would filter by project ID
      const projectMultiplier = currentProject.id === '1' ? 1 : 
                               currentProject.id === '2' ? 0.7 : 0.5;
      
      // Transform the response to match our expected format
      const transformedSummary: BudgetSummary = {
        totalBudget: Math.round((summary.totalBudget || 0) * projectMultiplier),
        totalExpenses: Math.round((summary.totalSpent || 0) * projectMultiplier),
        remaining: Math.round((summary.remaining || 0) * projectMultiplier),
        expenses: (summary.expenses || []).slice(0, Math.ceil((summary.expenses || []).length * projectMultiplier)),
        categoryBreakdown: (summary.categoryBreakdown || []).map(cat => ({
          ...cat,
          spent: Math.round(cat.spent * projectMultiplier),
          count: Math.ceil(cat.count * projectMultiplier)
        })),
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
