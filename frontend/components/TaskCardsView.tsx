import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { FilterChips } from './FilterChips';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'completed' | 'in-progress' | 'not-started';

export interface Task {
  id: string;
  title: string;
  category: string;
  description: string;
  progress: number;
  priority: TaskPriority;
  status: TaskStatus;
  date: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Replace Kitchen Cabinets',
    category: 'kitchen',
    description: 'Remove old cabinets and install new custom cabinets with soft-close hinges.',
    progress: 75,
    priority: 'high',
    status: 'in-progress',
    date: 'Jun 15, 2023'
  },
  {
    id: '2',
    title: 'Install Bathroom Tiles',
    category: 'bathroom',
    description: 'Install new porcelain tiles on bathroom floor and shower walls.',
    progress: 100,
    priority: 'medium',
    status: 'completed',
    date: 'May 30, 2023'
  },
  {
    id: '3',
    title: 'Paint Living Room',
    category: 'living room',
    description: 'Prime and paint living room walls with eggshell finish in "Coastal Beige" color.',
    progress: 0,
    priority: 'low',
    status: 'not-started',
    date: 'Jun 20, 2023'
  },
  {
    id: '4',
    title: 'Replace Countertops',
    category: 'kitchen',
    description: 'Remove old laminate countertops and install new quartz countertops.',
    progress: 25,
    priority: 'high',
    status: 'in-progress',
    date: 'Jul 1, 2023'
  },
  {
    id: '5',
    title: 'Install Recessed Lighting',
    category: 'kitchen',
    description: 'Install 6 recessed LED lights in kitchen ceiling with dimmer switches.',
    progress: 60,
    priority: 'medium',
    status: 'in-progress',
    date: 'Jun 25, 2023'
  },
  {
    id: '6',
    title: 'Replace Bathroom Vanity',
    category: 'bathroom',
    description: 'Remove old vanity and install new 36" double sink vanity with marble top.',
    progress: 40,
    priority: 'medium',
    status: 'in-progress',
    date: 'Jul 5, 2023'
  }
];

const categories = ['All', 'Kitchen', 'Bathroom', 'Living Room'];

export function TaskCardsView() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTasks = selectedCategory === 'All' 
    ? mockTasks 
    : mockTasks.filter(task => 
        task.category.toLowerCase() === selectedCategory.toLowerCase()
      );

  return (
    <div className="space-y-6">
      {/* Header with Add Task button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Tasks</h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filter Chips */}
      <FilterChips 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
