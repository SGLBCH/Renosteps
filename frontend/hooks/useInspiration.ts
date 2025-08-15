import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackend } from '../components/AuthenticatedBackend';
import type { 
  CreateInspirationRequest, 
  Inspiration, 
  UploadFileRequest,
  DeleteInspirationRequest 
} from '~backend/inspiration/types';

export function useInspiration(projectId: number) {
  const backend = useBackend();
  return useQuery({
    queryKey: ['inspiration', projectId],
    queryFn: async () => {
      const response = await backend.inspiration.list({ projectId });
      return response.inspirations;
    },
    enabled: !!projectId,
  });
}

export function useCreateInspiration() {
  const queryClient = useQueryClient();
  const backend = useBackend();

  return useMutation({
    mutationFn: async (data: CreateInspirationRequest) => {
      return await backend.inspiration.create(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspiration', variables.projectId] });
    },
  });
}

export function useUploadFile() {
  const backend = useBackend();
  return useMutation({
    mutationFn: async (data: UploadFileRequest) => {
      return await backend.inspiration.uploadFile(data);
    },
  });
}

export function useDeleteInspiration() {
  const queryClient = useQueryClient();
  const backend = useBackend();

  return useMutation({
    mutationFn: async (data: DeleteInspirationRequest) => {
      return await backend.inspiration.deleteInspiration(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspiration'] });
    },
  });
}

export function useFileUrl(fileId: number) {
  const backend = useBackend();
  return useQuery({
    queryKey: ['file-url', fileId],
    queryFn: async () => {
      const response = await backend.inspiration.getFileUrl({ fileId });
      return response.downloadUrl;
    },
    enabled: !!fileId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
