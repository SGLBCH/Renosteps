import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ExternalLink, Trash2, FileImage, Edit, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import backend from '~backend/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Inspiration } from '~backend/inspiration/types';

interface InspirationCardProps {
  inspiration: Inspiration;
  onUpdate?: () => void;
}

export function InspirationCard({ inspiration, onUpdate }: InspirationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this inspiration?')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await backend.inspiration.deleteInspiration({ id: inspiration.id });
      
      // Refresh the inspiration list
      queryClient.invalidateQueries({ queryKey: ['inspiration', inspiration.projectId] });
      
      toast({
        title: "Success",
        description: "Inspiration deleted successfully",
      });
      
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete inspiration:', error);
      
      let errorMessage = "Failed to delete inspiration";
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes('not found')) {
          errorMessage = "Inspiration not found. It may have already been deleted.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error('Failed to load image:', inspiration.fileUrl);
  };

  const handleImageClick = () => {
    if (inspiration.fileUrl && !imageError) {
      window.open(inspiration.fileUrl, '_blank');
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">{inspiration.title}</CardTitle>
          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={true} // TODO: Implement edit functionality
              title="Edit inspiration (coming soon)"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete inspiration"
            >
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-3">
        {/* Image Display */}
        {inspiration.fileUrl && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-muted relative">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            
            {imageError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">Failed to load image</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImageError(false);
                    setImageLoading(true);
                  }}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <img 
                src={inspiration.fileUrl} 
                alt={inspiration.title}
                className={`w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onClick={handleImageClick}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}
          </div>
        )}

        {inspiration.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {inspiration.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {inspiration.fileUrl && !imageError && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImageClick}
              className="flex items-center space-x-1"
              title="View full size image"
            >
              <FileImage className="h-3 w-3" />
              <span>View Image</span>
            </Button>
          )}
          
          {inspiration.category && (
            <Badge variant="secondary" className="text-xs">
              {inspiration.category}
            </Badge>
          )}
          
          <Badge variant="secondary" className="text-xs">
            {new Date(inspiration.createdAt).toLocaleDateString()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
