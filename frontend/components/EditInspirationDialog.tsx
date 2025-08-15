import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import backend from '~backend/client';
import { useQueryClient } from '@tanstack/react-query';
import type { Inspiration } from '~backend/inspiration/types';

interface EditInspirationDialogProps {
  inspiration: Inspiration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EditInspirationDialog({ inspiration, open, onOpenChange, onUpdate }: EditInspirationDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setTitle(inspiration.title);
      setDescription(inspiration.description || '');
      setSelectedFile(null);
      setImagePreview(null);
      setUploadError(null);
      setValidationErrors([]);
    }
  }, [open, inspiration]);

  const validateFile = (file: File): string[] => {
    const errors: string[] = [];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('Please select an image file (JPG, PNG, GIF, etc.)');
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
    }
    
    // Check file name
    if (file.name.length > 255) {
      errors.push('File name is too long (maximum 255 characters)');
    }
    
    return errors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(null);
    setValidationErrors([]);
    
    if (!file) {
      setSelectedFile(null);
      setImagePreview(null);
      return;
    }

    // Validate file
    const errors = validateFile(file);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setSelectedFile(null);
      setImagePreview(null);
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read the selected file. Please try again.');
        setSelectedFile(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setUploadError('Failed to process the selected file. Please try again.');
      setSelectedFile(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setUploadError(null);
    setValidationErrors([]);
  };

  const uploadFileToBackend = async (file: File): Promise<string> => {
    try {
      console.log('Starting file upload for:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Get signed upload URL from backend
      const uploadResult = await backend.inspiration.uploadFile({
        filename: file.name,
        contentType: file.type,
      });
      
      console.log('Got upload URL, uploading file...');
      
      // Upload file directly to object storage using the signed URL
      const uploadResponse = await fetch(uploadResult.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
      
      console.log('File uploaded successfully, URL:', uploadResult.fileUrl);
      
      return uploadResult.fileUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      
      // Provide specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Upload timed out. Please check your connection and try again.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error during upload. Please check your connection.');
        } else if (error.message.includes('413') || error.message.includes('too large')) {
          throw new Error('File is too large for upload. Please select a smaller file.');
        } else if (error.message.includes('415') || error.message.includes('unsupported')) {
          throw new Error('File type not supported. Please select a different image file.');
        } else if (error.message.includes('500')) {
          throw new Error('Server error during upload. Please try again later.');
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      } else {
        throw new Error('Unknown error occurred during upload. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setUploadError(null);
    setValidationErrors([]);
    
    // Validate form
    if (!title.trim()) {
      setValidationErrors(['Please enter a title']);
      return;
    }
    
    if (title.trim().length > 255) {
      setValidationErrors(['Title must be less than 255 characters']);
      return;
    }

    setIsSubmitting(true);
    
    try {
      let fileUrl = inspiration.fileUrl;

      // Upload new file if selected
      if (selectedFile) {
        console.log('Uploading new file:', selectedFile.name);
        
        try {
          fileUrl = await uploadFileToBackend(selectedFile);
          console.log('File uploaded successfully, URL:', fileUrl);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setUploadError(uploadError instanceof Error ? uploadError.message : 'Failed to upload file');
          return;
        }
      }

      // Update inspiration
      await backend.inspiration.update({
        id: inspiration.id,
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl,
      });

      onOpenChange(false);
      onUpdate();

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['inspiration', inspiration.projectId] });

      toast({
        title: "Success",
        description: "Inspiration updated successfully",
      });
    } catch (error) {
      console.error('Failed to update inspiration:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update inspiration';
      
      setUploadError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Inspiration</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Display */}
          {(uploadError || validationErrors.length > 0) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadError && <div className="mb-2">{uploadError}</div>}
                {validationErrors.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter inspiration title"
              required
              disabled={isSubmitting}
              maxLength={255}
            />
            <div className="text-xs text-muted-foreground">
              {title.length}/255 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
              disabled={isSubmitting}
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image</Label>
            {inspiration.fileUrl && !selectedFile && (
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                <img 
                  src={inspiration.fileUrl} 
                  alt={inspiration.title}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {inspiration.fileUrl ? 'Upload new image' : 'Click to upload an image'}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Supports JPG, PNG, GIF up to 10MB
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview"
                      className="w-full h-32 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeFile}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {/* File Info */}
                <div className="border rounded-lg p-3 flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB • {selectedFile.type}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || isSubmitting || validationErrors.length > 0}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {selectedFile ? 'Uploading...' : 'Updating...'}
                </>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
