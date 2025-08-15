import { useState, useCallback } from 'react';
import { TaskCard } from './TaskCard';
import { FilterChips } from './FilterChips';
import { TaskDialog } from './TaskDialog';
import { ErrorBoundary } from './ErrorBoundary';
import { TaskCardErrorBoundary } from './TaskCardErrorBoundary';
import { useToast } from '@/components/ui/use-toast';
import { useProject } from '../contexts/ProjectContext';
import { useProjectTasks } from '../hooks/useProjectTasks';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'completed' | 'in-progress' | 'not-started';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  projectId?: string;
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
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  subtasks?: Subtask[];
}

const categories = ['All', 'Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Exterior', 'Other'];

function TaskCardsContent() {
  const { currentProject } = useProject();
  const { tasks, setTasks, loading, error, retryCount, loadTasks } = useProjectTasks();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { toast } = useToast();

  // Optimistic update functions
  const updateTaskOptimistically = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  }, [setTasks]);

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
  }, [setTasks]);

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
  }, [setTasks]);

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
  }, [setTasks]);

  const removeTaskOptimistically = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, [setTasks]);

  const addTaskOptimistically = useCallback((task: Task) => {
    if (currentProject && task.projectId === String(currentProject.id)) {
      setTasks(prevTasks => [task, ...prevTasks]);
    }
  }, [setTasks, currentProject]);

  const handleRetry = useCallback(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskCreated = useCallback((newTask: Task) => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = selectedCategory === 'All' 
    ? tasks 
    : tasks.filter(task => 
        task.category.toLowerCase() === selectedCategory.toLowerCase()
      );

  if (!currentProject) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-semibold">Tasks</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">No project selected</div>
        </div>
      </div>
    );
  }

  if (loading && retryCount === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-semibold">Tasks</h2>
            <p className="text-sm text-muted-foreground">{currentProject.name}</p>
          </div>
          <ErrorBoundary>
            <TaskDialog onTaskCreated={handleTaskCreated} />
          </ErrorBoundary>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading tasks for {currentProject.name}...</div>
        </div>
      </div>
    );
  }

  if (error && retryCount >= 2) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-semibold">Tasks</h2>
            <p className="text-sm text-muted-foreground">{currentProject.name}</p>
          </div>
          <ErrorBoundary>
            <TaskDialog onTaskCreated={handleTaskCreated} />
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 flex-shrink-0 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Tasks</h2>
          <p className="text-sm text-muted-foreground">{currentProject.name}</p>
        </div>
        <ErrorBoundary>
          <TaskDialog onTaskCreated={handleTaskCreated} />
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
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-muted-foreground mb-4">
              {selectedCategory === 'All' 
                ? `No tasks found for ${currentProject.name}. Create your first task to get started!` 
                : `No tasks found in the ${selectedCategory} category for ${currentProject.name}.`
              }
            </div>
            <ErrorBoundary>
              <TaskDialog onTaskCreated={handleTaskCreated} />
            </ErrorBoundary>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6 pb-6">
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
