import { useProject } from '../contexts/ProjectContext';

export function Inspiration() {
  const { currentProject } = useProject();

  if (!currentProject) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Inspiration</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No project selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Inspiration</h2>
        <p className="text-sm text-muted-foreground">{currentProject.name}</p>
      </div>
      
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Inspiration content coming soon...</div>
      </div>
    </div>
  );
}
