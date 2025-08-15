import { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useInspiration } from '../hooks/useInspiration';
import { CreateInspirationDialog } from './CreateInspirationDialog';
import { InspirationCard } from './InspirationCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function Inspiration() {
  const { currentProject } = useProject();
  const { data: inspirations, isLoading, error, refetch } = useInspiration(currentProject?.id || 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdate = () => {
    refetch();
  };

  if (!currentProject) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl md:text-2xl font-semibold">Inspiration</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No project selected</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">Inspiration</h2>
            <p className="text-sm text-muted-foreground">{currentProject.name}</p>
          </div>
          <CreateInspirationDialog projectId={currentProject.id} />
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span>Failed to load inspirations. Please try again.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto"
            >
              {isRefreshing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Inspiration</h2>
          <p className="text-sm text-muted-foreground">{currentProject.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            title="Refresh inspirations"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <CreateInspirationDialog projectId={currentProject.id} />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Loading inspirations...</span>
          </div>
        </div>
      ) : inspirations && inspirations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {inspirations.map((inspiration) => (
            <InspirationCard 
              key={inspiration.id} 
              inspiration={inspiration} 
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground">No inspirations yet</div>
            <p className="text-sm text-muted-foreground">
              Create your first inspiration to get started
            </p>
            <CreateInspirationDialog projectId={currentProject.id} />
          </div>
        </div>
      )}
    </div>
  );
}
