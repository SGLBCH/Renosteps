import { useState, useEffect } from 'react';
import backend from '~backend/client';
import type { Task } from '../components/TaskCardsView';

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
  progress: number;
}

export function useProjectStats() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tasksResponse = await backend.tasks.list();
      setTasks(tasksResponse.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const calculateProjectStats = (): ProjectStats => {
    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const notStartedTasks = tasks.filter(task => task.status === 'not-started').length;
    
    const overdueTasks = tasks.filter(task => {
      if (!task.endDate || task.status === 'completed') return false;
      return new Date(task.endDate) < now;
    }).length;

    const upcomingTasks = tasks.filter(task => {
      if (!task.startDate || task.status === 'completed') return false;
      const startDate = new Date(task.startDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return startDate >= now && startDate <= weekFromNow;
    }).length;

    const progress = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks,
      upcomingTasks,
      progress,
    };
  };

  const projectStats = calculateProjectStats();

  return {
    projectStats,
    loading,
    error,
    refetch: loadTasks,
  };
}
