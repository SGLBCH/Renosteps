import { useState } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, Edit, Trash2, Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { TaskDialog } from './TaskDialog';
import { ErrorBoundary } from './ErrorBoundary';
import backend from '~backend/client';
import type { Task, Subtask } from './TaskCardsView';

interface TaskCardProps {
  task: Task;
  onTaskUpdated: (taskId: string, updates: Partial<Task>) => void;
  onTaskDeleted: (taskId: string) => void;
  onSubtaskUpdated: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  onSubtaskAdded: (taskId: string, subtask: Subtask) => void;
  onSubtaskDeleted: (taskId: string, subtaskId: string) => void;
  onError: () => void;
}

function TaskCardContent({ 
  task, 
  onTaskUpdated, 
  onTaskDeleted, 
  onSubtaskUpdated, 
  onSubtaskAdded, 
  onSubtaskDeleted,
  onError 
}: TaskCardProps) {
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState('');
  const [showAllSubtasks, setShowAllSubtasks] = useState(false);
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

    // Optimistically remove the task
    onTaskDeleted(task.id);

    try {
      await backend.tasks.deleteTask({ id: task.id });
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete the task. Please try again.",
        variant: "destructive",
      });
      // Revert by reloading tasks
      onError();
    }
  };

  const handleCompleteTask = async () => {
    // Optimistically update the task
    onTaskUpdated(task.id, { status: 'completed', progress: 100 });

    try {
      await backend.tasks.completeTask({ id: task.id });
      toast({
        title: "Task completed",
        description: "The task has been marked as completed.",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete the task. Please try again.",
        variant: "destructive",
      });
      // Revert by reloading tasks
      onError();
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      setLoading(true);
      const response = await backend.tasks.createSubtask({
        taskId: task.id,
        title: newSubtaskTitle.trim(),
      });
      
      // Optimistically add the subtask
      const newSubtask: Subtask = {
        id: response.id,
        taskId: task.id,
        title: newSubtaskTitle.trim(),
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      onSubtaskAdded(task.id, newSubtask);
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
      
      toast({
        title: "Subtask added",
        description: "The subtask has been successfully added.",
      });
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast({
        title: "Error",
        description: "Failed to add the subtask. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    // Optimistically update the subtask
    onSubtaskUpdated(task.id, subtask.id, { completed: !subtask.completed });

    try {
      await backend.tasks.updateSubtask({
        id: subtask.id,
        completed: !subtask.completed,
      });
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Error",
        description: "Failed to update the subtask. Please try again.",
        variant: "destructive",
      });
      // Revert by reloading tasks
      onError();
    }
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask.id);
    setEditSubtaskTitle(subtask.title);
  };

  const handleSaveSubtaskEdit = async (subtaskId: string) => {
    if (!editSubtaskTitle.trim()) return;

    // Optimistically update the subtask
    onSubtaskUpdated(task.id, subtaskId, { title: editSubtaskTitle.trim() });

    try {
      await backend.tasks.updateSubtask({
        id: subtaskId,
        title: editSubtaskTitle.trim(),
      });
      setEditingSubtask(null);
      setEditSubtaskTitle('');
      toast({
        title: "Subtask updated",
        description: "The subtask has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Error",
        description: "Failed to update the subtask. Please try again.",
        variant: "destructive",
      });
      // Revert by reloading tasks
      onError();
    }
  };

  const handleCancelSubtaskEdit = () => {
    setEditingSubtask(null);
    setEditSubtaskTitle('');
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm('Are you sure you want to delete this subtask?')) {
      return;
    }

    // Optimistically remove the subtask
    onSubtaskDeleted(task.id, subtaskId);

    try {
      await backend.tasks.deleteSubtask({ id: subtaskId });
      toast({
        title: "Subtask deleted",
        description: "The subtask has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast({
        title: "Error",
        description: "Failed to delete the subtask. Please try again.",
        variant: "destructive",
      });
      // Revert by reloading tasks
      onError();
    }
  };

  const handleTaskSaved = (updatedTask: Task) => {
    onTaskUpdated(task.id, updatedTask);
  };

  // Sort subtasks: incomplete first, then completed
  const sortedSubtasks = task.subtasks ? [...task.subtasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  }) : [];

  const completedSubtasks = sortedSubtasks.filter(s => s.completed).length;
  const totalSubtasks = sortedSubtasks.length;

  // Determine which subtasks to show
  const subtasksToShow = showAllSubtasks ? sortedSubtasks : sortedSubtasks.slice(0, 2);
  const hiddenSubtasksCount = Math.max(0, totalSubtasks - 2);

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
        {task.status !== 'completed' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-green-600 hover:text-green-700"
            onClick={handleCompleteTask}
            title="Mark as completed"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <ErrorBoundary>
          <TaskDialog task={task} onTaskSaved={handleTaskSaved} />
        </ErrorBoundary>
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
      <div className="space-y-4 pr-32">
        {/* Title and Category */}
        <div>
          <h3 className="font-semibold text-lg leading-tight">{task.title}</h3>
          <p className="text-sm text-muted-foreground capitalize">{task.category}</p>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-muted-foreground leading-7 text-sm">{task.description}</p>
        )}

        {/* Subtasks */}
        {(task.subtasks && task.subtasks.length > 0) || showAddSubtask ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Subtasks ({completedSubtasks}/{totalSubtasks})
              </span>
              {!showAddSubtask && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddSubtask(true)}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>

            <div className="space-y-2">
              {subtasksToShow.map((subtask) => (
                <ErrorBoundary key={subtask.id}>
                  <div className="flex items-center gap-2 group">
                    <div className="flex items-center gap-2 flex-1">
                      {subtask.completed && (
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      )}
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask)}
                        className="h-4 w-4 flex-shrink-0"
                      />
                      {editingSubtask === subtask.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editSubtaskTitle}
                            onChange={(e) => setEditSubtaskTitle(e.target.value)}
                            className="text-sm h-7 flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveSubtaskEdit(subtask.id);
                              } else if (e.key === 'Escape') {
                                handleCancelSubtaskEdit();
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveSubtaskEdit(subtask.id)}
                            disabled={!editSubtaskTitle.trim()}
                            className="h-7 px-2 text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelSubtaskEdit}
                            className="h-7 px-2 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span 
                          className={`text-sm flex-1 ${
                            subtask.completed 
                              ? 'line-through text-muted-foreground' 
                              : 'text-foreground'
                          }`}
                        >
                          {subtask.title}
                        </span>
                      )}
                    </div>
                    {editingSubtask !== subtask.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSubtask(subtask)}
                          className="h-6 w-6 p-0"
                          title="Edit subtask"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          title="Delete subtask"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </ErrorBoundary>
              ))}

              {/* Show more/less button */}
              {totalSubtasks > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllSubtasks(!showAllSubtasks)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground w-full justify-start"
                >
                  {showAllSubtasks ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      +{hiddenSubtasksCount} more
                    </>
                  )}
                </Button>
              )}

              {showAddSubtask && (
                <div className="flex items-center gap-2">
                  <div className="w-6 flex-shrink-0"></div>
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Enter subtask title"
                    className="text-sm h-8 flex-1 max-w-[60%]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSubtask();
                      } else if (e.key === 'Escape') {
                        setShowAddSubtask(false);
                        setNewSubtaskTitle('');
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddSubtask}
                    disabled={loading || !newSubtaskTitle.trim()}
                    className="h-8 px-3"
                  >
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddSubtask(false);
                      setNewSubtaskTitle('');
                    }}
                    className="h-8 px-3"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtasks (0/0)</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddSubtask(true)}
              className="h-6 px-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
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
                <span>{formatDate(task.startDate)} - {formatDate(task.endDate)}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon(task.status)}
            <span className="text-muted-foreground">{getStatusText(task.status)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskCard(props: TaskCardProps) {
  return (
    <ErrorBoundary>
      <TaskCardContent {...props} />
    </ErrorBoundary>
  );
}
