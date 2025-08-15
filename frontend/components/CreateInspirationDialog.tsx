import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Upload, X } from 'lucide-react';
import { useCreateInspiration, useUploadFile } from '../hooks/useInspiration';
import { useToast } from '@/components/ui/use-toast';

interface CreateInspirationDialogProps {
  projectId: number;
}

interface FileUpload {
  file: File;
  id: string;
}

const INSPIRATION_CATEGORIES = [
  'Design',
  'Architecture',
  'Materials',
  'Colors',
  'Furniture',
  'Lighting',
  'Landscaping',
  'Other'
];

export function CreateInspirationDialog({ projectId }: CreateInspirationDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const createInspiration = useCreateInspiration();
  const uploadFile = useUploadFile();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validate file count
    if (files.length + selectedFiles.length > 5) {
      toast({
        title: 'Too many files',
        description: 'Maximum 5 files allowed',
        variant: 'destructive',
      });
      return;
    }

    // Validate each file
    const validFiles: FileUpload[] = [];
    for (const file of selectedFiles) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 5MB`,
          variant: 'destructive',
        });
        continue;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} must be JPG, PNG, or PDF`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
      });
    }

    setFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    event.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for the inspiration',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create inspiration
      const inspiration = await createInspiration.mutateAsync({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
      });

      // Upload files
      for (const fileUpload of files) {
        try {
          const uploadResponse = await uploadFile.mutateAsync({
            inspirationId: inspiration.id,
            filename: fileUpload.file.name,
            originalName: fileUpload.file.name,
            fileSize: fileUpload.file.size,
            contentType: fileUpload.file.type,
          });

          // Upload file to signed URL
          await fetch(uploadResponse.uploadUrl, {
            method: 'PUT',
            body: fileUpload.file,
            headers: {
              'Content-Type': fileUpload.file.type,
            },
          });
        } catch (error) {
          console.error(`Failed to upload file ${fileUpload.file.name}:`, error);
          toast({
            title: 'Upload warning',
            description: `Failed to upload ${fileUpload.file.name}`,
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Inspiration created successfully',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setFiles([]);
      setOpen(false);
    } catch (error) {
      console.error('Failed to create inspiration:', error);
      toast({
        title: 'Error',
        description: 'Failed to create inspiration',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Inspiration
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Inspiration</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter inspiration title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your inspiration (max 200 characters)"
              maxLength={200}
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/200
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {INSPIRATION_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Files (max 5, 5MB each)</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={files.length >= 5}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, PDF only
                </span>
              </div>
              
              <input
                id="file-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((fileUpload) => (
                    <div
                      key={fileUpload.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {fileUpload.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileUpload.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileUpload.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Inspiration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
