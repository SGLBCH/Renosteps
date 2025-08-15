import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ExternalLink, Trash2, FileImage, Edit } from 'lucide-react';
import backend from '~backend/client';
import type { Inspiration } from '~backend/inspiration/types';

interface InspirationCardProps {
  inspiration: Inspiration;
  onUpdate?: () => void;
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
      await backend.inspiration.deleteInspiration({ id: inspiration.id });
      toast({
        title: "Success",
        description: "Inspiration deleted successfully",
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete inspiration:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspiration",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-3">
        {/* Image Display */}
        {inspiration.fileUrl && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
            <img 
              src={inspiration.fileUrl} 
              alt={inspiration.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => window.open(inspiration.fileUrl, '_blank')}
            />
          </div>
        )}

        {inspiration.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {inspiration.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {inspiration.fileUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(inspiration.fileUrl, '_blank')}
              className="flex items-center space-x-1"
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
