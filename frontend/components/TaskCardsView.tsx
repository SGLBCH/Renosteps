import { useState, useEffect, useCallback } from 'react';
import { TaskCard } from './TaskCard';
import { FilterChips } from './FilterChips';
import { TaskDialog } from './TaskDialog';
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

export function TaskCardsView() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await backend.tasks.list();
      setTasks(response.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks');
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  const filteredTasks = selectedCategory === 'All' 
    ? tasks 
    : tasks.filter(task => 
        task.category.toLowerCase() === selectedCategory.toLowerCase()
      );

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-semibold">Tasks</h2>
          <TaskDialog onTaskSaved={loadTasks} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-semibold">Tasks</h2>
          <TaskDialog onTaskSaved={loadTasks} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">{error}</div>
            <button 
              onClick={loadTasks}
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
        <TaskDialog 
          onTaskSaved={loadTasks}
          onTaskCreated={addTaskOptimistically}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex-shrink-0 mb-6">
        <FilterChips 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
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
            <TaskDialog 
              onTaskSaved={loadTasks}
              onTaskCreated={addTaskOptimistically}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
            {filteredTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onTaskUpdated={updateTaskOptimistically}
                onTaskDeleted={removeTaskOptimistically}
                onSubtaskUpdated={updateSubtaskOptimistically}
                onSubtaskAdded={addSubtaskOptimistically}
                onSubtaskDeleted={removeSubtaskOptimistically}
                onError={loadTasks}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
