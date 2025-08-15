import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Task, TaskPriority, TaskStatus } from './TaskCardsView';

interface TaskDialogProps {
  task?: Task;
  onTaskSaved?: (task: Task) => void;
  onTaskCreated?: (task: Task) => void;
  trigger?: React.ReactNode;
}

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  startDate?: Date;
  endDate?: Date;
}

const categories = ['kitchen', 'bathroom', 'living room', 'bedroom', 'exterior', 'other'];
const priorities: TaskPriority[] = ['high', 'medium', 'low'];
const statuses: TaskStatus[] = ['not-started', 'in-progress', 'completed'];

export function TaskDialog({ task, onTaskSaved, onTaskCreated, trigger }: TaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    category: 'kitchen',
    priority: 'medium',
    status: 'not-started',
    progress: 0,
    startDate: undefined,
    endDate: undefined,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        status: task.status,
        progress: task.progress,
        startDate: task.startDate ? new Date(task.startDate) : undefined,
        endDate: task.endDate ? new Date(task.endDate) : undefined,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'kitchen',
        priority: 'medium',
        status: 'not-started',
        progress: 0,
        startDate: undefined,
        endDate: undefined,
      });
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (task) {
        // Update existing task
        const updatedTaskData = {
          id: task.id,
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
          progress: formData.progress,
          startDate: formData.startDate,
          endDate: formData.endDate,
          createdAt: task.createdAt,
          updatedAt: new Date(),
          subtasks: task.subtasks,
        };

        // Optimistically update the UI first
        if (onTaskSaved) {
          onTaskSaved(updatedTaskData);
        }

        // Close dialog immediately for better UX
        setOpen(false);

        // Then make the API call
        await backend.tasks.update({
          id: task.id,
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
          progress: formData.progress,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
        
        toast({
          title: "Task updated",
          description: "The task has been successfully updated.",
        });
      } else {
        // Create new task
        const response = await backend.tasks.create({
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
          progress: formData.progress,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
        
        toast({
          title: "Task created",
          description: "The task has been successfully created.",
        });
        
        if (onTaskCreated) {
          onTaskCreated(response);
        }

        setOpen(false);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Error",
        description: "Failed to save the task. Please try again.",
        variant: "destructive",
      });
      
      // If there was an error and we're editing, we should revert the optimistic update
      // This would require a more complex state management, but for now we'll just show the error
      if (!task) {
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = task ? (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Add Task
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <Label htmlFor="progress">Progress: {formData.progress}%</Label>
            <Slider
              id="progress"
              value={[formData.progress]}
              onValueChange={(value) => setFormData({ ...formData, progress: value[0] })}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({ ...formData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData({ ...formData, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
