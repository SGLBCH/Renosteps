import { useState, useEffect, useCallback } from 'react';
import { TaskCard } from './TaskCard';
import { FilterChips } from './FilterChips';
import { TaskDialog } from './TaskDialog';
import { ErrorBoundary } from './ErrorBoundary';
import { TaskCardErrorBoundary } from './TaskCardErrorBoundary';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'completed' | 'in-progress' | 'not-started';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  description?: string;
  progress: number;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  subtasks?: Subtask[];
}

const categories = ['All', 'Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Exterior', 'Other'];

function TaskCardsContent() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const loadTasks = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);
      
      // Add timeout to the frontend request as well
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const response = await Promise.race([
        backend.tasks.list(),
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
      if (showLoadingState) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [toast, retryCount]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Reset retry count when component unmounts or when switching views
  useEffect(() => {
    return () => {
      setRetryCount(0);
    };
  }, []);

  // Optimistic update functions
  const updateTaskOptimistically = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  }, []);

  const updateSubtaskOptimistically = useCallback((taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? {
              ...task,
              subtasks: task.subtasks?.map(subtask =>
                subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
              )
            }
          : task
      )
    );
  }, []);

  const addSubtaskOptimistically = useCallback((taskId: string, subtask: Subtask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? {
              ...task,
              subtasks: [...(task.subtasks || []), subtask]
            }
          : task
      )
    );
  }, []);

  const removeSubtaskOptimistically = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? {
              ...task,
              subtasks: task.subtasks?.filter(subtask => subtask.id !== subtaskId)
            }
          : task
      )
    );
  }, []);

  const removeTaskOptimistically = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  const addTaskOptimistically = useCallback((task: Task) => {
    setTasks(prevTasks => [task, ...prevTasks]);
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = selectedCategory === 'All' 
    ? tasks 
    : tasks.filter(task => 
        task.category.toLowerCase() === selectedCategory.toLowerCase()
      );

  if (loading && retryCount === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-semibold">Tasks</h2>
          <ErrorBoundary>
            <TaskDialog onTaskSaved={loadTasks} />
          </ErrorBoundary>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (error && retryCount >= 2) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-semibold">Tasks</h2>
          <ErrorBoundary>
            <TaskDialog onTaskSaved={loadTasks} />
          </ErrorBoundary>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">{error}</div>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Add Task button */}
      <div className="flex justify-between items-center flex-shrink-0 mb-6">
        <h2 className="text-2xl font-semibold">Tasks</h2>
        <ErrorBoundary>
          <TaskDialog 
            onTaskSaved={loadTasks}
            onTaskCreated={addTaskOptimistically}
          />
        </ErrorBoundary>
      </div>

      {/* Filter Chips */}
      <div className="flex-shrink-0 mb-6">
        <ErrorBoundary>
          <FilterChips 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </ErrorBoundary>
      </div>

      {/* Task Cards Grid - Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-muted-foreground mb-4">
              {selectedCategory === 'All' 
                ? 'No tasks found. Create your first task to get started!' 
                : `No tasks found in the ${selectedCategory} category.`
              }
            </div>
            <ErrorBoundary>
              <TaskDialog 
                onTaskSaved={loadTasks}
                onTaskCreated={addTaskOptimistically}
              />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
            {filteredTasks.map((task) => (
              <TaskCardErrorBoundary 
                key={task.id} 
                taskTitle={task.title}
                onRetry={loadTasks}
              >
                <TaskCard 
                  task={task} 
                  onTaskUpdated={updateTaskOptimistically}
                  onTaskDeleted={removeTaskOptimistically}
                  onSubtaskUpdated={updateSubtaskOptimistically}
                  onSubtaskAdded={addSubtaskOptimistically}
                  onSubtaskDeleted={removeSubtaskOptimistically}
                  onError={loadTasks}
                />
              </TaskCardErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskCardsView() {
  return (
    <ErrorBoundary>
      <TaskCardsContent />
    </ErrorBoundary>
  );
}
