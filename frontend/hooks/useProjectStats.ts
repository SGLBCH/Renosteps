import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useProjectTasks } from './useProjectTasks';
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
  const { currentProject, loading: projectLoading } = useProject();
  const { tasks, loading: tasksLoading, error: tasksError, loadTasks } = useProjectTasks();

  const calculateProjectStats = useCallback((): ProjectStats => {
    if (!currentProject || !tasks) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        notStartedTasks: 0,
        overdueTasks: 0,
        upcomingTasks: 0,
        progress: 0,
      };
    }

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
  }, [currentProject, tasks]);

  const projectStats = calculateProjectStats();

  return {
    projectStats,
    loading: tasksLoading || projectLoading,
    error: tasksError,
    refetch: loadTasks,
    currentProject
  };
}
