import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useProjectStats } from '../hooks/useProjectStats';

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

interface TaskRefreshProviderProps {
  children: ReactNode;
}

export function TaskRefreshProvider({ children }: TaskRefreshProviderProps) {
  const { refetch } = useProjectStats();

  const refreshTasks = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <TaskRefreshContext.Provider value={{ refreshTasks }}>
      {children}
    </TaskRefreshContext.Provider>
  );
}
