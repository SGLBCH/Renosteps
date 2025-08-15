import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import backend from '~backend/client';
import type { Task } from '../components/TaskCardsView';

export function useProjectTasks() {
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadTasks = useCallback(async (showLoadingState = true) => {
    if (!currentProject) {
      setTasks([]);
      setLoading(false);
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
      
      // In a real app, you would filter tasks by project ID
      // For now, we'll simulate project-specific tasks by using the project ID as a filter
      const response = await Promise.race([
        backend.tasks.list(),
        timeoutPromise
      ]) as { tasks: Task[] };
      
      // Simulate project-specific filtering
      // In a real app, the backend would handle this filtering
      const projectTasks = response.tasks.filter(task => {
        // For demo purposes, we'll show different tasks for different projects
        // In reality, tasks would have a projectId field
        const taskProjectMapping: Record<string, string[]> = {
          '1': response.tasks.slice(0, Math.ceil(response.tasks.length * 0.6)).map(t => t.id),
          '2': response.tasks.slice(Math.ceil(response.tasks.length * 0.3)).map(t => t.id),
          '3': response.tasks.slice(0, Math.ceil(response.tasks.length * 0.4)).map(t => t.id),
        };
        
        const projectTaskIds = taskProjectMapping[currentProject.id] || [];
        return projectTaskIds.includes(task.id);
      });
      
      setTasks(projectTasks || []);
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
  }, [currentProject, retryCount]);

  // Reload tasks when project changes
  useEffect(() => {
    setRetryCount(0); // Reset retry count when project changes
    loadTasks();
  }, [loadTasks]);

  // Reset retry count when component unmounts or when switching views
  useEffect(() => {
    return () => {
      setRetryCount(0);
    };
  }, []);

  return {
    tasks,
    setTasks,
    loading,
    error,
    retryCount,
    loadTasks,
    currentProject
  };
}
