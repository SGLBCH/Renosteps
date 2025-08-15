import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Upload, X, Image } from 'lucide-react';
import backend from '~backend/client';
import type { Inspiration } from '~backend/inspiration/types';

interface EditInspirationDialogProps {
  inspiration: Inspiration;
  onUpdate: () => void;
}

const CATEGORIES = [
  'Design',
  'Architecture',
  'Materials',
  'Colors',
  'Furniture',
  'Lighting',
  'Landscaping',
  'Other'
];

export function EditInspirationDialog({ inspiration, onUpdate }: EditInspirationDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(inspiration.title);
  const [description, setDescription] = useState(inspiration.description || '');
  const [url, setUrl] = useState(inspiration.url || '');
  const [category, setCategory] = useState(inspiration.category || '');
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const { toast } = useToast();

  // Load existing photos when dialog opens
  useEffect(() => {
    if (open && inspiration.photos && inspiration.photos.length > 0) {
      loadPhotos();
    }
  }, [open, inspiration.photos]);

  const loadPhotos = async () => {
    if (!inspiration.photos || inspiration.photos.length === 0) return;
    
    setIsLoadingPhotos(true);
    try {
      const photoUrls = await Promise.all(
        inspiration.photos.map(async (filename) => {
          const response = await backend.inspiration.getFileUrl({ filename });
          return response.url;
        })
      );
      setPhotos(photoUrls);
    } catch (error) {
      console.error('Failed to load photos:', error);
      toast({
        title: "Error",
        description: "Failed to load photos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Warning",
        description: "Only image files are allowed",
        variant: "destructive",
      });
    }
    
    setNewPhotos(prev => [...prev, ...imageFiles]);
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingPhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload new photos first
      const uploadedFilenames: string[] = [];
      for (const file of newPhotos) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await backend.inspiration.uploadFile(formData);
        uploadedFilenames.push(response.filename);
      }

      // Calculate which photos to keep (existing photos that weren't removed)
      const originalPhotoCount = inspiration.photos?.length || 0;
      const keptPhotos = inspiration.photos?.filter((_, index) => {
        // Check if this photo still exists in our photos array
        return index < photos.length;
      }) || [];

      // Combine kept photos with newly uploaded ones
      const allPhotos = [...keptPhotos, ...uploadedFilenames];

      await backend.inspiration.update({
        id: inspiration.id,
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        category: category || undefined,
        photos: allPhotos.length > 0 ? allPhotos : undefined,
      });
      
      toast({
        title: "Success",
        description: "Inspiration updated successfully",
      });
      
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update inspiration:', error);
      toast({
        title: "Error",
        description: "Failed to update inspiration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setTitle(inspiration.title);
      setDescription(inspiration.description || '');
      setUrl(inspiration.url || '');
      setCategory(inspiration.category || '');
      setPhotos([]);
      setNewPhotos([]);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inspiration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter inspiration title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            
            {/* Existing Photos */}
            {isLoadingPhotos && (
              <div className="text-sm text-muted-foreground">Loading photos...</div>
            )}
            
            {photos.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Current photos:</div>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photoUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photoUrl}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeExistingPhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Photos */}
            {newPhotos.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">New photos to add:</div>
                <div className="grid grid-cols-3 gap-2">
                  {newPhotos.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeNewPhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Add Photos
                  </span>
                </Button>
              </Label>
              {(photos.length > 0 || newPhotos.length > 0) && (
                <span className="text-sm text-muted-foreground">
                  {photos.length + newPhotos.length} photo(s)
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
