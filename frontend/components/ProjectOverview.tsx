import { Progress } from '@/components/ui/progress';
import { useProjectStats } from '../hooks/useProjectStats';
import { useProject } from '../contexts/ProjectContext';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProjectOverview() {
  const { currentProject } = useProject();
  const { projectStats, loading, error } = useProjectStats();

  if (!currentProject) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Project Overview</h3>
        <div className="text-sm text-muted-foreground">
          No project selected
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Project Overview</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium">Loading...</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Project Overview</h3>
        <div className="text-sm text-muted-foreground">
          Failed to load project data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Project Overview</h3>
        <p className="text-sm text-muted-foreground">{currentProject.name}</p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{projectStats.progress}%</span>
        </div>
        <Progress value={projectStats.progress} className="h-2" />
        <div className="text-xs text-muted-foreground">
          {projectStats.completedTasks} of {projectStats.totalTasks} tasks completed
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Completed</span>
          </div>
          <Badge variant="default" className="bg-green-500">
            {projectStats.completedTasks}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm">In Progress</span>
          </div>
          <Badge variant="default" className="bg-blue-500">
            {projectStats.inProgressTasks}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm">Not Started</span>
          </div>
          <Badge variant="secondary">
            {projectStats.notStartedTasks}
          </Badge>
        </div>

        {projectStats.overdueTasks > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm">Overdue</span>
            </div>
            <Badge variant="destructive">
              {projectStats.overdueTasks}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
