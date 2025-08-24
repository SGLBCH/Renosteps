import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useBackend } from '../components/AuthenticatedBackend';
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

// Enhanced error analysis for budget operations
function analyzeBudgetError(error: any, operation: string): string {
  console.group(`🔍 Budget Error Analysis - ${operation}`);
  console.log('Raw error:', error);
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  
  // Network-level errors
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    console.log('❌ NETWORK ERROR: Cannot reach backend for budget operations');
    console.groupEnd();
    return `Backend service is not available. Please ensure the backend is running.`;
  }

  // HTTP status errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    console.log(`❌ HTTP ERROR: Status ${status} during ${operation}`);
    console.groupEnd();
    return `Server error (${status}) during ${operation}. Please try again.`;
  }

  // Timeout errors
  if (error.message.includes('timeout')) {
    console.log('❌ TIMEOUT ERROR: Budget operation timed out');
    console.groupEnd();
    return `Request timed out during ${operation}. Please try again.`;
  }

  // Authentication errors
  if (error.message.includes('Unauthorized') || error.message.includes('401')) {
    console.log('❌ AUTH ERROR: Unauthorized budget operation');
    console.groupEnd();
    return `Authentication required for ${operation}. Please log in again.`;
  }

  console.log('❌ UNKNOWN ERROR during budget operation');
  console.groupEnd();
  return `An error occurred during ${operation}. Please try again.`;
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
      
      // Add timeout to the frontend request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT: Budget loading request timed out after 10 seconds')), 10000)
      );
      
      console.log('📡 Making budget request...');
      const startTime = performance.now();
      
      // Pass the project ID as string to filter budget data
      const summary = await Promise.race([
        backend.budget.getSummary({ projectId: String(currentProject.id) }),
        timeoutPromise
      ]) as BudgetSummaryResponse;
      
      const endTime = performance.now();
      console.log(`✅ Budget loaded in ${(endTime - startTime).toFixed(2)}ms`);
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
      
      const errorMessage = analyzeBudgetError(err, 'budget_loading');
      console.log('Analyzed error:', errorMessage);
      
      // Don't show error state immediately for network errors, try to retry a few times
      if (retryCount < 2 && (
        err instanceof TypeError && err.message.includes('Failed to fetch')
      )) {
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
