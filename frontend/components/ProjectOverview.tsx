import { Progress } from '@/components/ui/progress';

export function ProjectOverview() {
  const progress = 35;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Project Overview</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}
