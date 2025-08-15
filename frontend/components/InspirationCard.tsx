import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, FileText, Image } from 'lucide-react';
import { useDeleteInspiration, useFileUrl } from '../hooks/useInspiration';
import { useToast } from '@/components/ui/use-toast';
import type { Inspiration } from '~backend/inspiration/types';

interface InspirationCardProps {
  inspiration: Inspiration;
}

export function InspirationCard({ inspiration }: InspirationCardProps) {
  const { toast } = useToast();
  const deleteInspiration = useDeleteInspiration();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this inspiration?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteInspiration.mutateAsync({ id: inspiration.id });
      toast({
        title: 'Success',
        description: 'Inspiration deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete inspiration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete inspiration',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{inspiration.title}</CardTitle>
            {inspiration.category && (
              <Badge variant="secondary" className="text-xs">
                {inspiration.category}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {inspiration.description && (
          <p className="text-sm text-muted-foreground">{inspiration.description}</p>
        )}
        
        {inspiration.files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Files ({inspiration.files.length})</h4>
            <div className="grid grid-cols-1 gap-2">
              {inspiration.files.map((file) => (
                <FileItem key={file.id} file={file} />
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Created {new Date(inspiration.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

interface FileItemProps {
  file: Inspiration['files'][0];
}

function FileItem({ file }: FileItemProps) {
  const { data: downloadUrl } = useFileUrl(file.id);
  
  const getFileIcon = () => {
    if (file.contentType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded-md">
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        {getFileIcon()}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{file.originalName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
        </div>
      </div>
      
      {downloadUrl && (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex-shrink-0"
        >
          <a href={downloadUrl} download={file.originalName} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" />
          </a>
        </Button>
      )}
    </div>
  );
}
