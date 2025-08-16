import { useState } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, Edit, Trash2, Plus, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { TaskDialog } from './TaskDialog';
import { ErrorBoundary } from './ErrorBoundary';
import { useBackend } from './AuthenticatedBackend';
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
  const [deleteMode, setDeleteMode] = useState(false);
  const [operationLoading, setOperationLoading] = useState<{
    delete: boolean;
    complete: boolean;
    subtaskToggle: string | null;
  }>({
    delete: false,
    complete: false,
    subtaskToggle: null,
  });
  const { toast } = useToast();
  const backend = useBackend();

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

    setOperationLoading(prev => ({ ...prev, delete: true }));

    try {
      await backend.tasks.deleteTask({ id: task.id });
      
      onTaskDeleted(task.id);
      
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
    } finally {
      setOperationLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleCompleteTask = async () => {
    setOperationLoading(prev => ({ ...prev, complete: true }));

    try {
      const updatedTask = await backend.tasks.completeTask({ id: task.id });
      
      onTaskUpdated(task.id, updatedTask);
      
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
    } finally {
      setOperationLoading(prev => ({ ...prev, complete: false }));
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
      
      const newSubtask: Subtask = {
        id: response.id,
        taskId: response.taskId,
        title: response.title,
        completed: response.completed,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
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
    setOperationLoading(prev => ({ ...prev, subtaskToggle: subtask.id }));

    try {
      const updatedSubtask = await backend.tasks.updateSubtask({
        id: subtask.id,
        completed: !subtask.completed,
      });
      
      onSubtaskUpdated(task.id, subtask.id, {
        completed: updatedSubtask.completed,
        updatedAt: updatedSubtask.updatedAt,
      });
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Error",
        description: "Failed to update the subtask. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(prev => ({ ...prev, subtaskToggle: null }));
    }
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask.id);
    setEditSubtaskTitle(subtask.title);
  };

  const handleSaveSubtaskEdit = async (subtaskId: string) => {
    if (!editSubtaskTitle.trim()) return;

    try {
      const updatedSubtask = await backend.tasks.updateSubtask({
        id: subtaskId,
        title: editSubtaskTitle.trim(),
      });
      
      onSubtaskUpdated(task.id, subtaskId, {
        title: updatedSubtask.title,
        updatedAt: updatedSubtask.updatedAt,
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

    try {
      await backend.tasks.deleteSubtask({ id: subtaskId });
      
      onSubtaskDeleted(task.id, subtaskId);
      
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
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 relative animate-fade-in">
      {/* Priority Badge */}
      <div className="absolute top-3 md:top-4 right-3 md:right-4">
        <Badge variant={getPriorityVariant(task.priority)} className="capitalize text-xs">
          {task.priority}
        </Badge>
      </div>

      {/* Actions */}
      <div className="absolute top-3 md:top-4 right-16 md:right-20 flex gap-1">
        {task.status !== 'completed' && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 md:h-8 md:w-8 text-green-600 hover:text-green-700"
            onClick={handleCompleteTask}
            disabled={operationLoading.complete}
            title="Mark as completed"
          >
            {operationLoading.complete ? (
              <div className="h-3 w-3 md:h-4 md:w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            ) : (
              <Check className="h-3 w-3 md:h-4 md:w-4" />
            )}
          </Button>
        )}
        <ErrorBoundary>
          <TaskDialog task={task} onTaskSaved={handleTaskSaved} />
        </ErrorBoundary>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={operationLoading.delete}
        >
          {operationLoading.delete ? (
            <div className="h-3 w-3 md:h-4 md:w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
          ) : (
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-3 md:space-y-4 pr-24 md:pr-32">
        {/* Title and Category */}
        <div>
          <h3 className="font-semibold text-base md:text-lg leading-tight">{task.title}</h3>
          <p className="text-sm text-muted-foreground capitalize">{task.category}</p>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-muted-foreground leading-6 text-sm">{task.description}</p>
        )}

        {/* Subtasks */}
        {(task.subtasks && task.subtasks.length > 0) || showAddSubtask ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Subtasks ({completedSubtasks}/{totalSubtasks})
              </span>
              <div className="flex items-center gap-2">
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
                {totalSubtasks > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteMode(!deleteMode)}
                    className={`h-6 px-2 text-xs ${deleteMode ? 'text-destructive' : ''}`}
                  >
                    {deleteMode ? (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {subtasksToShow.map((subtask) => (
                <ErrorBoundary key={subtask.id}>
                  <div className="flex items-start gap-2 group">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {subtask.completed && (
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask)}
                        disabled={operationLoading.subtaskToggle === subtask.id}
                        className="h-4 w-4 flex-shrink-0 mt-0.5"
                      />
                      {editingSubtask === subtask.id ? (
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveSubtaskEdit(subtask.id)}
                              disabled={!editSubtaskTitle.trim()}
                              className="h-7 px-2 text-xs flex-shrink-0"
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelSubtaskEdit}
                              className="h-7 px-2 text-xs flex-shrink-0"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between flex-1 min-w-0">
                          <span 
                            className={`text-sm flex-1 min-w-0 break-words ${
                              subtask.completed 
                                ? 'line-through text-muted-foreground' 
                                : 'text-foreground'
                            }`}
                          >
                            {subtask.title}
                          </span>
                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            {deleteMode ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubtask(subtask.id)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                title="Delete subtask"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSubtask(subtask)}
                                className="h-6 w-6 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                title="Edit subtask"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 flex-shrink-0 hidden sm:block"></div>
                    <Input
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Enter subtask title"
                      className="text-sm h-8 flex-1"
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
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      size="sm"
                      onClick={handleAddSubtask}
                      disabled={loading || !newSubtaskTitle.trim()}
                      className="h-8 px-3 flex-1"
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddSubtask(false);
                        setNewSubtaskTitle('');
                      }}
                      className="h-8 px-3 flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
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
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{formatDate(task.startDate)} - {formatDate(task.endDate)}</span>
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
