import { createContext, useContext, ReactNode } from 'react';

interface TaskRefreshContextType {
  refreshTasks: () => void;
}

const TaskRefreshContext = createContext<TaskRefreshContextType | null>(null);

export function useTaskRefresh() {
  const context = useContext(TaskRefreshContext);
  if (!context) {
    throw new Error('useTaskRefresh must be used within a TaskRefreshProvider');
  }
  return context;
}

export const TaskRefreshContext as TaskRefreshContextExport = TaskRefreshContext;
