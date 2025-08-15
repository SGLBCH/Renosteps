import { useState, useEffect } from 'react';
import backend from '~backend/client';
import type { BudgetSummary } from '~backend/budget/types';

export function useBudget() {
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await backend.budget.getSummary();
      setBudgetSummary(summary);
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
