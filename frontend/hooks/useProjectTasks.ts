import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useBackend } from '../components/AuthenticatedBackend';
import { http } from '../lib/http';
import type { Task } from '../components/TaskCardsView';

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
      
      // Use the centralized HTTP client with built-in retry and timeout
      const response = await http.request(
        () => backend.tasks.list({ projectId: String(currentProject.id) }),
        'task loading'
      );
      
      console.log('✅ Tasks loaded successfully');
      console.log('Tasks count:', response.tasks?.length || 0);
      console.groupEnd();
      
      setTasks(response.tasks || []);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.group('❌ Task Loading Failed');
      console.error('Raw task loading error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      console.log('Error message:', errorMessage);
      
      // Don't show error state immediately for network errors, try to retry a few times
      if (retryCount < 2 && errorMessage.includes('not available')) {
        console.log(`🔄 Retrying task load (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        console.groupEnd();
        
        // Retry after a short delay
        setTimeout(() => {
          loadTasks(false);
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
