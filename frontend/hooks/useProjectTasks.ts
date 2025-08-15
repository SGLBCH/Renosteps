import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import backend from '~backend/client';
import type { Task } from '../components/TaskCardsView';

export function useProjectTasks() {
  const { currentProject, loading: projectLoading } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadTasks = useCallback(async (showLoadingState = true) => {
    // Don't try to load tasks if projects are still loading
    if (projectLoading) {
      return;
    }

    if (!currentProject) {
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
      
      // Add timeout to the frontend request as well
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      // Pass the project ID to filter tasks by project
      const response = await Promise.race([
        backend.tasks.list({ projectId: String(currentProject.id) }),
        timeoutPromise
      ]) as { tasks: Task[] };
      
      setTasks(response.tasks || []);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error loading tasks:', error);
      
      // Don't show error state immediately, try to retry a few times
      if (retryCount < 2) {
        console.log(`Retrying task load (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        
        // Retry after a short delay
        setTimeout(() => {
          loadTasks(false);
        }, 1000 + (retryCount * 1000)); // Exponential backoff
        
        return;
      }
      
      setError('Failed to load tasks');
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [currentProject, retryCount, projectLoading]);

  // Reload tasks when project changes, but only if projects have finished loading
  useEffect(() => {
    if (!projectLoading) {
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
