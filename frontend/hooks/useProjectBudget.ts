import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useBackend } from '../components/AuthenticatedBackend';
import { http } from '../lib/http';
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
  const backend = useBackend();

  const fetchBudgetSummary = useCallback(async (showLoadingState = true) => {
    // Don't try to load budget if projects are still loading
    if (projectLoading) {
      console.log('⏳ Waiting for projects to load before loading budget');
      return;
    }

    if (!currentProject) {
      console.log('ℹ️ No current project - clearing budget');
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
      
      console.group('💰 Loading Budget Summary');
      console.log('Project ID:', currentProject.id);
      console.log('Project name:', currentProject.name);
      console.log('Retry count:', retryCount);
      
      // Use the centralized HTTP client with built-in retry and timeout
      const summary = await http.request(
        () => backend.budget.getSummary({ projectId: String(currentProject.id) }),
        'budget loading'
      ) as BudgetSummaryResponse;
      
      console.log('✅ Budget loaded successfully');
      console.log('Budget summary:', {
        totalBudget: summary.totalBudget,
        totalSpent: summary.totalSpent,
        expenseCount: summary.expenses?.length || 0
      });
      console.groupEnd();
      
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
      console.group('❌ Budget Loading Failed');
      console.error('Raw budget loading error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load budget';
      console.log('Error message:', errorMessage);
      
      // Don't show error state immediately for network errors, try to retry a few times
      if (retryCount < 2 && errorMessage.includes('not available')) {
        console.log(`🔄 Retrying budget load (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        console.groupEnd();
        
        // Retry after a short delay
        setTimeout(() => {
          fetchBudgetSummary(false);
        }, 1000 + (retryCount * 1000)); // Exponential backoff
        
        return;
      }
      
      console.log('❌ Max retries reached or non-network error - showing error state');
      console.groupEnd();
      setError(errorMessage);
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [currentProject, projectLoading, retryCount, backend]);

  useEffect(() => {
    if (!projectLoading) {
      console.log('🔄 Project changed or projects loaded - reloading budget');
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
      console.log('🔄 Manual budget refresh requested');
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
