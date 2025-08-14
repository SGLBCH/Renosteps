import { Calendar, CheckCircle, Clock, XCircle, Edit, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TaskDialog } from './TaskDialog';
import backend from '~backend/client';
import type { Task } from './TaskCardsView';

interface TaskCardProps {
  task: Task;
  onTaskUpdated: () => void;
}

export function TaskCard({ task, onTaskUpdated }: TaskCardProps) {
  const { toast } = useToast();

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'not-started':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'not-started':
        return 'Not Started';
      default:
        return status;
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await backend.tasks.deleteTask({ id: task.id });
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
      onTaskUpdated();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 relative animate-fade-in">
      {/* Priority Badge */}
      <div className="absolute top-4 right-4">
        <Badge variant={getPriorityVariant(task.priority)} className="capitalize">
          {task.priority}
        </Badge>
      </div>

      {/* Actions */}
      <div className="absolute top-4 right-20 flex gap-1">
        <TaskDialog task={task} onTaskSaved={onTaskUpdated} />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-4 pr-24">
        {/* Title and Category */}
        <div>
          <h3 className="font-semibold text-lg leading-tight">{task.title}</h3>
          <p className="text-sm text-muted-foreground capitalize">{task.category}</p>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-muted-foreground leading-7 text-sm">{task.description}</p>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-2" />
        </div>

        {/* Dates */}
        {(task.startDate || task.endDate) && (
          <div className="space-y-1">
            {task.startDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Start: {formatDate(task.startDate)}</span>
              </div>
            )}
            {task.endDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>End: {formatDate(task.endDate)}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created: {formatDate(task.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon(task.status)}
            <span className="text-muted-foreground">{getStatusText(task.status)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
