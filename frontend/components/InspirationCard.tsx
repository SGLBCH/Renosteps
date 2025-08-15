import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { EditInspirationDialog } from './EditInspirationDialog';
import { Edit, Trash2, ExternalLink, FileText } from 'lucide-react';
import backend from '~backend/client';
import type { Inspiration } from '~backend/inspiration/types';

interface InspirationCardProps {
  inspiration: Inspiration;
  onUpdate: () => void;
}

export function InspirationCard({ inspiration, onUpdate }: InspirationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this inspiration?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await backend.inspiration.delete({ id: inspiration.id });
      toast({
        title: 'Success',
        description: 'Inspiration deleted successfully',
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete inspiration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete inspiration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewFile = async () => {
    if (!inspiration.fileUrl) return;
    
    try {
      const response = await backend.inspiration.getFileUrl({ id: inspiration.id });
      window.open(response.url, '_blank');
    } catch (error) {
      console.error('Failed to get file URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to open file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold leading-tight">{inspiration.title}</h2>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Image/File Preview Section */}
        {inspiration.fileUrl ? (
          <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <Button
              variant="ghost"
              onClick={handleViewFile}
              className="h-full w-full flex flex-col items-center justify-center space-y-2 hover:bg-muted/80"
            >
              <FileText className="h-12 w-12 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to view file</span>
            </Button>
          </div>
        ) : (
          <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <span className="text-sm text-muted-foreground">No file attached</span>
            </div>
          </div>
        )}

        {/* Description */}
        {inspiration.description && (
          <p className="text-sm text-muted-foreground flex-1">{inspiration.description}</p>
        )}
        
        {/* Category Badge */}
        {inspiration.category && (
          <Badge variant="secondary" className="w-fit">
            {inspiration.category}
          </Badge>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="text-xs text-muted-foreground">
            Created {new Date(inspiration.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <EditInspirationDialog inspiration={inspiration} onUpdate={onUpdate}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </EditInspirationDialog>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/30"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
