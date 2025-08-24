import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useBackend } from '../components/AuthenticatedBackend';
import type { Task } from '../components/TaskCardsView';

// Enhanced error analysis for task operations
function analyzeTaskError(error: any, operation: string): string {
  console.group(`🔍 Task Error Analysis - ${operation}`);
  console.log('Raw error:', error);
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  
  // Network-level errors
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    console.log('❌ NETWORK ERROR: Cannot reach backend for task operations');
    console.groupEnd();
    return `NETWORK_ERROR: Cannot connect to backend for ${operation}. Check if backend is running.`;
  }

  // HTTP status errors
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    console.log(`❌ HTTP ERROR: Status ${status} during ${operation}`);
    console.groupEnd();
    return `HTTP_${status}: Server error during ${operation}. Check backend logs.`;
  }

  // Timeout errors
  if (error.message.includes('timeout')) {
    console.log('❌ TIMEOUT ERROR: Task operation timed out');
    console.groupEnd();
    return `TIMEOUT_ERROR: ${operation} request timed out. Backend may be slow.`;
  }

  // Authentication errors
  if (error.message.includes('Unauthorized') || error.message.includes('401')) {
    console.log('❌ AUTH ERROR: Unauthorized task operation');
    console.groupEnd();
    return `AUTH_ERROR: Authentication required for ${operation}. Please log in again.`;
  }

  console.log('❌ UNKNOWN ERROR during task operation');
  console.groupEnd();
  return `UNKNOWN_ERROR: ${error.message || 'Unknown error'} during ${operation}`;
}

export function useProjectTasks() {
  const { currentProject, loading: projectLoading } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const backend = useBackend();

  const loadTasks = useCallback(async (showLoadingState = true) => {
    // Don't try to load tasks if projects are still loading
    if (projectLoading) {
      console.log('⏳ Waiting for projects to load before loading tasks');
      return;
    }

    if (!currentProject) {
      console.log('ℹ️ No current project - clearing tasks');
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);
      
      console.group('📋 Loading Tasks');
      console.log('Project ID:', currentProject.id);
      console.log('Project name:', currentProject.name);
      console.log('Retry count:', retryCount);
      
      // Add timeout to the frontend request as well
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT: Task loading request timed out after 15 seconds')), 15000)
      );
      
      console.log('📡 Making tasks request...');
      const startTime = performance.now();
      
      // Pass the project ID to filter tasks by project
      const response = await Promise.race([
        backend.tasks.list({ projectId: String(currentProject.id) }),
        timeoutPromise
      ]) as { tasks: Task[] };
      
      const endTime = performance.now();
      console.log(`✅ Tasks loaded in ${(endTime - startTime).toFixed(2)}ms`);
      console.log('Tasks count:', response.tasks?.length || 0);
      console.groupEnd();
      
      setTasks(response.tasks || []);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.group('❌ Task Loading Failed');
      console.error('Raw task loading error:', error);
      
      const errorMessage = analyzeTaskError(error, 'task_loading');
      console.log('Analyzed error:', errorMessage);
      
      // Don't show error state immediately, try to retry a few times
      if (retryCount < 2) {
        console.log(`🔄 Retrying task load (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        console.groupEnd();
        
        // Retry after a short delay
        setTimeout(() => {
          loadTasks(false);
        }, 1000 + (retryCount * 1000)); // Exponential backoff
        
        return;
      }
      
      console.log('❌ Max retries reached - showing error state');
      console.groupEnd();
      setError(errorMessage);
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [currentProject, retryCount, projectLoading, backend]);

  // Reload tasks when project changes, but only if projects have finished loading
  useEffect(() => {
    if (!projectLoading) {
      console.log('🔄 Project changed or projects loaded - reloading tasks');
      setRetryCount(0); // Reset retry count when project changes
      loadTasks();
    }
  }, [loadTasks, projectLoading]);

  // Reset retry count when component unmounts or when switching views
  useEffect(() => {
    return () => {
      setRetryCount(0);
    };
  }, []);

  return {
    tasks,
    setTasks,
    loading: loading || projectLoading,
    error,
    retryCount,
    loadTasks,
    currentProject
  };
}
