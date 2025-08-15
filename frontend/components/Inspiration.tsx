import { useProject } from '../contexts/ProjectContext';
import { useInspiration } from '../hooks/useInspiration';
import { CreateInspirationDialog } from './CreateInspirationDialog';
import { InspirationCard } from './InspirationCard';

export function Inspiration() {
  const { currentProject } = useProject();
  const { data: inspirations, isLoading, error } = useInspiration(currentProject?.id || 0);

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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Inspiration</h2>
            <p className="text-sm text-muted-foreground">{currentProject.name}</p>
          </div>
          <CreateInspirationDialog projectId={currentProject.id} />
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Failed to load inspirations</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Inspiration</h2>
          <p className="text-sm text-muted-foreground">{currentProject.name}</p>
        </div>
        <CreateInspirationDialog projectId={currentProject.id} />
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading inspirations...</div>
        </div>
      ) : inspirations && inspirations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspirations.map((inspiration) => (
            <InspirationCard key={inspiration.id} inspiration={inspiration} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground">No inspirations yet</div>
            <p className="text-sm text-muted-foreground">
              Create your first inspiration to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
