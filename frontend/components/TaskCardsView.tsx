import { useState, useEffect } from 'react';
import { TaskCard } from './TaskCard';
import { FilterChips } from './FilterChips';
import { TaskDialog } from './TaskDialog';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'completed' | 'in-progress' | 'not-started';

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
}

const categories = ['All', 'Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Exterior', 'Other'];

export function TaskCardsView() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await backend.tasks.list();
      setTasks(response.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = selectedCategory === 'All' 
    ? tasks 
    : tasks.filter(task => 
        task.category.toLowerCase() === selectedCategory.toLowerCase()
      );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Tasks</h2>
          <TaskDialog onTaskSaved={loadTasks} />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Task button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Tasks</h2>
        <TaskDialog onTaskSaved={loadTasks} />
      </div>

      {/* Filter Chips */}
      <FilterChips 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-muted-foreground mb-4">
            {selectedCategory === 'All' 
              ? 'No tasks found. Create your first task to get started!' 
              : `No tasks found in the ${selectedCategory} category.`
            }
          </div>
          <TaskDialog onTaskSaved={loadTasks} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onTaskUpdated={loadTasks} />
          ))}
        </div>
      )}
    </div>
  );
}
