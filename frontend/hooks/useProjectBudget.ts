import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import backend from '~backend/client';
import type { BudgetSummaryResponse } from '~backend/budget/types';

export interface BudgetSummary {
  totalBudget: number;
  totalExpenses: number;
  totalSpent: number;
  remaining: number;
  expenses: any[];
  categoryBreakdown: {
    category: string;
    spent: number;
    count: number;
  }[];
}

export function useProjectBudget() {
  const { currentProject, loading: projectLoading } = useProject();
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchBudgetSummary = useCallback(async (showLoadingState = true) => {
    // Don't try to load budget if projects are still loading
    if (projectLoading) {
      return;
    }

    if (!currentProject) {
      setBudgetSummary(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);
      
      // Add timeout to the frontend request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      // Pass the project ID to filter budget data
      const summary = await Promise.race([
        backend.budget.getSummary({ projectId: currentProject.id }),
        timeoutPromise
      ]) as BudgetSummaryResponse;
      
      // Transform the response to match our expected format
      const transformedSummary: BudgetSummary = {
        totalBudget: summary.totalBudget || 0,
        totalExpenses: summary.totalSpent || 0,
        totalSpent: summary.totalSpent || 0,
        remaining: summary.remaining || 0,
        expenses: summary.expenses || [],
        categoryBreakdown: summary.categoryBreakdown || [],
      };
      
      setBudgetSummary(transformedSummary);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Failed to fetch budget summary:', err);
      
      // Don't show error state immediately, try to retry a few times
      if (retryCount < 2) {
        console.log(`Retrying budget load (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        
        // Retry after a short delay
        setTimeout(() => {
          fetchBudgetSummary(false);
        }, 1000 + (retryCount * 1000)); // Exponential backoff
        
        return;
      }
      
      let errorMessage = 'Failed to load budget summary';
      if (err?.message) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [currentProject, projectLoading, retryCount]);

  useEffect(() => {
    if (!projectLoading) {
      setRetryCount(0); // Reset retry count when project changes
      fetchBudgetSummary();
    }
  }, [fetchBudgetSummary, projectLoading]);

  // Reset retry count when component unmounts or when switching views
  useEffect(() => {
    return () => {
      setRetryCount(0);
    };
  }, []);

  const refreshBudget = useCallback(() => {
    if (!projectLoading) {
      setRetryCount(0); // Reset retry count on manual refresh
      fetchBudgetSummary();
    }
  }, [fetchBudgetSummary, projectLoading]);

  return {
    budgetSummary,
    loading: loading || projectLoading,
    error,
    refreshBudget,
    currentProject
  };
}
